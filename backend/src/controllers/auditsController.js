import { db } from '../db/dbAdapter.js';

export const auditsController = {
  // Get all audits
  async getAudits(req, res, next) {
    try {
      const { audit_type, status, factory_id, department_id, search } = req.query;
      const filter = {};

      if (audit_type) filter.audit_type = audit_type;
      if (status) filter.status = status;
      if (factory_id) filter.factory_id = factory_id;
      if (department_id) filter.department_id = department_id;
      if (search) filter.audit_code = `LIKE:${search}`;

      const audits = await db.find('audits', filter, { sortBy: 'start_date', sortOrder: 'desc' });
      const departments = await db.find('departments', {});
      const checklists = await db.find('auditChecklists', {});
      const ncs = await db.find('nonConformities', {});

      const enriched = audits.map(a => {
        const auditChecks = checklists.filter(c => c.audit_id === a.id);
        const auditNCs = ncs.filter(n => n.audit_id === a.id);

        const compliantCount = auditChecks.filter(c => c.status === 'Compliant').length;
        const totalEvaluated = auditChecks.filter(c => c.status !== 'Not Applicable').length;
        const autoScore = totalEvaluated > 0 ? Math.round((compliantCount / totalEvaluated) * 1000) / 10 : (a.compliance_score || 90);

        return {
          ...a,
          department_name: departments.find(d => d.id === a.department_id)?.name || 'Multi-Department',
          checklist_items_count: auditChecks.length,
          compliant_items_count: compliantCount,
          non_compliant_items_count: auditChecks.filter(c => c.status === 'Non-Compliant').length,
          observation_items_count: auditChecks.filter(c => c.status === 'Observation').length,
          nc_count: auditNCs.length,
          compliance_score: a.compliance_score !== null ? a.compliance_score : autoScore
        };
      });

      res.json({ success: true, count: enriched.length, audits: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Get audit details with checklists and findings
  async getAuditById(req, res, next) {
    try {
      const audit = await db.findById('audits', req.params.id);
      if (!audit) {
        return res.status(404).json({ success: false, message: 'Audit not found' });
      }

      const department = audit.department_id ? await db.findById('departments', audit.department_id) : null;
      const factory = await db.findById('factories', audit.factory_id);
      const checklists = await db.find('auditChecklists', { audit_id: audit.id });
      const requirements = await db.find('requirements', {});
      const standards = await db.find('standards', {});
      const ncs = await db.find('nonConformities', { audit_id: audit.id });

      const enrichedChecklists = checklists.map(chk => {
        const reqDoc = requirements.find(r => r.id === chk.requirement_id);
        const stdDoc = reqDoc ? standards.find(s => s.id === reqDoc.standard_id) : null;
        const linkedNC = ncs.find(n => n.checklist_id === chk.id || n.requirement_id === chk.requirement_id);

        return {
          ...chk,
          requirement_title: reqDoc?.title || 'Requirement Checklist Item',
          requirement_code: reqDoc?.code || '',
          standard_name: stdDoc?.name || '',
          linked_nc_id: linkedNC?.id || null,
          linked_nc_number: linkedNC?.nc_number || null,
          linked_nc_status: linkedNC?.status || null
        };
      });

      res.json({
        success: true,
        audit: {
          ...audit,
          department_name: department?.name || 'All Factory Floors',
          factory_name: factory?.name,
          checklists: enrichedChecklists,
          non_conformities: ncs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Create new audit
  async createAudit(req, res, next) {
    try {
      const {
        audit_type,
        factory_id,
        department_id,
        lead_auditor_id,
        auditor_name,
        start_date,
        end_date,
        scope,
        notes
      } = req.body;

      if (!audit_type || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Audit type, start date, and end date are required.' });
      }

      const auditCode = `AUD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      const newAudit = await db.insert('audits', {
        audit_code: auditCode,
        audit_type,
        factory_id: factory_id || req.user?.factory_id || 'f1111111-1111-1111-1111-111111111111',
        department_id: department_id || null,
        lead_auditor_id: lead_auditor_id || req.user?.id || null,
        auditor_name: auditor_name || req.user?.full_name || 'Lead Auditor',
        start_date,
        end_date,
        scope: scope || 'Compliance standard review',
        status: 'Scheduled',
        notes: notes || '',
        compliance_score: null,
        is_deleted: false
      });

      // Auto-populate checklist items from active requirements
      const requirements = await db.find('requirements', { status: 'Active' });
      for (const reqItem of requirements) {
        if (!department_id || reqItem.department_id === department_id || !reqItem.department_id) {
          await db.insert('auditChecklists', {
            audit_id: newAudit.id,
            requirement_id: reqItem.id,
            status: 'Not Applicable',
            finding: '',
            comments: '',
            evidence_url: null,
            severity: reqItem.risk_level === 'Critical' ? 'Critical' : (reqItem.risk_level === 'High' ? 'Major' : 'Minor'),
            checked_by: null,
            checked_at: null
          });
        }
      }

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_AUDIT',
        entityType: 'AUDIT',
        entityId: newAudit.id,
        entityName: newAudit.audit_code,
        newValue: newAudit,
        req
      });

      res.status(201).json({ success: true, message: 'Audit created and checklist populated.', audit: newAudit });
    } catch (err) {
      next(err);
    }
  },

  // Update audit item checklist (supports Compliant, Non-Compliant, Observation, Not Applicable + Auto NC creation!)
  async updateChecklistItem(req, res, next) {
    try {
      const { checklist_id } = req.params;
      const { status, finding, comments, evidence_url, severity, auto_create_nc } = req.body;

      const checklistItem = await db.findById('auditChecklists', checklist_id);
      if (!checklistItem) {
        return res.status(404).json({ success: false, message: 'Checklist item not found' });
      }

      const updatedChecklist = await db.updateById('auditChecklists', checklist_id, {
        status,
        finding: finding !== undefined ? finding : checklistItem.finding,
        comments: comments !== undefined ? comments : checklistItem.comments,
        evidence_url: evidence_url !== undefined ? evidence_url : checklistItem.evidence_url,
        severity: severity || checklistItem.severity,
        checked_by: req.user?.id || null,
        checked_at: new Date().toISOString()
      });

      let createdNC = null;

      // Rule 2: If Non-Compliant and auto_create_nc or requested, create NC
      if (status === 'Non-Compliant' && (auto_create_nc || finding)) {
        const audit = await db.findById('audits', checklistItem.audit_id);
        const requirement = await db.findById('requirements', checklistItem.requirement_id);

        const existingNC = await db.findOne('nonConformities', { checklist_id });
        if (!existingNC) {
          const ncNumber = `NC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

          // Due date default: 3 days for Critical, 7 days for Major, 14 days for Minor
          const dueDays = severity === 'Critical' ? 3 : (severity === 'Major' ? 7 : 14);
          const targetDueDate = new Date();
          targetDueDate.setDate(targetDueDate.getDate() + dueDays);

          const ncSeverity = severity || 'Major';
          const likelihood = ncSeverity === 'Critical' ? 4 : 3;
          const impact = ncSeverity === 'Critical' ? 5 : (ncSeverity === 'Major' ? 4 : 3);
          const riskScore = likelihood * impact;

          createdNC = await db.insert('nonConformities', {
            nc_number: ncNumber,
            audit_id: checklistItem.audit_id,
            checklist_id,
            factory_id: audit?.factory_id || 'f1111111-1111-1111-1111-111111111111',
            department_id: requirement?.department_id || audit?.department_id || null,
            requirement_id: checklistItem.requirement_id,
            finding: finding || 'Non-compliant finding identified during internal compliance audit.',
            severity: ncSeverity,
            risk_level: riskScore >= 16 ? 'Critical' : (riskScore >= 12 ? 'High' : (riskScore >= 6 ? 'Medium' : 'Low')),
            risk_score: riskScore,
            likelihood,
            impact,
            responsible_person_id: null,
            responsible_name: 'Department Manager',
            created_date: new Date().toISOString().split('T')[0],
            due_date: targetDueDate.toISOString().split('T')[0],
            status: 'Open',
            root_cause: '',
            immediate_correction: '',
            corrective_action: '',
            preventive_action: '',
            closed_at: null,
            closed_by: null,
            is_deleted: false
          });

          await db.sendNotification({
            userId: null,
            role: 'department_manager',
            title: `New NC Raised: ${ncNumber}`,
            message: `Audit finding marked Non-Compliant: ${finding || 'Action required.'} [${ncSeverity}]`,
            type: 'nc',
            priority: ncSeverity === 'Critical' ? 'Critical' : 'High',
            link: `/nc/${createdNC.id}`
          });
        }
      }

      res.json({
        success: true,
        message: 'Checklist item updated',
        checklist: updatedChecklist,
        created_nc: createdNC
      });
    } catch (err) {
      next(err);
    }
  },

  // Update audit status (e.g. In Progress, Completed, Closed)
  async updateAuditStatus(req, res, next) {
    try {
      const { status, notes, compliance_score } = req.body;
      const oldAudit = await db.findById('audits', req.params.id);
      if (!oldAudit) return res.status(404).json({ success: false, message: 'Audit not found' });

      const updated = await db.updateById('audits', req.params.id, {
        status,
        notes: notes !== undefined ? notes : oldAudit.notes,
        compliance_score: compliance_score !== undefined ? compliance_score : oldAudit.compliance_score
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_AUDIT_STATUS',
        entityType: 'AUDIT',
        entityId: updated.id,
        entityName: updated.audit_code,
        oldValue: { status: oldAudit.status },
        newValue: { status: updated.status, compliance_score: updated.compliance_score },
        req
      });

      res.json({ success: true, message: 'Audit status updated', audit: updated });
    } catch (err) {
      next(err);
    }
  }
};

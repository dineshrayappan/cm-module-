import { db } from '../db/dbAdapter.js';

export const ncController = {
  // Get list of NCs with multi-criteria filters
  async getNCs(req, res, next) {
    try {
      const {
        status,
        severity,
        risk_level,
        department_id,
        factory_id,
        search,
        aging_bucket
      } = req.query;

      const filter = {};
      if (status) {
        if (status === 'open_all') {
          // All non-closed
          filter.status = { $ne: 'Closed' };
        } else {
          filter.status = status;
        }
      }
      if (severity) filter.severity = severity;
      if (risk_level) filter.risk_level = risk_level;
      if (department_id) filter.department_id = department_id;
      if (factory_id) filter.factory_id = factory_id;
      if (search) filter.nc_number = `LIKE:${search}`;

      // Enforce Supervisor Department Isolation
      if (req.user && req.user.role === 'supervisor' && req.user.department_id) {
        filter.department_id = req.user.department_id;
      }

      const ncs = await db.find('nonConformities', filter, { sortBy: 'created_date', sortOrder: 'desc' });
      const departments = await db.find('departments', {});
      const requirements = await db.find('requirements', {});
      const caps = await db.find('correctiveActions', {});

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let enriched = ncs.map(nc => {
        const reqDoc = requirements.find(r => r.id === nc.requirement_id);
        const linkedCAP = caps.find(c => c.nc_id === nc.id);

        // Aging calculation (days since created)
        const createdDate = new Date(nc.created_date);
        const ageDays = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

        let bucket = '0-7 Days';
        if (ageDays >= 61) bucket = '60+ Days';
        else if (ageDays >= 31) bucket = '31-60 Days';
        else if (ageDays >= 16) bucket = '16-30 Days';
        else if (ageDays >= 8) bucket = '8-15 Days';

        const isOverdue = nc.status !== 'Closed' && nc.due_date && nc.due_date < todayStr;

        return {
          ...nc,
          age_days: ageDays,
          aging_bucket: bucket,
          is_overdue: isOverdue,
          department_name: departments.find(d => d.id === nc.department_id)?.name || 'General Factory',
          requirement_title: reqDoc?.title || 'Requirement',
          requirement_code: reqDoc?.code || '',
          cap_id: linkedCAP?.id || null,
          cap_status: linkedCAP?.status || 'No CAP'
        };
      });

      // Filter by aging bucket if requested
      if (aging_bucket) {
        enriched = enriched.filter(nc => nc.aging_bucket === aging_bucket);
      }

      res.json({ success: true, count: enriched.length, non_conformities: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Get NC by ID with CAP, Evidence, and Audit Trail history
  async getNCById(req, res, next) {
    try {
      const nc = await db.findById('nonConformities', req.params.id);
      if (!nc) {
        return res.status(404).json({ success: false, message: 'Non-Conformity not found' });
      }

      const department = nc.department_id ? await db.findById('departments', nc.department_id) : null;
      const factory = await db.findById('factories', nc.factory_id);
      const requirement = nc.requirement_id ? await db.findById('requirements', nc.requirement_id) : null;
      const standard = requirement ? await db.findById('standards', requirement.standard_id) : null;
      const audit = nc.audit_id ? await db.findById('audits', nc.audit_id) : null;
      const cap = await db.findOne('correctiveActions', { nc_id: nc.id });
      const evidenceList = await db.find('evidence', { related_nc_id: nc.id });
      const auditLogs = await db.find('auditLogs', { entity_id: nc.id });

      const now = new Date();
      const ageDays = Math.max(0, Math.floor((now.getTime() - new Date(nc.created_date).getTime()) / (1000 * 60 * 60 * 24)));

      res.json({
        success: true,
        non_conformity: {
          ...nc,
          age_days: ageDays,
          department_name: department?.name || 'General Factory',
          factory_name: factory?.name,
          requirement,
          standard,
          audit,
          cap,
          evidence: evidenceList,
          audit_trail: auditLogs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Create NC (enforces Rule 3: Responsible person & Rule 4: Target date)
  async createNC(req, res, next) {
    try {
      const {
        finding,
        severity,
        likelihood,
        impact,
        factory_id,
        department_id,
        requirement_id,
        audit_id,
        checklist_id,
        responsible_person_id,
        responsible_name,
        due_date
      } = req.body;

      if (!finding) {
        return res.status(400).json({ success: false, message: 'Finding description is required.' });
      }

      // Rule 4: Every applicable NC must have a target date
      if (!due_date) {
        return res.status(400).json({ success: false, message: 'Target resolution due date is mandatory for all Non-Conformities.' });
      }

      // Rule 3: Every applicable NC must have a responsible person
      if (!responsible_name && !responsible_person_id) {
        return res.status(400).json({ success: false, message: 'Responsible person assignment is mandatory for all Non-Conformities.' });
      }

      // Risk matrix calculation: Likelihood (1-5) * Impact (1-5)
      const l = Number(likelihood || 3);
      const i = Number(impact || 3);
      const riskScore = l * i;
      let riskLevel = 'Low';
      if (riskScore >= 16) riskLevel = 'Critical';
      else if (riskScore >= 12) riskLevel = 'High';
      else if (riskScore >= 6) riskLevel = 'Medium';

      const ncNumber = `NC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const newNC = await db.insert('nonConformities', {
        nc_number: ncNumber,
        audit_id: audit_id || null,
        checklist_id: checklist_id || null,
        factory_id: factory_id || req.user?.factory_id || 'f1111111-1111-1111-1111-111111111111',
        department_id: department_id || null,
        requirement_id: requirement_id || null,
        finding,
        severity: severity || 'Major',
        risk_level: riskLevel,
        risk_score: riskScore,
        likelihood: l,
        impact: i,
        responsible_person_id: responsible_person_id || null,
        responsible_name: responsible_name || 'Department Manager',
        created_date: new Date().toISOString().split('T')[0],
        due_date,
        status: 'Open',
        root_cause: '',
        immediate_correction: '',
        corrective_action: '',
        preventive_action: '',
        closed_at: null,
        closed_by: null,
        is_deleted: false
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_NC',
        entityType: 'NC',
        entityId: newNC.id,
        entityName: newNC.nc_number,
        newValue: newNC,
        req
      });

      res.status(201).json({ success: true, message: 'Non-Conformity registered successfully', non_conformity: newNC });
    } catch (err) {
      next(err);
    }
  },

  // Update NC
  async updateNC(req, res, next) {
    try {
      const oldNC = await db.findById('nonConformities', req.params.id);
      if (!oldNC) return res.status(404).json({ success: false, message: 'NC not found' });

      // If likelihood or impact updated, recompute risk score
      const updateData = { ...req.body };
      if (updateData.likelihood || updateData.impact) {
        const l = Number(updateData.likelihood || oldNC.likelihood);
        const i = Number(updateData.impact || oldNC.impact);
        const score = l * i;
        updateData.risk_score = score;
        if (score >= 16) updateData.risk_level = 'Critical';
        else if (score >= 12) updateData.risk_level = 'High';
        else if (score >= 6) updateData.risk_level = 'Medium';
        else updateData.risk_level = 'Low';
      }

      const updated = await db.updateById('nonConformities', req.params.id, updateData);

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_NC',
        entityType: 'NC',
        entityId: updated.id,
        entityName: updated.nc_number,
        oldValue: oldNC,
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'NC updated successfully', non_conformity: updated });
    } catch (err) {
      next(err);
    }
  },

  // Close NC (enforces Rule 9: NC CANNOT be closed before successful verification!)
  async closeNC(req, res, next) {
    try {
      const nc = await db.findById('nonConformities', req.params.id);
      if (!nc) return res.status(404).json({ success: false, message: 'NC not found' });

      // Enforce Rule 9
      const cap = await db.findOne('correctiveActions', { nc_id: nc.id });
      if (!cap || cap.status !== 'Verified') {
        return res.status(400).json({
          success: false,
          message: 'Compliance Enforcement Error: Non-Conformity cannot be closed without prior successful auditor verification of the Corrective Action Plan (CAP).'
        });
      }

      const updated = await db.updateById('nonConformities', nc.id, {
        status: 'Closed',
        closed_at: new Date().toISOString(),
        closed_by: req.user?.id || null
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CLOSE_NC',
        entityType: 'NC',
        entityId: nc.id,
        entityName: nc.nc_number,
        oldValue: { status: nc.status },
        newValue: { status: 'Closed', closed_at: updated.closed_at },
        req
      });

      await db.sendNotification({
        userId: nc.responsible_person_id,
        role: 'department_manager',
        title: `✅ NC Closed: ${nc.nc_number}`,
        message: `Non-Conformity ${nc.nc_number} has been verified and officially closed by ${req.user?.full_name || 'Compliance Head'}.`,
        type: 'nc',
        priority: 'Normal',
        link: `/nc/${nc.id}`
      });

      res.json({ success: true, message: 'Non-Conformity successfully closed.', non_conformity: updated });
    } catch (err) {
      next(err);
    }
  },

  // NC Aging Report
  async getAgingReport(req, res, next) {
    try {
      const ncs = await db.find('nonConformities', { status: { $ne: 'Closed' } });
      const now = new Date();

      const buckets = {
        '0-7 Days': 0,
        '8-15 Days': 0,
        '16-30 Days': 0,
        '31-60 Days': 0,
        '60+ Days': 0
      };

      const bucketItems = {
        '0-7 Days': [],
        '8-15 Days': [],
        '16-30 Days': [],
        '31-60 Days': [],
        '60+ Days': []
      };

      for (const nc of ncs) {
        const age = Math.max(0, Math.floor((now.getTime() - new Date(nc.created_date).getTime()) / (1000 * 60 * 60 * 24)));
        let b = '0-7 Days';
        if (age >= 61) b = '60+ Days';
        else if (age >= 31) b = '31-60 Days';
        else if (age >= 16) b = '16-30 Days';
        else if (age >= 8) b = '8-15 Days';

        buckets[b]++;
        bucketItems[b].push({
          id: nc.id,
          nc_number: nc.nc_number,
          finding: nc.finding,
          severity: nc.severity,
          age_days: age,
          due_date: nc.due_date,
          status: nc.status
        });
      }

      res.json({
        success: true,
        total_open_ncs: ncs.length,
        buckets,
        details: bucketItems
      });
    } catch (err) {
      next(err);
    }
  }
};

import { db } from '../db/dbAdapter.js';

export const capController = {
  // Get all CAPs
  async getCAPs(req, res, next) {
    try {
      const { status, nc_id } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (nc_id) filter.nc_id = nc_id;

      const caps = await db.find('correctiveActions', filter, { sortBy: 'created_at', sortOrder: 'desc' });
      const ncs = await db.find('nonConformities', {});
      const departments = await db.find('departments', {});

      let enriched = caps.map(cap => {
        const ncDoc = ncs.find(n => n.id === cap.nc_id);
        const deptDoc = ncDoc ? departments.find(d => d.id === ncDoc.department_id) : null;
        return {
          ...cap,
          nc_number: ncDoc?.nc_number || 'NC Ref',
          nc_finding: ncDoc?.finding || '',
          nc_severity: ncDoc?.severity || 'Major',
          department_id: ncDoc?.department_id,
          department_name: deptDoc?.name || 'General Factory'
        };
      });

      // Enforce Supervisor Department Isolation
      if (req.user && req.user.role === 'supervisor' && req.user.department_id) {
        enriched = enriched.filter(c => c.department_id === req.user.department_id);
      }

      res.json({ success: true, count: enriched.length, corrective_actions: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Get CAP by ID with related NC and Evidence
  async getCAPById(req, res, next) {
    try {
      const cap = await db.findById('correctiveActions', req.params.id);
      if (!cap) {
        return res.status(404).json({ success: false, message: 'CAP not found' });
      }

      const nc = await db.findById('nonConformities', cap.nc_id);
      const evidenceList = await db.find('evidence', { related_cap_id: cap.id });
      const auditLogs = await db.find('auditLogs', { entity_id: cap.id });

      res.json({
        success: true,
        corrective_action: {
          ...cap,
          non_conformity: nc,
          evidence: evidenceList,
          audit_trail: auditLogs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Create CAP
  async createCAP(req, res, next) {
    try {
      const {
        nc_id,
        immediate_correction,
        root_cause,
        corrective_action,
        preventive_action,
        responsible_person_id,
        responsible_name,
        target_date,
        submit_now
      } = req.body;

      if (!nc_id || !immediate_correction || !root_cause || !corrective_action || !preventive_action || !target_date) {
        return res.status(400).json({
          success: false,
          message: 'All fields (Immediate correction, Root cause, Corrective action, Preventive action, Target date) are mandatory.'
        });
      }

      const nc = await db.findById('nonConformities', nc_id);
      if (!nc) return res.status(404).json({ success: false, message: 'Related Non-Conformity not found.' });

      // Check if CAP already exists
      const existingCAP = await db.findOne('correctiveActions', { nc_id });
      if (existingCAP) {
        return res.status(400).json({ success: false, message: 'A Corrective Action Plan already exists for this NC.' });
      }

      const capCode = `CAP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const initialStatus = submit_now ? 'Submitted' : 'Draft';

      const newCAP = await db.insert('correctiveActions', {
        cap_code: capCode,
        nc_id,
        immediate_correction,
        root_cause,
        corrective_action,
        preventive_action,
        responsible_person_id: responsible_person_id || req.user?.id || null,
        responsible_name: responsible_name || req.user?.full_name || 'Responsible Officer',
        target_date,
        status: initialStatus,
        reviewer_comments: '',
        approval_date: null,
        reviewer_id: null,
        is_deleted: false
      });

      // Update NC status to CAP Submitted
      if (submit_now) {
        await db.updateById('nonConformities', nc_id, { status: 'CAP Submitted' });

        await db.sendNotification({
          userId: null,
          role: 'compliance_manager',
          title: `CAP Submitted: ${nc.nc_number}`,
          message: `Corrective Action Plan submitted for review for ${nc.nc_number} (${nc.severity}).`,
          type: 'cap',
          priority: 'High',
          link: `/cap/${newCAP.id}`
        });
      }

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userName: req.user?.full_name,
        userRole: req.user?.role,
        action: 'CREATE_CAP',
        actionLabel: 'CAP formulated',
        entityType: 'CAP',
        entityId: newCAP.id,
        relatedNcId: newCAP.nc_id,
        entityName: newCAP.cap_code,
        newValue: newCAP,
        details: `Corrective Action Plan formulated for ${nc?.nc_number || 'NC'}`,
        req
      });

      res.status(201).json({ success: true, message: 'CAP created successfully', corrective_action: newCAP });
    } catch (err) {
      next(err);
    }
  },

  // Submit CAP for review
  async submitCAP(req, res, next) {
    try {
      const cap = await db.findById('correctiveActions', req.params.id);
      if (!cap) return res.status(404).json({ success: false, message: 'CAP not found' });

      const isResubmit = cap.status === 'Rejected';
      const actionCode = isResubmit ? 'RESUBMIT_CAP' : 'SUBMIT_CAP';
      const actionLabel = isResubmit ? 'HR resubmitted CAP' : 'HR submitted CAP';

      const updated = await db.updateById('correctiveActions', cap.id, {
        status: 'Submitted'
      });

      await db.updateById('nonConformities', cap.nc_id, {
        status: 'Under Review'
      });

      const nc = await db.findById('nonConformities', cap.nc_id);

      await db.sendNotification({
        userId: null,
        role: 'compliance_manager',
        title: `CAP Review Needed: ${cap.cap_code}`,
        message: `CAP for NC ${nc?.nc_number} is ready for compliance review.`,
        type: 'cap',
        priority: 'High',
        link: `/cap/${cap.id}`
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userName: req.user?.full_name,
        userRole: req.user?.role,
        action: actionCode,
        actionLabel,
        entityType: 'CAP',
        entityId: cap.id,
        relatedNcId: cap.nc_id,
        entityName: cap.cap_code,
        oldValue: { status: cap.status },
        newValue: { status: 'Submitted' },
        details: isResubmit ? `CAP reworked and resubmitted by HR/Supervisor` : `Initial CAP submitted by HR/Supervisor`,
        req
      });

      res.json({ success: true, message: 'CAP submitted for review', corrective_action: updated });
    } catch (err) {
      next(err);
    }
  },

  // Review CAP (Approve or Reject with reviewer remarks)
  async reviewCAP(req, res, next) {
    try {
      const { action, comments } = req.body; // action: 'approve' or 'reject'
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: "Action must be either 'approve' or 'reject'." });
      }

      if (action === 'reject' && !comments) {
        return res.status(400).json({ success: false, message: 'Reviewer comments are mandatory when rejecting a CAP.' });
      }

      const cap = await db.findById('correctiveActions', req.params.id);
      if (!cap) return res.status(404).json({ success: false, message: 'CAP not found' });

      const nc = await db.findById('nonConformities', cap.nc_id);

      const newCapStatus = action === 'approve' ? 'Approved' : 'Rejected';
      const newNcStatus = action === 'approve' ? 'CAP Approved' : 'CAP Rejected';

      const updated = await db.updateById('correctiveActions', cap.id, {
        status: newCapStatus,
        reviewer_comments: comments || cap.reviewer_comments,
        approval_date: action === 'approve' ? new Date().toISOString() : null,
        reviewer_id: req.user?.id || null
      });

      await db.updateById('nonConformities', cap.nc_id, {
        status: newNcStatus
      });

      // Send Notification to responsible user
      const notifTitle = action === 'approve' ? `🟢 CAP Approved: ${cap.cap_code}` : `🔴 CAP Rejected: ${cap.cap_code}`;
      const notifMsg = action === 'approve'
        ? `Compliance management approved the CAP for NC ${nc?.nc_number}. Proceed with implementation and evidence upload.`
        : `CAP for NC ${nc?.nc_number} was rejected: "${comments}". Please rework and resubmit.`;

      await db.sendNotification({
        userId: cap.responsible_person_id,
        role: 'department_manager',
        title: notifTitle,
        message: notifMsg,
        type: 'cap',
        priority: action === 'approve' ? 'Normal' : 'High',
        link: `/cap/${cap.id}`
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userName: req.user?.full_name,
        userRole: req.user?.role,
        action: action === 'approve' ? 'APPROVE_CAP' : 'REJECT_CAP',
        actionLabel: action === 'approve' ? 'Auditor approved CAP' : 'Auditor rejected CAP',
        entityType: 'CAP',
        entityId: cap.id,
        relatedNcId: cap.nc_id,
        entityName: cap.cap_code,
        oldValue: { status: cap.status },
        newValue: { status: newCapStatus, comments },
        details: action === 'approve' ? 'CAP approved by auditor/compliance manager' : `CAP rejected by auditor: "${comments}"`,
        req
      });

      res.json({
        success: true,
        message: `CAP ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        corrective_action: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // Submit Evidence for CAP verification
  async submitCAPEvidence(req, res, next) {
    try {
      const cap = await db.findById('correctiveActions', req.params.id);
      if (!cap) return res.status(404).json({ success: false, message: 'CAP not found' });

      // Verify at least 1 evidence attachment exists
      const evidenceList = await db.find('evidence', { related_cap_id: cap.id });
      if (evidenceList.length === 0 && !req.body.evidence_url) {
        return res.status(400).json({
          success: false,
          message: 'Evidence upload is mandatory before submitting CAP for auditor verification.'
        });
      }

      const updated = await db.updateById('correctiveActions', cap.id, {
        status: 'Completed'
      });

      await db.updateById('nonConformities', cap.nc_id, {
        status: 'Verification'
      });

      const nc = await db.findById('nonConformities', cap.nc_id);

      await db.sendNotification({
        userId: null,
        role: 'internal_auditor',
        title: `Verification Required: NC ${nc?.nc_number}`,
        message: `CAP implementation completed and evidence attached. Auditor verification required.`,
        type: 'verification',
        priority: 'High',
        link: `/verification`
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userName: req.user?.full_name,
        userRole: req.user?.role,
        action: 'SUBMIT_FOR_VERIFICATION',
        actionLabel: 'CAP submitted for verification',
        entityType: 'CAP',
        entityId: cap.id,
        relatedNcId: cap.nc_id,
        entityName: cap.cap_code,
        oldValue: { status: cap.status },
        newValue: { status: 'Completed', nc_status: 'Verification' },
        details: 'Evidence attached. Submitted for field auditor inspection.',
        req
      });

      res.json({ success: true, message: 'CAP submitted for auditor verification', corrective_action: updated });
    } catch (err) {
      next(err);
    }
  },

  // Verify CAP by Auditor (Pass -> marks Verified and allows NC closure; Fail -> Rework)
  async verifyCAP(req, res, next) {
    try {
      const { result, verification_notes } = req.body; // result: 'pass' or 'fail'
      if (!result || !['pass', 'fail'].includes(result)) {
        return res.status(400).json({ success: false, message: "Verification result must be 'pass' or 'fail'." });
      }

      const cap = await db.findById('correctiveActions', req.params.id);
      if (!cap) return res.status(404).json({ success: false, message: 'CAP not found' });

      const nc = await db.findById('nonConformities', cap.nc_id);

      if (result === 'pass') {
        const updated = await db.updateById('correctiveActions', cap.id, {
          status: 'Verified',
          reviewer_comments: verification_notes ? `${cap.reviewer_comments || ''} | Verified: ${verification_notes}` : cap.reviewer_comments
        });

        // Mark NC as closed upon verified pass!
        await db.updateById('nonConformities', cap.nc_id, {
          status: 'Closed',
          closed_at: new Date().toISOString(),
          closed_by: req.user?.id || null
        });

        await db.logAction({
          userId: req.user?.id,
          userEmail: req.user?.email,
          userName: req.user?.full_name,
          userRole: req.user?.role,
          action: 'VERIFY_EVIDENCE',
          actionLabel: 'Auditor verified evidence',
          entityType: 'CAP',
          entityId: cap.id,
          relatedNcId: cap.nc_id,
          entityName: cap.cap_code,
          oldValue: { status: cap.status },
          newValue: { status: 'Verified', nc_status: 'Closed' },
          details: `Field verification PASSED. ${verification_notes || 'All requirements satisfied.'}`,
          req
        });

        await db.logAction({
          userId: req.user?.id,
          userEmail: req.user?.email,
          userName: req.user?.full_name,
          userRole: req.user?.role,
          action: 'CLOSE_NC',
          actionLabel: 'NC closed',
          entityType: 'NC',
          entityId: cap.nc_id,
          relatedNcId: cap.nc_id,
          entityName: nc?.nc_number || 'NC',
          oldValue: { status: nc?.status || 'Verification' },
          newValue: { status: 'Closed' },
          details: 'Non-conformity officially closed upon verified CAP implementation.',
          req
        });


        await db.sendNotification({
          userId: cap.responsible_person_id,
          role: 'department_manager',
          title: `🎉 CAP Verified & NC Closed: ${nc?.nc_number}`,
          message: `Verification PASSED by ${req.user?.full_name || 'Auditor'}. Non-conformity is officially closed.`,
          type: 'verification',
          priority: 'Normal',
          link: `/nc/${nc?.id}`
        });

        res.json({ success: true, message: 'Verification passed and NC officially closed.', corrective_action: updated });
      } else {
        // Fail -> Rework required
        const updated = await db.updateById('correctiveActions', cap.id, {
          status: 'Rejected',
          reviewer_comments: `Verification FAILED: ${verification_notes || 'Corrective evidence inadequate.'}`
        });

        await db.updateById('nonConformities', cap.nc_id, {
          status: 'CAP Rejected'
        });

        await db.sendNotification({
          userId: cap.responsible_person_id,
          role: 'department_manager',
          title: `❌ Verification Failed: ${nc?.nc_number}`,
          message: `Auditor verification failed: "${verification_notes}". Rework required.`,
          type: 'verification',
          priority: 'Critical',
          link: `/cap/${cap.id}`
        });

        res.json({ success: true, message: 'Verification failed. CAP sent back for rework.', corrective_action: updated });
      }
    } catch (err) {
      next(err);
    }
  }
};

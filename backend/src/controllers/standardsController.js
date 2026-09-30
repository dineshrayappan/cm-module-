import { db } from '../db/dbAdapter.js';
import { taskGeneratorService } from '../services/taskGeneratorService.js';

export const standardsController = {
  async getStandards(req, res, next) {
    try {
      const standards = await db.find('standards', {});
      const requirements = await db.find('requirements', {});

      const enriched = standards.map(s => {
        const reqs = requirements.filter(r => r.standard_id === s.id);
        return {
          ...s,
          requirements_count: reqs.length,
          critical_count: reqs.filter(r => r.risk_level === 'Critical').length,
          high_count: reqs.filter(r => r.risk_level === 'High').length
        };
      });

      res.json({ success: true, count: enriched.length, standards: enriched });
    } catch (err) {
      next(err);
    }
  },

  async getStandardById(req, res, next) {
    try {
      const standard = await db.findById('standards', req.params.id);
      if (!standard) {
        return res.status(404).json({ success: false, message: 'Compliance Standard not found' });
      }

      const requirements = await db.find('requirements', { standard_id: standard.id });
      const departments = await db.find('departments', {});

      const enrichedReqs = requirements.map(r => ({
        ...r,
        department_name: departments.find(d => d.id === r.department_id)?.name || 'General Factory'
      }));

      res.json({ success: true, standard: { ...standard, requirements: enrichedReqs } });
    } catch (err) {
      next(err);
    }
  },

  async createStandard(req, res, next) {
    try {
      const { code, name, description, version, effective_date, expiry_date, status } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'Standard code and name are required.' });
      }

      const existing = await db.findOne('standards', { code });
      if (existing) {
        return res.status(400).json({ success: false, message: `Standard with code '${code}' already exists.` });
      }

      const newStandard = await db.insert('standards', {
        code,
        name,
        description,
        version: version || '1.0',
        effective_date: effective_date || new Date().toISOString().split('T')[0],
        expiry_date,
        status: status || 'Active',
        is_deleted: false
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_STANDARD',
        entityType: 'STANDARD',
        entityId: newStandard.id,
        entityName: newStandard.name,
        newValue: newStandard,
        req
      });

      res.status(201).json({ success: true, message: 'Standard created successfully', standard: newStandard });
    } catch (err) {
      next(err);
    }
  },

  async updateStandard(req, res, next) {
    try {
      const oldStandard = await db.findById('standards', req.params.id);
      if (!oldStandard) {
        return res.status(404).json({ success: false, message: 'Standard not found' });
      }

      const updated = await db.updateById('standards', req.params.id, req.body);

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_STANDARD',
        entityType: 'STANDARD',
        entityId: updated.id,
        entityName: updated.name,
        oldValue: oldStandard,
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Standard updated successfully', standard: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteStandard(req, res, next) {
    try {
      await db.deleteById('standards', req.params.id, true);
      res.json({ success: true, message: 'Standard archived successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export const requirementsController = {
  async getRequirements(req, res, next) {
    try {
      const { standard_id, department_id, frequency, risk_level, status, search } = req.query;
      const filter = {};

      if (standard_id) filter.standard_id = standard_id;
      if (department_id) filter.department_id = department_id;
      if (frequency) filter.frequency = frequency;
      if (risk_level) filter.risk_level = risk_level;
      if (status) filter.status = status;
      if (search) filter.title = `LIKE:${search}`;

      const requirements = await db.find('requirements', filter);
      const standards = await db.find('standards', {});
      const departments = await db.find('departments', {});

      const enriched = requirements.map(r => ({
        ...r,
        standard_name: standards.find(s => s.id === r.standard_id)?.name || 'General Standard',
        standard_code: standards.find(s => s.id === r.standard_id)?.code || '',
        department_name: departments.find(d => d.id === r.department_id)?.name || 'General Factory',
        department_code: departments.find(d => d.id === r.department_id)?.code || ''
      }));

      res.json({ success: true, count: enriched.length, requirements: enriched });
    } catch (err) {
      next(err);
    }
  },

  async getRequirementById(req, res, next) {
    try {
      const requirement = await db.findById('requirements', req.params.id);
      if (!requirement) {
        return res.status(404).json({ success: false, message: 'Requirement not found' });
      }

      const standard = await db.findById('standards', requirement.standard_id);
      const department = await db.findById('departments', requirement.department_id);

      res.json({
        success: true,
        requirement: {
          ...requirement,
          standard_name: standard?.name,
          department_name: department?.name
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async createRequirement(req, res, next) {
    try {
      const {
        code,
        standard_id,
        title,
        description,
        department_id,
        frequency,
        risk_level,
        responsible_role,
        evidence_required,
        due_date_rule,
        weight,
        status
      } = req.body;

      if (!code || !standard_id || !title || !frequency) {
        return res.status(400).json({
          success: false,
          message: 'Code, Standard, Title, and Frequency are required fields.'
        });
      }

      const existing = await db.findOne('requirements', { code });
      if (existing) {
        return res.status(400).json({ success: false, message: `Requirement with code '${code}' already exists.` });
      }

      const newReq = await db.insert('requirements', {
        code,
        standard_id,
        title,
        description,
        department_id: department_id || null,
        frequency,
        risk_level: risk_level || 'Medium',
        responsible_role: responsible_role || 'Department Manager',
        evidence_required: evidence_required !== undefined ? evidence_required : true,
        due_date_rule: due_date_rule || 'End of frequency cycle',
        weight: weight ? Number(weight) : 10,
        status: status || 'Active',
        is_deleted: false
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_REQUIREMENT',
        entityType: 'REQUIREMENT',
        entityId: newReq.id,
        entityName: newReq.title,
        newValue: newReq,
        req
      });

      res.status(201).json({ success: true, message: 'Requirement created successfully', requirement: newReq });
    } catch (err) {
      next(err);
    }
  },

  async updateRequirement(req, res, next) {
    try {
      const oldReq = await db.findById('requirements', req.params.id);
      if (!oldReq) {
        return res.status(404).json({ success: false, message: 'Requirement not found' });
      }

      const updated = await db.updateById('requirements', req.params.id, req.body);

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_REQUIREMENT',
        entityType: 'REQUIREMENT',
        entityId: updated.id,
        entityName: updated.title,
        oldValue: oldReq,
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Requirement updated successfully', requirement: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteRequirement(req, res, next) {
    try {
      await db.deleteById('requirements', req.params.id, true);
      res.json({ success: true, message: 'Requirement deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Trigger Automatic Task Generation
  async triggerAutoTasks(req, res, next) {
    try {
      const result = await taskGeneratorService.generateTasksForActiveRequirements(req.user?.factory_id);
      res.json({
        success: true,
        message: `Task generation complete: ${result.generated_count} new tasks generated.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

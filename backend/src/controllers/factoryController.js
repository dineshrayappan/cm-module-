import { db } from '../db/dbAdapter.js';

export const factoryController = {
  async getFactories(req, res, next) {
    try {
      const factories = await db.find('factories', {});
      res.json({ success: true, count: factories.length, factories });
    } catch (err) {
      next(err);
    }
  },

  async getFactoryById(req, res, next) {
    try {
      const factory = await db.findById('factories', req.params.id);
      if (!factory) {
        return res.status(404).json({ success: false, message: 'Factory not found' });
      }
      res.json({ success: true, factory });
    } catch (err) {
      next(err);
    }
  },

  async createFactory(req, res, next) {
    try {
      const { code, name, address, country, state, contact_person, contact_number, email, status } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'Factory code and name are required.' });
      }

      // Check unique code
      const existing = await db.findOne('factories', { code });
      if (existing) {
        return res.status(400).json({ success: false, message: `Factory with code '${code}' already exists.` });
      }

      const newFactory = await db.insert('factories', {
        code,
        name,
        address,
        country: country || 'Bangladesh',
        state,
        contact_person,
        contact_number,
        email,
        status: status || 'Active',
        is_deleted: false
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_FACTORY',
        entityType: 'FACTORY',
        entityId: newFactory.id,
        entityName: newFactory.name,
        newValue: newFactory,
        req
      });

      res.status(201).json({ success: true, message: 'Factory created successfully', factory: newFactory });
    } catch (err) {
      next(err);
    }
  },

  async updateFactory(req, res, next) {
    try {
      const oldFactory = await db.findById('factories', req.params.id);
      if (!oldFactory) {
        return res.status(404).json({ success: false, message: 'Factory not found' });
      }

      const updated = await db.updateById('factories', req.params.id, req.body);

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_FACTORY',
        entityType: 'FACTORY',
        entityId: updated.id,
        entityName: updated.name,
        oldValue: oldFactory,
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Factory updated successfully', factory: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteFactory(req, res, next) {
    try {
      await db.deleteById('factories', req.params.id, true);
      res.json({ success: true, message: 'Factory deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export const departmentController = {
  async getDepartments(req, res, next) {
    try {
      const { factory_id } = req.query;
      const filter = {};
      if (factory_id) filter.factory_id = factory_id;

      const departments = await db.find('departments', filter);
      const factories = await db.find('factories', {});

      const enriched = departments.map(d => ({
        ...d,
        factory_name: factories.find(f => f.id === d.factory_id)?.name || 'Default Factory'
      }));

      res.json({ success: true, count: enriched.length, departments: enriched });
    } catch (err) {
      next(err);
    }
  },

  async getDepartmentById(req, res, next) {
    try {
      const department = await db.findById('departments', req.params.id);
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, department });
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(req, res, next) {
    try {
      const { factory_id, code, name, manager_name, manager_email, description, status } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'Department code and name are required.' });
      }

      const factories = await db.find('factories', {});
      const fId = factory_id || (factories[0]?.id);

      const existing = await db.findOne('departments', { code, factory_id: fId });
      if (existing) {
        return res.status(400).json({ success: false, message: `Department code '${code}' already exists in this factory.` });
      }

      const newDept = await db.insert('departments', {
        factory_id: fId,
        code,
        name,
        manager_name,
        manager_email,
        description,
        status: status || 'Active',
        is_deleted: false
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_DEPARTMENT',
        entityType: 'DEPARTMENT',
        entityId: newDept.id,
        entityName: newDept.name,
        newValue: newDept,
        req
      });

      res.status(201).json({ success: true, message: 'Department created successfully', department: newDept });
    } catch (err) {
      next(err);
    }
  },

  async updateDepartment(req, res, next) {
    try {
      const oldDept = await db.findById('departments', req.params.id);
      if (!oldDept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      const updated = await db.updateById('departments', req.params.id, req.body);

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_DEPARTMENT',
        entityType: 'DEPARTMENT',
        entityId: updated.id,
        entityName: updated.name,
        oldValue: oldDept,
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Department updated successfully', department: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteDepartment(req, res, next) {
    try {
      await db.deleteById('departments', req.params.id, true);
      res.json({ success: true, message: 'Department deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

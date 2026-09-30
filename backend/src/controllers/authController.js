import jwt from 'jsonwebtoken';
import { db } from '../db/dbAdapter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'garment-compliance-secret-key-2026';

export const authController = {
  // Login
  async login(req, res, next) {
    try {
      const { email, password, role } = req.body;

      let user = null;
      if (email) {
        user = await db.findOne('profiles', { email });
      } else if (role) {
        user = await db.findOne('profiles', { role });
        if (!user) {
          if (role === 'admin') user = await db.findOne('profiles', { role: 'super_admin' }) || await db.findOne('profiles', { role: 'compliance_head' });
          if (role === 'auditor') user = await db.findOne('profiles', { role: 'internal_auditor' });
          if (role === 'supervisor') user = await db.findOne('profiles', { role: 'department_manager' }) || await db.findOne('profiles', { role: 'department_user' });
        }
      }

      if (!user) {
        // Fallback to demo admin
        user = await db.findOne('profiles', { role: 'admin' }) || await db.findOne('profiles', { role: 'super_admin' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          factory_id: user.factory_id,
          department_id: user.department_id
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          factory_id: user.factory_id,
          department_id: user.department_id,
          phone: user.phone,
          avatar_url: user.avatar_url
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Switch Role (Instant switcher between the 3 roles: ADMIN, AUDITOR, SUPERVISOR)
  async switchRole(req, res, next) {
    try {
      const { role } = req.body;
      let user = await db.findOne('profiles', { role });

      if (!user) {
        if (role === 'admin') user = await db.findOne('profiles', { role: 'super_admin' }) || await db.findOne('profiles', { role: 'compliance_head' });
        if (role === 'auditor') user = await db.findOne('profiles', { role: 'internal_auditor' });
        if (role === 'supervisor') user = await db.findOne('profiles', { role: 'department_manager' }) || await db.findOne('profiles', { role: 'department_user' });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: `No profile found for role '${role}'` });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          factory_id: user.factory_id,
          department_id: user.department_id
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: `Switched active role to ${user.full_name} (${role})`,
        token,
        user
      });
    } catch (err) {
      next(err);
    }
  },

  // Get current logged-in profile
  async getMe(req, res, next) {
    try {
      const profile = await db.findById('profiles', req.user.id);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'User profile not found' });
      }

      let department = null;
      if (profile.department_id) {
        department = await db.findById('departments', profile.department_id);
      }

      let factory = null;
      if (profile.factory_id) {
        factory = await db.findById('factories', profile.factory_id);
      }

      res.json({
        success: true,
        user: {
          ...profile,
          department_name: department?.name || null,
          factory_name: factory?.name || null
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // List all users
  async getUsers(req, res, next) {
    try {
      const users = await db.find('profiles', {});
      const departments = await db.find('departments', {});
      const factories = await db.find('factories', {});

      const enriched = users.map(u => ({
        ...u,
        department_name: departments.find(d => d.id === u.department_id)?.name || 'All Departments',
        factory_name: factories.find(f => f.id === u.factory_id)?.name || 'All Factories'
      }));

      res.json({ success: true, count: enriched.length, users: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { full_name, phone, avatar_url } = req.body;
      const updated = await db.updateById('profiles', req.user.id, {
        full_name,
        phone,
        avatar_url
      });
      res.json({ success: true, message: 'Profile updated', user: updated });
    } catch (err) {
      next(err);
    }
  }
};

import jwt from 'jsonwebtoken';
import { db } from '../db/dbAdapter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'garment-compliance-secret-key-2026';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const customUserId = req.headers['x-user-id'];
    const customUserRole = req.headers['x-user-role'];

    // 1. Direct Demo Header Switcher (for instant testing of any of the 7 roles without relogging)
    if (customUserRole || customUserId) {
      let profile = null;
      if (customUserId) {
        profile = await db.findById('profiles', customUserId);
      }
      if (!profile && customUserRole) {
        profile = await db.findOne('profiles', { role: customUserRole });
      }

      if (profile) {
        req.user = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          factory_id: profile.factory_id,
          department_id: profile.department_id
        };
        return next();
      }
    }

    // 2. Token-based auth (JWT or Supabase access token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // If Supabase is connected, verify with Supabase
      if (db.isSupabase() && db.supabase) {
        try {
          const { data: { user }, error } = await db.supabase.auth.getUser(token);
          if (user && !error) {
            const profile = await db.findById('profiles', user.id);
            req.user = {
              id: user.id,
              email: user.email,
              full_name: profile ? profile.full_name : (user.user_metadata?.full_name || 'User'),
              role: profile ? profile.role : 'viewer',
              factory_id: profile?.factory_id || null,
              department_id: profile?.department_id || null
            };
            return next();
          }
        } catch (err) {
          // fall through to internal JWT decode
        }
      }

      // Local JWT decode
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const profile = await db.findById('profiles', decoded.id);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          full_name: profile ? profile.full_name : decoded.full_name,
          role: profile ? profile.role : decoded.role,
          factory_id: profile?.factory_id || decoded.factory_id,
          department_id: profile?.department_id || decoded.department_id
        };
        return next();
      } catch (jwtErr) {
        // If expired or invalid token
      }
    }

    // 3. Default active user (defaults to Super Admin / Compliance Head for local dev resilience)
    const defaultProfile = await db.findOne('profiles', { role: 'super_admin' }) || {
      id: 'u1111111-1111-1111-1111-111111111111',
      email: 'admin@apexgarments.com',
      full_name: 'Kazi Nazrul Islam',
      role: 'super_admin',
      factory_id: 'f1111111-1111-1111-1111-111111111111',
      department_id: null
    };

    req.user = defaultProfile;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ success: false, message: 'Authentication required.' });
  }
};

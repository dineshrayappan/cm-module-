import jwt from 'jsonwebtoken';
import { db } from '../db/dbAdapter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'garment-compliance-secret-key-2026';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Token-based auth (JWT or Supabase access token) - Primary Authority
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
              username: profile?.username || user.email?.split('@')[0],
              email: user.email,
              full_name: profile ? profile.full_name : (user.user_metadata?.full_name || 'User'),
              role: profile ? profile.role : 'supervisor',
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
          username: decoded.username || profile?.username,
          email: decoded.email,
          full_name: profile ? profile.full_name : decoded.full_name,
          role: profile ? profile.role : decoded.role,
          factory_id: profile?.factory_id || decoded.factory_id,
          department_id: profile?.department_id || decoded.department_id
        };
        return next();
      } catch (jwtErr) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
      }
    }

    // 2. If no Bearer token provided, deny access
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ success: false, message: 'Authentication required.' });
  }
};

import { db } from '../db/dbAdapter.js';

export const notificationsController = {
  async getNotifications(req, res, next) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const notifications = await db.find('notifications', {}, { sortBy: 'created_at', sortOrder: 'desc' });

      // Filter for notifications matching user ID or their role or general
      const filtered = notifications.filter(n => {
        if (!n.user_id && !n.role) return true;
        if (n.user_id === userId) return true;
        if (n.role === userRole) return true;
        if (['super_admin', 'compliance_head'].includes(userRole)) return true;
        return false;
      });

      const unreadCount = filtered.filter(n => !n.read_status).length;

      res.json({
        success: true,
        count: filtered.length,
        unread_count: unreadCount,
        notifications: filtered
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const updated = await db.updateById('notifications', req.params.id, {
        read_status: true
      });
      res.json({ success: true, message: 'Notification marked as read', notification: updated });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const notifications = await db.find('notifications', { read_status: false });
      for (const n of notifications) {
        await db.updateById('notifications', n.id, { read_status: true });
      }
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
};

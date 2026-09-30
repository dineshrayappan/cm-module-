import { db } from '../db/dbAdapter.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';
import { escalationService } from '../services/escalationService.js';

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
  },

  // Get Outbound Email & WhatsApp / SMS logs
  async getOutboundLogs(req, res, next) {
    try {
      const { channel } = req.query;
      const filter = {};
      if (channel) filter.channel = channel;
      const logs = await notificationDispatcher.getOutboundLogs(filter);
      res.json({ success: true, count: logs.length, logs });
    } catch (err) {
      next(err);
    }
  },

  // Manually trigger the 6-stage reminder and escalation evaluator
  async triggerCycle(req, res, next) {
    try {
      const result = await escalationService.processEscalations();
      res.json({
        success: true,
        message: `Notification & Escalation Cycle executed. Dispatched ${result.dispatched_count} notifications.`,
        ...result
      });
    } catch (err) {
      next(err);
    }
  },

  // Test send an alert across In-App, Email, and WhatsApp
  async testDispatch(req, res, next) {
    try {
      const { channel, recipient_email, recipient_phone } = req.body;
      const result = await notificationDispatcher.dispatch({
        recipient: {
          userId: req.user?.id,
          email: recipient_email || req.user?.email || 'compliance.officer@apexgarments.com',
          phone: recipient_phone || '+880 1711-000002',
          name: req.user?.name || 'Compliance Specialist',
          role: req.user?.role || 'compliance_head'
        },
        title: '🔔 Test Notification: Multi-Channel Delivery',
        message: 'This is a test notification confirming real-time alerts across In-App, HTML Email, and SMS/WhatsApp channels.',
        type: 'escalation',
        stage: 'reminder_7d',
        priority: 'High',
        entityType: 'TEST',
        entityCode: 'TEST-ALERT-01',
        link: '/notifications'
      });

      res.json({
        success: true,
        message: 'Test notification dispatched across active channels',
        delivery: result
      });
    } catch (err) {
      next(err);
    }
  }
};

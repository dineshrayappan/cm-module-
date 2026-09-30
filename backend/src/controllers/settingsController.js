import { db } from '../db/dbAdapter.js';

export const settingsController = {
  // Get Scoring Configuration
  async getScoreConfig(req, res, next) {
    try {
      const configs = await db.find('scoreConfigurations', { is_active: true });
      const current = configs[0] || {
        critical_weight: 40.0,
        major_weight: 25.0,
        minor_weight: 10.0,
        task_completion_weight: 15.0,
        audit_pass_weight: 10.0,
        pass_threshold: 85.0
      };
      res.json({ success: true, config: current });
    } catch (err) {
      next(err);
    }
  },

  // Update Scoring Configuration
  async updateScoreConfig(req, res, next) {
    try {
      const {
        critical_weight,
        major_weight,
        minor_weight,
        task_completion_weight,
        audit_pass_weight,
        pass_threshold
      } = req.body;

      const configs = await db.find('scoreConfigurations', { is_active: true });
      let updated = null;

      if (configs.length > 0) {
        updated = await db.updateById('scoreConfigurations', configs[0].id, {
          critical_weight: Number(critical_weight),
          major_weight: Number(major_weight),
          minor_weight: Number(minor_weight),
          task_completion_weight: Number(task_completion_weight),
          audit_pass_weight: Number(audit_pass_weight),
          pass_threshold: Number(pass_threshold)
        });
      } else {
        updated = await db.insert('scoreConfigurations', {
          critical_weight: Number(critical_weight),
          major_weight: Number(major_weight),
          minor_weight: Number(minor_weight),
          task_completion_weight: Number(task_completion_weight),
          audit_pass_weight: Number(audit_pass_weight),
          pass_threshold: Number(pass_threshold),
          is_active: true
        });
      }

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_SCORE_CONFIG',
        entityType: 'SETTINGS',
        entityId: updated.id,
        entityName: 'Scoring Formula Weights',
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Scoring configuration updated successfully', config: updated });
    } catch (err) {
      next(err);
    }
  },

  // Get Escalation Configuration
  async getEscalationConfig(req, res, next) {
    try {
      const configs = await db.find('escalationConfigurations', { is_active: true });
      const current = configs[0] || {
        reminder_days_before: 2,
        escalation_level_1_days: 3,
        escalation_level_2_days: 7,
        escalation_level_3_days: 14
      };
      res.json({ success: true, config: current });
    } catch (err) {
      next(err);
    }
  },

  // Update Escalation Configuration
  async updateEscalationConfig(req, res, next) {
    try {
      const {
        reminder_days_before,
        escalation_level_1_days,
        escalation_level_2_days,
        escalation_level_3_days
      } = req.body;

      const configs = await db.find('escalationConfigurations', { is_active: true });
      let updated = null;

      if (configs.length > 0) {
        updated = await db.updateById('escalationConfigurations', configs[0].id, {
          reminder_days_before: Number(reminder_days_before),
          escalation_level_1_days: Number(escalation_level_1_days),
          escalation_level_2_days: Number(escalation_level_2_days),
          escalation_level_3_days: Number(escalation_level_3_days)
        });
      } else {
        updated = await db.insert('escalationConfigurations', {
          reminder_days_before: Number(reminder_days_before),
          escalation_level_1_days: Number(escalation_level_1_days),
          escalation_level_2_days: Number(escalation_level_2_days),
          escalation_level_3_days: Number(escalation_level_3_days),
          is_active: true
        });
      }

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_ESCALATION_CONFIG',
        entityType: 'SETTINGS',
        entityId: updated.id,
        entityName: 'Escalation Thresholds',
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Escalation configuration updated successfully', config: updated });
    } catch (err) {
      next(err);
    }
  },

  // Get Immutable Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const { entity_type, entity_id, user_email, action } = req.query;
      const filter = {};
      if (entity_type) filter.entity_type = entity_type;
      if (entity_id) filter.entity_id = entity_id;
      if (user_email) filter.user_email = user_email;
      if (action) filter.action = action;

      const logs = await db.find('auditLogs', filter, { sortBy: 'created_at', sortOrder: 'desc' });
      res.json({ success: true, count: logs.length, logs });
    } catch (err) {
      next(err);
    }
  }
};

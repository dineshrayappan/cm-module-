import { db } from '../db/dbAdapter.js';

export const escalationService = {
  /**
   * Run automated escalation check across all tasks and open NCs
   * Identifies overdue items and triggers hierarchical notifications based on configured thresholds
   */
  async processEscalations(factoryId = null) {
    const escConfigs = await db.find('escalationConfigurations', { is_active: true });
    const config = (escConfigs && escConfigs[0]) || {
      reminder_days_before: 2,
      escalation_level_1_days: 3,  // Dept Manager
      escalation_level_2_days: 7,  // Compliance Manager
      escalation_level_3_days: 14  // Compliance Head
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const escalatedItems = [];

    // 1. Process Tasks
    const tasks = await db.find('tasks', factoryId ? { factory_id: factoryId } : {});
    for (const task of tasks) {
      if (['Completed', 'Cancelled'].includes(task.status)) continue;

      const dueDate = new Date(task.due_date);
      const diffMs = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        // Mark as overdue if not already marked
        let newStatus = 'Overdue';
        let newEscalationLevel = task.escalation_level || 0;
        let notifyRole = null;
        let notifMessage = '';

        if (diffDays >= config.escalation_level_3_days && newEscalationLevel < 3) {
          newEscalationLevel = 3;
          notifyRole = 'compliance_head';
          notifMessage = `🔴 Level 3 Escalation: Task ${task.task_code} (${task.title}) is ${diffDays} days overdue! Requires Compliance Head intervention.`;
        } else if (diffDays >= config.escalation_level_2_days && newEscalationLevel < 2) {
          newEscalationLevel = 2;
          notifyRole = 'compliance_manager';
          notifMessage = `🟠 Level 2 Escalation: Task ${task.task_code} (${task.title}) is ${diffDays} days overdue! Escalated to Compliance Manager.`;
        } else if (diffDays >= config.escalation_level_1_days && newEscalationLevel < 1) {
          newEscalationLevel = 1;
          notifyRole = 'department_manager';
          notifMessage = `🟡 Level 1 Escalation: Task ${task.task_code} (${task.title}) is ${diffDays} days overdue. Escalated to Department Manager.`;
        }

        if (task.status !== newStatus || task.escalation_level !== newEscalationLevel) {
          await db.updateById('tasks', task.id, {
            status: newStatus,
            escalation_level: newEscalationLevel
          });

          if (notifyRole) {
            await db.sendNotification({
              userId: null,
              role: notifyRole,
              title: `Escalation: Task ${task.task_code} Overdue (${diffDays}d)`,
              message: notifMessage,
              type: 'escalation',
              priority: newEscalationLevel === 3 ? 'Critical' : 'High',
              link: '/tasks'
            });

            escalatedItems.push({
              type: 'task',
              id: task.id,
              code: task.task_code,
              diffDays,
              level: newEscalationLevel,
              targetRole: notifyRole
            });
          }
        }
      }
    }

    // 2. Process Open NCs
    const ncs = await db.find('nonConformities', factoryId ? { factory_id: factoryId } : {});
    for (const nc of ncs) {
      if (nc.status === 'Closed') continue;

      const dueDate = new Date(nc.due_date);
      const diffMs = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        let notifyRole = null;
        let notifMessage = '';
        let targetLevel = 1;

        if (diffDays >= config.escalation_level_3_days) {
          targetLevel = 3;
          notifyRole = 'compliance_head';
          notifMessage = `🔴 Critical Escalation: Non-Conformity ${nc.nc_number} (${nc.severity}) is ${diffDays} days past target closure! Escalated to Compliance Head.`;
        } else if (diffDays >= config.escalation_level_2_days) {
          targetLevel = 2;
          notifyRole = 'compliance_manager';
          notifMessage = `🟠 Level 2 Escalation: NC ${nc.nc_number} is ${diffDays} days overdue. Escalated to Compliance Manager.`;
        } else if (diffDays >= config.escalation_level_1_days) {
          targetLevel = 1;
          notifyRole = 'department_manager';
          notifMessage = `🟡 Level 1 Escalation: NC ${nc.nc_number} is ${diffDays} days overdue. Escalated to Department Manager.`;
        }

        if (notifyRole) {
          // Check if notification already sent in last 24h
          await db.sendNotification({
            userId: nc.responsible_person_id || null,
            role: notifyRole,
            title: `🔴 Overdue NC: ${nc.nc_number} (${diffDays} days)`,
            message: notifMessage,
            type: 'escalation',
            priority: targetLevel >= 2 ? 'Critical' : 'High',
            link: `/nc/${nc.id}`
          });

          escalatedItems.push({
            type: 'nc',
            id: nc.id,
            code: nc.nc_number,
            diffDays,
            level: targetLevel,
            targetRole: notifyRole
          });
        }
      }
    }

    return {
      processed_at: new Date().toISOString(),
      config_used: config,
      escalated_count: escalatedItems.length,
      items: escalatedItems
    };
  }
};

import { db } from '../db/dbAdapter.js';
import { notificationDispatcher } from './notificationDispatcher.js';

export const escalationService = {
  /**
   * Run automated multi-stage reminder & escalation checks across all active Tasks and open NCs
   * Stages:
   * 1. 7 days before due date -> Reminder
   * 2. 3 days before due date -> Urgent Reminder
   * 3. Due date (0 days) -> Due Today
   * 4. After due date (1+ days) -> Overdue Alert & Status Update
   * 5. 3 days overdue -> Escalate to Department Manager
   * 6. 7 days overdue -> Escalate to Compliance Head
   */
  async processEscalations(factoryId = null) {
    const escConfigs = await db.find('escalationConfigurations', { is_active: true });
    const config = (escConfigs && escConfigs[0]) || {
      advance_reminder_days: 7,
      urgent_reminder_days: 3,
      due_today_alert: true,
      overdue_alert: true,
      escalation_level_1_days: 3, // 3 days overdue -> Dept Manager
      escalation_level_2_days: 7, // 7 days overdue -> Compliance Head
      enable_in_app: true,
      enable_email: true,
      enable_whatsapp_sms: true
    };

    const now = new Date();
    // Normalize to date string (YYYY-MM-DD)
    const todayStr = now.toISOString().split('T')[0];
    const todayMidnight = new Date(todayStr + 'T00:00:00Z');

    const dispatchedLog = [];

    // Helper: Find department manager
    const getDeptManager = async (departmentId) => {
      if (!departmentId) return null;
      const mgr = await db.findOne('profiles', { department_id: departmentId, role: 'department_manager' });
      if (mgr) return mgr;
      // Fallback: any department manager
      return db.findOne('profiles', { role: 'department_manager' });
    };

    // Helper: Find Compliance Head & Compliance Manager
    const complianceHead = await db.findOne('profiles', { role: 'compliance_head' });
    const complianceMgr = await db.findOne('profiles', { role: 'compliance_manager' });

    // ==========================================
    // 1. PROCESS COMPLIANCE TASKS
    // ==========================================
    const tasks = await db.find('tasks', factoryId ? { factory_id: factoryId } : {});

    for (const task of tasks) {
      if (['Completed', 'Cancelled'].includes(task.status)) continue;
      if (!task.due_date) continue;

      const dueMidnight = new Date(task.due_date.split('T')[0] + 'T00:00:00Z');
      const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
      const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const daysOverdue = -daysUntilDue;

      // Determine recipient (assigned user or department manager fallback)
      let assignee = null;
      if (task.assigned_to) {
        assignee = await db.findById('profiles', task.assigned_to);
      }
      if (!assignee) {
        assignee = await getDeptManager(task.department_id);
      }

      const deptMgr = await getDeptManager(task.department_id);

      // STAGE 1: 7 Days Before Due Date -> Advance Reminder
      if (daysUntilDue === config.advance_reminder_days || (daysUntilDue <= 7 && daysUntilDue > 3)) {
        const stage = 'reminder_7d';
        const alreadySent = await db.findOne('notifications', { entity_id: task.id, stage });
        if (!alreadySent && assignee) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: assignee.id,
              email: assignee.email,
              phone: assignee.phone,
              name: assignee.full_name,
              role: assignee.role
            },
            title: `📅 Advance Reminder: Task ${task.task_code} Due in 7 Days`,
            message: `Task "${task.title}" is due on ${task.due_date}. Please review required checklists and prepare necessary evidence.`,
            type: 'task',
            stage,
            priority: 'Normal',
            entityType: 'TASK',
            entityId: task.id,
            entityCode: task.task_code,
            link: '/tasks'
          });
          dispatchedLog.push({ entity: task.task_code, stage, recipient: assignee.email, daysUntilDue });
        }
      }

      // STAGE 2: 3 Days Before Due Date -> Urgent Reminder
      if (daysUntilDue === config.urgent_reminder_days || (daysUntilDue <= 3 && daysUntilDue > 0)) {
        const stage = 'reminder_3d';
        const alreadySent = await db.findOne('notifications', { entity_id: task.id, stage });
        if (!alreadySent && assignee) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: assignee.id,
              email: assignee.email,
              phone: assignee.phone,
              name: assignee.full_name,
              role: assignee.role
            },
            title: `⏳ Reminder: Task ${task.task_code} Due in 3 Days`,
            message: `Urgent: Task "${task.title}" is due in ${daysUntilDue} day(s) on ${task.due_date}. Evidence upload required before completion.`,
            type: 'task',
            stage,
            priority: 'High',
            entityType: 'TASK',
            entityId: task.id,
            entityCode: task.task_code,
            link: '/tasks'
          });
          dispatchedLog.push({ entity: task.task_code, stage, recipient: assignee.email, daysUntilDue });
        }
      }

      // STAGE 3: Due Date (0 Days) -> Due Today Alert
      if (daysUntilDue === 0) {
        const stage = 'due_today';
        const alreadySent = await db.findOne('notifications', { entity_id: task.id, stage });
        if (!alreadySent && assignee) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: assignee.id,
              email: assignee.email,
              phone: assignee.phone,
              name: assignee.full_name,
              role: assignee.role
            },
            title: `🚨 Due Today: Task ${task.task_code}`,
            message: `Task "${task.title}" reaches its final completion deadline today (${task.due_date}). Please submit execution report and evidence.`,
            type: 'task',
            stage,
            priority: 'High',
            entityType: 'TASK',
            entityId: task.id,
            entityCode: task.task_code,
            link: '/tasks'
          });
          dispatchedLog.push({ entity: task.task_code, stage, recipient: assignee.email, daysUntilDue: 0 });
        }
      }

      // STAGE 4: After Due Date (1+ Days Overdue) -> Overdue Alert & Status Update
      if (daysOverdue >= 1) {
        if (task.status !== 'Overdue') {
          await db.updateById('tasks', task.id, { status: 'Overdue', is_overdue: true });
        }

        const stage = 'overdue';
        const alreadySent = await db.findOne('notifications', { entity_id: task.id, stage });
        if (!alreadySent && assignee) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: assignee.id,
              email: assignee.email,
              phone: assignee.phone,
              name: assignee.full_name,
              role: assignee.role
            },
            title: `🔴 Overdue Notice: Task ${task.task_code} (${daysOverdue}d)`,
            message: `Task "${task.title}" passed its deadline on ${task.due_date}. It is now ${daysOverdue} day(s) overdue. Immediate action required.`,
            type: 'task',
            stage,
            priority: 'Critical',
            entityType: 'TASK',
            entityId: task.id,
            entityCode: task.task_code,
            link: '/tasks'
          });
          dispatchedLog.push({ entity: task.task_code, stage, recipient: assignee.email, daysOverdue });
        }
      }

      // STAGE 5: 3 Days Overdue -> Escalate to Department Manager
      if (daysOverdue >= config.escalation_level_1_days) {
        const stage = 'escalate_dept_mgr';
        const alreadySent = await db.findOne('notifications', { entity_id: task.id, stage });
        if (!alreadySent) {
          await db.updateById('tasks', task.id, { escalation_level: 1 });

          // Alert Department Manager
          if (deptMgr) {
            await notificationDispatcher.dispatch({
              recipient: {
                userId: deptMgr.id,
                email: deptMgr.email,
                phone: deptMgr.phone,
                name: deptMgr.full_name,
                role: 'department_manager'
              },
              title: `⚠️ Level 1 Escalation: Task ${task.task_code} is ${daysOverdue} Days Overdue`,
              message: `Escalation to Department Manager: Task "${task.title}" assigned in your department is ${daysOverdue} days past deadline. Please intervene.`,
              type: 'escalation',
              stage,
              priority: 'High',
              entityType: 'TASK',
              entityId: task.id,
              entityCode: task.task_code,
              link: '/tasks'
            });
            dispatchedLog.push({ entity: task.task_code, stage, recipient: deptMgr.email, daysOverdue });
          }
        }
      }

      // STAGE 6: 7 Days Overdue -> Escalate to Compliance Head
      if (daysOverdue >= config.escalation_level_2_days) {
        const stage = 'escalate_compliance_head';
        const alreadySent = await db.findOne('notifications', { entity_id: task.id, stage });
        if (!alreadySent) {
          await db.updateById('tasks', task.id, { escalation_level: 2 });

          // Alert Compliance Head & Manager
          if (complianceHead) {
            await notificationDispatcher.dispatch({
              recipient: {
                userId: complianceHead.id,
                email: complianceHead.email,
                phone: complianceHead.phone,
                name: complianceHead.full_name,
                role: 'compliance_head'
              },
              title: `🚨 Critical Escalation: Task ${task.task_code} (${daysOverdue}d Overdue)`,
              message: `Executive Escalation to Compliance Head: Task "${task.title}" has been overdue for ${daysOverdue} days. System compliance rating impacted.`,
              type: 'escalation',
              stage,
              priority: 'Critical',
              entityType: 'TASK',
              entityId: task.id,
              entityCode: task.task_code,
              link: '/tasks'
            });
            dispatchedLog.push({ entity: task.task_code, stage, recipient: complianceHead.email, daysOverdue });
          }
        }
      }
    }

    // ==========================================
    // 2. PROCESS OPEN NON-CONFORMITIES (NC)
    // ==========================================
    const ncs = await db.find('nonConformities', factoryId ? { factory_id: factoryId } : {});

    for (const nc of ncs) {
      if (nc.status === 'Closed') continue;
      if (!nc.due_date) continue;

      const dueMidnight = new Date(nc.due_date.split('T')[0] + 'T00:00:00Z');
      const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
      const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const daysOverdue = -daysUntilDue;

      let responsible = null;
      if (nc.responsible_person_id) {
        responsible = await db.findById('profiles', nc.responsible_person_id);
      }
      if (!responsible) {
        responsible = await getDeptManager(nc.department_id);
      }
      const deptMgr = await getDeptManager(nc.department_id);

      // NC STAGE 1: 7 Days Before Target Date -> Reminder
      if (daysUntilDue === config.advance_reminder_days || (daysUntilDue <= 7 && daysUntilDue > 3)) {
        const stage = 'reminder_7d';
        const alreadySent = await db.findOne('notifications', { entity_id: nc.id, stage });
        if (!alreadySent && responsible) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: responsible.id,
              email: responsible.email,
              phone: responsible.phone,
              name: responsible.full_name,
              role: responsible.role
            },
            title: `📅 CAP Submission Reminder: NC ${nc.nc_number} (Due in 7d)`,
            message: `Non-Conformity "${nc.finding}" (${nc.severity}) target resolution date is ${nc.due_date}. Please formulate and submit CAP.`,
            type: 'nc',
            stage,
            priority: 'Normal',
            entityType: 'NC',
            entityId: nc.id,
            entityCode: nc.nc_number,
            link: `/ncs`
          });
          dispatchedLog.push({ entity: nc.nc_number, stage, recipient: responsible.email, daysUntilDue });
        }
      }

      // NC STAGE 2: 3 Days Before Target Date -> Urgent Reminder
      if (daysUntilDue === config.urgent_reminder_days || (daysUntilDue <= 3 && daysUntilDue > 0)) {
        const stage = 'reminder_3d';
        const alreadySent = await db.findOne('notifications', { entity_id: nc.id, stage });
        if (!alreadySent && responsible) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: responsible.id,
              email: responsible.email,
              phone: responsible.phone,
              name: responsible.full_name,
              role: responsible.role
            },
            title: `⏳ Urgent CAP Deadline: NC ${nc.nc_number} (Due in 3d)`,
            message: `Attention required: Corrective action plan for "${nc.finding}" must be submitted within 3 days (${nc.due_date}).`,
            type: 'nc',
            stage,
            priority: 'High',
            entityType: 'NC',
            entityId: nc.id,
            entityCode: nc.nc_number,
            link: `/ncs`
          });
          dispatchedLog.push({ entity: nc.nc_number, stage, recipient: responsible.email, daysUntilDue });
        }
      }

      // NC STAGE 3: Due Date (0 Days) -> Due Today
      if (daysUntilDue === 0) {
        const stage = 'due_today';
        const alreadySent = await db.findOne('notifications', { entity_id: nc.id, stage });
        if (!alreadySent && responsible) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: responsible.id,
              email: responsible.email,
              phone: responsible.phone,
              name: responsible.full_name,
              role: responsible.role
            },
            title: `🚨 NC Target Date Reached Today: ${nc.nc_number}`,
            message: `Target closure deadline for NC ${nc.nc_number} is today. Ensure CAP evidence is attached for auditor verification.`,
            type: 'nc',
            stage,
            priority: 'High',
            entityType: 'NC',
            entityId: nc.id,
            entityCode: nc.nc_number,
            link: `/ncs`
          });
          dispatchedLog.push({ entity: nc.nc_number, stage, recipient: responsible.email, daysUntilDue: 0 });
        }
      }

      // NC STAGE 4: After Due Date (1+ Days Overdue) -> Overdue Alert
      if (daysOverdue >= 1) {
        if (!nc.is_overdue) {
          await db.updateById('nonConformities', nc.id, { is_overdue: true });
        }

        const stage = 'overdue';
        const alreadySent = await db.findOne('notifications', { entity_id: nc.id, stage });
        if (!alreadySent && responsible) {
          await notificationDispatcher.dispatch({
            recipient: {
              userId: responsible.id,
              email: responsible.email,
              phone: responsible.phone,
              name: responsible.full_name,
              role: responsible.role
            },
            title: `🔴 OVERDUE NON-CONFORMITY: ${nc.nc_number} (${daysOverdue}d)`,
            message: `Non-Conformity "${nc.finding}" (${nc.severity}) is ${daysOverdue} day(s) overdue. Escalation process initiated.`,
            type: 'nc',
            stage,
            priority: 'Critical',
            entityType: 'NC',
            entityId: nc.id,
            entityCode: nc.nc_number,
            link: `/ncs`
          });
          dispatchedLog.push({ entity: nc.nc_number, stage, recipient: responsible.email, daysOverdue });
        }
      }

      // NC STAGE 5: 3 Days Overdue -> Escalate to Department Manager
      if (daysOverdue >= config.escalation_level_1_days) {
        const stage = 'escalate_dept_mgr';
        const alreadySent = await db.findOne('notifications', { entity_id: nc.id, stage });
        if (!alreadySent) {
          if (deptMgr) {
            await notificationDispatcher.dispatch({
              recipient: {
                userId: deptMgr.id,
                email: deptMgr.email,
                phone: deptMgr.phone,
                name: deptMgr.full_name,
                role: 'department_manager'
              },
              title: `⚠️ Level 1 Escalation: NC ${nc.nc_number} is ${daysOverdue} Days Overdue`,
              message: `Department Manager Escalation: Non-Conformity in your department (${nc.finding}) is ${daysOverdue} days past target closure. Immediate CAP submission required.`,
              type: 'escalation',
              stage,
              priority: 'High',
              entityType: 'NC',
              entityId: nc.id,
              entityCode: nc.nc_number,
              link: `/ncs`
            });
            dispatchedLog.push({ entity: nc.nc_number, stage, recipient: deptMgr.email, daysOverdue });
          }
        }
      }

      // NC STAGE 6: 7 Days Overdue -> Escalate to Compliance Head
      if (daysOverdue >= config.escalation_level_2_days) {
        const stage = 'escalate_compliance_head';
        const alreadySent = await db.findOne('notifications', { entity_id: nc.id, stage });
        if (!alreadySent) {
          if (complianceHead) {
            await notificationDispatcher.dispatch({
              recipient: {
                userId: complianceHead.id,
                email: complianceHead.email,
                phone: complianceHead.phone,
                name: complianceHead.full_name,
                role: 'compliance_head'
              },
              title: `🚨 Critical Escalation: NC ${nc.nc_number} Overdue by ${daysOverdue} Days`,
              message: `Executive Escalation to Compliance Head: Unresolved ${nc.severity} NC "${nc.finding}" is ${daysOverdue} days past target date. Immediate management sanction required.`,
              type: 'escalation',
              stage,
              priority: 'Critical',
              entityType: 'NC',
              entityId: nc.id,
              entityCode: nc.nc_number,
              link: `/ncs`
            });
            dispatchedLog.push({ entity: nc.nc_number, stage, recipient: complianceHead.email, daysOverdue });
          }
        }
      }
    }

    return {
      success: true,
      processed_at: new Date().toISOString(),
      dispatched_count: dispatchedLog.length,
      dispatched_items: dispatchedLog
    };
  }
};

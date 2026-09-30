import { db } from '../db/dbAdapter.js';
import { taskGeneratorService } from '../services/taskGeneratorService.js';
import { escalationService } from '../services/escalationService.js';

export const tasksController = {
  // Get all tasks with multi-criteria filtering
  async getTasks(req, res, next) {
    try {
      const { department_id, assigned_user_id, status, priority, due_date, search, factory_id } = req.query;
      const filter = {};

      if (department_id) filter.department_id = department_id;
      if (assigned_user_id) filter.assigned_user_id = assigned_user_id;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (due_date) filter.due_date = due_date;
      if (factory_id) filter.factory_id = factory_id;
      if (search) filter.title = `LIKE:${search}`;

      const tasks = await db.find('tasks', filter, { sortBy: 'due_date', sortOrder: 'asc' });
      const departments = await db.find('departments', {});
      const profiles = await db.find('profiles', {});
      const requirements = await db.find('requirements', {});

      const now = new Date().toISOString().split('T')[0];

      const enriched = tasks.map(t => {
        const reqDoc = requirements.find(r => r.id === t.requirement_id);
        const isOverdue = t.status !== 'Completed' && t.status !== 'Cancelled' && t.due_date < now;
        return {
          ...t,
          status: isOverdue ? 'Overdue' : t.status,
          department_name: departments.find(d => d.id === t.department_id)?.name || 'General',
          department_code: departments.find(d => d.id === t.department_id)?.code || '',
          assigned_user_name: profiles.find(p => p.id === t.assigned_user_id)?.full_name || 'Unassigned',
          requirement_code: reqDoc?.code || '',
          evidence_required: reqDoc?.evidence_required !== false
        };
      });

      res.json({ success: true, count: enriched.length, tasks: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Get My Tasks (Assigned to logged-in user or user's department)
  async getMyTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const deptId = req.user.department_id;
      const userRole = req.user.role;

      let allTasks = await db.find('tasks', {});
      const departments = await db.find('departments', {});
      const profiles = await db.find('profiles', {});
      const requirements = await db.find('requirements', {});
      const now = new Date().toISOString().split('T')[0];

      // If department user or manager, filter by their tasks
      if (['department_user', 'department_manager'].includes(userRole)) {
        allTasks = allTasks.filter(t => t.assigned_user_id === userId || (deptId && t.department_id === deptId));
      }

      const enriched = allTasks.map(t => {
        const reqDoc = requirements.find(r => r.id === t.requirement_id);
        const isOverdue = t.status !== 'Completed' && t.status !== 'Cancelled' && t.due_date < now;
        return {
          ...t,
          status: isOverdue ? 'Overdue' : t.status,
          department_name: departments.find(d => d.id === t.department_id)?.name || 'General',
          assigned_user_name: profiles.find(p => p.id === t.assigned_user_id)?.full_name || 'Unassigned',
          requirement_code: reqDoc?.code || '',
          evidence_required: reqDoc?.evidence_required !== false
        };
      });

      res.json({ success: true, count: enriched.length, tasks: enriched });
    } catch (err) {
      next(err);
    }
  },

  async getTaskById(req, res, next) {
    try {
      const task = await db.findById('tasks', req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const requirement = await db.findById('requirements', task.requirement_id);
      const department = await db.findById('departments', task.department_id);
      const assignedUser = task.assigned_user_id ? await db.findById('profiles', task.assigned_user_id) : null;
      const evidenceList = await db.find('evidence', { related_task_id: task.id });

      res.json({
        success: true,
        task: {
          ...task,
          requirement,
          department_name: department?.name,
          assigned_user_name: assignedUser?.full_name || 'Unassigned',
          evidence_list: evidenceList
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async createTask(req, res, next) {
    try {
      const {
        requirement_id,
        department_id,
        assigned_user_id,
        factory_id,
        title,
        description,
        due_date,
        priority
      } = req.body;

      if (!title || !due_date) {
        return res.status(400).json({ success: false, message: 'Task title and due date are required.' });
      }

      const taskCode = `TSK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTask = await db.insert('tasks', {
        task_code: taskCode,
        requirement_id: requirement_id || null,
        department_id: department_id || req.user?.department_id || null,
        assigned_user_id: assigned_user_id || null,
        factory_id: factory_id || req.user?.factory_id || 'f1111111-1111-1111-1111-111111111111',
        title,
        description: description || '',
        created_date: new Date().toISOString().split('T')[0],
        due_date,
        completed_date: null,
        priority: priority || 'Medium',
        status: 'Pending',
        evidence_url: null,
        comments: '',
        escalation_level: 0,
        is_auto_generated: false,
        is_deleted: false
      });

      if (assigned_user_id) {
        await db.sendNotification({
          userId: assigned_user_id,
          title: `New Task Assigned: ${taskCode}`,
          message: `You have been assigned compliance task: "${title}", due on ${due_date}.`,
          type: 'task',
          priority: priority || 'Normal',
          link: '/tasks'
        });
      }

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'CREATE_TASK',
        entityType: 'TASK',
        entityId: newTask.id,
        entityName: newTask.title,
        newValue: newTask,
        req
      });

      res.status(201).json({ success: true, message: 'Task created successfully', task: newTask });
    } catch (err) {
      next(err);
    }
  },

  // Start task
  async startTask(req, res, next) {
    try {
      const task = await db.findById('tasks', req.params.id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      const updated = await db.updateById('tasks', req.params.id, {
        status: 'In Progress'
      });

      res.json({ success: true, message: 'Task marked as In Progress', task: updated });
    } catch (err) {
      next(err);
    }
  },

  // Complete task (enforces evidence requirement check!)
  async completeTask(req, res, next) {
    try {
      const task = await db.findById('tasks', req.params.id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      const { comments, evidence_url } = req.body;

      // Check if Requirement requires evidence
      if (task.requirement_id) {
        const reqDoc = await db.findById('requirements', task.requirement_id);
        if (reqDoc && reqDoc.evidence_required) {
          const uploadedEvidence = await db.find('evidence', { related_task_id: task.id });
          const hasEvidence = (evidence_url || task.evidence_url || uploadedEvidence.length > 0);

          if (!hasEvidence) {
            return res.status(400).json({
              success: false,
              message: `Validation Error: Requirement [${reqDoc.code}] requires mandatory evidence attachment before this task can be marked Completed.`
            });
          }
        }
      }

      const updated = await db.updateById('tasks', req.params.id, {
        status: 'Completed',
        completed_date: new Date().toISOString(),
        comments: comments || task.comments,
        evidence_url: evidence_url || task.evidence_url
      });

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'COMPLETE_TASK',
        entityType: 'TASK',
        entityId: task.id,
        entityName: task.title,
        oldValue: { status: task.status },
        newValue: { status: 'Completed', completed_date: updated.completed_date },
        req
      });

      res.json({ success: true, message: 'Task completed successfully', task: updated });
    } catch (err) {
      next(err);
    }
  },

  // Update task details
  async updateTask(req, res, next) {
    try {
      const oldTask = await db.findById('tasks', req.params.id);
      if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });

      const updated = await db.updateById('tasks', req.params.id, req.body);

      await db.logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'UPDATE_TASK',
        entityType: 'TASK',
        entityId: updated.id,
        entityName: updated.title,
        oldValue: oldTask,
        newValue: updated,
        req
      });

      res.json({ success: true, message: 'Task updated', task: updated });
    } catch (err) {
      next(err);
    }
  },

  // Run periodic automated task generator & escalation check
  async runAutoSchedule(req, res, next) {
    try {
      const tasksGen = await taskGeneratorService.generateTasksForActiveRequirements(req.user?.factory_id);
      const escalations = await escalationService.processEscalations(req.user?.factory_id);

      res.json({
        success: true,
        message: 'Auto-generation & escalation cycle completed successfully',
        tasks_generated: tasksGen.generated_count,
        items_escalated: escalations.escalated_count,
        escalations_summary: escalations.items
      });
    } catch (err) {
      next(err);
    }
  }
};

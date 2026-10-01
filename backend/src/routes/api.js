import express from 'express';
import { authController } from '../controllers/authController.js';
import { factoryController, departmentController } from '../controllers/factoryController.js';
import { standardsController, requirementsController } from '../controllers/standardsController.js';
import { tasksController } from '../controllers/tasksController.js';
import { auditsController } from '../controllers/auditsController.js';
import { ncController } from '../controllers/ncController.js';
import { capController } from '../controllers/capController.js';
import { evidenceController, uploadMiddleware } from '../controllers/evidenceController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { notificationsController } from '../controllers/notificationsController.js';
import { reportsController } from '../controllers/reportsController.js';
import { settingsController } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/switch-role', authController.switchRole);
router.get('/auth/me', authMiddleware, authController.getMe);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.get('/auth/users', authMiddleware, requireRole(['admin']), authController.getUsers);

// ==========================================
// 2. FACTORIES & DEPARTMENTS
// ==========================================
router.get('/factories', authMiddleware, factoryController.getFactories);
router.get('/factories/:id', authMiddleware, factoryController.getFactoryById);
router.post('/factories', authMiddleware, requireRole(['admin']), factoryController.createFactory);
router.put('/factories/:id', authMiddleware, requireRole(['admin']), factoryController.updateFactory);
router.delete('/factories/:id', authMiddleware, requireRole(['admin']), factoryController.deleteFactory);

router.get('/departments', authMiddleware, departmentController.getDepartments);
router.get('/departments/:id', authMiddleware, departmentController.getDepartmentById);
router.post('/departments', authMiddleware, requireRole(['admin']), departmentController.createDepartment);
router.put('/departments/:id', authMiddleware, requireRole(['admin']), departmentController.updateDepartment);
router.delete('/departments/:id', authMiddleware, requireRole(['admin']), departmentController.deleteDepartment);

// ==========================================
// 3. COMPLIANCE STANDARDS & REQUIREMENTS
// ==========================================
router.get('/standards', authMiddleware, standardsController.getStandards);
router.get('/standards/:id', authMiddleware, standardsController.getStandardById);
router.post('/standards', authMiddleware, requireRole(['admin']), standardsController.createStandard);
router.put('/standards/:id', authMiddleware, requireRole(['admin']), standardsController.updateStandard);
router.delete('/standards/:id', authMiddleware, requireRole(['admin']), standardsController.deleteStandard);

router.get('/requirements', authMiddleware, requirementsController.getRequirements);
router.get('/requirements/:id', authMiddleware, requirementsController.getRequirementById);
router.post('/requirements', authMiddleware, requireRole(['admin']), requirementsController.createRequirement);
router.put('/requirements/:id', authMiddleware, requireRole(['admin']), requirementsController.updateRequirement);
router.delete('/requirements/:id', authMiddleware, requireRole(['admin']), requirementsController.deleteRequirement);
router.post('/requirements/trigger-auto-tasks', authMiddleware, requireRole(['admin']), requirementsController.triggerAutoTasks);

// ==========================================
// 4. TASKS
// ==========================================
router.get('/tasks', authMiddleware, tasksController.getTasks);
router.get('/tasks/my-tasks', authMiddleware, tasksController.getMyTasks);
router.get('/tasks/:id', authMiddleware, tasksController.getTaskById);
router.post('/tasks', authMiddleware, requireRole(['admin', 'supervisor']), tasksController.createTask);
router.put('/tasks/:id', authMiddleware, tasksController.updateTask);
router.post('/tasks/:id/start', authMiddleware, tasksController.startTask);
router.post('/tasks/:id/complete', authMiddleware, tasksController.completeTask);
router.post('/tasks/auto-schedule', authMiddleware, requireRole(['admin']), tasksController.runAutoSchedule);

// ==========================================
// 5. AUDITS & CHECKLISTS
// ==========================================
router.get('/audits', authMiddleware, requireRole(['admin', 'auditor']), auditsController.getAudits);
router.get('/audits/:id', authMiddleware, requireRole(['admin', 'auditor']), auditsController.getAuditById);
router.post('/audits', authMiddleware, requireRole(['admin', 'auditor']), auditsController.createAudit);
router.put('/audits/:id/status', authMiddleware, requireRole(['admin', 'auditor']), auditsController.updateAuditStatus);
router.put('/audits/checklist/:checklist_id', authMiddleware, requireRole(['admin', 'auditor']), auditsController.updateChecklistItem);

// ==========================================
// 6. NON-CONFORMITIES (NC)
// ==========================================
router.get('/ncs', authMiddleware, ncController.getNCs);
router.get('/ncs/aging-report', authMiddleware, ncController.getAgingReport);
router.get('/ncs/:id', authMiddleware, ncController.getNCById);
router.get('/ncs/:id/audit-trail', authMiddleware, ncController.getNCAuditTrail);
router.post('/ncs', authMiddleware, requireRole(['admin', 'auditor']), ncController.createNC);
router.put('/ncs/:id', authMiddleware, ncController.updateNC);
router.post('/ncs/:id/close', authMiddleware, requireRole(['admin', 'auditor']), ncController.closeNC);


// ==========================================
// 7. CORRECTIVE ACTION PLANS (CAP)
// ==========================================
router.get('/caps', authMiddleware, capController.getCAPs);
router.get('/caps/:id', authMiddleware, capController.getCAPById);
router.post('/caps', authMiddleware, requireRole(['admin', 'supervisor']), capController.createCAP);
router.post('/caps/:id/submit', authMiddleware, capController.submitCAP);
router.post('/caps/:id/review', authMiddleware, requireRole(['admin', 'auditor']), capController.reviewCAP);
router.post('/caps/:id/submit-evidence', authMiddleware, capController.submitCAPEvidence);
router.post('/caps/:id/verify', authMiddleware, requireRole(['admin', 'auditor']), capController.verifyCAP);

// ==========================================
// 8. EVIDENCE MANAGEMENT
// ==========================================
router.post('/evidence/upload', authMiddleware, uploadMiddleware.single('file'), evidenceController.uploadEvidence);
router.get('/evidence', authMiddleware, evidenceController.getEvidence);
router.put('/evidence/:id/verify', authMiddleware, requireRole(['admin', 'auditor']), evidenceController.verifyEvidence);

// ==========================================
// 9. DASHBOARD
// ==========================================
router.get('/dashboard/summary', authMiddleware, dashboardController.getDashboardSummary);

// ==========================================
// 10. NOTIFICATIONS & MULTI-CHANNEL DISPATCH
// ==========================================
router.get('/notifications', authMiddleware, notificationsController.getNotifications);
router.put('/notifications/:id/read', authMiddleware, notificationsController.markAsRead);
router.put('/notifications/mark-all-read', authMiddleware, notificationsController.markAllAsRead);
router.get('/notifications/outbound-log', authMiddleware, notificationsController.getOutboundLogs);
router.post('/notifications/trigger-cycle', authMiddleware, notificationsController.triggerCycle);
router.post('/notifications/test-dispatch', authMiddleware, notificationsController.testDispatch);

// ==========================================
// 11. REPORTS
// ==========================================
router.get('/reports/compliance', authMiddleware, requireRole(['admin', 'auditor']), reportsController.getComplianceReport);
router.get('/reports/audits', authMiddleware, requireRole(['admin', 'auditor']), reportsController.getAuditReport);
router.get('/reports/ncs', authMiddleware, requireRole(['admin', 'auditor']), reportsController.getNCReport);
router.get('/reports/caps', authMiddleware, requireRole(['admin', 'auditor']), reportsController.getCAPReport);
router.get('/reports/export/:type', authMiddleware, requireRole(['admin', 'auditor']), reportsController.exportCSV);

// ==========================================
// 12. SETTINGS, CONFIGURATION & AUDIT TRAIL
// ==========================================
router.get('/settings/score-config', authMiddleware, requireRole(['admin']), settingsController.getScoreConfig);
router.put('/settings/score-config', authMiddleware, requireRole(['admin']), settingsController.updateScoreConfig);
router.get('/settings/escalation-config', authMiddleware, requireRole(['admin']), settingsController.getEscalationConfig);
router.put('/settings/escalation-config', authMiddleware, requireRole(['admin']), settingsController.updateEscalationConfig);
router.get('/settings/audit-logs', authMiddleware, requireRole(['admin']), settingsController.getAuditLogs);

export default router;

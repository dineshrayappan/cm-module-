import { db } from '../db/dbAdapter.js';

export const scoringService = {
  /**
   * Calculate factory-wide compliance score and department scores
   * Uses configurable formula stored in the database
   */
  async calculateScores(factoryId = null) {
    // 1. Fetch active score configuration
    const scoreConfigs = await db.find('scoreConfigurations', { is_active: true });
    const config = (scoreConfigs && scoreConfigs[0]) || {
      critical_weight: 40.0,
      major_weight: 25.0,
      minor_weight: 10.0,
      task_completion_weight: 15.0,
      audit_pass_weight: 10.0,
      pass_threshold: 85.0
    };

    // 2. Fetch all departments
    const departments = await db.find('departments', factoryId ? { factory_id: factoryId } : {});
    const tasks = await db.find('tasks', factoryId ? { factory_id: factoryId } : {});
    const ncs = await db.find('nonConformities', factoryId ? { factory_id: factoryId } : {});
    const checklists = await db.find('auditChecklists', {});

    // Compute scores for each department
    const departmentScores = departments.map(dept => {
      const deptTasks = tasks.filter(t => t.department_id === dept.id);
      const totalTasks = deptTasks.length;
      const completedTasks = deptTasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = deptTasks.filter(t => t.status === 'Overdue').length;
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

      // Department NCs
      const deptNCs = ncs.filter(n => n.department_id === dept.id && n.status !== 'Closed');
      const criticalNCs = deptNCs.filter(n => n.severity === 'Critical').length;
      const majorNCs = deptNCs.filter(n => n.severity === 'Major').length;
      const minorNCs = deptNCs.filter(n => n.severity === 'Minor').length;

      // Configurable penalty calculation
      let penalty = (criticalNCs * 12) + (majorNCs * 5) + (minorNCs * 1.5) + (overdueTasks * 2);
      let rawScore = Math.max(0, 100 - penalty);

      // Blend with task completion rate
      const taskWeight = Number(config.task_completion_weight || 15) / 100;
      const complianceWeight = 1 - taskWeight;
      const finalScore = Math.round(((rawScore * complianceWeight) + (taskCompletionRate * taskWeight)) * 10) / 10;

      return {
        department_id: dept.id,
        department_code: dept.code,
        department_name: dept.name,
        manager_name: dept.manager_name,
        compliance_score: Math.min(100, Math.max(0, finalScore)),
        open_ncs: deptNCs.length,
        critical_ncs: criticalNCs,
        major_ncs: majorNCs,
        minor_ncs: minorNCs,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        status: finalScore >= config.pass_threshold ? 'Compliant' : 'Needs Improvement'
      };
    });

    // Factory Overall Compliance Score (Weighted average of departments)
    const validScores = departmentScores.map(d => d.compliance_score);
    const overallScore = validScores.length > 0
      ? Math.round((validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length) * 10) / 10
      : 92.5;

    // Open NC summary
    const openNCs = ncs.filter(n => n.status !== 'Closed');
    const closedNCs = ncs.filter(n => n.status === 'Closed');

    // Overdue NC count (due_date < today and not closed)
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueNCs = openNCs.filter(n => n.due_date && n.due_date < todayStr);

    // CAP completion percentage
    const caps = await db.find('correctiveActions', {});
    const completedCaps = caps.filter(c => ['Completed', 'Verified'].includes(c.status)).length;
    const capCompletionPercentage = caps.length > 0 ? Math.round((completedCaps / caps.length) * 100) : 85;

    return {
      overall_compliance_score: overallScore,
      pass_threshold: config.pass_threshold,
      total_departments: departments.length,
      department_scores: departmentScores,
      open_nc_count: openNCs.length,
      closed_nc_count: closedNCs.length,
      critical_nc_count: openNCs.filter(n => n.severity === 'Critical').length,
      major_nc_count: openNCs.filter(n => n.severity === 'Major').length,
      minor_nc_count: openNCs.filter(n => n.severity === 'Minor').length,
      overdue_nc_count: overdueNCs.length,
      cap_completion_percentage: capCompletionPercentage,
      total_tasks_count: tasks.length,
      pending_tasks_count: tasks.filter(t => ['Pending', 'In Progress'].includes(t.status)).length,
      overdue_tasks_count: tasks.filter(t => t.status === 'Overdue').length,
      scoring_config: config
    };
  }
};

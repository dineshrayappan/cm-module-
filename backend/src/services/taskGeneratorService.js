import { db } from '../db/dbAdapter.js';

export const taskGeneratorService = {
  /**
   * Automatically generate tasks based on active compliance requirements
   * Calculates due dates based on frequency (Daily, Weekly, Monthly, Quarterly, etc.)
   */
  async generateTasksForActiveRequirements(factoryId = null) {
    const requirements = await db.find('requirements', { status: 'Active' });
    const factories = await db.find('factories', factoryId ? { id: factoryId } : { status: 'Active' });
    const targetFactory = factories[0] || { id: 'f1111111-1111-1111-1111-111111111111' };

    const generated = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Compute week number
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const currentWeekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);

    for (const req of requirements) {
      // Determine due date according to frequency
      const dueDate = new Date();
      let frequencySuffix = '';

      switch (req.frequency) {
        case 'Daily':
          dueDate.setDate(dueDate.getDate() + 1);
          frequencySuffix = `Day ${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}`;
          break;
        case 'Weekly':
          dueDate.setDate(dueDate.getDate() + 7);
          frequencySuffix = `Week ${currentWeekNumber}`;
          break;
        case 'Monthly':
          dueDate.setMonth(dueDate.getMonth() + 1);
          frequencySuffix = `${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
          break;
        case 'Quarterly':
          dueDate.setMonth(dueDate.getMonth() + 3);
          const qNumber = Math.floor((now.getMonth() + 3) / 3);
          frequencySuffix = `Q${qNumber} ${now.getFullYear()}`;
          break;
        case 'Half-yearly':
          dueDate.setMonth(dueDate.getMonth() + 6);
          const hNumber = now.getMonth() < 6 ? 'H1' : 'H2';
          frequencySuffix = `${hNumber} ${now.getFullYear()}`;
          break;
        case 'Yearly':
          dueDate.setFullYear(dueDate.getFullYear() + 1);
          frequencySuffix = `Year ${now.getFullYear()}`;
          break;
        default:
          dueDate.setDate(dueDate.getDate() + 14);
          frequencySuffix = 'One-time';
      }

      const taskCode = `TSK-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const taskTitle = `${req.title} - ${frequencySuffix}`;

      // Check if a similar task already exists for this requirement in this period
      const existing = await db.findOne('tasks', {
        requirement_id: req.id,
        created_date: todayStr
      });

      if (!existing) {
        const newTask = {
          task_code: taskCode,
          requirement_id: req.id,
          department_id: req.department_id,
          assigned_user_id: null,
          factory_id: targetFactory.id,
          title: taskTitle,
          description: req.description,
          created_date: todayStr,
          due_date: dueDate.toISOString().split('T')[0],
          completed_date: null,
          priority: req.risk_level === 'Critical' ? 'Critical' : (req.risk_level === 'High' ? 'High' : 'Medium'),
          status: 'Pending',
          evidence_url: null,
          comments: `Auto-generated from compliance standard requirement [${req.code}]`,
          escalation_level: 0,
          is_auto_generated: true
        };

        const created = await db.insert('tasks', newTask);
        generated.push(created);
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      generated_count: generated.length,
      tasks: generated
    };
  }
};

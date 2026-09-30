import { db } from '../db/dbAdapter.js';
import { scoringService } from '../services/scoringService.js';

export const reportsController = {
  // Comprehensive Compliance Report
  async getComplianceReport(req, res, next) {
    try {
      const { factory_id } = req.query;
      const scores = await scoringService.calculateScores(factory_id);
      const requirements = await db.find('requirements', {});
      const standards = await db.find('standards', {});

      const activeReqCount = requirements.filter(r => r.status === 'Active').length;
      const criticalReqCount = requirements.filter(r => r.risk_level === 'Critical').length;

      res.json({
        success: true,
        report_title: 'Factory Compliance Performance Executive Report',
        generated_at: new Date().toISOString(),
        overall_score: scores.overall_compliance_score,
        pass_threshold: scores.pass_threshold,
        open_ncs: scores.open_nc_count,
        closed_ncs: scores.closed_nc_count,
        critical_ncs: scores.critical_nc_count,
        departments: scores.department_scores,
        requirements_summary: {
          total_active: activeReqCount,
          critical_requirements: criticalReqCount,
          standards_count: standards.length
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Audit Report
  async getAuditReport(req, res, next) {
    try {
      const audits = await db.find('audits', {});
      const checklists = await db.find('auditChecklists', {});
      const ncs = await db.find('nonConformities', {});
      const departments = await db.find('departments', {});

      const reportData = audits.map(a => {
        const auditChecks = checklists.filter(c => c.audit_id === a.id);
        const auditNCs = ncs.filter(n => n.audit_id === a.id);

        return {
          audit_code: a.audit_code,
          audit_type: a.audit_type,
          department: departments.find(d => d.id === a.department_id)?.name || 'Multi-Department',
          auditor: a.auditor_name,
          start_date: a.start_date,
          end_date: a.end_date,
          status: a.status,
          compliance_score: a.compliance_score || 90.0,
          checklist_total: auditChecks.length,
          compliant_items: auditChecks.filter(c => c.status === 'Compliant').length,
          non_compliant_items: auditChecks.filter(c => c.status === 'Non-Compliant').length,
          observations: auditChecks.filter(c => c.status === 'Observation').length,
          ncs_generated: auditNCs.length,
          open_ncs: auditNCs.filter(n => n.status !== 'Closed').length
        };
      });

      res.json({
        success: true,
        report_title: 'Internal & Third-Party Audit Summary Report',
        generated_at: new Date().toISOString(),
        total_audits: audits.length,
        audits: reportData
      });
    } catch (err) {
      next(err);
    }
  },

  // NC Report with Aging & Severity Breakdown
  async getNCReport(req, res, next) {
    try {
      const ncs = await db.find('nonConformities', {});
      const departments = await db.find('departments', {});
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Department breakdown
      const byDept = departments.map(d => {
        const deptNCs = ncs.filter(n => n.department_id === d.id);
        return {
          department_name: d.name,
          department_code: d.code,
          total_ncs: deptNCs.length,
          open_ncs: deptNCs.filter(n => n.status !== 'Closed').length,
          critical_ncs: deptNCs.filter(n => n.severity === 'Critical' && n.status !== 'Closed').length,
          closed_ncs: deptNCs.filter(n => n.status === 'Closed').length
        };
      });

      // Severity breakdown
      const bySeverity = {
        Critical: ncs.filter(n => n.severity === 'Critical').length,
        Major: ncs.filter(n => n.severity === 'Major').length,
        Minor: ncs.filter(n => n.severity === 'Minor').length,
        Observation: ncs.filter(n => n.severity === 'Observation').length
      };

      // Status breakdown
      const byStatus = {
        Open: ncs.filter(n => n.status === 'Open').length,
        CAP_Submitted: ncs.filter(n => n.status === 'CAP Submitted').length,
        Under_Review: ncs.filter(n => n.status === 'Under Review').length,
        CAP_Approved: ncs.filter(n => n.status === 'CAP Approved').length,
        CAP_Rejected: ncs.filter(n => n.status === 'CAP Rejected').length,
        Verification: ncs.filter(n => n.status === 'Verification').length,
        Closed: ncs.filter(n => n.status === 'Closed').length
      };

      // Aging breakdown
      const aging = {
        '0-7 Days': 0,
        '8-15 Days': 0,
        '16-30 Days': 0,
        '31-60 Days': 0,
        '60+ Days': 0
      };

      for (const nc of ncs.filter(n => n.status !== 'Closed')) {
        const age = Math.max(0, Math.floor((now.getTime() - new Date(nc.created_date).getTime()) / (1000 * 60 * 60 * 24)));
        if (age >= 61) aging['60+ Days']++;
        else if (age >= 31) aging['31-60 Days']++;
        else if (age >= 16) aging['16-30 Days']++;
        else if (age >= 8) aging['8-15 Days']++;
        else aging['0-7 Days']++;
      }

      res.json({
        success: true,
        report_title: 'Non-Conformity (NC) & Defect Analytics Report',
        generated_at: new Date().toISOString(),
        total_ncs: ncs.length,
        open_ncs: ncs.filter(n => n.status !== 'Closed').length,
        closed_ncs: ncs.filter(n => n.status === 'Closed').length,
        by_department: byDept,
        by_severity: bySeverity,
        by_status: byStatus,
        aging
      });
    } catch (err) {
      next(err);
    }
  },

  // CAP Performance Report
  async getCAPReport(req, res, next) {
    try {
      const caps = await db.find('correctiveActions', {});
      const ncs = await db.find('nonConformities', {});

      const now = new Date().toISOString().split('T')[0];

      const counts = {
        Draft: caps.filter(c => c.status === 'Draft').length,
        Submitted: caps.filter(c => c.status === 'Submitted').length,
        Under_Review: caps.filter(c => c.status === 'Under Review').length,
        Approved: caps.filter(c => c.status === 'Approved').length,
        Rejected: caps.filter(c => c.status === 'Rejected').length,
        Completed: caps.filter(c => c.status === 'Completed').length,
        Verified: caps.filter(c => c.status === 'Verified').length,
        Overdue: caps.filter(c => c.target_date < now && !['Completed', 'Verified'].includes(c.status)).length
      };

      res.json({
        success: true,
        report_title: 'Corrective Action Plan (CAP) Workflow Execution Report',
        generated_at: new Date().toISOString(),
        total_caps: caps.length,
        counts,
        completion_rate: caps.length > 0 ? Math.round(((counts.Completed + counts.Verified) / caps.length) * 100) : 0
      });
    } catch (err) {
      next(err);
    }
  },

  // CSV Data Export for any table
  async exportCSV(req, res, next) {
    try {
      const { type } = req.params; // 'ncs', 'tasks', 'audits', 'caps'
      let data = [];
      let filename = 'export.csv';

      if (type === 'ncs') {
        data = await db.find('nonConformities', {});
        filename = `non_conformities_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'tasks') {
        data = await db.find('tasks', {});
        filename = `compliance_tasks_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'audits') {
        data = await db.find('audits', {});
        filename = `audits_summary_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'caps') {
        data = await db.find('correctiveActions', {});
        filename = `corrective_actions_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid export type.' });
      }

      if (data.length === 0) {
        return res.status(200).send('No records found.');
      }

      // Convert to CSV
      const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvRows.join('\n'));
    } catch (err) {
      next(err);
    }
  }
};

import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Layers,
  Building2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const ReportsPage = () => {
  const { activeFactory } = useAuth();
  const [reportType, setReportType] = useState('compliance'); // 'compliance', 'audit', 'nc', 'cap'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportType, activeFactory?.id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      let res;
      if (reportType === 'compliance') {
        res = await api.reports.getCompliance(activeFactory?.id);
      } else if (reportType === 'audit') {
        res = await api.reports.getAudits();
      } else if (reportType === 'nc') {
        res = await api.reports.getNCs();
      } else if (reportType === 'cap') {
        res = await api.reports.getCAPs();
      }
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Compliance & Audit Reporting Suite</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Generate executive compliance audits, non-conformity aging, and buyer-ready audit exports
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>

          <a
            href={api.reports.getExportUrl(reportType === 'compliance' ? 'ncs' : (reportType === 'audit' ? 'audits' : (reportType === 'cap' ? 'caps' : 'ncs')))}
            download
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${reportType === 'compliance' ? 'active' : ''}`}
          onClick={() => setReportType('compliance')}
        >
          Executive Compliance Scorecard
        </button>
        <button
          className={`tab-btn ${reportType === 'audit' ? 'active' : ''}`}
          onClick={() => setReportType('audit')}
        >
          Audits & Inspection Report
        </button>
        <button
          className={`tab-btn ${reportType === 'nc' ? 'active' : ''}`}
          onClick={() => setReportType('nc')}
        >
          NC Defect & Aging Report
        </button>
        <button
          className={`tab-btn ${reportType === 'cap' ? 'active' : ''}`}
          onClick={() => setReportType('cap')}
        >
          Corrective Action (CAP) Execution
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Compiling analytical compliance report...
        </div>
      ) : !data ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>No report data available.</div>
      ) : (
        <div>
          {/* Printable Report Canvas */}
          <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
            {/* Report Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb' }}>
                  Official Compliance Document
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px', color: '#0f172a' }}>
                  {data.report_title}
                </h2>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Facility: <strong>{activeFactory?.name || 'Apex Garments Manufacturing'}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Generated On</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {new Date(data.generated_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Content for Compliance Report */}
            {reportType === 'compliance' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Overall Compliance</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: data.overall_score >= 85 ? '#059669' : '#e11d48' }}>
                      {data.overall_score}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669' }}>Target: {data.pass_threshold}%</div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Active Requirements</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
                      {data.requirements_summary?.total_active}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Across {data.requirements_summary?.standards_count} standards</div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Open NCs</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#e11d48' }}>
                      {data.open_ncs}
                    </div>
                    <div style={{ fontSize: '11px', color: '#e11d48' }}>{data.critical_ncs} Critical Severity</div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Resolved & Closed</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669' }}>
                      {data.closed_ncs}
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669' }}>Verified closure</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Department Compliance Breakdown</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Manager</th>
                        <th>Compliance Score</th>
                        <th>Open NCs</th>
                        <th>Tasks Done / Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.departments || []).map((d) => (
                        <tr key={d.department_id}>
                          <td>
                            <strong>{d.department_name}</strong> ({d.department_code})
                          </td>
                          <td>{d.manager_name}</td>
                          <td>
                            <strong style={{ color: d.compliance_score >= 85 ? '#059669' : '#e11d48' }}>
                              {d.compliance_score}%
                            </strong>
                          </td>
                          <td>
                            <span style={{ color: d.open_ncs > 0 ? '#e11d48' : '#059669', fontWeight: 700 }}>
                              {d.open_ncs}
                            </span>
                          </td>
                          <td>{d.completed_tasks} / {d.total_tasks}</td>
                          <td>
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Content for Audit Report */}
            {reportType === 'audit' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>
                  Audits Logged ({data.total_audits})
                </h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Audit Code</th>
                        <th>Type</th>
                        <th>Auditor</th>
                        <th>Period</th>
                        <th>Checklist Total</th>
                        <th>Compliant</th>
                        <th>Non-Compliant</th>
                        <th>Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.audits || []).map((a) => (
                        <tr key={a.audit_code}>
                          <td><strong>{a.audit_code}</strong></td>
                          <td>{a.audit_type}</td>
                          <td>{a.auditor}</td>
                          <td>{a.start_date} to {a.end_date}</td>
                          <td>{a.checklist_total} items</td>
                          <td style={{ color: '#059669', fontWeight: 700 }}>{a.compliant_items}</td>
                          <td style={{ color: '#e11d48', fontWeight: 700 }}>{a.non_compliant_items}</td>
                          <td>
                            <strong>{a.compliance_score}%</strong>
                          </td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Content for NC Report */}
            {reportType === 'nc' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Total NCs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{data.total_ncs}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fff1f2', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#be123c', fontWeight: 700 }}>Critical NCs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#be123c' }}>{data.by_severity?.Critical}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fff7ed', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 700 }}>Major NCs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#c2410c' }}>{data.by_severity?.Major}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fefce8', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#a16207', fontWeight: 700 }}>Minor NCs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#a16207' }}>{data.by_severity?.Minor}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Non-Conformities by Department</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Total NCs</th>
                        <th>Open NCs</th>
                        <th>Critical</th>
                        <th>Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.by_department || []).map((dept) => (
                        <tr key={dept.department_code}>
                          <td><strong>{dept.department_name}</strong> ({dept.department_code})</td>
                          <td>{dept.total_ncs}</td>
                          <td style={{ color: '#e11d48', fontWeight: 700 }}>{dept.open_ncs}</td>
                          <td style={{ color: '#be123c', fontWeight: 700 }}>{dept.critical_ncs}</td>
                          <td style={{ color: '#059669', fontWeight: 700 }}>{dept.closed_ncs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Content for CAP Report */}
            {reportType === 'cap' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Total Plans</div>
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{data.total_caps}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 700 }}>Under Review</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>{data.counts?.Submitted + data.counts?.Under_Review}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#047857', fontWeight: 700 }}>Approved / Active</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>{data.counts?.Approved}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 700 }}>Verified Pass</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed' }}>{data.counts?.Verified}</div>
                  </div>
                </div>

                <div style={{ padding: '18px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#166534' }}>CAP Completion & Verification Rate</h4>
                    <p style={{ fontSize: '13px', color: '#15803d', marginTop: '2px' }}>
                      Percentage of formulated corrective actions successfully executed and verified by lead auditors
                    </p>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#15803d' }}>
                    {data.completion_rate}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  Filter,
  FileText,
  BarChart3,
  Flame,
  CheckCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = ({ onNavigate }) => {
  const { activeFactory } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadDashboard();
    loadDepartments();
  }, [activeFactory?.id, selectedDept]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeFactory?.id) params.factory_id = activeFactory.id;
      if (selectedDept) params.department_id = selectedDept;

      const res = await api.dashboard.getSummary(params);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.departments.getAll(activeFactory?.id ? { factory_id: activeFactory.id } : {});
      if (res?.departments) setDepartments(res.departments);
    } catch (e) {}
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading Compliance Intelligence Dashboard...</div>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const charts = data?.charts || {};
  const alerts = data?.urgent_alerts || [];

  return (
    <div>
      {/* Top Banner & Quick Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
            Compliance Operations Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time compliance monitoring for <strong>{activeFactory?.name || 'Apex Garments Manufacturing'}</strong>
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Filter size={15} color="#64748b" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Factory Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('audits')}>
            <Calendar size={15} />
            <span>Launch Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Overall Score */}
        <div className="kpi-card" style={{ '--kpi-color': '#2563eb', '--kpi-bg': '#eff6ff' }}>
          <div className="kpi-header">
            <span className="kpi-label">Overall Compliance</span>
            <div className="kpi-icon">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: kpi.overall_compliance_score >= 85 ? '#059669' : '#e11d48' }}>
            {kpi.overall_compliance_score}%
          </div>
          <div className="kpi-subtext">
            <span>Pass Threshold: {kpi.pass_threshold}%</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>• Active</span>
          </div>
        </div>

        {/* Open NC */}
        <div className="kpi-card" style={{ '--kpi-color': '#f97316', '--kpi-bg': '#fff7ed' }}>
          <div className="kpi-header">
            <span className="kpi-label">Open NCs</span>
            <div className="kpi-icon">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpi.open_ncs}</div>
          <div className="kpi-subtext">
            <span>{kpi.closed_ncs} Resolved & Closed</span>
          </div>
        </div>

        {/* Critical NC */}
        <div className="kpi-card" style={{ '--kpi-color': '#e11d48', '--kpi-bg': '#fff1f2' }}>
          <div className="kpi-header">
            <span className="kpi-label">Critical NCs</span>
            <div className="kpi-icon">
              <AlertOctagon size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#e11d48' }}>{kpi.critical_ncs}</div>
          <div className="kpi-subtext">
            <span>High Severity Safety/Labor</span>
          </div>
        </div>

        {/* Overdue NC */}
        <div className="kpi-card" style={{ '--kpi-color': '#dc2626', '--kpi-bg': '#fef2f2' }}>
          <div className="kpi-header">
            <span className="kpi-label">Overdue NCs</span>
            <div className="kpi-icon">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#dc2626' }}>{kpi.overdue_ncs}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#dc2626', fontWeight: 700 }}>Action Past Target Date</span>
          </div>
        </div>

        {/* CAP Completion */}
        <div className="kpi-card" style={{ '--kpi-color': '#10b981', '--kpi-bg': '#ecfdf5' }}>
          <div className="kpi-header">
            <span className="kpi-label">CAP Completion</span>
            <div className="kpi-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpi.cap_completion_percentage}%</div>
          <div className="kpi-subtext">
            <span>Implemented & Verified</span>
          </div>
        </div>

        {/* Upcoming Audits */}
        <div className="kpi-card" style={{ '--kpi-color': '#8b5cf6', '--kpi-bg': '#f5f3ff' }}>
          <div className="kpi-header">
            <span className="kpi-label">Upcoming Audits</span>
            <div className="kpi-icon">
              <Calendar size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpi.upcoming_audits}</div>
          <div className="kpi-subtext">
            <span>Scheduled & In-Progress</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Department Compliance Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BarChart3 size={18} color="var(--primary-600)" />
                Department Compliance Performance
              </div>
              <div className="card-subtitle">Aggregated score based on active NCs and completed tasks</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.department_compliance || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department_code" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Compliance Score']}
                  labelFormatter={(code) => {
                    const d = (charts.department_compliance || []).find(item => item.department_code === code);
                    return d ? `${d.department_name} (${code})` : code;
                  }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="compliance_score" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {(charts.department_compliance || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.compliance_score >= 90 ? '#10b981' : (entry.compliance_score >= 80 ? '#3b82f6' : '#f59e0b')}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Compliance Trend Line Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="var(--primary-600)" />
                Factory Compliance Trend (6 Months)
              </div>
              <div className="card-subtitle">Month-over-month overall compliance score trajectory</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthly_trend || []} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Overall Score']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts & Risk Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* NC Severity Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">NC Severity Distribution</div>
          </div>
          <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={charts.nc_severity || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(charts.nc_severity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              {(charts.nc_severity || []).map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: s.fill }} />
                    <span style={{ color: '#475569', fontWeight: 600 }}>{s.name}</span>
                  </div>
                  <strong style={{ color: '#0f172a' }}>{s.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Assessment Summary Matrix */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Risk Assessment Summary</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Likelihood × Impact</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '6px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: '#fff1f2', border: '1px solid #ffe4e6' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#be123c', textTransform: 'uppercase' }}>Critical Risk</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#9f1239', marginTop: '2px' }}>
                {charts.risk_matrix?.critical || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#be123c' }}>Score 16–25</div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: '#fff7ed', border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase' }}>High Risk</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#9a3412', marginTop: '2px' }}>
                {charts.risk_matrix?.high || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#c2410c' }}>Score 12–15</div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: '#fefce8', border: '1px solid #fef9c3' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a16207', textTransform: 'uppercase' }}>Medium Risk</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#854d0e', marginTop: '2px' }}>
                {charts.risk_matrix?.medium || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#a16207' }}>Score 6–11</div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Low Risk</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '2px' }}>
                {charts.risk_matrix?.low || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#15803d' }}>Score 1–5</div>
            </div>
          </div>
        </div>

        {/* NC Aging Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">NC Aging Summary</div>
            <button
              onClick={() => onNavigate && onNavigate('open-nc')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Full Report →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {[
              { label: '0–7 Days', count: 8, color: '#10b981' },
              { label: '8–15 Days', count: 6, color: '#3b82f6' },
              { label: '16–30 Days', count: 4, color: '#f59e0b' },
              { label: '31–60 Days', count: 2, color: '#f97316' },
              { label: '60+ Days', count: 1, color: '#e11d48' }
            ].map((bucket) => (
              <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: bucket.color }} />
                  <span style={{ color: '#334155', fontWeight: 600 }}>{bucket.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{bucket.count} NCs</span>
                  <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(bucket.count / 10) * 100}%`, height: '100%', background: bucket.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent Action Items & Overdue Escalations */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Flame size={18} color="#e11d48" />
              Urgent Escalations & Critical Open NCs
            </div>
            <div className="card-subtitle">Non-conformities requiring immediate management intervention</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate && onNavigate('open-nc')}>
            View All NCs
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>NC Code</th>
                <th>Finding Description</th>
                <th>Severity</th>
                <th>Target Due Date</th>
                <th>Responsible Person</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No urgent escalations at this time.
                  </td>
                </tr>
              ) : (
                alerts.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{item.code}</strong>
                    </td>
                    <td style={{ maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </td>
                    <td>
                      <StatusBadge status={item.severity} />
                    </td>
                    <td>
                      <span style={{ color: item.is_overdue ? '#e11d48' : '#334155', fontWeight: item.is_overdue ? 700 : 500 }}>
                        {item.due_date} {item.is_overdue && '(Overdue)'}
                      </span>
                    </td>
                    <td>{item.responsible}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onNavigate && onNavigate(`nc-detail-${item.id}`)}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

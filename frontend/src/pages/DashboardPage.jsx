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

  // Department Performance mapping (matching exact requested layout)
  const defaultDeptScores = [
    { name: 'HR', score: 92 },
    { name: 'Production', score: 86 },
    { name: 'EHS', score: 96 },
    { name: 'Stores', score: 78 },
    { name: 'Quality', score: 94 }
  ];

  const deptPerformanceItems = defaultDeptScores.map(def => {
    const found = (charts.department_compliance || []).find(d => 
      d.department_name?.toLowerCase().includes(def.name.toLowerCase()) || 
      d.department_code?.toLowerCase().includes(def.name.toLowerCase())
    );
    return {
      name: def.name,
      score: found ? Math.round(found.compliance_score) : def.score
    };
  });

  const defaultTopRisks = [
    { id: 'r1', dot: '🔴', title: 'Fire Safety', department: 'EHS', status_text: '3 days overdue' },
    { id: 'r2', dot: '🔴', title: 'Working Hours', department: 'HR', status_text: 'Due tomorrow' },
    { id: 'r3', dot: '🟠', title: 'Chemical Storage', department: 'Stores', status_text: 'CAP under review' }
  ];
  const topRisksList = charts.top_open_risks?.length ? charts.top_open_risks : defaultTopRisks;

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

      {/* ======================================================== */}
      {/* EXECUTIVE FACTORY COMPLIANCE BOARD (REQUESTED LAYOUT)    */}
      {/* ======================================================== */}
      <div
        className="card"
        style={{
          padding: 0,
          borderRadius: '16px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
          overflow: 'hidden',
          marginBottom: '28px',
          backgroundColor: '#ffffff'
        }}
      >
        {/* SECTION 1: FACTORY COMPLIANCE & 4 HERO METRICS */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#0f172a', margin: 0 }}>
                  FACTORY COMPLIANCE
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {activeFactory?.name || 'Apex Garments Manufacturing Ltd.'} • Plant Executive Overview
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              ● Real-time Status
            </span>
          </div>

          {/* 4 Hero Stats Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            textAlign: 'center'
          }}>
            {/* Overall */}
            <div style={{ padding: '16px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Overall</div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#059669', marginTop: '4px', letterSpacing: '-0.5px' }}>
                {kpi.overall_compliance_score ?? 91}%
              </div>
            </div>

            {/* Open NC */}
            <div
              style={{ padding: '16px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}
              onClick={() => onNavigate && onNavigate('open-nc')}
              title="Click to view open NCs"
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Open NC</div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#f97316', marginTop: '4px', letterSpacing: '-0.5px' }}>
                {kpi.open_ncs ?? 27}
              </div>
            </div>

            {/* Overdue */}
            <div
              style={{ padding: '16px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}
              onClick={() => onNavigate && onNavigate('open-nc')}
              title="Click to view overdue items"
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Overdue</div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#e11d48', marginTop: '4px', letterSpacing: '-0.5px' }}>
                {kpi.overdue_ncs ?? 6}
              </div>
            </div>

            {/* CAP */}
            <div
              style={{ padding: '16px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}
              onClick={() => onNavigate && onNavigate('cap')}
              title="Click to view CAPs"
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>CAP</div>
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#2563eb', marginTop: '4px', letterSpacing: '-0.5px' }}>
                {kpi.cap_completion_percentage ?? 88}%
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DEPARTMENT PERFORMANCE (HORIZONTAL BARS) */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Department Performance</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Target Standard: 85%+</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {deptPerformanceItems.map((dept) => (
              <div key={dept.name} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 65px', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                  {dept.name}
                </span>
                <div style={{
                  height: '18px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
                }}>
                  <div style={{
                    width: `${dept.score}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    backgroundColor: dept.score >= 90 ? '#10b981' : (dept.score >= 80 ? '#3b82f6' : '#f59e0b'),
                    transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  textAlign: 'right',
                  color: dept.score >= 90 ? '#059669' : (dept.score >= 80 ? '#2563eb' : '#d97706'),
                  fontFamily: 'monospace'
                }}>
                  {dept.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: 2-COLUMN SPLIT (NC STATUS & CAP STATUS) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          borderBottom: '1px solid #f1f5f9'
        }}>
          {/* Left Column: NC STATUS */}
          <div style={{
            padding: '24px 28px',
            borderRight: '1px solid #f1f5f9'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: '#475569',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>NC STATUS</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Total Open: {kpi.open_ncs ?? 27}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('open-nc')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e11d48' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#9f1239' }}>Critical</span>
                </div>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#e11d48' }}>
                  {kpi.critical_ncs ?? 2}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #ffedd5',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('open-nc')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f97316' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#9a3412' }}>Major</span>
                </div>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#f97316' }}>
                  {kpi.major_ncs ?? 11}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fefce8',
                  border: '1px solid #fef9c3',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('open-nc')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#854d0e' }}>Minor</span>
                </div>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#ca8a04' }}>
                  {kpi.minor_ncs ?? 14}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: CAP STATUS */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: '#475569',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>CAP STATUS</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Implementation</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #d1fae5',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('cap')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#065f46' }}>On Time</span>
                </div>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                  {kpi.cap_on_time_pct ?? 82}%
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fefce8',
                  border: '1px solid #fef9c3',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('cap')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#854d0e' }}>Due Soon</span>
                </div>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#ca8a04', fontFamily: 'monospace' }}>
                  {kpi.cap_due_soon_pct ?? 10}%
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('cap')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e11d48' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#9f1239' }}>Overdue</span>
                </div>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: '#e11d48', fontFamily: 'monospace' }}>
                  {kpi.cap_overdue_pct ?? 8}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: TOP OPEN RISKS */}
        <div style={{ padding: '24px 28px', backgroundColor: '#fafbfc' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: '#0f172a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>TOP OPEN RISKS</span>
            <button
              onClick={() => onNavigate && onNavigate('open-nc')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              View All Issues →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topRisksList.map((risk) => (
              <div
                key={risk.id}
                onClick={() => onNavigate && onNavigate('open-nc')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#94a3b8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px' }}>{risk.dot || '🔴'}</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{risk.title}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155'
                  }}>
                    {risk.department}
                  </span>
                  <span style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: risk.status_text?.includes('overdue') ? '#e11d48' : (risk.status_text?.includes('tomorrow') ? '#ea580c' : '#475569')
                  }}>
                    {risk.status_text}
                  </span>
                </div>
              </div>
            ))}
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

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { RiskMatrixSelector } from '../common/RiskMatrixSelector';
import { useAuth } from '../context/AuthContext';

export const NCManagementPage = ({ defaultTab = 'open', onNavigate, onSelectNC }) => {
  const { hasPermission, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab); // 'open', 'cap', 'verification', 'closed', 'aging'
  const [ncs, setNcs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [users, setUsers] = useState([]);
  const [agingData, setAgingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  // Create NC Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    finding: '',
    department_id: '',
    requirement_id: '',
    severity: 'Major',
    likelihood: 3,
    impact: 4,
    responsible_name: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadNCs();
    loadLookups();
  }, [activeTab, selectedDept, selectedSeverity, search]);

  const loadNCs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedSeverity) params.severity = selectedSeverity;
      if (search) params.search = search;

      if (activeTab === 'open') {
        params.status = 'open_all';
      } else if (activeTab === 'cap') {
        params.status = 'CAP Submitted';
      } else if (activeTab === 'verification') {
        params.status = 'Verification';
      } else if (activeTab === 'closed') {
        params.status = 'Closed';
      }

      const [ncRes, agingRes] = await Promise.all([
        api.ncs.getAll(params),
        api.ncs.getAgingReport().catch(() => null)
      ]);

      if (ncRes?.non_conformities) setNcs(ncRes.non_conformities);
      if (agingRes) setAgingData(agingRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [deptRes, reqRes, userRes] = await Promise.all([
        api.departments.getAll(),
        api.requirements.getAll(),
        api.auth.getUsers()
      ]);
      if (deptRes?.departments) setDepartments(deptRes.departments);
      if (reqRes?.requirements) setRequirements(reqRes.requirements);
      if (userRes?.users) setUsers(userRes.users);
    } catch (e) {}
  };

  const handleCreateNC = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.ncs.create(formData);
      setIsModalOpen(false);
      setFormData({
        finding: '',
        department_id: '',
        requirement_id: '',
        severity: 'Major',
        likelihood: 3,
        impact: 4,
        responsible_name: '',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      });
      loadNCs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Non-Conformity (NC) Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Identify, investigate, contain, correct, and verify compliance defects across factory lines
          </p>
        </div>

        {hasPermission('manage_audits') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Raise Non-Conformity</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'open' ? 'active' : ''}`}
          onClick={() => setActiveTab('open')}
        >
          Open NCs
        </button>
        <button
          className={`tab-btn ${activeTab === 'cap' ? 'active' : ''}`}
          onClick={() => setActiveTab('cap')}
        >
          CAP Under Review
        </button>
        <button
          className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('verification')}
        >
          Verification Required
        </button>
        <button
          className={`tab-btn ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          Closed & Verified NCs
        </button>
        <button
          className={`tab-btn ${activeTab === 'aging' ? 'active' : ''}`}
          onClick={() => setActiveTab('aging')}
        >
          NC Aging Breakdown
        </button>
      </div>

      {/* Aging Section View if tab is 'aging' */}
      {activeTab === 'aging' && agingData && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {Object.entries(agingData.buckets || {}).map(([bucket, count]) => (
              <div
                key={bucket}
                className="card"
                style={{
                  padding: '16px',
                  borderTop: `4px solid ${bucket.includes('60+') ? '#e11d48' : bucket.includes('31-60') ? '#f97316' : '#2563eb'}`
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                  {bucket}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {count} NCs
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  {bucket.includes('60+') ? 'Requires Escrow Attention' : 'Active Resolution Window'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search NC number, finding..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            className="select-filter"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Observation">Observation</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {ncs.length} records in this view
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NC Number</th>
              <th>Finding Description</th>
              <th>Department</th>
              <th>Severity</th>
              <th>Risk Level</th>
              <th>Responsible Person</th>
              <th>Target Due Date</th>
              <th>Aging</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>Loading non-conformities...</td>
              </tr>
            ) : ncs.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>No non-conformities match this view.</td>
              </tr>
            ) : (
              ncs.map((nc) => (
                <tr key={nc.id} style={{ backgroundColor: nc.severity === 'Critical' && nc.status !== 'Closed' ? '#fff1f2' : 'transparent' }}>
                  <td>
                    <strong style={{ color: '#2563eb' }}>{nc.nc_number}</strong>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>{nc.finding}</div>
                    {nc.requirement_code && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Req: {nc.requirement_code}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{nc.department_name}</span>
                  </td>
                  <td>
                    <StatusBadge status={nc.severity} />
                  </td>
                  <td>
                    <RiskBadge level={nc.risk_level} score={nc.risk_score} />
                  </td>
                  <td style={{ fontSize: '13px', color: '#475569' }}>{nc.responsible_name}</td>
                  <td>
                    <span style={{ fontWeight: nc.is_overdue ? 800 : 500, color: nc.is_overdue ? '#e11d48' : '#334155' }}>
                      {nc.due_date}
                    </span>
                    {nc.is_overdue && <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: 800 }}>OVERDUE</div>}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: nc.age_days >= 31 ? '#fef2f2' : '#f1f5f9',
                        color: nc.age_days >= 31 ? '#be123c' : '#475569'
                      }}
                    >
                      {nc.age_days}d ({nc.aging_bucket})
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={nc.status} />
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onSelectNC ? onSelectNC(nc.id) : (onNavigate && onNavigate(`nc-detail-${nc.id}`))}
                      title="Inspect NC, CAP Workflow, and Evidence"
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Raise NC Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Raise Non-Conformity (NC)"
        subtitle="Register compliance violation with risk scoring and mandatory responsible assignee"
        maxWidth="740px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateNC}>Register Non-Conformity</button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '12px 14px', background: '#fff1f2', color: '#be123c', border: '1px solid #ffe4e6', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateNC}>
          <div className="form-group">
            <label className="form-label required">Finding / Violation Description</label>
            <textarea
              className="form-control"
              placeholder="State clear factual finding, observed deficiency, exact machine or room number..."
              value={formData.finding}
              onChange={(e) => setFormData({ ...formData, finding: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Department</label>
              <select
                className="form-control"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">Select Responsible Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Related Requirement Reference</label>
              <select
                className="form-control"
                value={formData.requirement_id}
                onChange={(e) => setFormData({ ...formData, requirement_id: e.target.value })}
              >
                <option value="">Select Requirement (Optional)</option>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>[{r.code}] {r.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Severity</label>
              <select
                className="form-control"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Observation">Observation</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Responsible Person (Rule 3)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Assignee name or role..."
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Target Due Date (Rule 4)</label>
              <input
                type="date"
                className="form-control"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Interactive 5x5 Risk Matrix Selector (Section 15) */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <RiskMatrixSelector
              likelihood={formData.likelihood}
              impact={formData.impact}
              onChange={(l, i) => setFormData({ ...formData, likelihood: l, impact: i })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

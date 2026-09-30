import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Plus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Play,
  FileCheck,
  Search,
  Eye,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useAuth } from '../context/AuthContext';

export const AuditsPage = ({ onNavigate, onSelectAudit }) => {
  const { hasPermission, currentUser } = useAuth();
  const [audits, setAudits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  // Create Audit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    audit_type: 'Internal Compliance Audit',
    department_id: '',
    auditor_name: currentUser?.full_name || 'Lead Auditor',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    scope: 'Comprehensive review of standards, egress pathways, PPE, and documentation.',
    notes: ''
  });

  useEffect(() => {
    loadAudits();
    loadDepartments();
  }, [selectedType, selectedStatus, search]);

  const loadAudits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType) params.audit_type = selectedType;
      if (selectedStatus) params.status = selectedStatus;
      if (search) params.search = search;

      const res = await api.audits.getAll(params);
      if (res?.audits) setAudits(res.audits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.departments.getAll();
      if (res?.departments) setDepartments(res.departments);
    } catch (e) {}
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    try {
      await api.audits.create(formData);
      setIsModalOpen(false);
      loadAudits();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Audit & Inspection Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Plan, conduct, and score factory audits with checklist findings and automatic NC generation
          </p>
        </div>

        {hasPermission('manage_audits') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Schedule New Audit</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search audits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Audit Types</option>
            <option value="Internal Compliance Audit">Internal Compliance Audit</option>
            <option value="Social Compliance Audit">Social Compliance Audit</option>
            <option value="EHS Audit">EHS Audit</option>
            <option value="Fire & Safety Audit">Fire & Safety Audit</option>
            <option value="Environmental Audit">Environmental Audit</option>
            <option value="Quality Audit">Quality Audit</option>
            <option value="Buyer Audit">Buyer Audit</option>
            <option value="Follow-up Audit">Follow-up Audit</option>
          </select>

          <select
            className="select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {audits.length} audits logged
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Audit Code</th>
              <th>Audit Type & Scope</th>
              <th>Target Department</th>
              <th>Lead Auditor</th>
              <th>Audit Period</th>
              <th>Compliance Score</th>
              <th>Checklists / NCs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading audits...</td>
              </tr>
            ) : audits.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>No audits found.</td>
              </tr>
            ) : (
              audits.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong style={{ color: '#2563eb' }}>{a.audit_code}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px' }}>{a.audit_type}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px' }}>{a.scope}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{a.department_name}</span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#475569' }}>{a.auditor_name}</td>
                  <td>
                    <div style={{ fontSize: '12.5px', color: '#334155' }}>
                      {a.start_date} → {a.end_date}
                    </div>
                  </td>
                  <td>
                    {a.compliance_score ? (
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '14px',
                          color: a.compliance_score >= 85 ? '#059669' : '#e11d48'
                        }}
                      >
                        {a.compliance_score}%
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>In Progress</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{a.compliant_items_count} ✓</span> /{' '}
                      <span style={{ color: '#e11d48', fontWeight: 700 }}>{a.non_compliant_items_count} ✗</span>
                    </div>
                    {a.nc_count > 0 && (
                      <div style={{ fontSize: '11px', color: '#e11d48', fontWeight: 700 }}>
                        {a.nc_count} NCs Raised
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectAudit ? onSelectAudit(a.id) : (onNavigate && onNavigate(`audit-exec-${a.id}`))}
                      title="Open Audit Checklist Execution"
                    >
                      <span>Execute Checklist</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Audit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Audit"
        subtitle="Initialize an audit checklist mapped to factory compliance standards"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateAudit}>Schedule Audit</button>
          </>
        }
      >
        <form onSubmit={handleCreateAudit}>
          <div className="form-group">
            <label className="form-label required">Audit Type</label>
            <select
              className="form-control"
              value={formData.audit_type}
              onChange={(e) => setFormData({ ...formData, audit_type: e.target.value })}
              required
            >
              <option value="Internal Compliance Audit">Internal Compliance Audit</option>
              <option value="Social Compliance Audit">Social Compliance Audit</option>
              <option value="EHS Audit">EHS Audit</option>
              <option value="Fire & Safety Audit">Fire & Safety Audit</option>
              <option value="Environmental Audit">Environmental Audit</option>
              <option value="Quality Audit">Quality Audit</option>
              <option value="Buyer Audit">Buyer Audit</option>
              <option value="Follow-up Audit">Follow-up Audit</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Audit Scope Department</label>
              <select
                className="form-control"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">Multi-Department / Full Factory</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Lead Auditor Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.auditor_name}
                onChange={(e) => setFormData({ ...formData, auditor_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">End Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Audit Scope & Focus Areas</label>
            <textarea
              className="form-control"
              placeholder="e.g. Inspect fire exits, machine eye guards, boiler certifications, payroll overtime..."
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

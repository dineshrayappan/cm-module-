import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useAuth } from '../context/AuthContext';

export const RequirementsPage = ({ onNavigate }) => {
  const { hasPermission } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [standards, setStandards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFreq, setSelectedFreq] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  // Auto task generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    standard_id: '',
    title: '',
    description: '',
    department_id: '',
    frequency: 'Monthly',
    risk_level: 'Medium',
    responsible_role: 'Department Manager',
    evidence_required: true,
    due_date_rule: 'End of frequency cycle',
    weight: 15,
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, [selectedStandard, selectedDept, selectedFreq, selectedRisk, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStandard) params.standard_id = selectedStandard;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedFreq) params.frequency = selectedFreq;
      if (selectedRisk) params.risk_level = selectedRisk;
      if (search) params.search = search;

      const [reqRes, stdRes, deptRes] = await Promise.all([
        api.requirements.getAll(params),
        api.standards.getAll(),
        api.departments.getAll()
      ]);

      if (reqRes?.requirements) setRequirements(reqRes.requirements);
      if (stdRes?.standards) setStandards(stdRes.standards);
      if (deptRes?.departments) setDepartments(deptRes.departments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTasks = async () => {
    try {
      setIsGenerating(true);
      const res = await api.requirements.triggerAutoTasks();
      setMessage(res.message);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.requirements.create(formData);
      setIsModalOpen(false);
      setFormData({
        code: '',
        standard_id: '',
        title: '',
        description: '',
        department_id: '',
        frequency: 'Monthly',
        risk_level: 'Medium',
        responsible_role: 'Department Manager',
        evidence_required: true,
        due_date_rule: 'End of frequency cycle',
        weight: 15,
        status: 'Active'
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Compliance Requirements Registry</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Actionable compliance requirements linked to factory standards and recurring schedules
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleGenerateTasks}
            disabled={isGenerating}
            title="Automatically spawn scheduled compliance tasks based on frequencies"
          >
            <Sparkles size={16} color="#2563eb" />
            <span>{isGenerating ? 'Generating Tasks...' : 'Generate Compliance Tasks'}</span>
          </button>

          {hasPermission('manage_settings') && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              <span>Add Requirement</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '10px', marginBottom: '18px', fontWeight: 600, fontSize: '13.5px' }}>
          {message}
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
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
          >
            <option value="">All Standards</option>
            {standards.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

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
            value={selectedFreq}
            onChange={(e) => setSelectedFreq(e.target.value)}
          >
            <option value="">All Frequencies</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Half-yearly">Half-yearly</option>
            <option value="Yearly">Yearly</option>
            <option value="One-time">One-time</option>
          </select>

          <select
            className="select-filter"
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing {requirements.length} requirements
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Req ID</th>
              <th>Standard</th>
              <th>Requirement Title & Description</th>
              <th>Department</th>
              <th>Frequency</th>
              <th>Risk Level</th>
              <th>Responsible Role</th>
              <th>Evidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading requirements...</td>
              </tr>
            ) : requirements.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>No requirements match filter criteria.</td>
              </tr>
            ) : (
              requirements.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong style={{ color: '#2563eb' }}>{req.code}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      {req.standard_code || req.standard_name}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px' }}>{req.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px' }}>{req.description}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{req.department_name}</span>
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                      {req.frequency}
                    </span>
                  </td>
                  <td>
                    <RiskBadge level={req.risk_level} />
                  </td>
                  <td style={{ fontSize: '12.5px', color: '#475569' }}>{req.responsible_role}</td>
                  <td>
                    {req.evidence_required ? (
                      <span style={{ color: '#059669', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileCheck size={14} /> Mandatory
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Optional</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={req.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Requirement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Compliance Requirement"
        subtitle="Create a new requirement with recurring task frequency rules"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateRequirement}>Save Requirement</button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '10px 14px', background: '#fff1f2', color: '#be123c', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateRequirement}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Requirement Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. REQ-FIRE-005"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Parent Standard</label>
              <select
                className="form-control"
                value={formData.standard_id}
                onChange={(e) => setFormData({ ...formData, standard_id: e.target.value })}
                required
              >
                <option value="">Select Compliance Standard</option>
                {standards.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Requirement Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Daily Egress Door Unobstructed Verification"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Compliance Description & Criteria</label>
            <textarea
              className="form-control"
              placeholder="Explicit inspection instructions, tolerances, threshold metrics..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Responsible Department</label>
              <select
                className="form-control"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">Factory Wide / All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Frequency</label>
              <select
                className="form-control"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                required
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-yearly">Half-yearly</option>
                <option value="Yearly">Yearly</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Risk Level</label>
              <select
                className="form-control"
                value={formData.risk_level}
                onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Responsible Role</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. EHS Officer"
                value={formData.responsible_role}
                onChange={(e) => setFormData({ ...formData, responsible_role: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scoring Weight</label>
              <input
                type="number"
                className="form-control"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                min="1"
                max="100"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <input
              type="checkbox"
              id="evReq"
              checked={formData.evidence_required}
              onChange={(e) => setFormData({ ...formData, evidence_required: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="evReq" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
              Mandatory Evidence Upload Required (Rule 1: Task cannot be completed without attached proof)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

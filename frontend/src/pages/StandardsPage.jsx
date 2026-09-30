import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, CheckCircle, Search, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useAuth } from '../context/AuthContext';

export const StandardsPage = ({ onNavigate }) => {
  const { hasPermission } = useAuth();
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    version: '1.0',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Active'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    try {
      setLoading(true);
      const res = await api.standards.getAll();
      if (res?.standards) setStandards(res.standards);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.standards.create(formData);
      setIsModalOpen(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        version: '1.0',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'Active'
      });
      loadStandards();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Compliance Standards Framework</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            International and statutory compliance benchmarks governing factory operations
          </p>
        </div>

        {hasPermission('manage_settings') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add Compliance Standard</span>
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Standard Code</th>
              <th>Standard Name & Description</th>
              <th>Version</th>
              <th>Requirements</th>
              <th>Effective Date</th>
              <th>Expiry / Review</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading standards...</td>
              </tr>
            ) : standards.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No standards registered.</td>
              </tr>
            ) : (
              standards.map((std) => (
                <tr key={std.id}>
                  <td>
                    <strong style={{ color: '#2563eb' }}>{std.code}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{std.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px' }}>{std.description}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#475569' }}>v{std.version}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{std.requirements_count || 0} reqs</span>
                  </td>
                  <td>{std.effective_date}</td>
                  <td>{std.expiry_date || 'Ongoing'}</td>
                  <td>
                    <StatusBadge status={std.status} />
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onNavigate && onNavigate('requirements')}
                    >
                      View Reqs →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Standard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Compliance Standard"
        subtitle="Register a new factory compliance standard framework"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Save Standard</button>
          </>
        }
      >
        {error && (
          <div style={{ padding: '10px 14px', background: '#fff1f2', color: '#be123c', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label required">Standard Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. STD-FIRE-04"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Standard Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Machine Safety & Mechanical Hazards"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Scope, regulatory reference (e.g. OSHA 1910, Accord, SMETA 6.1)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Version</label>
              <input
                type="text"
                className="form-control"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Effective Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry / Review Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

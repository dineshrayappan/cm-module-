import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, CheckCircle, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useAuth } from '../context/AuthContext';

export const DepartmentsPage = ({ onNavigate }) => {
  const { hasPermission, activeFactory } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [deptScores, setDeptScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    manager_name: '',
    manager_email: '',
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, [activeFactory?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, dashRes] = await Promise.all([
        api.departments.getAll(activeFactory?.id ? { factory_id: activeFactory.id } : {}),
        api.dashboard.getSummary(activeFactory?.id ? { factory_id: activeFactory.id } : {})
      ]);

      if (deptRes?.departments) setDepartments(deptRes.departments);
      if (dashRes?.charts?.department_compliance) setDeptScores(dashRes.charts.department_compliance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.departments.create({
        ...formData,
        factory_id: activeFactory?.id
      });
      setIsModalOpen(false);
      setFormData({
        code: '',
        name: '',
        manager_name: '',
        manager_email: '',
        description: '',
        status: 'Active'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Factory Department Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Operational units, assigned managers, compliance health metrics, and task completion
          </p>
        </div>

        {hasPermission('manage_settings') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Grid of Department Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {departments.map((dept) => {
          const scoreInfo = deptScores.find(s => s.department_id === dept.id) || {
            compliance_score: 90,
            open_ncs: 0,
            critical_ncs: 0,
            total_tasks: 0,
            completed_tasks: 0
          };

          return (
            <div key={dept.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                      {dept.code}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{dept.name}</h3>
                  </div>

                  {/* Score Gauge Badge */}
                  <div
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      backgroundColor: scoreInfo.compliance_score >= 90 ? '#ecfdf5' : (scoreInfo.compliance_score >= 80 ? '#eff6ff' : '#fef2f2'),
                      color: scoreInfo.compliance_score >= 90 ? '#059669' : (scoreInfo.compliance_score >= 80 ? '#2563eb' : '#e11d48'),
                      fontWeight: 800,
                      fontSize: '16px',
                      textAlign: 'center',
                      border: '1px solid currentColor'
                    }}
                  >
                    {scoreInfo.compliance_score}%
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8 }}>Score</div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4, marginBottom: '16px' }}>
                  {dept.description}
                </p>

                <div style={{ fontSize: '12.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Users size={14} color="#64748b" />
                  Manager: <strong>{dept.manager_name || 'Unassigned'}</strong>
                </div>

                {dept.manager_email && (
                  <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="#94a3b8" />
                    <span>{dept.manager_email}</span>
                  </div>
                )}
              </div>

              {/* Department Statistics Footer */}
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Open NCs: </span>
                  <strong style={{ color: scoreInfo.open_ncs > 0 ? '#e11d48' : '#059669' }}>
                    {scoreInfo.open_ncs}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b' }}>Tasks: </span>
                  <strong>{scoreInfo.completed_tasks}/{scoreInfo.total_tasks} Done</strong>
                </div>

                <StatusBadge status={dept.status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Factory Department"
        subtitle="Register a new manufacturing or support unit"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateDept}>Create Department</button>
          </>
        }
      >
        <form onSubmit={handleCreateDept}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Department Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. DEP-WASH"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Department Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Industrial Washing & Dyeing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Manager Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manager Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.manager_email}
                onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description & Activities</label>
            <textarea
              className="form-control"
              placeholder="Primary responsibilities, equipment, and workforce..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

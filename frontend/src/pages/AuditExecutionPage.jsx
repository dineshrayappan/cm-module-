import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Camera,
  AlertTriangle,
  Upload,
  Save,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

export const AuditExecutionPage = ({ auditId, onBack, onNavigate }) => {
  const [audit, setAudit] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Checklist Item form
  const [itemStatus, setItemStatus] = useState('Compliant');
  const [itemFinding, setItemFinding] = useState('');
  const [itemComments, setItemComments] = useState('');
  const [itemSeverity, setItemSeverity] = useState('Major');
  const [autoCreateNC, setAutoCreateNC] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    if (auditId) {
      loadAuditDetails();
    }
  }, [auditId]);

  const loadAuditDetails = async () => {
    try {
      setLoading(true);
      const res = await api.audits.getById(auditId);
      if (res?.audit) {
        setAudit(res.audit);
        setChecklists(res.audit.checklists || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationModal = (item) => {
    setActiveItem(item);
    setItemStatus(item.status || 'Compliant');
    setItemFinding(item.finding || '');
    setItemComments(item.comments || '');
    setItemSeverity(item.severity || 'Major');
    setAutoCreateNC(true);
    setIsEditModalOpen(true);
  };

  const handleSaveChecklistEvaluation = async (e) => {
    e.preventDefault();
    if (!activeItem) return;

    try {
      setSavingItem(true);
      const res = await api.audits.updateChecklist(activeItem.id, {
        status: itemStatus,
        finding: itemFinding,
        comments: itemComments,
        severity: itemSeverity,
        auto_create_nc: itemStatus === 'Non-Compliant' ? autoCreateNC : false
      });

      setIsEditModalOpen(false);
      loadAuditDetails();
    } catch (err) {
      alert(`Error updating checklist: ${err.message}`);
    } finally {
      setSavingItem(false);
    }
  };

  const handleMarkAuditCompleted = async () => {
    if (!window.confirm('Are you sure you want to mark this audit as Completed?')) return;
    try {
      await api.audits.updateStatus(audit.id, { status: 'Completed' });
      loadAuditDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading audit checklist execution environment...
      </div>
    );
  }

  if (!audit) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Audit not found.</h3>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          Back to Audits List
        </button>
      </div>
    );
  }

  const compliantCount = checklists.filter(c => c.status === 'Compliant').length;
  const nonCompliantCount = checklists.filter(c => c.status === 'Non-Compliant').length;
  const observationCount = checklists.filter(c => c.status === 'Observation').length;
  const evaluatedCount = checklists.filter(c => c.status !== 'Not Applicable').length;
  const calculatedScore = evaluatedCount > 0 ? Math.round((compliantCount / evaluatedCount) * 100) : 100;

  return (
    <div>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Audits
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {audit.status !== 'Completed' && audit.status !== 'Closed' && (
            <button className="btn btn-success" onClick={handleMarkAuditCompleted}>
              <CheckCircle2 size={16} />
              <span>Complete Audit & Score</span>
            </button>
          )}
          <StatusBadge status={audit.status} />
        </div>
      </div>

      {/* Audit Executive Summary Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff, #f8fafc)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                {audit.audit_code}
              </span>
              <span>•</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{audit.start_date} to {audit.end_date}</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{audit.audit_type}</h1>
            <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px', maxWidth: '600px' }}>
              {audit.scope}
            </p>
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
              Lead Auditor: <strong style={{ color: '#0f172a' }}>{audit.auditor_name}</strong> | Target Department: <strong style={{ color: '#0f172a' }}>{audit.department_name}</strong>
            </div>
          </div>

          {/* Quick Score Metrics */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ padding: '14px 20px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#166534' }}>Audit Score</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: calculatedScore >= 85 ? '#15803d' : '#e11d48' }}>
                {calculatedScore}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>Compliant:</span>
                <strong>{compliantCount}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e11d48' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>Non-Compliant:</span>
                <strong>{nonCompliantCount}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>Observation:</span>
                <strong>{observationCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Items Table / Cards */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FileCheck size={18} color="var(--primary-600)" />
              Audit Checklist Execution ({checklists.length} Criteria Items)
            </div>
            <div className="card-subtitle">
              Verify compliance on the floor. Mark status, record findings, and spawn Non-Conformities instantly.
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Standard</th>
                <th>Evaluation Status</th>
                <th>Auditor Finding & Remarks</th>
                <th>Linked NC</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {checklists.map((item, idx) => (
                <tr key={item.id} style={{ backgroundColor: item.status === 'Non-Compliant' ? '#fff1f2' : 'transparent' }}>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px' }}>
                      {item.requirement_title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Ref: <strong>{item.requirement_code}</strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      {item.standard_name}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    {item.finding ? (
                      <div style={{ fontSize: '13px', color: '#0f172a' }}>
                        <span style={{ fontWeight: 600 }}>Finding:</span> {item.finding}
                        {item.comments && (
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Note: {item.comments}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>No findings recorded</span>
                    )}
                  </td>
                  <td>
                    {item.linked_nc_number ? (
                      <button
                        onClick={() => onNavigate && onNavigate(`nc-detail-${item.linked_nc_id}`)}
                        style={{
                          background: '#fff1f2',
                          color: '#be123c',
                          border: '1px solid #fecdd3',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {item.linked_nc_number} ({item.linked_nc_status})
                      </button>
                    ) : item.status === 'Non-Compliant' ? (
                      <span style={{ color: '#e11d48', fontSize: '11px', fontWeight: 700 }}>NC Spawned</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openEvaluationModal(item)}
                    >
                      Evaluate Item
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Evaluation Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Audit Evaluation: ${activeItem?.requirement_code}`}
        subtitle={activeItem?.requirement_title}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSaveChecklistEvaluation}
              disabled={savingItem}
            >
              {savingItem ? 'Saving...' : 'Save Evaluation'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveChecklistEvaluation}>
          {/* 4 Status Options Radio Buttons (Section 13) */}
          <div className="form-group">
            <label className="form-label required">Compliance Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { val: 'Compliant', color: '#10b981', desc: 'Full conformance to requirement' },
                { val: 'Non-Compliant', color: '#e11d48', desc: 'Breach or deficiency observed' },
                { val: 'Observation', color: '#3b82f6', desc: 'Minor point for improvement' },
                { val: 'Not Applicable', color: '#64748b', desc: 'Does not apply to inspected area' }
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => setItemStatus(opt.val)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: itemStatus === opt.val ? `2px solid ${opt.color}` : '1px solid #e2e8f0',
                    backgroundColor: itemStatus === opt.val ? `${opt.color}15` : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <input
                    type="radio"
                    name="checklistStatus"
                    checked={itemStatus === opt.val}
                    onChange={() => setItemStatus(opt.val)}
                    style={{ accentColor: opt.color, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>{opt.val}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finding and severity if Non-Compliant or Observation */}
          {(itemStatus === 'Non-Compliant' || itemStatus === 'Observation') && (
            <>
              <div className="form-group">
                <label className="form-label required">Finding / Observation Description</label>
                <textarea
                  className="form-control"
                  placeholder="Describe exact physical deficiency, location, quantity, or discrepancy..."
                  value={itemFinding}
                  onChange={(e) => setItemFinding(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label required">Severity</label>
                  <select
                    className="form-control"
                    value={itemSeverity}
                    onChange={(e) => setItemSeverity(e.target.value)}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                    <option value="Observation">Observation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Auditor Comments</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Immediate verbal notification given"
                    value={itemComments}
                    onChange={(e) => setItemComments(e.target.value)}
                  />
                </div>
              </div>

              {itemStatus === 'Non-Compliant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                  <input
                    type="checkbox"
                    id="autoNC"
                    checked={autoCreateNC}
                    onChange={(e) => setAutoCreateNC(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="autoNC" style={{ fontSize: '13px', fontWeight: 700, color: '#be123c', cursor: 'pointer' }}>
                    Rule 2: Automatically generate and register an official Non-Conformity (NC) record for this finding
                  </label>
                </div>
              )}
            </>
          )}

          {itemStatus === 'Compliant' && (
            <div className="form-group">
              <label className="form-label">Verification Note (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Inspected on floor, condition conforms to requirement."
                value={itemComments}
                onChange={(e) => setItemComments(e.target.value)}
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

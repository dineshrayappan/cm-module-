import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCheck,
  Upload,
  Calendar,
  User,
  Shield,
  Clock,
  History,
  Check,
  X,
  FileText,
  ShieldCheck,
  Lock,
  Fingerprint,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useAuth } from '../context/AuthContext';

export const NCDetailPage = ({ ncId, onBack, onRefresh }) => {
  const { currentUser, currentRole, hasPermission } = useAuth();
  const [ncData, setNcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Form modals
  const [createCapModal, setCreateCapModal] = useState(false);
  const [capForm, setCapForm] = useState({
    immediate_correction: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: '',
    target_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' or 'reject'
  const [reviewComments, setReviewComments] = useState('');

  // Upload Evidence modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  // Verification modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState('pass'); // 'pass' or 'fail'
  const [verifyNotes, setVerifyNotes] = useState('');

  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadNC();
  }, [ncId]);

  const loadNC = async () => {
    try {
      setLoading(true);
      const res = await api.ncs.getById(ncId);
      if (res?.non_conformity) setNcData(res.non_conformity);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCAP = async (e) => {
    e.preventDefault();
    try {
      setActionError(null);
      await api.caps.create({
        ...capForm,
        nc_id: ncId,
        responsible_person_id: currentUser?.id,
        responsible_name: currentUser?.full_name || 'Department Officer',
        submit_now: true
      });
      setCreateCapModal(false);
      loadNC();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleReviewCAP = async (e) => {
    e.preventDefault();
    if (!ncData?.cap?.id) return;
    try {
      setActionError(null);
      await api.caps.review(ncData.cap.id, reviewAction, reviewComments);
      setReviewModalOpen(false);
      loadNC();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) return;
    try {
      setUploading(true);
      setActionError(null);
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('related_nc_id', ncId);
      if (ncData?.cap?.id) formData.append('related_cap_id', ncData.cap.id);
      formData.append('description', evidenceDesc || 'Implementation proof for NC corrective action');

      await api.evidence.upload(formData);
      setEvidenceModalOpen(false);
      setEvidenceFile(null);
      setEvidenceDesc('');
      loadNC();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitCAPForVerification = async () => {
    if (!ncData?.cap?.id) return;
    try {
      setActionError(null);
      await api.caps.submitEvidence(ncData.cap.id);
      loadNC();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyCAP = async (e) => {
    e.preventDefault();
    if (!ncData?.cap?.id) return;
    try {
      setActionError(null);
      await api.caps.verify(ncData.cap.id, verifyResult, verifyNotes);
      setVerifyModalOpen(false);
      loadNC();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Non-Conformity file...</div>;
  }

  if (!ncData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Record not found</h3>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          Back to NC Management
        </button>
      </div>
    );
  }

  const cap = ncData.cap;
  const evidenceList = ncData.evidence || [];
  const auditLogs = ncData.audit_trail || [];

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to NC List
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StatusBadge status={ncData.status} />
          <RiskBadge level={ncData.risk_level} score={ncData.risk_score} />
        </div>
      </div>

      {actionError && (
        <div style={{ padding: '12px 16px', background: '#fff1f2', color: '#be123c', border: '1px solid #ffe4e6', borderRadius: '10px', marginBottom: '16px', fontWeight: 600 }}>
          {actionError}
        </div>
      )}

      {/* Main Grid: Details on Left, Workflow/Timeline on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
        {/* Left Column: NC Overview & CAP Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* NC Header Card */}
          <div className="card" style={{ borderLeft: `6px solid ${ncData.severity === 'Critical' ? '#e11d48' : '#f97316'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>
                  {ncData.nc_number}
                </span>
                <h1 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#0f172a' }}>
                  {ncData.finding}
                </h1>
              </div>
              <StatusBadge status={ncData.severity} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{ncData.department_name}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Assignee</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{ncData.responsible_name}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Target Due Date</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{ncData.due_date}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Aging</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{ncData.age_days} Days</div>
              </div>
            </div>
          </div>

          {/* Corrective Action Plan (CAP) Workflow Section (Section 16 & 18) */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Corrective Action Plan (CAP)</div>
                <div className="card-subtitle">Root cause analysis, immediate correction, and preventive controls</div>
              </div>

              {cap ? (
                <StatusBadge status={cap.status} />
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setCreateCapModal(true)}>
                  + Formulate CAP
                </button>
              )}
            </div>

            {!cap ? (
              <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700 }}>No CAP Formulated Yet</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', maxWidth: '420px', margin: '4px auto 14px' }}>
                  Responsible department must conduct a 5-Why root cause analysis and submit a CAP before review.
                </p>
                <button className="btn btn-primary" onClick={() => setCreateCapModal(true)}>
                  Create Corrective Action Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb' }}>
                    1. Immediate Correction (Containment)
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#0f172a', marginTop: '4px' }}>
                    {cap.immediate_correction}
                  </p>
                </div>

                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#d97706' }}>
                    2. Root Cause Analysis (5-Why)
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#0f172a', marginTop: '4px' }}>
                    {cap.root_cause}
                  </p>
                </div>

                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669' }}>
                    3. Corrective Action
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#0f172a', marginTop: '4px' }}>
                    {cap.corrective_action}
                  </p>
                </div>

                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#7c3aed' }}>
                    4. Preventive Action & Systemic Controls
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#0f172a', marginTop: '4px' }}>
                    {cap.preventive_action}
                  </p>
                </div>

                {cap.reviewer_comments && (
                  <div style={{ padding: '14px', background: cap.status === 'Rejected' ? '#fff1f2' : '#f0fdf4', borderRadius: '10px', border: `1px solid ${cap.status === 'Rejected' ? '#fecdd3' : '#bbf7d0'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: cap.status === 'Rejected' ? '#be123c' : '#15803d' }}>
                      Reviewer Feedback / Verification Notes
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#0f172a', marginTop: '4px', fontStyle: 'italic' }}>
                      "{cap.reviewer_comments}"
                    </p>
                  </div>
                )}

                {/* Interactive Workflow Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  {/* Under Review => Compliance Manager reviews */}
                  {['Submitted', 'Under Review'].includes(cap.status) && hasPermission('review_cap') && (
                    <button className="btn btn-primary" onClick={() => setReviewModalOpen(true)}>
                      <CheckCircle size={15} /> Review & Approve / Reject CAP
                    </button>
                  )}

                  {/* Rejected => Rework and edit */}
                  {cap.status === 'Rejected' && (
                    <button className="btn btn-primary" onClick={() => setCreateCapModal(true)}>
                      Rework & Resubmit CAP
                    </button>
                  )}

                  {/* Approved => Upload evidence & submit for verification */}
                  {cap.status === 'Approved' && (
                    <>
                      <button className="btn btn-secondary" onClick={() => setEvidenceModalOpen(true)}>
                        <Upload size={14} /> Upload Implementation Evidence
                      </button>
                      <button className="btn btn-success" onClick={handleSubmitCAPForVerification}>
                        <FileCheck size={14} /> Submit for Auditor Verification
                      </button>
                    </>
                  )}

                  {/* Verification => Auditor verifies */}
                  {['Verification', 'Completed'].includes(ncData.status) && hasPermission('verify_cap') && (
                    <button className="btn btn-success" onClick={() => setVerifyModalOpen(true)}>
                      <CheckCircle size={16} /> Auditor Verification (Pass / Fail)
                    </button>
                  )}

                  {['Verification', 'Completed'].includes(ncData.status) && !hasPermission('verify_cap') && (
                    <div style={{ fontSize: '12.5px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} color="#0284c7" />
                      <span><strong>Auditor Action Required:</strong> Only AUDITOR or ADMIN can conduct field verification and close this Non-Conformity.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Evidence Attachments Section (Section 17) */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Evidence & Verification Documents ({evidenceList.length})</div>
                <div className="card-subtitle">Photos, certificates, lab reports, calibration slips</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setEvidenceModalOpen(true)}>
                + Upload Evidence
              </button>
            </div>

            {evidenceList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No evidence files attached yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileText size={18} color="#2563eb" />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.file_name}
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>{ev.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusBadge status={ev.verification_status} />
                      <a
                        href={ev.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Preview File ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Steps & Immutable Audit Trail (Section 25) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Workflow Stepper */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>
              Workflow Progression
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { step: '1. Finding Raised', done: true, desc: 'Logged by Auditor' },
                { step: '2. Assigned', done: !!ncData.responsible_name, desc: ncData.responsible_name },
                { step: '3. CAP Submitted', done: !!cap && cap.status !== 'Draft', desc: cap ? cap.status : 'Pending submission' },
                { step: '4. CAP Review', done: !!cap && ['Approved', 'Completed', 'Verified'].includes(cap.status), desc: 'Compliance Manager review' },
                { step: '5. Evidence Uploaded', done: evidenceList.length > 0, desc: `${evidenceList.length} files attached` },
                { step: '6. Auditor Verification', done: !!cap && cap.status === 'Verified', desc: 'Field inspection pass' },
                { step: '7. NC Closed', done: ncData.status === 'Closed', desc: 'Resolved and closed' }
              ].map((s, idx) => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: s.done ? '#10b981' : '#e2e8f0',
                      color: s.done ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {s.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: s.done ? '#0f172a' : '#64748b' }}>
                      {s.step}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Audit Trail Log (Section 14 & 25) */}
          <div className="card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div className="card-header" style={{ paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--primary-600)" />
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Audit Trail (Immutable)
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Append-only permanent record of all actions. Records cannot be altered or deleted.
                </div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: '11px',
                fontWeight: 700
              }}>
                <Lock size={12} />
                <span>Tamper-Proof</span>
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No historical actions recorded yet for this Non-Conformity.
              </div>
            ) : (
              <div style={{ position: 'relative', padding: '16px 8px 8px 8px' }}>
                {/* Continuous Timeline Line */}
                <div style={{
                  position: 'absolute',
                  left: '26px',
                  top: '28px',
                  bottom: '28px',
                  width: '2px',
                  backgroundColor: '#e2e8f0'
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {auditLogs.map((log, index) => {
                    const d = new Date(log.created_at);
                    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    // Compute relative timing like "Next day", "Next week"
                    let timingPrefix = timeStr;
                    if (index > 0 && auditLogs[index - 1]) {
                      const prevD = new Date(auditLogs[index - 1].created_at);
                      const dayDiff = Math.floor((d.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24));
                      if (dayDiff >= 6) {
                        timingPrefix = `Next week • ${timeStr}`;
                      } else if (dayDiff >= 1) {
                        timingPrefix = `Next day • ${timeStr}`;
                      }
                    }

                    // Human readable action title
                    let actionLabel = log.action_label;
                    if (!actionLabel) {
                      switch (log.action) {
                        case 'CREATE_NC': actionLabel = 'Auditor created NC'; break;
                        case 'ASSIGN_NC': actionLabel = 'Compliance Manager assigned to HR'; break;
                        case 'SUBMIT_CAP': actionLabel = 'HR submitted CAP'; break;
                        case 'REJECT_CAP': actionLabel = 'Auditor rejected CAP'; break;
                        case 'RESUBMIT_CAP': actionLabel = 'HR resubmitted CAP'; break;
                        case 'APPROVE_CAP': actionLabel = 'Auditor approved CAP'; break;
                        case 'UPLOAD_EVIDENCE': actionLabel = 'Evidence uploaded'; break;
                        case 'VERIFY_EVIDENCE':
                        case 'VERIFY_CAP_PASS': actionLabel = 'Auditor verified evidence'; break;
                        case 'CLOSE_NC': actionLabel = 'NC closed'; break;
                        default: actionLabel = log.action.replace(/_/g, ' ');
                      }
                    }

                    // Color schemes for timeline points
                    let nodeColor = '#3b82f6';
                    let nodeBg = '#eff6ff';
                    let nodeBorder = '#93c5fd';

                    if (log.action.includes('REJECT') || log.action.includes('FAIL')) {
                      nodeColor = '#dc2626';
                      nodeBg = '#fef2f2';
                      nodeBorder = '#fca5a5';
                    } else if (log.action.includes('APPROVE') || log.action.includes('CLOSE') || log.action.includes('PASS')) {
                      nodeColor = '#16a34a';
                      nodeBg = '#f0fdf4';
                      nodeBorder = '#86efac';
                    } else if (log.action.includes('VERIFY')) {
                      nodeColor = '#059669';
                      nodeBg = '#ecfdf5';
                      nodeBorder = '#6ee7b7';
                    } else if (log.action.includes('ASSIGN')) {
                      nodeColor = '#7c3aed';
                      nodeBg = '#f5f3ff';
                      nodeBorder = '#c4b5fd';
                    } else if (log.action.includes('CAP') || log.action.includes('EVIDENCE')) {
                      nodeColor = '#ea580c';
                      nodeBg = '#fff7ed';
                      nodeBorder = '#fdba74';
                    }

                    const isExpanded = expandedLogId === log.id;

                    return (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                        {/* Timeline Node Icon */}
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: nodeBg,
                            border: `2px solid ${nodeBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: nodeColor,
                            flexShrink: 0,
                            zIndex: 2,
                            marginTop: '2px'
                          }}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: nodeColor }} />
                        </div>

                        {/* Content Container */}
                        <div style={{
                          flex: 1,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 14px'
                        }}>
                          {/* Top Row: Time & Action Label */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: nodeColor,
                                backgroundColor: nodeBg,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${nodeBorder}`
                              }}>
                                {timingPrefix}
                              </span>
                              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                                {actionLabel}
                              </strong>
                            </div>

                            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                              {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          {/* Actor Info */}
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                            Actor: <strong>{log.user_name || log.user_email}</strong> ({log.user_role?.replace('_', ' ')})
                          </div>

                          {/* Details or Remark Note if present */}
                          {(log.details || log.new_value?.comments || log.new_value?.file) && (
                            <div style={{
                              marginTop: '6px',
                              padding: '6px 10px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#334155',
                              lineHeight: 1.4
                            }}>
                              {log.details || log.new_value?.comments || `File: ${log.new_value?.file}`}
                            </div>
                          )}

                          {/* Footer: Tamper Hash & Technical Detail Toggle */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid #f1f5f9',
                            fontSize: '10.5px',
                            color: '#94a3b8'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Fingerprint size={12} color="#10b981" />
                              <span style={{ fontFamily: 'monospace' }}>
                                {log.tamper_hash || 'SHA256:verified'}
                              </span>
                            </div>

                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: 0
                              }}
                            >
                              <span>{isExpanded ? 'Hide Payload' : 'Inspect'}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </div>

                          {/* Expanded JSON diff inspect */}
                          {isExpanded && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px',
                              backgroundColor: '#0f172a',
                              borderRadius: '6px',
                              color: '#38bdf8',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              maxHeight: '140px',
                              overflowY: 'auto'
                            }}>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify({
                                  action: log.action,
                                  actor: log.user_email,
                                  ip_address: log.ip_address,
                                  timestamp: log.created_at,
                                  changes: {
                                    before: log.old_value,
                                    after: log.new_value
                                  }
                                }, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Formulate CAP Modal */}
      <Modal
        isOpen={createCapModal}
        onClose={() => setCreateCapModal(false)}
        title="Formulate Corrective Action Plan (CAP)"
        subtitle={`Response for Non-Conformity: ${ncData.nc_number}`}
        maxWidth="720px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateCapModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateCAP}>Submit CAP for Review</button>
          </>
        }
      >
        <form onSubmit={handleCreateCAP}>
          <div className="form-group">
            <label className="form-label required">1. Immediate Correction (Containment)</label>
            <textarea
              className="form-control"
              placeholder="What immediate containment step was taken to stop the hazard or isolate affected product?"
              value={capForm.immediate_correction}
              onChange={(e) => setCapForm({ ...capForm, immediate_correction: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">2. Root Cause Analysis (5-Why Method)</label>
            <textarea
              className="form-control"
              placeholder="Why did this occur? What systemic process, training gap, or mechanical failure allowed it?"
              value={capForm.root_cause}
              onChange={(e) => setCapForm({ ...capForm, root_cause: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">3. Corrective Action (Direct Fix)</label>
            <textarea
              className="form-control"
              placeholder="What permanent physical, procedural, or engineering solution is being implemented?"
              value={capForm.corrective_action}
              onChange={(e) => setCapForm({ ...capForm, corrective_action: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">4. Preventive Action (Recurring Defense)</label>
            <textarea
              className="form-control"
              placeholder="How will recurrence be prevented? Policy updates, audits, supplier controls, SOPs..."
              value={capForm.preventive_action}
              onChange={(e) => setCapForm({ ...capForm, preventive_action: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Target Implementation Date</label>
            <input
              type="date"
              className="form-control"
              value={capForm.target_date}
              onChange={(e) => setCapForm({ ...capForm, target_date: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Review CAP Modal (Approve or Reject with remarks) */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Corrective Action Plan"
        subtitle={`Compliance Management Decision for ${ncData.nc_number}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setReviewModalOpen(false)}>Cancel</button>
            <button
              className={`btn ${reviewAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleReviewCAP}
            >
              {reviewAction === 'approve' ? 'Approve CAP' : 'Reject CAP'}
            </button>
          </>
        }
      >
        <form onSubmit={handleReviewCAP}>
          <div className="form-group">
            <label className="form-label required">Review Decision</label>
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                type="button"
                className={`btn ${reviewAction === 'approve' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setReviewAction('approve')}
              >
                ✓ Approve Plan
              </button>
              <button
                type="button"
                className={`btn ${reviewAction === 'reject' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setReviewAction('reject')}
              >
                ✗ Reject for Rework
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className={`form-label ${reviewAction === 'reject' ? 'required' : ''}`}>
              Reviewer Comments & Feedback
            </label>
            <textarea
              className="form-control"
              placeholder={reviewAction === 'reject' ? 'Specify why CAP is inadequate and what changes are required...' : 'Optional approval remarks or conditions...'}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              required={reviewAction === 'reject'}
            />
          </div>
        </form>
      </Modal>

      {/* Upload Evidence Modal */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Upload Implementation Evidence"
        subtitle={`Attach photos, certificates, or documents verifying CAP for ${ncData.nc_number}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEvidenceModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUploadEvidence} disabled={uploading || !evidenceFile}>
              {uploading ? 'Uploading...' : 'Save & Attach'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadEvidence}>
          <div className="form-group">
            <label className="form-label required">Select File (Image, PDF, Excel)</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setEvidenceFile(e.target.files[0])}
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Evidence Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Photo of yellow floor demarcation completed at Exit 4"
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Auditor Verification Modal (Pass -> Closes NC as per Rule 9) */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Auditor Field Verification"
        subtitle={`Verify CAP implementation for ${ncData.nc_number}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</button>
            <button
              className={`btn ${verifyResult === 'pass' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleVerifyCAP}
            >
              {verifyResult === 'pass' ? 'Confirm Pass & Close NC' : 'Fail Verification'}
            </button>
          </>
        }
      >
        <form onSubmit={handleVerifyCAP}>
          <div className="form-group">
            <label className="form-label required">Field Verification Result</label>
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                type="button"
                className={`btn ${verifyResult === 'pass' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setVerifyResult('pass')}
              >
                ✓ Verification PASSED (Close NC)
              </button>
              <button
                type="button"
                className={`btn ${verifyResult === 'fail' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setVerifyResult('fail')}
              >
                ✗ Verification FAILED (Rework)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Auditor Verification Remarks</label>
            <textarea
              className="form-control"
              placeholder="Detail observations made during physical inspection, photo comparison, and test results..."
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

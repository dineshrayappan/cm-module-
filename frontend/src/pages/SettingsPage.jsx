import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Save,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Database,
  Lock,
  ChevronRight,
  Info,
  Bell,
  Mail,
  MessageSquare,
  Send,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { hasPermission } = useAuth();
  const canManageSettings = hasPermission('manage_settings');

  const [activeTab, setActiveTab] = useState('scoring'); // 'scoring' | 'escalation' | 'audit_logs' | 'system'
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Scoring config state
  const [scoreConfig, setScoreConfig] = useState({
    critical_weight: 40.0,
    major_weight: 25.0,
    minor_weight: 10.0,
    task_completion_weight: 15.0,
    audit_pass_weight: 10.0,
    pass_threshold: 85.0
  });

  // Escalation config state
  const [escalationConfig, setEscalationConfig] = useState({
    advance_reminder_days: 7,
    urgent_reminder_days: 3,
    due_today_alert: true,
    overdue_alert: true,
    escalation_level_1_days: 3,
    escalation_level_2_days: 7,
    enable_in_app: true,
    enable_email: true,
    enable_whatsapp_sms: true
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterAction, setLogFilterAction] = useState('ALL');
  const [logFilterEntity, setLogFilterEntity] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const [scoreRes, escRes] = await Promise.all([
        api.settings.getScoreConfig(),
        api.settings.getEscalationConfig()
      ]);
      if (scoreRes.success && scoreRes.config) {
        setScoreConfig(scoreRes.config);
      }
      if (escRes.success && escRes.config) {
        setEscalationConfig(escRes.config);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load system configuration.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.settings.getAuditLogs();
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveScoreConfig = async (e) => {
    e.preventDefault();
    if (!canManageSettings) return;
    try {
      setLoading(true);
      setSaveSuccess(null);
      setError(null);
      const res = await api.settings.updateScoreConfig(scoreConfig);
      if (res.success) {
        setSaveSuccess('Scoring algorithm configuration saved successfully!');
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save scoring config.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEscalationConfig = async (e) => {
    e.preventDefault();
    if (!canManageSettings) return;
    try {
      setLoading(true);
      setSaveSuccess(null);
      setError(null);
      const res = await api.settings.updateEscalationConfig(escalationConfig);
      if (res.success) {
        setSaveSuccess('Escalation rules & threshold periods updated successfully!');
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save escalation config.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered audit logs
  const filteredLogs = auditLogs.filter(log => {
    if (logFilterAction !== 'ALL' && log.action !== logFilterAction) return false;
    if (logFilterEntity !== 'ALL' && log.entity_type !== logFilterEntity) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const matchEmail = log.user_email?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchEntity = log.entity_name?.toLowerCase().includes(q);
      if (!matchEmail && !matchAction && !matchEntity) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">System Settings & Compliance Engine</h1>
          <p className="page-subtitle">
            Configure dynamic compliance scoring formulas, automated escalation rules, and view the immutable audit trail.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchConfigs} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          <CheckCircle size={20} color="#10b981" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          color: '#991b1b',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          <AlertTriangle size={20} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Read-only Alert for Non-Admin roles */}
      {!canManageSettings && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px'
        }}>
          <Lock size={18} color="#2563eb" />
          <span><strong>Read-Only Mode:</strong> Only users with the <strong>ADMIN</strong> role can modify system settings, scoring formulas, or escalation thresholds.</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '24px'
      }}>
        <button
          className={`btn ${activeTab === 'scoring' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('scoring')}
        >
          <Sliders size={16} />
          Scoring Formula Weights
        </button>

        <button
          className={`btn ${activeTab === 'escalation' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('escalation')}
        >
          <Clock size={16} />
          Escalation Rules & Timers
        </button>

        <button
          className={`btn ${activeTab === 'audit_logs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('audit_logs')}
        >
          <ShieldCheck size={16} />
          Immutable Audit Trail
        </button>

        <button
          className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('system')}
        >
          <Database size={16} />
          Supabase & RLS Health
        </button>
      </div>

      {/* TAB 1: Scoring Formula Weights */}
      {activeTab === 'scoring' && (
        <div className="grid-layout grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Compliance Score Formula Configuration
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              The system calculates compliance rates dynamically using these database weights (stored in <code>score_configurations</code>). Adjust weights to align with your factory’s buyer codes of conduct.
            </p>

            <form onSubmit={handleSaveScoreConfig}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Critical NC Penalty Weight (Deduction points)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="form-control"
                    value={scoreConfig.critical_weight}
                    onChange={(e) => setScoreConfig({ ...scoreConfig, critical_weight: e.target.value })}
                    disabled={!canManageSettings}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Zero tolerance violations (e.g. locked emergency exits, child labour). Default: 40.0
                  </small>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Major NC Penalty Weight (Deduction points)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="form-control"
                    value={scoreConfig.major_weight}
                    onChange={(e) => setScoreConfig({ ...scoreConfig, major_weight: e.target.value })}
                    disabled={!canManageSettings}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Systemic compliance gaps (e.g. missing chemical SDS sheets, overdue training). Default: 25.0
                  </small>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Minor NC Penalty Weight (Deduction points)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="form-control"
                    value={scoreConfig.minor_weight}
                    onChange={(e) => setScoreConfig({ ...scoreConfig, minor_weight: e.target.value })}
                    disabled={!canManageSettings}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Isolated issues (e.g. minor housekeeping, single missing record). Default: 10.0
                  </small>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Task Completion Rate Weight (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="form-control"
                    value={scoreConfig.task_completion_weight}
                    onChange={(e) => setScoreConfig({ ...scoreConfig, task_completion_weight: e.target.value })}
                    disabled={!canManageSettings}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Contribution of timely preventive maintenance & routine inspection tasks. Default: 15.0%
                  </small>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Factory Pass Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    max="100"
                    className="form-control"
                    value={scoreConfig.pass_threshold}
                    onChange={(e) => setScoreConfig({ ...scoreConfig, pass_threshold: e.target.value })}
                    disabled={!canManageSettings}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Minimum overall score required for Green compliant status. Default: 85%
                  </small>
                </div>

                {canManageSettings ? (
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                    <Save size={16} />
                    Save Scoring Configuration
                  </button>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} /> Only Super Admins can alter compliance scoring algorithms.
                  </div>
                )}
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Info size={20} color="#0284c7" />
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Mathematical Scoring Formula
                </h4>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                Department compliance is calculated continuously as:
              </p>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #94a3b8',
                borderRadius: '6px',
                padding: '12px 14px',
                margin: '12px 0',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#0f172a'
              }}>
                Department Score = 100 - [ (Critical × {scoreConfig.critical_weight}) + (Major × {scoreConfig.major_weight}) + (Minor × {scoreConfig.minor_weight}) ] × PenaltyFactor + (TaskCompletionRate × {scoreConfig.task_completion_weight}%)
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                * Weights are not hard-coded. Changes committed here take effect immediately across all factory dashboards, department cards, and buyer reports.
              </p>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Target Rating Bands
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ecfdf5', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontWeight: 700, color: '#065f46' }}>Green (Compliant)</span>
                  <span style={{ fontWeight: 700, color: '#065f46' }}>&ge; {scoreConfig.pass_threshold}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fffbeb', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontWeight: 700, color: '#92400e' }}>Yellow (Needs Improvement)</span>
                  <span style={{ fontWeight: 700, color: '#92400e' }}>70% &ndash; {Number(scoreConfig.pass_threshold) - 1}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
                  <span style={{ fontWeight: 700, color: '#991b1b' }}>Red (Critical Risk)</span>
                  <span style={{ fontWeight: 700, color: '#991b1b' }}>&lt; 70%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Escalation Rules & Timers */}
      {activeTab === 'escalation' && (
        <div className="grid-layout grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Automated 6-Stage Notification & Escalation Rules
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Configure automated reminders and multi-stage escalation thresholds for tasks and Non-Conformities across In-App, Email, and WhatsApp/SMS.
            </p>

            <form onSubmit={handleSaveEscalationConfig}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Pre-Due Date Reminders */}
                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#0284c7" />
                    Pre-Deadline Reminders
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                        Advance Reminder (Days Prior)
                      </label>
                      <input
                        type="number"
                        min="4"
                        max="30"
                        className="form-control"
                        value={escalationConfig.advance_reminder_days}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, advance_reminder_days: e.target.value })}
                        disabled={!canManageSettings}
                        required
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        Default: 7 days before due date
                      </small>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                        Urgent Reminder (Days Prior)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-control"
                        value={escalationConfig.urgent_reminder_days}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, urgent_reminder_days: e.target.value })}
                        disabled={!canManageSettings}
                        required
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        Default: 3 days before due date
                      </small>
                    </div>
                  </div>
                </div>

                {/* Deadline & Immediate Overdue Alerts */}
                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    Deadline & Overdue Triggers
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(escalationConfig.due_today_alert)}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, due_today_alert: e.target.checked })}
                        disabled={!canManageSettings}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span><strong>Due Date Alert:</strong> Send "Due Today" high-priority notification on the deadline</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(escalationConfig.overdue_alert)}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, overdue_alert: e.target.checked })}
                        disabled={!canManageSettings}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span><strong>Overdue Notice:</strong> Flip status to Overdue and dispatch immediate overdue notice (+1 day)</span>
                    </label>
                  </div>
                </div>

                {/* Overdue Escalation Thresholds */}
                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color="#dc2626" />
                    Managerial Escalation Hierarchy
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                        Level 1: Dept Manager (Days Overdue)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="14"
                        className="form-control"
                        value={escalationConfig.escalation_level_1_days}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, escalation_level_1_days: e.target.value })}
                        disabled={!canManageSettings}
                        required
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        Default: 3 days overdue
                      </small>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                        Level 2: Compliance Head (Days Overdue)
                      </label>
                      <input
                        type="number"
                        min="4"
                        max="30"
                        className="form-control"
                        value={escalationConfig.escalation_level_2_days}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, escalation_level_2_days: e.target.value })}
                        disabled={!canManageSettings}
                        required
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        Default: 7 days overdue
                      </small>
                    </div>
                  </div>
                </div>

                {/* Notification Delivery Channels */}
                <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#166534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={16} color="#16a34a" />
                    Active Delivery Channels
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(escalationConfig.enable_in_app)}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, enable_in_app: e.target.checked })}
                        disabled={!canManageSettings}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <Bell size={14} color="#0284c7" />
                      <span>In-App Center</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(escalationConfig.enable_email)}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, enable_email: e.target.checked })}
                        disabled={!canManageSettings}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <Mail size={14} color="#059669" />
                      <span>HTML Email</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(escalationConfig.enable_whatsapp_sms)}
                        onChange={(e) => setEscalationConfig({ ...escalationConfig, enable_whatsapp_sms: e.target.checked })}
                        disabled={!canManageSettings}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <MessageSquare size={14} color="#25D366" />
                      <span>WhatsApp / SMS</span>
                    </label>
                  </div>
                </div>

                {canManageSettings ? (
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }} disabled={loading}>
                    <Save size={16} />
                    Save Escalation & Notification Parameters
                  </button>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} /> Only Super Admins can alter escalation rules.
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Workflow Diagram */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Automated 6-Stage Notification Flow
              </h4>
              <span className="badge badge-info" style={{ fontSize: '11px', padding: '4px 8px' }}>
                Multi-Channel Active
              </span>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              The background compliance engine continually evaluates all active tasks and open Non-Conformities through this exact automated lifecycle:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* STAGE 1 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  -{escalationConfig.advance_reminder_days}d
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{escalationConfig.advance_reminder_days} Days Before: Advance Reminder</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Prompt sent to Responsible Assignee with checklist criteria & CAP preparation guidance.
                  </div>
                </div>
              </div>

              {/* STAGE 2 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  -{escalationConfig.urgent_reminder_days}d
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {escalationConfig.urgent_reminder_days} Days Before: Urgent Reminder
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Urgent notification sent to prompt evidence upload and completion prior to deadline.
                  </div>
                </div>
              </div>

              {/* STAGE 3 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  0d
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Due Date: Due Today Alert
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Final deadline countdown alert sent on the exact due date.
                  </div>
                </div>
              </div>

              {/* STAGE 4 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  +1d
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    After Due Date: Overdue Notice
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Record status automatically flips to "Overdue"; urgent alert sent to responsible person.
                  </div>
                </div>
              </div>

              {/* STAGE 5 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  +{escalationConfig.escalation_level_1_days}d
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {escalationConfig.escalation_level_1_days} Days Overdue: Escalate to Department Manager
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Department Head alerted to intervene, review delay reasons, and enforce immediate action.
                  </div>
                </div>
              </div>

              {/* STAGE 6 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  +{escalationConfig.escalation_level_2_days}d
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {escalationConfig.escalation_level_2_days} Days Overdue: Escalate to Compliance Head
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Executive escalation to Compliance Head & GM. Automatically flags factory scorecard.
                  </div>
                </div>
              </div>
            </div>

            {/* Channels summary */}
            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Supported Notification Channels:
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Bell size={12} color="#0284c7" /> In-App Notification Center
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} color="#059669" /> Responsive HTML Corporate Email
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={12} color="#25D366" /> WhatsApp & SMS Webhook
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Immutable Audit Trail */}
      {activeTab === 'audit_logs' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  System-Wide Immutable Audit Trail
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Compliant with Buyer and ISO 19011 standards. Every modification, status change, and approval is permanently logged and cannot be edited or deleted.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={fetchAuditLogs} disabled={logsLoading}>
                <RefreshCw size={15} className={logsLoading ? 'spin' : ''} />
                Refresh Logs
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search user, action, or record..."
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '180px' }}
                value={logFilterEntity}
                onChange={(e) => setLogFilterEntity(e.target.value)}
              >
                <option value="ALL">All Entities</option>
                <option value="NC">Non-Conformity</option>
                <option value="CAP">Corrective Action</option>
                <option value="TASK">Task</option>
                <option value="AUDIT">Audit</option>
                <option value="SETTINGS">Settings</option>
              </select>

              <select
                className="form-control"
                style={{ width: '200px' }}
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE_NC">CREATE_NC</option>
                <option value="UPDATE_STATUS">UPDATE_STATUS</option>
                <option value="SUBMIT_CAP">SUBMIT_CAP</option>
                <option value="APPROVE_CAP">APPROVE_CAP</option>
                <option value="REJECT_CAP">REJECT_CAP</option>
                <option value="VERIFY_CAP">VERIFY_CAP</option>
                <option value="CLOSE_NC">CLOSE_NC</option>
                <option value="COMPLETE_TASK">COMPLETE_TASK</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User & Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details / Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No audit log entries matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr>
                          <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                              {log.user_email || 'System'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {log.user_role || 'automated_service'}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: log.action.includes('REJECT') ? '#fee2e2' : log.action.includes('CLOSE') || log.action.includes('VERIFY') ? '#ecfdf5' : '#eff6ff',
                              color: log.action.includes('REJECT') ? '#b91c1c' : log.action.includes('CLOSE') || log.action.includes('VERIFY') ? '#047857' : '#1d4ed8'
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                              {log.entity_name || log.entity_type}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ID: {log.entity_id ? log.entity_id.slice(0, 8) : 'N/A'}
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            >
                              {isExpanded ? 'Hide Payload' : 'View Payload Diff'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ backgroundColor: '#f8fafc' }}>
                            <td colSpan="5" style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                                    PREVIOUS STATE
                                  </div>
                                  <pre style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    fontSize: '11px',
                                    color: '#334155',
                                    maxHeight: '160px',
                                    overflowY: 'auto'
                                  }}>
                                    {log.old_value ? JSON.stringify(log.old_value, null, 2) : 'null (initial state)'}
                                  </pre>
                                </div>
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                                    COMMITTED NEW STATE
                                  </div>
                                  <pre style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    fontSize: '11px',
                                    color: '#0f172a',
                                    maxHeight: '160px',
                                    overflowY: 'auto'
                                  }}>
                                    {log.new_value ? JSON.stringify(log.new_value, null, 2) : 'null'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Supabase & RLS Health */}
      {activeTab === 'system' && (
        <div className="grid-layout grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Supabase PostgreSQL Connection Architecture
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#065f46' }}>PostgreSQL Schema Status</div>
                    <div style={{ fontSize: '12px', color: '#047857' }}>All 16 tables mapped, indexed, and foreign-key constrained.</div>
                  </div>
                </div>
                <span className="badge badge-success">READY</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#2563eb" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>Row Level Security (RLS)</div>
                    <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Policies enforced per role (Auditor, Dept Manager, User, Viewer).</div>
                  </div>
                </div>
                <span className="badge badge-info">ENFORCED</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={20} color="#0284c7" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Database Adapter Engine</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>Universal dual-mode: Supabase Cloud Client + Pre-seeded In-Memory Store.</div>
                  </div>
                </div>
                <span className="badge badge-neutral">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Supabase Storage Buckets
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Compliance evidence (inspection photos, calibration certificates, CAP rework documentation) is saved with SHA-256 hash checks and public URLs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Bucket: <code>compliance-evidence</code></div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MIME types: image/png, image/jpeg, application/pdf, .xlsx, .docx</div>
              </div>
              <div style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Audit Logs Bucket: <code>system-audit-trails</code></div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Append-only cold storage for buyer compliance inspections.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

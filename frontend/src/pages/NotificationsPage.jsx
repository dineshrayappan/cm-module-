import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';

export const NotificationsPage = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [outboundLogs, setOutboundLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'outbound'
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'reminder', 'due_today', 'escalation', 'cap'
  const [loading, setLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadOutboundLogs();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.getAll();
      if (res?.notifications) setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadOutboundLogs = async () => {
    try {
      const res = await api.notifications.getOutboundLogs();
      if (res?.logs) setOutboundLogs(res.logs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      loadNotifications();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      loadNotifications();
    } catch (e) {}
  };

  const handleTriggerCycle = async () => {
    try {
      setIsDispatching(true);
      setDispatchResult(null);
      const res = await api.notifications.triggerCycle();
      setDispatchResult({
        success: true,
        message: res.message || `Cycle complete! Dispatched ${res.dispatched_count} notifications.`
      });
      loadNotifications();
      loadOutboundLogs();
      setTimeout(() => setDispatchResult(null), 5000);
    } catch (err) {
      setDispatchResult({ success: false, message: err.message });
      setTimeout(() => setDispatchResult(null), 5000);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleTestDispatch = async () => {
    try {
      setIsDispatching(true);
      const res = await api.notifications.testDispatch({});
      setDispatchResult({
        success: true,
        message: 'Test notification sent across In-App, HTML Email, and SMS/WhatsApp channels!'
      });
      loadNotifications();
      loadOutboundLogs();
      setTimeout(() => setDispatchResult(null), 5000);
    } catch (err) {
      setDispatchResult({ success: false, message: err.message });
      setTimeout(() => setDispatchResult(null), 5000);
    } finally {
      setIsDispatching(false);
    }
  };

  const filtered = notifications.filter(n => {
    if (filterType === 'unread') return !n.read_status;
    if (filterType === 'escalation') return n.type === 'escalation' || (n.stage && n.stage.startsWith('escalate'));
    if (filterType === 'reminder') return n.stage === 'reminder_7d' || n.stage === 'reminder_3d';
    if (filterType === 'due_today') return n.stage === 'due_today';
    if (filterType === 'cap') return n.type === 'cap';
    return true;
  });

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Automated Notification & Escalation Center</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-channel alerts for 7-day/3-day reminders, due-today deadlines, overdue flags, and department/head escalations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleTestDispatch} disabled={isDispatching} title="Send a test multi-channel notification">
            <Send size={15} />
            <span>Send Test Alert</span>
          </button>

          <button className="btn btn-primary" onClick={handleTriggerCycle} disabled={isDispatching}>
            <RefreshCw size={15} className={isDispatching ? 'spin' : ''} />
            <span>Run Notification Cycle</span>
          </button>

          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Result Alert */}
      {dispatchResult && (
        <div style={{
          backgroundColor: dispatchResult.success ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${dispatchResult.success ? '#10b981' : '#ef4444'}`,
          color: dispatchResult.success ? '#065f46' : '#991b1b',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          {dispatchResult.success ? <CheckCircle2 size={18} color="#10b981" /> : <AlertTriangle size={18} color="#ef4444" />}
          <span>{dispatchResult.message}</span>
        </div>
      )}

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'inbox' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('inbox')}
        >
          <Bell size={16} />
          In-App Notification Stream ({notifications.length})
        </button>

        <button
          className={`btn ${activeTab === 'outbound' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('outbound')}
        >
          <Mail size={16} />
          Outbound Delivery Log (Email & SMS/WhatsApp) ({outboundLogs.length})
        </button>
      </div>

      {activeTab === 'inbox' && (
        <>
          {/* Sub-Filters */}
          <div className="tabs-nav" style={{ marginBottom: '18px' }}>
            <button
              className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`tab-btn ${filterType === 'unread' ? 'active' : ''}`}
              onClick={() => setFilterType('unread')}
            >
              Unread ({notifications.filter(n => !n.read_status).length})
            </button>
            <button
              className={`tab-btn ${filterType === 'reminder' ? 'active' : ''}`}
              onClick={() => setFilterType('reminder')}
            >
              7d & 3d Reminders
            </button>
            <button
              className={`tab-btn ${filterType === 'due_today' ? 'active' : ''}`}
              onClick={() => setFilterType('due_today')}
            >
              Due Today
            </button>
            <button
              className={`tab-btn ${filterType === 'escalation' ? 'active' : ''}`}
              onClick={() => setFilterType('escalation')}
            >
              Escalations ({notifications.filter(n => n.type === 'escalation' || (n.stage && n.stage.startsWith('escalate'))).length})
            </button>
            <button
              className={`tab-btn ${filterType === 'cap' ? 'active' : ''}`}
              onClick={() => setFilterType('cap')}
            >
              CAP Alerts
            </button>
          </div>

          {/* Notification List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading notification stream...
              </div>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ fontWeight: 600 }}>No notifications in this view</div>
                <div style={{ fontSize: '13px' }}>You are completely caught up!</div>
              </div>
            ) : (
              filtered.map(n => {
                const isEscalation = n.type === 'escalation' || (n.stage && n.stage.startsWith('escalate'));
                const isDueToday = n.stage === 'due_today';
                const isReminder = n.stage === 'reminder_7d' || n.stage === 'reminder_3d';

                return (
                  <div
                    key={n.id}
                    className="card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      backgroundColor: n.read_status ? 'var(--bg-surface)' : isEscalation ? '#fff7ed' : isDueToday ? '#fef2f2' : '#f8fafc',
                      borderLeft: isEscalation ? '4px solid #ea580c' : isDueToday ? '4px solid #dc2626' : isReminder ? '4px solid #2563eb' : '4px solid #94a3b8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isEscalation ? '#ffedd5' : isDueToday ? '#fee2e2' : '#e0f2fe',
                        color: isEscalation ? '#c2410c' : isDueToday ? '#dc2626' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isEscalation ? <ShieldAlert size={18} /> : isDueToday ? <Clock size={18} /> : isReminder ? <Calendar size={18} /> : <Bell size={18} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: n.read_status ? 600 : 700, color: 'var(--text-main)' }}>
                            {n.title}
                          </h4>
                          {n.stage && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              backgroundColor: n.stage.includes('head') ? '#fee2e2' : n.stage.includes('dept') ? '#fef3c7' : '#e0f2fe',
                              color: n.stage.includes('head') ? '#b91c1c' : n.stage.includes('dept') ? '#b45309' : '#0369a1'
                            }}>
                              {n.stage.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          )}
                          <StatusBadge status={n.priority} />
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>

                      <p style={{ margin: '4px 0 10px 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {n.message}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {n.link && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              if (!n.read_status) handleMarkAsRead(n.id);
                              if (onNavigate) onNavigate(n.link.replace('/', ''));
                            }}
                          >
                            <span>Open Record</span>
                            <ArrowRight size={13} />
                          </button>
                        )}

                        {!n.read_status && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Outbound Delivery Log View */}
      {activeTab === 'outbound' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                Multi-Channel Outbound Dispatch Log
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Audit history of all automated emails and WhatsApp/SMS alerts sent by the escalation engine
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadOutboundLogs}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Channel</th>
                <th>Recipient</th>
                <th>Subject / Alert Message</th>
                <th>Priority</th>
                <th>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              {outboundLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No outbound messages dispatched yet. Click "Run Notification Cycle" to trigger automatic checks.
                  </td>
                </tr>
              ) : (
                outboundLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: log.channel === 'email' ? '#eff6ff' : '#f0fdf4',
                        color: log.channel === 'email' ? '#1d4ed8' : '#15803d'
                      }}>
                        {log.channel === 'email' ? <Mail size={12} /> : <MessageSquare size={12} />}
                        {log.channel === 'email' ? 'HTML EMAIL' : 'WHATSAPP/SMS'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                        {log.recipient_name || log.recipient}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {log.recipient}
                      </div>
                    </td>
                    <td style={{ maxWidth: '350px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                        {log.subject}
                      </div>
                      {log.entity_code && (
                        <div style={{ fontSize: '11px', color: '#2563eb' }}>Ref: {log.entity_code}</div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={log.priority || 'Normal'} />
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#059669',
                        backgroundColor: '#ecfdf5',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        <CheckCircle2 size={12} />
                        {log.status || 'DELIVERED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

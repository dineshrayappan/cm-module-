import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Filter, ArrowRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';

export const NotificationsPage = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'escalation', 'task', 'cap'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
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

  const filtered = notifications.filter(n => {
    if (filterType === 'unread') return !n.read_status;
    if (filterType === 'escalation') return n.type === 'escalation';
    if (filterType === 'task') return n.type === 'task';
    if (filterType === 'cap') return n.type === 'cap';
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Notification & Escalation Center</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            System alerts, overdue task warnings, CAP approvals, and audit schedule broadcasts
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handleMarkAllRead}>
          <CheckCheck size={16} />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          className={`tab-btn ${filterType === 'unread' ? 'active' : ''}`}
          onClick={() => setFilterType('unread')}
        >
          Unread ({notifications.filter(n => !n.read_status).length})
        </button>
        <button
          className={`tab-btn ${filterType === 'escalation' ? 'active' : ''}`}
          onClick={() => setFilterType('escalation')}
        >
          Escalations ({notifications.filter(n => n.type === 'escalation').length})
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
            No notifications in this filter view.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: item.read_status ? '#ffffff' : '#f0f9ff',
                borderLeft: `5px solid ${item.priority === 'Critical' ? '#e11d48' : (item.priority === 'High' ? '#f59e0b' : '#3b82f6')}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.type === 'escalation' ? '#fff1f2' : '#eff6ff',
                    color: item.type === 'escalation' ? '#e11d48' : '#2563eb',
                    flexShrink: 0
                  }}
                >
                  {item.type === 'escalation' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>{item.title}</h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    {!item.read_status && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{item.message}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!item.read_status && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    Mark Read
                  </button>
                )}

                {item.link && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      handleMarkAsRead(item.id);
                      if (onNavigate) onNavigate(item.link.replace('/', ''));
                    }}
                  >
                    <span>View Record</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

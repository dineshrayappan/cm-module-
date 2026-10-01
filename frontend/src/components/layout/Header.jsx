import React, { useState, useEffect } from 'react';
import {
  Building,
  UserCheck,
  Bell,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useAuth, ROLES_LIST, normalizeRole } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Header = ({ onNavigate }) => {
  const {
    currentUser,
    currentRole,
    logout,
    factories,
    activeFactory,
    setActiveFactory
  } = useAuth();
  const canonicalRole = normalizeRole(currentRole);
  const activeRoleObj = ROLES_LIST.find(r => r.id === canonicalRole) || ROLES_LIST[0];

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, [currentRole]);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerAutoScheduler = async () => {
    try {
      setIsGenerating(true);
      const res = await api.tasks.autoSchedule();
      setGenMessage(`Cycle Complete: ${res.tasks_generated} tasks generated, ${res.items_escalated} escalations.`);
      loadNotifications();
      setTimeout(() => setGenMessage(null), 4000);
    } catch (err) {
      setGenMessage(`Error: ${err.message}`);
      setTimeout(() => setGenMessage(null), 4000);
    } finally {
      setIsGenerating(false);
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

  return (
    <header className="top-header">
      {/* Left: Active Factory Selector */}
      <div className="header-left">
        <div className="factory-badge">
          <Building size={16} color="var(--primary-600)" />
          <select
            value={activeFactory?.id || ''}
            onChange={(e) => {
              const selected = factories.find(f => f.id === e.target.value);
              if (selected) setActiveFactory(selected);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--text-main)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>

        {genMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              animation: 'fadeIn 200ms ease'
            }}
          >
            <CheckCircle size={14} />
            <span>{genMessage}</span>
          </div>
        )}
      </div>

      {/* Right: Actions, Role Badge, Notifications, Profile, Logout */}
      <div className="header-right">
        {/* Quick Task Generator Button (Admin Only) */}
        {canonicalRole === 'admin' && (
          <button
            className="btn btn-outline btn-sm"
            onClick={handleTriggerAutoScheduler}
            disabled={isGenerating}
            title="Simulate recurring task engine and overdue escalation checks"
          >
            <RefreshCw size={14} className={isGenerating ? 'spin-icon' : ''} />
            <span>{isGenerating ? 'Running Engine...' : 'Run Auto Schedule'}</span>
          </button>
        )}

        {/* Active Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: `${activeRoleObj.color}15`,
          border: `1px solid ${activeRoleObj.color}40`,
        }}>
          <UserCheck size={16} color={activeRoleObj.color} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1 }}>
              Logged In As
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: activeRoleObj.color, lineHeight: 1.2 }}>
              {activeRoleObj.label}
            </span>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={18} color="var(--text-secondary)" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer Popover */}
          {showNotifMenu && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '380px',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-light)',
                zIndex: 100,
                animation: 'scaleUp 150ms ease'
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                  Compliance Notifications ({unreadCount} unread)
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        handleMarkAsRead(notif.id);
                        if (notif.link && onNavigate) {
                          onNavigate(notif.link.replace('/', ''));
                        }
                        setShowNotifMenu(false);
                      }}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid #f8fafc',
                        backgroundColor: notif.read_status ? '#ffffff' : '#f0f9ff',
                        cursor: 'pointer',
                        transition: 'background 150ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{notif.title}</div>
                        {!notif.read_status && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '10px 18px',
                  borderTop: '1px solid #f1f5f9',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  borderBottomLeftRadius: '14px',
                  borderBottomRightRadius: '14px'
                }}
              >
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    if (onNavigate) onNavigate('notifications');
                  }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div
          className="user-profile-btn"
          onClick={() => {
            if (canonicalRole === 'admin' && onNavigate) {
              onNavigate('users');
            }
          }}
          style={{ cursor: canonicalRole === 'admin' ? 'pointer' : 'default' }}
          title={canonicalRole === 'admin' ? 'Manage Users' : `${currentUser?.full_name} (${activeRoleObj.label})`}
        >
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="Avatar"
            className="user-avatar"
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {currentUser?.full_name || 'Active User'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentUser?.department_name || activeRoleObj.badge}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              logout();
            }
          }}
          className="btn btn-outline btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#dc2626',
            borderColor: '#fca5a5',
            backgroundColor: '#ffffff',
            fontWeight: 700
          }}
          title="Sign out of current workspace"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};


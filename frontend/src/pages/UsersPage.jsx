import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Building, Phone, Mail, CheckCircle, Check, X } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth, ROLES_LIST, normalizeRole } from '../context/AuthContext';

export const UsersPage = () => {
  const { currentRole, switchRole } = useAuth();
  const canonicalRole = normalizeRole(currentRole);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.auth.getUsers();
      if (res?.users) setUsers(res.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ROLE_DETAILS = {
    admin: {
      items: [
        'Manage Users',
        'Manage Requirements',
        'Manage Departments',
        'Manage Audits',
        'Manage NC/CAP',
        'Reports & Dashboard'
      ]
    },
    auditor: {
      items: [
        'Conduct Audits',
        'Audit Checklist',
        'Create NC',
        'Review CAP',
        'Verify Evidence',
        'Close NC'
      ]
    },
    supervisor: {
      items: [
        'My Tasks',
        'Department Compliance',
        'Respond to NC',
        'Submit CAP',
        'Upload Evidence'
      ]
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Users & Role-Based Access Control</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            System enforced 3-tier user structure: ADMIN, AUDITOR, and SUPERVISOR
          </p>
        </div>
      </div>

      {/* 3 Role Descriptions Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {ROLES_LIST.map((r) => {
          const isActive = canonicalRole === r.id;
          const details = ROLE_DETAILS[r.id]?.items || [];
          return (
            <div
              key={r.id}
              className="card"
              style={{
                padding: '20px',
                borderTop: `4px solid ${r.color}`,
                backgroundColor: isActive ? '#f8fafc' : '#ffffff',
                boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>{r.label}</strong>
                  {isActive ? (
                    <span style={{ fontSize: '11px', color: r.color, fontWeight: 800, background: `${r.color}20`, padding: '2px 8px', borderRadius: '4px' }}>
                      Active Role
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {r.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', minHeight: '36px' }}>
                  {r.description}
                </div>

                {/* User Structure Hierarchy */}
                <div style={{
                  marginTop: '14px',
                  padding: '10px 12px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '6px' }}>
                    {r.label} Structure:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {details.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '11.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: r.color, fontWeight: 800 }}>•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className={`btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => switchRole(r.id)}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  borderColor: r.color,
                  backgroundColor: isActive ? r.color : 'transparent',
                  color: isActive ? '#ffffff' : r.color
                }}
              >
                {isActive ? 'Current Active Role' : `Switch to ${r.label}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Assigned Role</th>
              <th>Department</th>
              <th>Factory</th>
              <th>Contact Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>Loading system user directory...</td>
              </tr>
            ) : (
              users.map((u) => {
                const uCanonical = normalizeRole(u.role);
                const roleObj = ROLES_LIST.find(r => r.id === uCanonical) || { label: u.role, color: '#3b82f6' };
                const isCurrent = canonicalRole === uCanonical;

                return (
                  <tr key={u.id} style={{ backgroundColor: isCurrent ? '#f0f9ff' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt=""
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <strong style={{ color: 'var(--text-main)' }}>{u.full_name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: `${roleObj.color}15`,
                          color: roleObj.color
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: roleObj.color }} />
                        {roleObj.label}
                      </span>
                    </td>
                    <td>{u.department_name || 'Cross-Department'}</td>
                    <td>{u.factory_name || 'Default Factory'}</td>
                    <td style={{ fontSize: '13px', color: '#475569' }}>{u.phone || '—'}</td>
                    <td>
                      <StatusBadge status={u.status || 'Active'} />
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => switchRole(uCanonical)}
                        disabled={isCurrent}
                      >
                        {isCurrent ? 'Current' : 'Switch Role'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

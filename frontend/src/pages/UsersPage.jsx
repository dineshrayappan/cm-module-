import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Building, Phone, Mail, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth, ROLES_LIST } from '../context/AuthContext';

export const UsersPage = () => {
  const { currentRole, switchRole } = useAuth();
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Users & Role-Based Access Control</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            System users, role authorization tiers, factory assignments, and security profiles
          </p>
        </div>
      </div>

      {/* Role Descriptions Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {ROLES_LIST.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <div
              key={r.id}
              className="card"
              style={{
                padding: '16px',
                borderTop: `4px solid ${r.color}`,
                backgroundColor: isActive ? '#f8fafc' : '#ffffff',
                boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{r.label}</strong>
                {isActive && (
                  <span style={{ fontSize: '11px', color: r.color, fontWeight: 800, background: `${r.color}20`, padding: '2px 8px', borderRadius: '4px' }}>
                    Active Persona
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>{r.badge}</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => switchRole(r.id)}
                style={{ marginTop: '12px', width: '100%', borderColor: r.color, color: r.color }}
              >
                Switch to this Role
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
                const roleObj = ROLES_LIST.find(r => r.id === u.role) || { label: u.role, color: '#3b82f6' };
                const isCurrent = currentRole === u.role;

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
                        onClick={() => switchRole(u.role)}
                        disabled={isCurrent}
                      >
                        {isCurrent ? 'Current' : 'Impersonate'}
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

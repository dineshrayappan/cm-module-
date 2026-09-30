import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getActiveRole, setActiveRole, setAuthToken } from '../services/api';

const AuthContext = createContext();

export const ROLES_LIST = [
  { id: 'super_admin', label: 'Super Admin', color: '#8b5cf6', badge: 'Full Access' },
  { id: 'compliance_head', label: 'Compliance Head', color: '#3b82f6', badge: 'Oversight & Approvals' },
  { id: 'compliance_manager', label: 'Compliance Manager', color: '#0ea5e9', badge: 'Manager' },
  { id: 'internal_auditor', label: 'Internal Auditor', color: '#10b981', badge: 'Auditor' },
  { id: 'department_manager', label: 'Department Manager', color: '#f59e0b', badge: 'HR / Dept Head' },
  { id: 'department_user', label: 'Department User', color: '#6366f1', badge: 'EHS / Floor User' },
  { id: 'viewer', label: 'Viewer', color: '#64748b', badge: 'Read Only' }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(getActiveRole());
  const [factories, setFactories] = useState([]);
  const [activeFactory, setActiveFactory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile & factories on mount
  useEffect(() => {
    loadUserData();
  }, [currentRole]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userRes, factoriesRes] = await Promise.all([
        api.auth.getMe().catch(() => null),
        api.factories.getAll().catch(() => ({ factories: [] }))
      ]);

      if (userRes?.user) {
        setCurrentUser(userRes.user);
      }

      if (factoriesRes?.factories) {
        setFactories(factoriesRes.factories);
        if (!activeFactory && factoriesRes.factories.length > 0) {
          setActiveFactory(factoriesRes.factories[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load user or factory context:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (newRole) => {
    try {
      setActiveRole(newRole);
      setCurrentRole(newRole);
      const res = await api.auth.switchRole(newRole);
      if (res?.token) {
        setAuthToken(res.token);
      }
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    // Check specific role permissions
    if (permission === 'manage_audits') {
      return ['super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'].includes(currentUser.role);
    }
    if (permission === 'review_cap') {
      return ['super_admin', 'compliance_head', 'compliance_manager'].includes(currentUser.role);
    }
    if (permission === 'verify_cap') {
      return ['super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'].includes(currentUser.role);
    }
    if (permission === 'manage_settings') {
      return ['super_admin', 'compliance_head'].includes(currentUser.role);
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        factories,
        activeFactory,
        setActiveFactory,
        hasPermission,
        loading,
        refreshData: loadUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

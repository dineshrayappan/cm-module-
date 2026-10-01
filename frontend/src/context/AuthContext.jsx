import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken, getStoredUser, setStoredUser } from '../services/api';

const AuthContext = createContext();

export const normalizeRole = (role) => {
  if (!role) return 'supervisor';
  const r = role.toLowerCase();
  if (['admin', 'super_admin', 'compliance_head', 'compliance_manager'].includes(r)) return 'admin';
  if (['auditor', 'internal_auditor', 'viewer'].includes(r)) return 'auditor';
  if (['supervisor', 'department_manager', 'department_user'].includes(r)) return 'supervisor';
  return r;
};

export const ROLES_LIST = [
  {
    id: 'admin',
    label: 'ADMIN',
    badge: 'Full System Access',
    color: '#8b5cf6',
    description: 'Full system access: Manage users, departments, requirements, audits, NCs and CAPs. View all dashboards and reports.'
  },
  {
    id: 'auditor',
    label: 'AUDITOR',
    badge: 'Conduct Audits & Close NC',
    color: '#0ea5e9',
    description: 'Create and conduct audits, complete audit checklists, create NCs, review CAPs and evidence, verify and close NCs, view audit reports.'
  },
  {
    id: 'supervisor',
    label: 'SUPERVISOR',
    badge: 'Department Tasks & CAP',
    color: '#f59e0b',
    description: 'View assigned department tasks, complete compliance tasks, respond to NCs, submit CAP and evidence, track assigned issues.'
  }
];

export const AuthProvider = ({ children }) => {
  const initialUser = getStoredUser();
  const initialToken = getAuthToken();
  const [currentUser, setCurrentUser] = useState(initialToken ? initialUser : null);
  const [currentRole, setCurrentRole] = useState(initialToken && initialUser ? normalizeRole(initialUser.role) : null);
  const [factories, setFactories] = useState([]);
  const [activeFactory, setActiveFactory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile & factories on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setCurrentRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [userRes, factoriesRes] = await Promise.all([
        api.auth.getMe().catch((err) => {
          console.warn('Session expired or invalid:', err);
          logout();
          return null;
        }),
        api.factories.getAll().catch(() => ({ factories: [] }))
      ]);

      if (userRes?.user) {
        setStoredUser(userRes.user);
        setCurrentUser(userRes.user);
        setCurrentRole(normalizeRole(userRes.user.role));
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

  const login = async (identifier, password) => {
    const res = await api.auth.login({ identifier, password });
    if (res?.token && res?.user) {
      setAuthToken(res.token);
      setStoredUser(res.user);
      const canonical = normalizeRole(res.user.role);
      setCurrentUser(res.user);
      setCurrentRole(canonical);

      // Load factories for user
      try {
        const factoriesRes = await api.factories.getAll();
        if (factoriesRes?.factories?.length) {
          setFactories(factoriesRes.factories);
          setActiveFactory(factoriesRes.factories[0]);
        }
      } catch (e) {}

      return res.user;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const logout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const role = normalizeRole(currentUser.role);

    // ADMIN: Full system access
    if (role === 'admin') return true;

    // AUDITOR:
    // Create and conduct audits, complete checklists, create NCs, review CAPs and evidence, verify and close NCs, view reports
    if (role === 'auditor') {
      const auditorPerms = [
        'manage_audits',
        'create_audit',
        'conduct_audits',
        'audit_checklist',
        'complete_checklists',
        'create_nc',
        'review_cap',
        'review_evidence',
        'verify_evidence',
        'verify_cap',
        'close_nc',
        'verify_nc',
        'view_reports',
        'view_dashboards',
        'view_tasks'
      ];
      // Explicitly blocked for auditor
      if (['manage_users', 'manage_settings', 'manage_departments', 'manage_requirements', 'create_standard'].includes(permission)) {
        return false;
      }
      return auditorPerms.includes(permission);
    }

    // SUPERVISOR:
    // View assigned department tasks, complete compliance tasks, respond to NCs, submit CAP and evidence, track assigned issues
    // Cannot modify system settings or close/verify NCs
    if (role === 'supervisor') {
      const supervisorPerms = [
        'view_tasks',
        'complete_tasks',
        'start_task',
        'respond_nc',
        'create_cap',
        'submit_cap',
        'upload_evidence',
        'view_dashboards',
        'department_compliance'
      ];
      // Explicitly blocked for supervisor
      if ([
        'manage_settings',
        'close_nc',
        'verify_nc',
        'verify_cap',
        'verify_evidence',
        'review_cap',
        'manage_users',
        'manage_departments',
        'manage_requirements',
        'create_audit',
        'conduct_audits',
        'audit_checklist',
        'view_reports'
      ].includes(permission)) {
        return false;
      }
      return supervisorPerms.includes(permission);
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        login,
        logout,
        isAuthenticated: Boolean(currentUser && getAuthToken()),
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

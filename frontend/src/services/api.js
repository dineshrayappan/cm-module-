// API Client for Garment Compliance Management System

const BASE_URL = '/api';

export const getAuthToken = () => localStorage.getItem('tex_auth_token');
export const setAuthToken = (token) => localStorage.setItem('tex_auth_token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('tex_auth_token');
  localStorage.removeItem('tex_active_role');
  localStorage.removeItem('tex_user');
};

export const getActiveRole = () => localStorage.getItem('tex_active_role') || null;
export const setActiveRole = (role) => localStorage.setItem('tex_active_role', role);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('tex_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('tex_user', JSON.stringify(user));

async function request(endpoint, options = {}) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    switchRole: (role) => request('/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),
    getMe: () => request('/auth/me'),
    getUsers: () => request('/auth/users'),
    updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) })
  },

  // Factories & Departments
  factories: {
    getAll: () => request('/factories'),
    getById: (id) => request(`/factories/${id}`),
    create: (data) => request('/factories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/factories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/factories/${id}`, { method: 'DELETE' })
  },
  departments: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/departments${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/departments/${id}`),
    create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/departments/${id}`, { method: 'DELETE' })
  },

  // Standards & Requirements
  standards: {
    getAll: () => request('/standards'),
    getById: (id) => request(`/standards/${id}`),
    create: (data) => request('/standards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/standards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/standards/${id}`, { method: 'DELETE' })
  },
  requirements: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/requirements${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/requirements/${id}`),
    create: (data) => request('/requirements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/requirements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/requirements/${id}`, { method: 'DELETE' }),
    triggerAutoTasks: () => request('/requirements/trigger-auto-tasks', { method: 'POST' })
  },

  // Tasks
  tasks: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/tasks${query ? `?${query}` : ''}`);
    },
    getMyTasks: () => request('/tasks/my-tasks'),
    getById: (id) => request(`/tasks/${id}`),
    create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    start: (id) => request(`/tasks/${id}/start`, { method: 'POST' }),
    complete: (id, data) => request(`/tasks/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
    autoSchedule: () => request('/tasks/auto-schedule', { method: 'POST' })
  },

  // Audits & Checklists
  audits: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/audits${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/audits/${id}`),
    create: (data) => request('/audits', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, data) => request(`/audits/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    updateChecklist: (checklistId, data) => request(`/audits/checklist/${checklistId}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Non-Conformities (NC)
  ncs: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/ncs${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/ncs/${id}`),
    getAuditTrail: (id) => request(`/ncs/${id}/audit-trail`),
    create: (data) => request('/ncs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/ncs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    close: (id) => request(`/ncs/${id}/close`, { method: 'POST' }),
    getAgingReport: () => request('/ncs/aging-report')
  },


  // Corrective Action Plans (CAP)
  caps: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/caps${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/caps/${id}`),
    create: (data) => request('/caps', { method: 'POST', body: JSON.stringify(data) }),
    submit: (id) => request(`/caps/${id}/submit`, { method: 'POST' }),
    review: (id, action, comments) => request(`/caps/${id}/review`, { method: 'POST', body: JSON.stringify({ action, comments }) }),
    submitEvidence: (id, data = {}) => request(`/caps/${id}/submit-evidence`, { method: 'POST', body: JSON.stringify(data) }),
    verify: (id, result, verification_notes) => request(`/caps/${id}/verify`, { method: 'POST', body: JSON.stringify({ result, verification_notes }) })
  },

  // Evidence
  evidence: {
    upload: (formData) => request('/evidence/upload', { method: 'POST', body: formData }),
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/evidence${query ? `?${query}` : ''}`);
    },
    verify: (id, status) => request(`/evidence/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status }) })
  },

  // Dashboard
  dashboard: {
    getSummary: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/dashboard/summary${query ? `?${query}` : ''}`);
    }
  },

  // Notifications & Multi-Channel Alerts
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'PUT' }),
    getOutboundLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/notifications/outbound-log${query ? `?${query}` : ''}`);
    },
    triggerCycle: () => request('/notifications/trigger-cycle', { method: 'POST' }),
    testDispatch: (data) => request('/notifications/test-dispatch', { method: 'POST', body: JSON.stringify(data) })
  },

  // Reports
  reports: {
    getCompliance: (factoryId) => request(`/reports/compliance${factoryId ? `?factory_id=${factoryId}` : ''}`),
    getAudits: () => request('/reports/audits'),
    getNCs: () => request('/reports/ncs'),
    getCAPs: () => request('/reports/caps'),
    getExportUrl: (type) => `${BASE_URL}/reports/export/${type}`
  },

  // Settings & Configuration
  settings: {
    getScoreConfig: () => request('/settings/score-config'),
    updateScoreConfig: (data) => request('/settings/score-config', { method: 'PUT', body: JSON.stringify(data) }),
    getEscalationConfig: () => request('/settings/escalation-config'),
    updateEscalationConfig: (data) => request('/settings/escalation-config', { method: 'PUT', body: JSON.stringify(data) }),
    getAuditLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/settings/audit-logs${query ? `?${query}` : ''}`);
    }
  }
};

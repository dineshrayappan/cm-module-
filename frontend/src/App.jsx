import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, normalizeRole } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { StandardsPage } from './pages/StandardsPage';
import { RequirementsPage } from './pages/RequirementsPage';
import { TasksPage } from './pages/TasksPage';
import { AuditsPage } from './pages/AuditsPage';
import { AuditExecutionPage } from './pages/AuditExecutionPage';
import { NCManagementPage } from './pages/NCManagementPage';
import { NCDetailPage } from './pages/NCDetailPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

// Allowed page sets per role
const ROLE_ALLOWED_PAGES = {
  admin: [
    'dashboard',
    'standards',
    'requirements',
    'tasks',
    'audits',
    'audit-exec',
    'open-nc',
    'cap',
    'verification',
    'closed-nc',
    'ncs',
    'nc-detail',
    'departments',
    'reports',
    'notifications',
    'users',
    'settings'
  ],
  auditor: [
    'dashboard',
    'audits',
    'audit-exec',
    'open-nc',
    'cap',
    'verification',
    'closed-nc',
    'ncs',
    'nc-detail',
    'reports',
    'notifications'
  ],
  supervisor: [
    'dashboard',
    'tasks',
    'departments',
    'open-nc',
    'cap',
    'verification',
    'nc-detail',
    'notifications'
  ]
};

function MainAppShell() {
  const { currentUser, currentRole, isAuthenticated, loading } = useAuth();
  const canonicalRole = normalizeRole(currentRole);

  const [activePage, setActivePage] = useState('dashboard');
  const [selectedNcId, setSelectedNcId] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [ncTab, setNcTab] = useState('open');

  // Verify page validity whenever role or user changes
  useEffect(() => {
    if (canonicalRole) {
      const allowed = ROLE_ALLOWED_PAGES[canonicalRole] || ['dashboard'];
      if (!allowed.includes(activePage)) {
        setActivePage('dashboard');
      }
    }
  }, [canonicalRole]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '14px',
        fontWeight: 600
      }}>
        Loading Workspace...
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  const allowedPages = ROLE_ALLOWED_PAGES[canonicalRole] || ['dashboard'];
  const isPageAllowed = allowedPages.includes(activePage);

  const handleNavigate = (page) => {
    if (typeof page === 'string' && page.startsWith('nc-detail-')) {
      const id = page.replace('nc-detail-', '');
      setSelectedNcId(id);
      setActivePage('nc-detail');
    } else if (typeof page === 'string' && page.startsWith('audit-exec-')) {
      const id = page.replace('audit-exec-', '');
      setSelectedAuditId(id);
      setActivePage('audit-exec');
    } else {
      // Map specific NC tabs
      if (page === 'open-nc') {
        setNcTab('open');
        setActivePage('open-nc');
      } else if (page === 'cap') {
        setNcTab('cap');
        setActivePage('cap');
      } else if (page === 'verification') {
        setNcTab('verification');
        setActivePage('verification');
      } else if (page === 'closed-nc') {
        // Block supervisor from viewing closed-nc if attempted
        if (canonicalRole === 'supervisor') {
          setActivePage('dashboard');
          return;
        }
        setNcTab('closed');
        setActivePage('closed-nc');
      } else if (page === 'checklists') {
        setActivePage('audits');
      } else if (page === 'findings') {
        setNcTab('open');
        setActivePage('open-nc');
      } else {
        // If navigating to a restricted page, don't allow
        if (!allowedPages.includes(page)) {
          setActivePage('dashboard');
          return;
        }
        setActivePage(page);
      }
    }
    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    if (!isPageAllowed) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          margin: '24px'
        }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px' }}>
            Your role (<strong>{canonicalRole?.toUpperCase()}</strong>) does not have access permissions for this section.
          </p>
          <button
            onClick={() => setActivePage('dashboard')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Return to {canonicalRole?.toUpperCase()} Dashboard</span>
          </button>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'standards':
        return <StandardsPage />;

      case 'requirements':
        return <RequirementsPage />;

      case 'tasks':
        return <TasksPage />;

      case 'audits':
        return (
          <AuditsPage
            onSelectAudit={(id) => {
              setSelectedAuditId(id);
              setActivePage('audit-exec');
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'audit-exec':
        return (
          <AuditExecutionPage
            auditId={selectedAuditId}
            onBack={() => setActivePage('audits')}
            onNavigate={handleNavigate}
          />
        );

      case 'open-nc':
      case 'cap':
      case 'verification':
      case 'closed-nc':
      case 'ncs':
        return (
          <NCManagementPage
            key={activePage}
            defaultTab={ncTab}
            onSelectNC={(id) => {
              setSelectedNcId(id);
              setActivePage('nc-detail');
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'nc-detail':
        return (
          <NCDetailPage
            ncId={selectedNcId}
            onBack={() => setActivePage('open-nc')}
            onRefresh={() => {}}
          />
        );

      case 'departments':
        return <DepartmentsPage />;

      case 'reports':
        return <ReportsPage />;

      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;

      case 'users':
        return <UsersPage />;

      case 'settings':
        return <SettingsPage />;

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={handleNavigate} />
      <div className="main-content">
        <Header onNavigate={handleNavigate} />
        <main className="content-body">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppShell />
    </AuthProvider>
  );
}


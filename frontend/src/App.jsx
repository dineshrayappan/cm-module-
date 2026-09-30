import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

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

function MainAppShell() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedNcId, setSelectedNcId] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [ncTab, setNcTab] = useState('open');

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
        setNcTab('closed');
        setActivePage('closed-nc');
      } else if (page === 'checklists') {
        setActivePage('audits');
      } else if (page === 'findings') {
        setNcTab('open');
        setActivePage('open-nc');
      } else {
        setActivePage(page);
      }
    }
    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
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

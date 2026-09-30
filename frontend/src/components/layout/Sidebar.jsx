import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  FileSearch,
  AlertTriangle,
  FolderKanban,
  Building2,
  FileBarChart2,
  Bell,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { useAuth, ROLES_LIST } from '../../context/AuthContext';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { currentRole, currentUser } = useAuth();

  const [complianceOpen, setComplianceOpen] = useState(true);
  const [auditsOpen, setAuditsOpen] = useState(true);
  const [ncOpen, setNcOpen] = useState(true);

  const activeRoleObj = ROLES_LIST.find(r => r.id === currentRole) || ROLES_LIST[0];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={22} />
        </div>
        <div className="sidebar-logo-text">
          TexCompliant™
          <span>Garment Compliance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Dashboard */}
        <div
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePage('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </div>

        {/* Section: Compliance */}
        <div className="nav-section-title">Compliance Core</div>
        <div
          className="nav-item"
          onClick={() => setComplianceOpen(!complianceOpen)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={18} />
            <span>Compliance</span>
          </div>
          {complianceOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>

        {complianceOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div
              className={`nav-subitem ${activePage === 'standards' ? 'active' : ''}`}
              onClick={() => setActivePage('standards')}
            >
              Standards
            </div>
            <div
              className={`nav-subitem ${activePage === 'requirements' ? 'active' : ''}`}
              onClick={() => setActivePage('requirements')}
            >
              Requirements
            </div>
            <div
              className={`nav-subitem ${activePage === 'tasks' ? 'active' : ''}`}
              onClick={() => setActivePage('tasks')}
            >
              Tasks
            </div>
          </div>
        )}

        {/* Section: Audits */}
        <div className="nav-section-title">Audits & Inspections</div>
        <div
          className="nav-item"
          onClick={() => setAuditsOpen(!auditsOpen)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSearch size={18} />
            <span>Audits</span>
          </div>
          {auditsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>

        {auditsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div
              className={`nav-subitem ${activePage === 'audits' ? 'active' : ''}`}
              onClick={() => setActivePage('audits')}
            >
              Audits
            </div>
            <div
              className={`nav-subitem ${activePage === 'checklists' ? 'active' : ''}`}
              onClick={() => setActivePage('checklists')}
            >
              Checklists
            </div>
            <div
              className={`nav-subitem ${activePage === 'findings' ? 'active' : ''}`}
              onClick={() => setActivePage('findings')}
            >
              Findings
            </div>
          </div>
        )}

        {/* Section: NC Management */}
        <div className="nav-section-title">Non-Conformity Management</div>
        <div
          className="nav-item"
          onClick={() => setNcOpen(!ncOpen)}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} />
            <span>NC Management</span>
          </div>
          {ncOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>

        {ncOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div
              className={`nav-subitem ${activePage === 'open-nc' ? 'active' : ''}`}
              onClick={() => setActivePage('open-nc')}
            >
              Open NC
            </div>
            <div
              className={`nav-subitem ${activePage === 'cap' ? 'active' : ''}`}
              onClick={() => setActivePage('cap')}
            >
              CAP
            </div>
            <div
              className={`nav-subitem ${activePage === 'verification' ? 'active' : ''}`}
              onClick={() => setActivePage('verification')}
            >
              Verification
            </div>
            <div
              className={`nav-subitem ${activePage === 'closed-nc' ? 'active' : ''}`}
              onClick={() => setActivePage('closed-nc')}
            >
              Closed NC
            </div>
          </div>
        )}

        {/* Single Navigation Items */}
        <div className="nav-section-title">Operations & Analytics</div>
        <div
          className={`nav-item ${activePage === 'departments' ? 'active' : ''}`}
          onClick={() => setActivePage('departments')}
        >
          <Building2 size={18} />
          <span>Departments</span>
        </div>

        <div
          className={`nav-item ${activePage === 'reports' ? 'active' : ''}`}
          onClick={() => setActivePage('reports')}
        >
          <FileBarChart2 size={18} />
          <span>Reports</span>
        </div>

        <div
          className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`}
          onClick={() => setActivePage('notifications')}
        >
          <Bell size={18} />
          <span>Notifications</span>
        </div>

        {/* Administration */}
        <div className="nav-section-title">System Administration</div>
        <div
          className={`nav-item ${activePage === 'users' ? 'active' : ''}`}
          onClick={() => setActivePage('users')}
        >
          <Users size={18} />
          <span>Users & Roles</span>
        </div>

        <div
          className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
          onClick={() => setActivePage('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </div>
      </nav>

      {/* Sidebar Footer with Active Role indicator */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: activeRoleObj.color,
              boxShadow: `0 0 10px ${activeRoleObj.color}`
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.full_name || 'Active User'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Role: <strong style={{ color: activeRoleObj.color }}>{activeRoleObj.label}</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

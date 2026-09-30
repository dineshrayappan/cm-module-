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
  FileText,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useAuth, ROLES_LIST, normalizeRole } from '../../context/AuthContext';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { currentRole, currentUser } = useAuth();
  const canonicalRole = normalizeRole(currentRole);

  const [complianceOpen, setComplianceOpen] = useState(true);
  const [auditsOpen, setAuditsOpen] = useState(true);
  const [ncOpen, setNcOpen] = useState(true);

  const activeRoleObj = ROLES_LIST.find(r => r.id === canonicalRole) || ROLES_LIST[0];

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

      {/* Role Badge Indicator */}
      <div style={{
        margin: '10px 14px 16px',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: `${activeRoleObj.color}15`,
        border: `1px solid ${activeRoleObj.color}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: activeRoleObj.color,
            boxShadow: `0 0 8px ${activeRoleObj.color}`
          }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: activeRoleObj.color, letterSpacing: '0.5px' }}>
            {activeRoleObj.label} WORKSPACE
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {canonicalRole === 'admin' ? 'Full Access' : canonicalRole === 'auditor' ? 'Audits' : 'Supervisor'}
        </span>
      </div>

      {/* Navigation based on 3 Roles */}
      <nav className="sidebar-nav">

        {/* ==================================================== */}
        {/* ROLE 1: ADMIN NAVIGATION                             */}
        {/* ==================================================== */}
        {canonicalRole === 'admin' && (
          <>
            {/* Reports & Dashboard */}
            <div className="nav-section-title">Reports & Dashboard</div>
            <div
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
            <div
              className={`nav-item ${activePage === 'reports' ? 'active' : ''}`}
              onClick={() => setActivePage('reports')}
            >
              <FileBarChart2 size={18} />
              <span>Reports & Analytics</span>
            </div>

            {/* Manage Users */}
            <div className="nav-section-title">Manage Users</div>
            <div
              className={`nav-item ${activePage === 'users' ? 'active' : ''}`}
              onClick={() => setActivePage('users')}
            >
              <Users size={18} />
              <span>Manage Users</span>
            </div>

            {/* Manage Requirements */}
            <div className="nav-section-title">Manage Requirements</div>
            <div
              className="nav-item"
              onClick={() => setComplianceOpen(!complianceOpen)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Layers size={18} />
                <span>Requirements</span>
              </div>
              {complianceOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </div>
            {complianceOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  className={`nav-subitem ${activePage === 'standards' ? 'active' : ''}`}
                  onClick={() => setActivePage('standards')}
                >
                  Compliance Standards
                </div>
                <div
                  className={`nav-subitem ${activePage === 'requirements' ? 'active' : ''}`}
                  onClick={() => setActivePage('requirements')}
                >
                  Legal Requirements
                </div>
                <div
                  className={`nav-subitem ${activePage === 'tasks' ? 'active' : ''}`}
                  onClick={() => setActivePage('tasks')}
                >
                  Tasks Schedule
                </div>
              </div>
            )}

            {/* Manage Departments */}
            <div className="nav-section-title">Manage Departments</div>
            <div
              className={`nav-item ${activePage === 'departments' ? 'active' : ''}`}
              onClick={() => setActivePage('departments')}
            >
              <Building2 size={18} />
              <span>Manage Departments</span>
            </div>

            {/* Manage Audits */}
            <div className="nav-section-title">Manage Audits</div>
            <div
              className="nav-item"
              onClick={() => setAuditsOpen(!auditsOpen)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileSearch size={18} />
                <span>Manage Audits</span>
              </div>
              {auditsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </div>
            {auditsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  className={`nav-subitem ${activePage === 'audits' ? 'active' : ''}`}
                  onClick={() => setActivePage('audits')}
                >
                  Audit Schedules
                </div>
                <div
                  className={`nav-subitem ${activePage === 'checklists' ? 'active' : ''}`}
                  onClick={() => setActivePage('checklists')}
                >
                  Audit Checklists
                </div>
                <div
                  className={`nav-subitem ${activePage === 'findings' ? 'active' : ''}`}
                  onClick={() => setActivePage('findings')}
                >
                  Audit Findings
                </div>
              </div>
            )}

            {/* Manage NC/CAP */}
            <div className="nav-section-title">Manage NC / CAP</div>
            <div
              className="nav-item"
              onClick={() => setNcOpen(!ncOpen)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={18} />
                <span>Manage NC / CAP</span>
              </div>
              {ncOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </div>
            {ncOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  className={`nav-subitem ${activePage === 'open-nc' ? 'active' : ''}`}
                  onClick={() => setActivePage('open-nc')}
                >
                  Open NCs
                </div>
                <div
                  className={`nav-subitem ${activePage === 'cap' ? 'active' : ''}`}
                  onClick={() => setActivePage('cap')}
                >
                  Corrective Actions (CAP)
                </div>
                <div
                  className={`nav-subitem ${activePage === 'verification' ? 'active' : ''}`}
                  onClick={() => setActivePage('verification')}
                >
                  Evidence Verification
                </div>
                <div
                  className={`nav-subitem ${activePage === 'closed-nc' ? 'active' : ''}`}
                  onClick={() => setActivePage('closed-nc')}
                >
                  Closed NCs
                </div>
              </div>
            )}

            {/* Administration & Settings */}
            <div className="nav-section-title">Administration</div>
            <div
              className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`}
              onClick={() => setActivePage('notifications')}
            >
              <Bell size={18} />
              <span>Notifications & Alerts</span>
            </div>
            <div
              className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
              onClick={() => setActivePage('settings')}
            >
              <Settings size={18} />
              <span>Settings & Engine</span>
            </div>
          </>
        )}

        {/* ==================================================== */}
        {/* ROLE 2: AUDITOR NAVIGATION                           */}
        {/* ==================================================== */}
        {canonicalRole === 'auditor' && (
          <>
            <div className="nav-section-title">Auditor Center</div>
            <div
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>

            <div className="nav-section-title">Audit Management</div>
            <div
              className={`nav-item ${activePage === 'audits' ? 'active' : ''}`}
              onClick={() => setActivePage('audits')}
            >
              <FileSearch size={18} />
              <span>Conduct Audits</span>
            </div>

            <div
              className={`nav-item ${activePage === 'checklists' ? 'active' : ''}`}
              onClick={() => setActivePage('checklists')}
            >
              <ClipboardList size={18} />
              <span>Audit Checklist</span>
            </div>

            <div
              className={`nav-item ${activePage === 'open-nc' ? 'active' : ''}`}
              onClick={() => setActivePage('open-nc')}
            >
              <AlertTriangle size={18} />
              <span>Create & Track NC</span>
            </div>

            <div className="nav-section-title">CAP & Verification</div>
            <div
              className={`nav-item ${activePage === 'cap' ? 'active' : ''}`}
              onClick={() => setActivePage('cap')}
            >
              <FolderKanban size={18} />
              <span>Review CAP</span>
            </div>

            <div
              className={`nav-item ${activePage === 'verification' ? 'active' : ''}`}
              onClick={() => setActivePage('verification')}
            >
              <Sparkles size={18} />
              <span>Verify Evidence</span>
            </div>

            <div
              className={`nav-item ${activePage === 'closed-nc' ? 'active' : ''}`}
              onClick={() => setActivePage('closed-nc')}
            >
              <ShieldCheck size={18} />
              <span>Close NC</span>
            </div>

            <div className="nav-section-title">Reports & Alerts</div>
            <div
              className={`nav-item ${activePage === 'reports' ? 'active' : ''}`}
              onClick={() => setActivePage('reports')}
            >
              <FileBarChart2 size={18} />
              <span>View Audit Reports</span>
            </div>

            <div
              className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`}
              onClick={() => setActivePage('notifications')}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </div>
          </>
        )}

        {/* ==================================================== */}
        {/* ROLE 3: SUPERVISOR NAVIGATION                        */}
        {/* ==================================================== */}
        {canonicalRole === 'supervisor' && (
          <>
            <div className="nav-section-title">Supervisor Center</div>
            <div
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>

            <div className="nav-section-title">Department Tasks</div>
            <div
              className={`nav-item ${activePage === 'tasks' ? 'active' : ''}`}
              onClick={() => setActivePage('tasks')}
            >
              <CheckSquare size={18} />
              <span>My Tasks</span>
            </div>

            <div
              className={`nav-item ${activePage === 'departments' ? 'active' : ''}`}
              onClick={() => setActivePage('departments')}
            >
              <Building2 size={18} />
              <span>Department Compliance</span>
            </div>

            <div className="nav-section-title">NC Response & Action</div>
            <div
              className={`nav-item ${activePage === 'open-nc' ? 'active' : ''}`}
              onClick={() => setActivePage('open-nc')}
            >
              <AlertTriangle size={18} />
              <span>Respond to NC</span>
            </div>

            <div
              className={`nav-item ${activePage === 'cap' ? 'active' : ''}`}
              onClick={() => setActivePage('cap')}
            >
              <FolderKanban size={18} />
              <span>Submit CAP</span>
            </div>

            <div
              className={`nav-item ${activePage === 'verification' ? 'active' : ''}`}
              onClick={() => setActivePage('verification')}
            >
              <Upload size={18} />
              <span>Upload Evidence</span>
            </div>

            <div className="nav-section-title">Alerts</div>
            <div
              className={`nav-item ${activePage === 'notifications' ? 'active' : ''}`}
              onClick={() => setActivePage('notifications')}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </div>
          </>
        )}

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
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.full_name || 'Active User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Role: <strong style={{ color: activeRoleObj.color }}>{activeRoleObj.label}</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Search,
  Upload,
  FileCheck,
  Filter,
  User,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useAuth } from '../context/AuthContext';

export const TasksPage = () => {
  const { currentUser, currentRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Complete Task Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [completeComments, setCompleteComments] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [completeError, setCompleteError] = useState(null);
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Create Task Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    department_id: '',
    assigned_user_id: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'Medium'
  });

  useEffect(() => {
    loadTasks();
    loadLookups();
  }, [activeTab, selectedDept, selectedStatus, selectedPriority, search, currentRole]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (search) params.search = search;

      let res;
      if (activeTab === 'my') {
        res = await api.tasks.getMyTasks();
      } else {
        res = await api.tasks.getAll(params);
      }

      if (res?.tasks) setTasks(res.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        api.departments.getAll(),
        api.auth.getUsers()
      ]);
      if (deptRes?.departments) setDepartments(deptRes.departments);
      if (userRes?.users) setUsers(userRes.users);
    } catch (e) {}
  };

  const handleStartTask = async (taskId) => {
    try {
      await api.tasks.start(taskId);
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const openCompleteModal = (task) => {
    setTaskToComplete(task);
    setCompleteComments('');
    setEvidenceFile(null);
    setCompleteError(null);
    setCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!taskToComplete) return;

    try {
      setSubmittingComplete(true);
      setCompleteError(null);

      let uploadedUrl = null;
      // If evidence file selected, upload it first
      if (evidenceFile) {
        const formData = new FormData();
        formData.append('file', evidenceFile);
        formData.append('related_task_id', taskToComplete.id);
        formData.append('description', `Completion evidence for ${taskToComplete.title}`);
        const uploadRes = await api.evidence.upload(formData);
        uploadedUrl = uploadRes?.evidence?.file_url;
      }

      await api.tasks.complete(taskToComplete.id, {
        comments: completeComments,
        evidence_url: uploadedUrl
      });

      setCompleteModalOpen(false);
      loadTasks();
    } catch (err) {
      setCompleteError(err.message);
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.tasks.create(createData);
      setCreateModalOpen(false);
      setCreateData({
        title: '',
        description: '',
        department_id: '',
        assigned_user_id: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'Medium'
      });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Compliance Task Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Daily, weekly, and monthly operational compliance routines across factory units
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          <span>New Compliance Task</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Factory Tasks
        </button>
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My Assigned Tasks ({currentUser?.full_name || 'My Role'})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            className="select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            className="select-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {tasks.length} tasks found
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task Code</th>
              <th>Task Title & Scope</th>
              <th>Department</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Evidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading tasks...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>No compliance tasks found.</td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong style={{ color: '#2563eb' }}>{task.task_code}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px' }}>{task.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px' }}>{task.description}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{task.department_name}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: '#475569' }}>{task.assigned_user_name}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: task.status === 'Overdue' ? 800 : 500,
                        color: task.status === 'Overdue' ? '#e11d48' : '#334155'
                      }}
                    >
                      {task.due_date}
                    </span>
                    {task.escalation_level > 0 && (
                      <div style={{ fontSize: '10.5px', color: '#e11d48', fontWeight: 700 }}>
                        Escalated (L{task.escalation_level})
                      </div>
                    )}
                  </td>
                  <td>
                    <RiskBadge level={task.priority} />
                  </td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td>
                    {task.evidence_url ? (
                      <a
                        href={task.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#059669', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileCheck size={14} /> View File
                      </a>
                    ) : task.evidence_required ? (
                      <span style={{ color: '#f59e0b', fontSize: '11.5px', fontWeight: 600 }}>Required</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>Optional</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {task.status === 'Pending' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStartTask(task.id)}
                          title="Begin task"
                        >
                          <Play size={12} /> Start
                        </button>
                      )}

                      {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => openCompleteModal(task)}
                          title="Complete task and upload evidence"
                        >
                          <CheckCircle size={12} /> Complete
                        </button>
                      )}

                      {task.status === 'Completed' && (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complete Task Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={`Complete Task: ${taskToComplete?.task_code}`}
        subtitle={taskToComplete?.title}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCompleteModalOpen(false)}>Cancel</button>
            <button
              className="btn btn-success"
              onClick={handleCompleteSubmit}
              disabled={submittingComplete}
            >
              {submittingComplete ? 'Saving...' : 'Mark Completed'}
            </button>
          </>
        }
      >
        {completeError && (
          <div style={{ padding: '12px 14px', background: '#fff1f2', color: '#be123c', border: '1px solid #ffe4e6', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600 }}>
            {completeError}
          </div>
        )}

        {taskToComplete?.evidence_required && (
          <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', color: '#1e40af' }}>
            ℹ️ <strong>Rule 1 Enforcement:</strong> This compliance requirement requires mandatory photo/document evidence attachment before it can be marked completed.
          </div>
        )}

        <form onSubmit={handleCompleteSubmit}>
          <div className="form-group">
            <label className="form-label">Inspection Comments & Observations</label>
            <textarea
              className="form-control"
              placeholder="Record remarks, findings, verification notes..."
              value={completeComments}
              onChange={(e) => setCompleteComments(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className={`form-label ${taskToComplete?.evidence_required ? 'required' : ''}`}>
              Upload Evidence (Image, PDF, Document)
            </label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setEvidenceFile(e.target.files[0])}
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Supports JPG, PNG, PDF, Excel sheets (up to 25MB).
            </span>
          </div>
        </form>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Ad-Hoc Compliance Task"
        subtitle="Assign a specific compliance activity to a department or user"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateTask}>Create Task</button>
          </>
        }
      >
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label required">Task Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Eyewash Station Valve Replacement"
              value={createData.title}
              onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task Description</label>
            <textarea
              className="form-control"
              placeholder="Specify requirements, floor location, line number..."
              value={createData.description}
              onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-control"
                value={createData.department_id}
                onChange={(e) => setCreateData({ ...createData, department_id: e.target.value })}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign To User</label>
              <select
                className="form-control"
                value={createData.assigned_user_id}
                onChange={(e) => setCreateData({ ...createData, assigned_user_id: e.target.value })}
              >
                <option value="">Select Responsible Person</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label required">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={createData.due_date}
                onChange={(e) => setCreateData({ ...createData, due_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-control"
                value={createData.priority}
                onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

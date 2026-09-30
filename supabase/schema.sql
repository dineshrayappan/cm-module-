-- ============================================================================
-- GARMENT COMPLIANCE MANAGEMENT SYSTEM - DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. FACTORIES TABLE
CREATE TABLE IF NOT EXISTS factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    country VARCHAR(100) DEFAULT 'Bangladesh',
    state VARCHAR(100),
    contact_person VARCHAR(150),
    contact_number VARCHAR(50),
    email VARCHAR(150),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Under Audit')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    manager_name VARCHAR(150),
    manager_email VARCHAR(150),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_factory_dept_code UNIQUE (factory_id, code)
);

-- 3. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor', 'department_manager', 'department_user', 'viewer'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROFILES (USERS) TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) REFERENCES roles(id) DEFAULT 'viewer',
    factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPLIANCE STANDARDS TABLE
CREATE TABLE IF NOT EXISTS standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Under Review', 'Archived')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLIANCE REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    frequency VARCHAR(30) NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time')),
    risk_level VARCHAR(20) DEFAULT 'Medium' CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
    responsible_role VARCHAR(100) DEFAULT 'Department Manager',
    evidence_required BOOLEAN DEFAULT TRUE,
    due_date_rule VARCHAR(100) DEFAULT 'End of frequency cycle',
    weight INTEGER DEFAULT 10 CHECK (weight BETWEEN 1 AND 100),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS TABLE (Auto-generated & Manual compliance tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_code VARCHAR(60) UNIQUE NOT NULL,
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    created_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    completed_date TIMESTAMPTZ,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled')),
    evidence_url TEXT,
    comments TEXT,
    escalation_level INTEGER DEFAULT 0, -- 0: Normal, 1: Dept Mgr, 2: Compliance Mgr, 3: Compliance Head
    is_auto_generated BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDITS TABLE
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_code VARCHAR(60) UNIQUE NOT NULL,
    audit_type VARCHAR(100) NOT NULL CHECK (audit_type IN (
        'Internal Compliance Audit',
        'Social Compliance Audit',
        'EHS Audit',
        'Safety Audit',
        'Environmental Audit',
        'Quality Audit',
        'Buyer Audit',
        'Follow-up Audit'
    )),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    lead_auditor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    auditor_name VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scope TEXT,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'In Progress', 'Completed', 'Closed')),
    notes TEXT,
    compliance_score NUMERIC(5,2) DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT CHECKLISTS TABLE
CREATE TABLE IF NOT EXISTS audit_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'Not Applicable' CHECK (status IN ('Compliant', 'Non-Compliant', 'Observation', 'Not Applicable')),
    finding TEXT,
    comments TEXT,
    evidence_url TEXT,
    severity VARCHAR(20) DEFAULT 'Minor' CHECK (severity IN ('Critical', 'Major', 'Minor', 'Observation')),
    checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_audit_requirement UNIQUE (audit_id, requirement_id)
);

-- 10. NON-CONFORMITIES (NC) TABLE
CREATE TABLE IF NOT EXISTS non_conformities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nc_number VARCHAR(60) UNIQUE NOT NULL,
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    checklist_id UUID REFERENCES audit_checklists(id) ON DELETE SET NULL,
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    finding TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Observation')),
    risk_level VARCHAR(20) DEFAULT 'Medium' CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
    risk_score INTEGER DEFAULT 6,
    likelihood INTEGER DEFAULT 2 CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
    responsible_person_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    responsible_name VARCHAR(150),
    created_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Open' CHECK (status IN (
        'Open',
        'CAP Submitted',
        'Under Review',
        'CAP Rejected',
        'CAP Approved',
        'Evidence Submitted',
        'Verification',
        'Closed'
    )),
    root_cause TEXT,
    immediate_correction TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CORRECTIVE ACTION PLANS (CAP) TABLE
CREATE TABLE IF NOT EXISTS corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cap_code VARCHAR(60) UNIQUE NOT NULL,
    nc_id UUID REFERENCES non_conformities(id) ON DELETE CASCADE,
    immediate_correction TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    corrective_action TEXT NOT NULL,
    preventive_action TEXT NOT NULL,
    responsible_person_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    responsible_name VARCHAR(150),
    target_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN (
        'Draft',
        'Submitted',
        'Under Review',
        'Rejected',
        'Approved',
        'Completed',
        'Verified'
    )),
    reviewer_comments TEXT,
    approval_date TIMESTAMPTZ,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. EVIDENCE ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    related_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    related_nc_id UUID REFERENCES non_conformities(id) ON DELETE CASCADE,
    related_cap_id UUID REFERENCES corrective_actions(id) ON DELETE CASCADE,
    description TEXT,
    verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. RISK ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nc_id UUID REFERENCES non_conformities(id) ON DELETE CASCADE,
    likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
    notes TEXT,
    assessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'task' CHECK (type IN ('task', 'nc', 'cap', 'audit', 'escalation', 'verification', 'system')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Critical', 'High', 'Normal', 'Low')),
    link VARCHAR(255),
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AUDIT TRAIL / LOGS (IMMUTABLE)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- e.g. 'CREATE_NC', 'APPROVE_CAP', 'CLOSE_NC'
    entity_type VARCHAR(50) NOT NULL, -- e.g. 'NC', 'CAP', 'TASK', 'AUDIT'
    entity_id UUID,
    entity_name VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CONFIGURABLE SCORING CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS score_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    critical_weight NUMERIC(5,2) DEFAULT 40.0,
    major_weight NUMERIC(5,2) DEFAULT 25.0,
    minor_weight NUMERIC(5,2) DEFAULT 10.0,
    task_completion_weight NUMERIC(5,2) DEFAULT 15.0,
    audit_pass_weight NUMERIC(5,2) DEFAULT 10.0,
    pass_threshold NUMERIC(5,2) DEFAULT 85.0,
    config_json JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CONFIGURABLE ESCALATION CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS escalation_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    reminder_days_before INTEGER DEFAULT 2,
    escalation_level_1_days INTEGER DEFAULT 3,  -- Escalates to Department Manager
    escalation_level_2_days INTEGER DEFAULT 7,  -- Escalates to Compliance Manager
    escalation_level_3_days INTEGER DEFAULT 14, -- Escalates to Compliance Head
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR FAST QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_nc_status ON non_conformities(status);
CREATE INDEX IF NOT EXISTS idx_nc_severity ON non_conformities(severity);
CREATE INDEX IF NOT EXISTS idx_nc_dept ON non_conformities(department_id);
CREATE INDEX IF NOT EXISTS idx_nc_factory ON non_conformities(factory_id);
CREATE INDEX IF NOT EXISTS idx_nc_due_date ON non_conformities(due_date);

CREATE INDEX IF NOT EXISTS idx_cap_nc ON corrective_actions(nc_id);
CREATE INDEX IF NOT EXISTS idx_cap_status ON corrective_actions(status);

CREATE INDEX IF NOT EXISTS idx_audits_factory ON audits(factory_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

CREATE INDEX IF NOT EXISTS idx_evidence_nc ON evidence(related_nc_id);
CREATE INDEX IF NOT EXISTS idx_evidence_task ON evidence(related_task_id);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_conformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_configurations ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch user role from JWT / profiles
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Roles & Standards: Public Read for Authenticated Users
CREATE POLICY "Allow authenticated read on roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on standards" ON standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage standards" ON standards FOR ALL TO authenticated 
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager'));

-- Factories & Departments: Read all active, write restricted
CREATE POLICY "Allow authenticated read on factories" ON factories FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Allow admin manage factories" ON factories FOR ALL TO authenticated USING (get_auth_user_role() = 'super_admin');

CREATE POLICY "Allow authenticated read on departments" ON departments FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Allow admin manage departments" ON departments FOR ALL TO authenticated 
USING (get_auth_user_role() IN ('super_admin', 'compliance_head'));

-- Profiles: Authenticated users can view profiles, super_admin can manage
CREATE POLICY "Allow authenticated read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow super_admin manage profiles" ON profiles FOR ALL TO authenticated USING (get_auth_user_role() = 'super_admin');
CREATE POLICY "Allow user update self profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Requirements: Read for all, manage by compliance managers/heads
CREATE POLICY "Allow authenticated read requirements" ON requirements FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Allow compliance team manage requirements" ON requirements FOR ALL TO authenticated 
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager'));

-- Tasks:
-- Super Admin, Compliance Head, Compliance Manager: Full Access
-- Dept Manager: Full access to department tasks
-- Dept User: Access to assigned tasks or dept tasks
-- Auditor & Viewer: Read only
CREATE POLICY "Compliance management full access tasks" ON tasks FOR ALL TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager'));

CREATE POLICY "Department manager access own dept tasks" ON tasks FOR ALL TO authenticated
USING (
    get_auth_user_role() = 'department_manager' 
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Department user access assigned tasks" ON tasks FOR ALL TO authenticated
USING (
    get_auth_user_role() = 'department_user' 
    AND (assigned_user_id = auth.uid() OR department_id = (SELECT department_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Auditor and viewer read tasks" ON tasks FOR SELECT TO authenticated
USING (get_auth_user_role() IN ('internal_auditor', 'viewer'));

-- Audits & Checklists:
CREATE POLICY "Auditors and Compliance manage audits" ON audits FOR ALL TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'));

CREATE POLICY "All authenticated view audits" ON audits FOR SELECT TO authenticated USING (is_deleted = false);

CREATE POLICY "Manage audit checklists" ON audit_checklists FOR ALL TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'));

CREATE POLICY "View audit checklists" ON audit_checklists FOR SELECT TO authenticated USING (true);

-- Non-Conformities (NC):
CREATE POLICY "Compliance and auditors manage NC" ON non_conformities FOR ALL TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'));

CREATE POLICY "Department users view and update assigned NC" ON non_conformities FOR ALL TO authenticated
USING (
    get_auth_user_role() IN ('department_manager', 'department_user')
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Viewers read NC" ON non_conformities FOR SELECT TO authenticated USING (is_deleted = false);

-- Corrective Action Plans (CAP):
CREATE POLICY "Full access on CAP for management" ON corrective_actions FOR ALL TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'));

CREATE POLICY "Dept manager and users create and edit CAP" ON corrective_actions FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM non_conformities nc
        WHERE nc.id = corrective_actions.nc_id
        AND nc.department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Viewers read CAP" ON corrective_actions FOR SELECT TO authenticated USING (is_deleted = false);

-- Evidence:
CREATE POLICY "Manage evidence" ON evidence FOR ALL TO authenticated USING (true);

-- Risk Assessments:
CREATE POLICY "Compliance & auditors manage risk" ON risk_assessments FOR ALL TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'));
CREATE POLICY "View risk assessments" ON risk_assessments FOR SELECT TO authenticated USING (true);

-- Notifications:
CREATE POLICY "Users read their notifications" ON notifications FOR ALL TO authenticated
USING (user_id = auth.uid() OR role = get_auth_user_role());

-- Audit Logs: Read only, no direct modifications
CREATE POLICY "Allow view audit logs" ON audit_logs FOR SELECT TO authenticated
USING (get_auth_user_role() IN ('super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor'));

-- Configuration Tables:
CREATE POLICY "View configurations" ON score_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage score configurations" ON score_configurations FOR ALL TO authenticated 
USING (get_auth_user_role() IN ('super_admin', 'compliance_head'));

CREATE POLICY "View escalation configurations" ON escalation_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage escalation configurations" ON escalation_configurations FOR ALL TO authenticated 
USING (get_auth_user_role() IN ('super_admin', 'compliance_head'));

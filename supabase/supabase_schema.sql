-- ==============================================================================
-- GARMENT MANUFACTURING QMS - COMPLETE DATABASE RESET & RE-CREATION SCRIPT
-- ==============================================================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO:
-- 1. Wipe all existing tables, old constraints, and corrupted test data
-- 2. Re-create all tables with proper columns and unrestricted status constraints
-- 3. Configure open Row Level Security (RLS) policies for frontend & backend API access
-- 4. Seed standard users (admin, auditor, supervisor) with bcrypt hashed passwords
-- 5. Seed standard departments, compliance tasks, audits, and sample NC complaints
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CLEAN WIPE: DROP EXISTING TABLES AND DEPENDENCIES (CASCADE)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.auditLogs CASCADE;
DROP TABLE IF EXISTS public.compliance_tasks CASCADE;
DROP TABLE IF EXISTS public.audits CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.ncs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. CREATE USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.users (
    id TEXT PRIMARY KEY DEFAULT ('usr-' || substr(md5(random()::text), 1, 8)),
    "employeeId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AUDITOR', 'SUPERVISOR', 'ACTION_PERSON')),
    department TEXT NOT NULL DEFAULT 'Central Quality Audit',
    designation TEXT DEFAULT 'Staff',
    "mobileNumber" TEXT DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_employeeId ON public.users ("employeeId");
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_role ON public.users (role);

-- ------------------------------------------------------------------------------
-- 3. CREATE COMPLAINTS / NCs TABLE (FULL LIFECYCLE SUPPORT)
-- ------------------------------------------------------------------------------
CREATE TABLE public.complaints (
    id TEXT PRIMARY KEY DEFAULT ('cmp-' || floor(extract(epoch from now()) * 1000)::text),
    "complaintId" TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Stitching Fault',
    department TEXT NOT NULL DEFAULT 'Production',
    location TEXT NOT NULL DEFAULT 'Production Floor',
    priority TEXT NOT NULL DEFAULT 'HIGH',
    description TEXT DEFAULT '',
    requirement TEXT DEFAULT 'AQL 1.5 Workmanship Standard',
    "riskSeverity" TEXT DEFAULT 'HIGH',
    "capRequired" BOOLEAN DEFAULT false,
    "verificationMethod" TEXT DEFAULT 'Physical Floor Re-inspection',
    "beforePhoto" TEXT NOT NULL,
    "afterPhoto" TEXT DEFAULT NULL,
    "assignedTo" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdBy" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "deadlineHours" NUMERIC DEFAULT 16,
    "deadlineTimestamp" TIMESTAMPTZ,
    "actualCompletedAt" TIMESTAMPTZ DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft', 'Open', 'Assigned', 'In Progress', 'CAP Submitted', 'Under Review', 'Rejected / Rework', 'Verified', 'Closed')),
    "actionNotes" TEXT DEFAULT '',
    "feedbackRemarks" TEXT DEFAULT '',
    "rejectionReason" TEXT DEFAULT '',
    cap JSONB DEFAULT '{}'::jsonb,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_complaintId ON public.complaints ("complaintId");
CREATE INDEX idx_complaints_department ON public.complaints (department);
CREATE INDEX idx_complaints_status ON public.complaints (status);
CREATE INDEX idx_complaints_deadline ON public.complaints ("deadlineTimestamp");
CREATE INDEX idx_complaints_createdAt ON public.complaints ("createdAt");

-- ------------------------------------------------------------------------------
-- 4. CREATE COMPLIANCE TASKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.compliance_tasks (
    id TEXT PRIMARY KEY DEFAULT ('tsk-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT DEFAULT '',
    "assignedTo" JSONB DEFAULT '{}'::jsonb,
    "dueDate" TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    recurrence TEXT DEFAULT 'Daily',
    priority TEXT DEFAULT 'HIGH',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_department ON public.compliance_tasks (department);
CREATE INDEX idx_tasks_status ON public.compliance_tasks (status);

-- ------------------------------------------------------------------------------
-- 5. CREATE AUDITS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.audits (
    id TEXT PRIMARY KEY DEFAULT ('aud-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    audit_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    auditor JSONB DEFAULT '{}'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    findings_count INT DEFAULT 0,
    scheduled_date TIMESTAMPTZ DEFAULT NOW(),
    completed_date TIMESTAMPTZ DEFAULT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. CREATE IMMUTABLE AUDIT TRAIL LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || substr(md5(random()::text), 1, 10)),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    action_label TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'NC',
    entity_id TEXT,
    entity_name TEXT,
    related_nc_id TEXT,
    details TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT '127.0.0.1',
    is_immutable BOOLEAN DEFAULT true,
    tamper_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_related_nc ON public.audit_logs (related_nc_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at);

-- ------------------------------------------------------------------------------
-- 7. CREATE DEPARTMENTS MASTER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    manager TEXT,
    headcount INT DEFAULT 25,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for complaints" ON public.complaints FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for compliance_tasks" ON public.compliance_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for audits" ON public.audits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for departments" ON public.departments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. SEED MASTER DEPARTMENTS
-- ------------------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, manager, headcount) VALUES
    ('dept-01', 'Production', 'PROD', 'Rajesh Kumar', 280),
    ('dept-02', 'Quality', 'QA', 'Kavita Nair', 35),
    ('dept-03', 'Maintenance', 'MAINT', 'Vikram Singh', 22),
    ('dept-04', 'Stores', 'STORE', 'Ramesh Patel', 18),
    ('dept-05', 'EHS', 'EHS', 'Sunil Verma', 12),
    ('dept-06', 'EDP', 'EDP', 'Deepak Joshi', 8),
    ('dept-07', 'HR', 'HR', 'Meera Swaminathan', 15);

-- ------------------------------------------------------------------------------
-- 10. SEED USER ACCOUNTS (Passwords: admin123, auditor123, supervisor123)
-- ------------------------------------------------------------------------------
INSERT INTO public.users (id, "employeeId", name, email, password, role, department, designation, "mobileNumber", "isActive") VALUES
    (
        'usr-adm-001',
        'ADM-001',
        'Anil Mehta',
        'admin@factory.com',
        '$2a$10$p1RfcDyNpnXMlrLeQnjDyO6SASUtvtUVPq7LbzoKZKwSosenEw7Gm', -- admin123
        'ADMIN',
        'Executive Oversight',
        'Plant Operations Director',
        '+91 98000 11223',
        true
    ),
    (
        'usr-aud-001',
        'AUD-001',
        'Sarah Auditor',
        'auditor@factory.com',
        '$2a$10$SBTG0CoxDroMVBvUGqRC9ukm9LfCjHNUbfAbVBX.q6qQ74VnT7yNW', -- auditor123
        'AUDITOR',
        'Quality Assurance',
        'Lead Compliance Auditor',
        '+91 98765 43210',
        true
    ),
    (
        'usr-aud-002',
        'AUD-002',
        'Dinesh Rayappan',
        'dinesh@factory.com',
        '$2a$10$SBTG0CoxDroMVBvUGqRC9ukm9LfCjHNUbfAbVBX.q6qQ74VnT7yNW', -- auditor123
        'AUDITOR',
        'Quality Assurance',
        'Senior Internal Auditor',
        '+91 98111 55667',
        true
    ),
    (
        'usr-sup-001',
        'SUP-001',
        'Rajesh Kumar',
        'supervisor@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'Production',
        'Sewing Floor In-Charge',
        '+91 98111 22334',
        true
    ),
    (
        'usr-sup-002',
        'SUP-002',
        'Kavita Nair',
        'quality@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'Quality',
        'QC Section Lead',
        '+91 98222 33445',
        true
    ),
    (
        'usr-sup-003',
        'SUP-003',
        'Vikram Singh',
        'maintenance@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'Maintenance',
        'Chief Mechanical Engineer',
        '+91 98333 44556',
        true
    ),
    (
        'usr-sup-004',
        'SUP-004',
        'Ramesh Patel',
        'store@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'Stores',
        'Material & Fabric Store Lead',
        '+91 98444 55667',
        true
    ),
    (
        'usr-sup-005',
        'SUP-005',
        'Sunil Verma',
        'ehs@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'EHS',
        'Safety & Compliance Officer',
        '+91 98555 66778',
        true
    ),
    (
        'usr-sup-006',
        'SUP-006',
        'Deepak Joshi',
        'edp@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'EDP',
        'IT & Systems Specialist',
        '+91 98666 77889',
        true
    ),
    (
        'usr-sup-007',
        'SUP-007',
        'Meera Swaminathan',
        'hr@factory.com',
        '$2a$10$YWqHX4.CCyFyZXcelS9hteItNtgnED5zELjsq7qu4a84U3WKgGqaG', -- supervisor123
        'SUPERVISOR',
        'HR',
        'HR & Training Manager',
        '+91 98777 88990',
        true
    );

-- ------------------------------------------------------------------------------
-- 11. SEED INITIAL COMPLAINTS / NCs (Including NC-2026-00125 with full lifecycle)
-- ------------------------------------------------------------------------------
INSERT INTO public.complaints (
    id, "complaintId", category, department, location, priority, description,
    requirement, "riskSeverity", "capRequired", "verificationMethod",
    "beforePhoto", "afterPhoto", "assignedTo", "createdBy",
    "deadlineHours", "deadlineTimestamp", "actualCompletedAt",
    status, "actionNotes", "feedbackRemarks", "rejectionReason",
    cap, timeline, "createdAt", "updatedAt"
) VALUES
(
    'cmp-00125',
    'NC-2026-00125',
    'HR & Labor Standard',
    'HR',
    'HR Office Floor 2',
    'HIGH',
    '[Workflow Status: Closed] [Audit Requirement: Labor Welfare & ISO 9001:2015] [Risk: HIGH] [CAP Required: YES] [Verification: Auditor Document Verification]\n\nMissing statutory safety training documentation for 14 newly inducted sewing operators.',
    'Labor Welfare & ISO 9001:2015',
    'HIGH',
    true,
    'Auditor Document Verification',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmMmYyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYzkxZDFkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9vZiBXYXJyYW50PC90ZXh0Pjwvc3ZnPg==',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmZGY0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMTU4MDNkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WZXJpZmllZCBDb21wbGlhbnQ8L3RleHQ+PC9zdmc+',
    '{"userId": "usr-sup-007", "name": "Meera Swaminathan", "department": "HR", "designation": "HR Manager", "employeeId": "SUP-007"}'::jsonb,
    '{"userId": "usr-aud-001", "name": "Sarah Auditor", "role": "AUDITOR", "employeeId": "AUD-001"}'::jsonb,
    16,
    NOW() - INTERVAL '1 day',
    NOW(),
    'Closed',
    'Signed attendance matrix uploaded and verified by auditor.',
    'All 14 operators completed required machine safety module.',
    '',
    '{"required": true, "status": "VERIFIED_EFFECTIVE", "rootCause": "Onboarding coordinator omitted training checklist during batch rush", "immediateCorrection": "Conducted emergency 4-hour safety workshop", "correctiveAction": "Enforced HR portal gatepass signoff requirement before floor badge issue"}'::jsonb,
    '[
        {"action": "CREATED", "notes": "Auditor created NC", "timestamp": "2026-09-24T10:02:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}},
        {"action": "ASSIGN_NC", "notes": "Compliance Manager assigned to HR", "timestamp": "2026-09-24T10:15:00.000Z", "performedBy": {"name": "Dinesh Rayappan", "role": "AUDITOR"}},
        {"action": "SUBMIT_CAP", "notes": "HR submitted CAP", "timestamp": "2026-09-24T14:20:00.000Z", "performedBy": {"name": "Meera Swaminathan", "role": "SUPERVISOR"}},
        {"action": "REJECT_CAP", "notes": "Auditor rejected CAP: Root cause incomplete", "timestamp": "2026-09-25T09:30:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}},
        {"action": "RESUBMIT_CAP", "notes": "HR resubmitted CAP with revised training schedule", "timestamp": "2026-09-25T11:10:00.000Z", "performedBy": {"name": "Meera Swaminathan", "role": "SUPERVISOR"}},
        {"action": "APPROVE_CAP", "notes": "Auditor approved CAP", "timestamp": "2026-09-25T15:30:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}},
        {"action": "UPLOAD_EVIDENCE", "notes": "Evidence uploaded: attendance_signed.pdf", "timestamp": "2026-09-28T10:15:00.000Z", "performedBy": {"name": "Meera Swaminathan", "role": "SUPERVISOR"}},
        {"action": "VERIFY_EVIDENCE", "notes": "Auditor verified evidence physically", "timestamp": "2026-09-28T16:00:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}},
        {"action": "CLOSE_NC", "notes": "NC closed with full compliance", "timestamp": "2026-09-28T16:05:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}}
    ]'::jsonb,
    NOW() - INTERVAL '7 days',
    NOW()
),
(
    'cmp-00126',
    'NC-2026-00126',
    'Stitching Fault',
    'Production',
    'Sewing Line 3 - Station 14',
    'HIGH',
    '[Workflow Status: Open] [Audit Requirement: AQL 1.5 Workmanship Standard] [Risk: HIGH] [CAP Required: YES] [Verification: Physical Floor Re-inspection]\n\nMachine #14 - 8 skipped stitches per 10cm along collar seam line.',
    'AQL 1.5 Workmanship Standard',
    'HIGH',
    true,
    'Physical Floor Re-inspection',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmMmYyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYzkxZDFkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EZWZlY3QgUHJvb2Y8L3RleHQ+PC9zdmc+',
    NULL,
    '{"userId": "usr-sup-001", "name": "Rajesh Kumar", "department": "Production", "designation": "Floor In-Charge", "employeeId": "SUP-001"}'::jsonb,
    '{"userId": "usr-aud-001", "name": "Sarah Auditor", "role": "AUDITOR", "employeeId": "AUD-001"}'::jsonb,
    16,
    NOW() + INTERVAL '12 hours',
    NULL,
    'Open',
    '',
    '',
    '',
    '{"required": true, "status": "PENDING"}'::jsonb,
    '[{"action": "CREATED", "notes": "Auditor logged NC against Sewing Line 3", "timestamp": "2026-09-30T10:00:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}}]'::jsonb,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
),
(
    'cmp-00127',
    'NC-2026-00127',
    'Measurement / Dimension',
    'Quality',
    'Finishing & Inspection Table 2',
    'MEDIUM',
    '[Workflow Status: In Progress] [Audit Requirement: Brand Tech Pack Tolerance] [Risk: MEDIUM] [CAP Required: YES] [Verification: Measurement Chart Re-audit]\n\nSleeve length variance +1.5cm exceeding brand tolerance of +/- 0.5cm.',
    'Brand Tech Pack Tolerance',
    'MEDIUM',
    true,
    'Measurement Chart Re-audit',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmMmYyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYzkxZDFkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NZWFzdXJlbWVudCBGbGF3PC90ZXh0Pjwvc3ZnPg==',
    NULL,
    '{"userId": "usr-sup-002", "name": "Kavita Nair", "department": "Quality", "designation": "QC Lead", "employeeId": "SUP-002"}'::jsonb,
    '{"userId": "usr-aud-001", "name": "Sarah Auditor", "role": "AUDITOR", "employeeId": "AUD-001"}'::jsonb,
    24,
    NOW() + INTERVAL '18 hours',
    NULL,
    'In Progress',
    'Spreading tension calibrated on cutting table.',
    '',
    '',
    '{"required": true, "status": "IN_PROGRESS"}'::jsonb,
    '[
        {"action": "CREATED", "notes": "Auditor logged NC", "timestamp": "2026-09-30T11:00:00.000Z", "performedBy": {"name": "Sarah Auditor", "role": "AUDITOR"}},
        {"action": "IN_PROGRESS", "notes": "QC lead initiated containment and remeasurement", "timestamp": "2026-09-30T14:30:00.000Z", "performedBy": {"name": "Kavita Nair", "role": "SUPERVISOR"}}
    ]'::jsonb,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '1 hour'
);

-- ------------------------------------------------------------------------------
-- 12. SEED IMMUTABLE AUDIT TRAIL LOGS (Matching 9-step timeline for NC-00125)
-- ------------------------------------------------------------------------------
INSERT INTO public.audit_logs (
    id, user_id, user_name, user_role, action, action_label,
    entity_type, entity_id, entity_name, related_nc_id, details, payload,
    is_immutable, tamper_hash, created_at
) VALUES
('log-001', 'usr-aud-001', 'Sarah Auditor', 'AUDITOR', 'CREATE_NC', 'CREATE_NC', 'NC', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'Auditor created NC', '{"category": "HR & Labor Standard"}'::jsonb, true, 'SHA256:7f9a12c8b4e1', '2026-09-24 10:02:00+00'),
('log-002', 'usr-aud-002', 'Dinesh Rayappan', 'AUDITOR', 'ASSIGN_NC', 'ASSIGN_NC', 'NC', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'Compliance Manager assigned to HR', '{"assignedTo": "Meera Swaminathan"}'::jsonb, true, 'SHA256:8b1e45f92a3c', '2026-09-24 10:15:00+00'),
('log-003', 'usr-sup-007', 'Meera Swaminathan', 'SUPERVISOR', 'SUBMIT_CAP', 'SUBMIT_CAP', 'CAP', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'HR submitted CAP', '{"targetDate": "2026-09-28"}'::jsonb, true, 'SHA256:3c8d12a76f4e', '2026-09-24 14:20:00+00'),
('log-004', 'usr-aud-001', 'Sarah Auditor', 'AUDITOR', 'REJECT_CAP', 'REJECT_CAP', 'CAP', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'Auditor rejected CAP', '{"reason": "Root cause analysis incomplete"}'::jsonb, true, 'SHA256:4d9e56b87a1f', '2026-09-25 09:30:00+00'),
('log-005', 'usr-sup-007', 'Meera Swaminathan', 'SUPERVISOR', 'RESUBMIT_CAP', 'RESUBMIT_CAP', 'CAP', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'HR resubmitted CAP', '{"immediateCorrection": "Emergency workshop"}'::jsonb, true, 'SHA256:5e0f67c98b2a', '2026-09-25 11:10:00+00'),
('log-006', 'usr-aud-001', 'Sarah Auditor', 'AUDITOR', 'APPROVE_CAP', 'APPROVE_CAP', 'CAP', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'Auditor approved CAP', '{"status": "APPROVED"}'::jsonb, true, 'SHA256:6f1a78d09c3b', '2026-09-25 15:30:00+00'),
('log-007', 'usr-sup-007', 'Meera Swaminathan', 'SUPERVISOR', 'UPLOAD_EVIDENCE', 'UPLOAD_EVIDENCE', 'EVIDENCE', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'Evidence uploaded', '{"filename": "training_attendance_signed.pdf"}'::jsonb, true, 'SHA256:7a2b89e10d4c', '2026-09-28 10:15:00+00'),
('log-008', 'usr-aud-001', 'Sarah Auditor', 'AUDITOR', 'VERIFY_EVIDENCE', 'VERIFY_EVIDENCE', 'EVIDENCE', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'Auditor verified evidence', '{"verification": "PASS"}'::jsonb, true, 'SHA256:8b3c90f21e5d', '2026-09-28 16:00:00+00'),
('log-009', 'usr-aud-001', 'Sarah Auditor', 'AUDITOR', 'CLOSE_NC', 'CLOSE_NC', 'NC', 'cmp-00125', 'NC-2026-00125', 'cmp-00125', 'NC closed', '{"resolution": "VERIFIED_CLOSED"}'::jsonb, true, 'SHA256:9c4d01a32f6e', '2026-09-28 16:05:00+00');

-- ------------------------------------------------------------------------------
-- 13. SEED DAILY COMPLIANCE TASKS
-- ------------------------------------------------------------------------------
INSERT INTO public.compliance_tasks (id, title, department, description, "assignedTo", "dueDate", status, recurrence, priority) VALUES
('tsk-001', 'Needle Detector 9-Point Calibration Log', 'Quality', 'Verify daily sensitivity calibration at 1.0mm ferrous ball standard across conveyor belt.', '{"name": "Kavita Nair", "department": "Quality"}'::jsonb, NOW() + INTERVAL '4 hours', 'Pending', 'Daily', 'HIGH'),
('tsk-002', 'Daily Eye Guard & Pulley Safety Inspection', 'Production', 'Physical verification that all sewing machine eye shields and finger guards are securely in place.', '{"name": "Rajesh Kumar", "department": "Production"}'::jsonb, NOW() + INTERVAL '6 hours', 'In Progress', 'Daily', 'HIGH'),
('tsk-003', 'Emergency Exit Aisle Clearance Check', 'EHS', 'Ensure clear passageways, unblocked fire alarm pulls, and zero fabric carton obstruction in egress corridors.', '{"name": "Sunil Verma", "department": "EHS"}'::jsonb, NOW() + INTERVAL '8 hours', 'Pending', 'Daily', 'CRITICAL'),
('tsk-004', 'Sewing Machine Oil Wick Drip Check', 'Maintenance', 'Inspect Line 1 to 5 needle bar wicks to eliminate oil drip risk onto garment cuffs and collars.', '{"name": "Vikram Singh", "department": "Maintenance"}'::jsonb, NOW() + INTERVAL '12 hours', 'Pending', 'Daily', 'MEDIUM');

-- ------------------------------------------------------------------------------
-- 14. SEED AUDIT ROUNDS
-- ------------------------------------------------------------------------------
INSERT INTO public.audits (id, title, audit_number, department, status, auditor, findings_count, scheduled_date) VALUES
('aud-001', 'Q3 Factory-Wide Workmanship AQL 1.5 Audit', 'AUD-2026-Q3-01', 'Production', 'In Progress', '{"name": "Sarah Auditor", "role": "AUDITOR"}'::jsonb, 3, NOW() - INTERVAL '1 day'),
('aud-002', 'ISO 9001:2015 Social & Safety Compliance Review', 'AUD-2026-ISO-02', 'EHS', 'Scheduled', '{"name": "Dinesh Rayappan", "role": "AUDITOR"}'::jsonb, 1, NOW() + INTERVAL '2 days');

-- ------------------------------------------------------------------------------
-- VERIFY EXECUTION: TABLE ROW COUNTS
-- ------------------------------------------------------------------------------
SELECT 'users' AS table_name, count(*) AS total_rows FROM public.users
UNION ALL
SELECT 'complaints', count(*) FROM public.complaints
UNION ALL
SELECT 'compliance_tasks', count(*) FROM public.compliance_tasks
UNION ALL
SELECT 'audits', count(*) FROM public.audits
UNION ALL
SELECT 'audit_logs', count(*) FROM public.audit_logs
UNION ALL
SELECT 'departments', count(*) FROM public.departments;

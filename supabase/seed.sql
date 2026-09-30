-- ============================================================================
-- GARMENT COMPLIANCE MANAGEMENT SYSTEM - SEED DATA (SUPABASE POSTGRESQL)
-- ============================================================================

-- 1. ROLES
INSERT INTO roles (id, name, description, permissions) VALUES
('super_admin', 'Super Admin', 'Full system administration, factories, departments, standards, users, and system config.', '["*"]'::jsonb),
('compliance_head', 'Compliance Head', 'Factory-wide compliance oversight, audit management, CAP review/approval, verification and reports.', '["view:all", "manage:audits", "review:cap", "verify:nc", "manage:standards", "view:reports"]'::jsonb),
('compliance_manager', 'Compliance Manager', 'Compliance requirements management, task assignments, audits, NC creation, and CAP monitoring.', '["view:all", "manage:requirements", "assign:tasks", "manage:audits", "create:nc", "review:cap"]'::jsonb),
('internal_auditor', 'Internal Auditor', 'Conduct audits, complete checklists, log findings, create NCs, and verify corrective actions.', '["create:audits", "fill:checklists", "create:findings", "create:nc", "verify:evidence"]'::jsonb),
('department_manager', 'Department Manager', 'Oversee department tasks, respond to NCs, formulate CAP, upload evidence, and monitor department compliance.', '["view:dept_tasks", "complete:tasks", "respond:nc", "create:cap", "upload:evidence"]'::jsonb),
('department_user', 'Department User', 'View and execute assigned daily/weekly compliance tasks, upload photo evidence, submit for review.', '["view:assigned_tasks", "complete:assigned_tasks", "upload:evidence"]'::jsonb),
('viewer', 'Viewer', 'Read-only access to compliance dashboards, analytics, and generated reports.', '["view:dashboards", "view:reports"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. FACTORIES
INSERT INTO factories (id, code, name, address, country, state, contact_person, contact_number, email, status) VALUES
('f1111111-1111-1111-1111-111111111111', 'FAC-APEX-01', 'Apex Garments Manufacturing Ltd.', 'Plot 42-48, Sector 4, Export Processing Zone', 'Bangladesh', 'Dhaka Division', 'Engr. Tariqul Islam', '+880 1711-234567', 'compliance@apexgarments.com', 'Active'),
('f2222222-2222-2222-2222-222222222222', 'FAC-ECHOTEX-02', 'EchoTex International Apparel', 'Chandra, Kaliakoir, Gazipur', 'Bangladesh', 'Dhaka Division', 'Nusrat Jahan', '+880 1819-987654', 'compliance.head@echotexapparel.com', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 3. DEPARTMENTS
INSERT INTO departments (id, factory_id, code, name, manager_name, manager_email, description, status) VALUES
('d1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'DEP-HR', 'Human Resources', 'Mahmudul Hasan', 'hr.manager@apexgarments.com', 'Personnel management, payroll, labor standards, working hours, and grievance handling.', 'Active'),
('d2222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'DEP-PROD', 'Production & Sewing', 'Rafiqul Alam', 'prod.manager@apexgarments.com', 'Cutting, sewing, finishing lines, needle policy, and production safety.', 'Active'),
('d3333333-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111111', 'DEP-QA', 'Quality Assurance', 'Shirin Akhtar', 'qa.head@apexgarments.com', 'Product quality, metal detection calibration, fabric inspection, and buyer standards.', 'Active'),
('d4444444-4444-4444-4444-444444444444', 'f1111111-1111-1111-1111-111111111111', 'DEP-EHS', 'Environmental Health & Safety', 'Kamal Hossain', 'ehs.manager@apexgarments.com', 'Fire safety, workplace health, ergonomics, chemical safety, PPE, and emergency response.', 'Active'),
('d5555555-5555-5555-5555-555555555555', 'f1111111-1111-1111-1111-111111111111', 'DEP-MAINT', 'Maintenance & Engineering', 'Engr. Zahidul Haque', 'maint.head@apexgarments.com', 'Boiler safety, electrical panel maintenance, generator maintenance, and machinery calibration.', 'Active'),
('d6666666-6666-6666-6666-666666666666', 'f1111111-1111-1111-1111-111111111111', 'DEP-STORE', 'Warehouse & Stores', 'Faruk Ahmed', 'store.manager@apexgarments.com', 'Fabric storage, trims inventory, chemical storage, aisle clearance, and stacking safety.', 'Active'),
('d7777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', 'DEP-SEC', 'Factory Security', 'Capt. (Retd) Anwar Hossain', 'security.incharge@apexgarments.com', 'Access control, CCTV surveillance, emergency evacuation gates, and visitor logs.', 'Active'),
('d8888888-8888-8888-8888-888888888888', 'f1111111-1111-1111-1111-111111111111', 'DEP-ADMIN', 'Administration & Facilities', 'Tahmina Begum', 'admin.manager@apexgarments.com', 'Canteen hygiene, potable water testing, child-care facility, and sanitation.', 'Active')
ON CONFLICT (factory_id, code) DO NOTHING;

-- 4. PROFILES
INSERT INTO profiles (id, email, full_name, role, factory_id, department_id, phone, avatar_url, status) VALUES
('u1111111-1111-1111-1111-111111111111', 'admin@apexgarments.com', 'Kazi Nazrul Islam', 'super_admin', 'f1111111-1111-1111-1111-111111111111', NULL, '+880 1711-000001', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Active'),
('u2222222-2222-2222-2222-222222222222', 'compliance.head@apexgarments.com', 'Dr. Selim Reza', 'compliance_head', 'f1111111-1111-1111-1111-111111111111', NULL, '+880 1711-000002', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Active'),
('u3333333-3333-3333-3333-333333333333', 'compliance.mgr@apexgarments.com', 'Tanvir Ahmed Chowdhury', 'compliance_manager', 'f1111111-1111-1111-1111-111111111111', NULL, '+880 1711-000003', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Active'),
('u4444444-4444-4444-4444-444444444444', 'auditor.internal@apexgarments.com', 'Fatima Farhana', 'internal_auditor', 'f1111111-1111-1111-1111-111111111111', NULL, '+880 1711-000004', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Active'),
('u5555555-5555-5555-5555-555555555555', 'hr.manager@apexgarments.com', 'Mahmudul Hasan', 'department_manager', 'f1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '+880 1711-000005', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Active'),
('u6666666-6666-6666-6666-666666666666', 'ehs.officer@apexgarments.com', 'Shahadat Hossain', 'department_user', 'f1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444', '+880 1711-000006', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'Active'),
('u7777777-7777-7777-7777-777777777777', 'buyer.viewer@globalbrands.com', 'Claire Vance', 'viewer', 'f1111111-1111-1111-1111-111111111111', NULL, '+44 7700 900123', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', 'Active')
ON CONFLICT (email) DO NOTHING;

-- 5. STANDARDS
INSERT INTO standards (id, code, name, description, version, effective_date, expiry_date, status) VALUES
('s1111111-1111-1111-1111-111111111111', 'STD-FIRE-01', 'Fire Safety & Structural Compliance', 'Accord / RSC and National Building Code compliance for emergency egress, fire alarm, suppression systems, and structural integrity.', '3.2', '2025-01-01', '2027-12-31', 'Active'),
('s2222222-2222-2222-2222-222222222222', 'STD-SOC-02', 'Social & Labor Compliance (SMETA / WRAP)', 'Ethical trade initiative base code: no child labor, fair wages, regulated working hours, freedom of association, and humane treatment.', '6.1', '2025-03-01', '2027-03-01', 'Active'),
('s3333333-3333-3333-3333-333333333333', 'STD-EHS-03', 'Occupational Health & Safety (ISO 45001)', 'Personal protective equipment (PPE), machine guarding, electrical safety, ergonomic workstations, and incident reporting.', '2018-R1', '2024-06-01', '2027-06-01', 'Active'),
('s4444444-4444-4444-4444-444444444444', 'STD-CHEM-04', 'Chemical Management (ZDHC MRSL Level 3)', 'Zero Discharge of Hazardous Chemicals, SDS compliance, secondary containment, eye-wash stations, and toxic vapor ventilation.', '3.1', '2025-01-15', '2028-01-15', 'Active'),
('s5555555-5555-5555-5555-555555555555', 'STD-ENV-05', 'Environmental Compliance (Higg FEM)', 'Effluent treatment plant (ETP) parameters, greenhouse gas emissions, hazardous waste disposal manifests, and water conservation.', '4.0', '2025-01-01', '2027-12-31', 'Active')
ON CONFLICT (code) DO NOTHING;

-- 6. CONFIGURATIONS
INSERT INTO score_configurations (id, factory_id, critical_weight, major_weight, minor_weight, task_completion_weight, audit_pass_weight, pass_threshold, config_json, is_active) VALUES
('sc-01', 'f1111111-1111-1111-1111-111111111111', 40.0, 25.0, 10.0, 15.0, 10.0, 85.0, '{"formula": "weighted_deduction", "base_score": 100, "deductions": {"critical_open": 15, "major_open": 5, "minor_open": 1.5, "task_overdue": 2}}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO escalation_configurations (id, factory_id, reminder_days_before, escalation_level_1_days, escalation_level_2_days, escalation_level_3_days, is_active) VALUES
('esc-01', 'f1111111-1111-1111-1111-111111111111', 2, 3, 7, 14, true)
ON CONFLICT (id) DO NOTHING;

/**
 * Normalizes role string to one of the 3 canonical system roles:
 * - admin
 * - auditor
 * - supervisor
 */
export const normalizeRole = (role) => {
  if (!role) return 'supervisor';
  const r = role.toLowerCase();
  if (['admin', 'super_admin', 'compliance_head', 'compliance_manager'].includes(r)) return 'admin';
  if (['auditor', 'internal_auditor', 'viewer'].includes(r)) return 'auditor';
  if (['supervisor', 'department_manager', 'department_user'].includes(r)) return 'supervisor';
  return r;
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if current user's role is permitted to perform the action
 * Enforces permissions for: ADMIN, AUDITOR, SUPERVISOR
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const canonicalRole = normalizeRole(req.user.role);

    // ADMIN has universal access
    if (canonicalRole === 'admin') {
      return next();
    }

    // Map allowed roles to their canonical names
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    if (normalizedAllowed.includes(canonicalRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: role '${canonicalRole.toUpperCase()}' is not authorized to perform this operation. Allowed roles: ${normalizedAllowed.map(r => r.toUpperCase()).join(', ')}`
    });
  };
};

/**
 * Department Access Control Middleware
 * Ensures supervisors only manipulate their own department records
 * ADMIN and AUDITOR have factory-wide access
 */
export const requireDepartmentMatch = (getDeptIdFromReq) => {
  return (req, res, next) => {
    const canonicalRole = normalizeRole(req.user.role);
    // ADMIN and AUDITOR have cross-department access
    if (['admin', 'auditor'].includes(canonicalRole)) {
      return next();
    }

    const targetDeptId = getDeptIdFromReq(req);
    if (!targetDeptId || targetDeptId === req.user.department_id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access restricted: you may only access records within your assigned department.'
    });
  };
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if current user's role is permitted to perform the action
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = req.user.role;

    // Super Admin has universal access
    if (userRole === 'super_admin') {
      return next();
    }

    // Array of allowed roles
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: role '${userRole}' is not authorized to perform this operation. Allowed roles: ${allowedRoles.join(', ')}`
    });
  };
};

/**
 * Department Access Control Middleware
 * Ensures department users/managers only manipulate their own department records
 */
export const requireDepartmentMatch = (getDeptIdFromReq) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    // Management & Auditors have cross-department access
    if (['super_admin', 'compliance_head', 'compliance_manager', 'internal_auditor', 'viewer'].includes(userRole)) {
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

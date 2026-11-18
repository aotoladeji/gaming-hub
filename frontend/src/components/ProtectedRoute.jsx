import React from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from '../api/api';

/**
 * Guards admin routes. Pass requireSuperAdmin to also gate on role.
 */
export default function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (requireSuperAdmin && session.admin.role !== 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

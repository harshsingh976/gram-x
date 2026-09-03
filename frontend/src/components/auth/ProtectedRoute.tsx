/**
 * GRAM-X Protected Route Guard
 * Enforces Supabase Auth session requirement and optional role-based access limits.
 */

import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { authStatus, role } = useAuth();
  const location = useLocation();

  if (authStatus === 'AUTH_LOADING') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <Spinner size="lg" className="text-sky-400 mb-4" />
        <p className="text-sm font-semibold text-slate-400">Verifying secure session...</p>
      </div>
    );
  }

  if (authStatus === 'AUTH_UNAUTHENTICATED') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

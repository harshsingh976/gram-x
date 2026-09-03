/**
 * GRAM-X Application Routes
 * Implements React Router configuration for authentication and role-based portal routing.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignIn } from '../pages/auth/SignIn';
import { Register } from '../pages/auth/Register';
import { ResetKey } from '../pages/auth/ResetKey';
import App from '../App';

export const AppRoutes = () => {
  const { authStatus } = useAuth();

  const isAuthenticated = authStatus === 'AUTHENTICATED';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/reset-key"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ResetKey />}
        />

        {/* Protected Dashboard Root */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <App />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;

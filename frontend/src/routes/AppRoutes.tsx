/**
 * GRAM-X Central Application Routes
 * Declarative routing for Auth flows (/login, /register, /reset-key) and protected dashboard (/).
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignIn } from '../pages/auth/SignIn';
import { Register } from '../pages/auth/Register';
import { ResetKey } from '../pages/auth/ResetKey';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import App from '../App';

export const AppRoutes = () => {
  const { authStatus } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes (redirect to / if already authenticated) */}
        <Route
          path="/login"
          element={
            authStatus === 'AUTHENTICATED' ? <Navigate to="/" replace /> : <SignIn />
          }
        />
        <Route
          path="/register"
          element={
            authStatus === 'AUTHENTICATED' ? <Navigate to="/" replace /> : <Register />
          }
        />
        <Route
          path="/reset-key"
          element={
            authStatus === 'AUTHENTICATED' ? <Navigate to="/" replace /> : <ResetKey />
          }
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;

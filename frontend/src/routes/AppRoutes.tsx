/**
 * GRAM-X Central Application Routes
 * Declarative routing for Auth flows (/login, /register, /reset-key) and protected dashboard (/).
 * Phase 6: AnimatePresence page transitions with prefers-reduced-motion support.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { SignIn } from '../pages/auth/SignIn';
import { Register } from '../pages/auth/Register';
import { ResetKey } from '../pages/auth/ResetKey';
import { TransparencyPortal } from '../pages/TransparencyPortal';
import { ServiceDirectory } from '../pages/ServiceDirectory';
import { CommandCenter } from '../pages/CommandCenter';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import App from '../App';


// Detect reduced motion preference
const useReducedMotion = () => {
  const [reduced, setReduced] = React.useState(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
};

// Page transition animation variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

// Animated page wrapper
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedVariants : pageVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: reducedMotion ? 0.08 : 0.18, ease: 'easeOut' }}
      style={{ minHeight: '100dvh', width: '100%' }}
    >
      {children}
    </motion.div>
  );
};

// Inner routes component — needs useLocation inside BrowserRouter
const AnimatedRoutes = () => {
  const { authStatus } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Informational Routes */}
        <Route
          path="/transparency"
          element={<PageWrapper><TransparencyPortal /></PageWrapper>}
        />
        <Route
          path="/services"
          element={<PageWrapper><ServiceDirectory /></PageWrapper>}
        />

        {/* Public Authentication Routes (redirect to / if already authenticated) */}
        <Route
          path="/login"
          element={
            authStatus === 'AUTHENTICATED'
              ? <Navigate to="/" replace />
              : <PageWrapper><SignIn /></PageWrapper>
          }
        />
        <Route
          path="/register"
          element={
            authStatus === 'AUTHENTICATED'
              ? <Navigate to="/" replace />
              : <PageWrapper><Register /></PageWrapper>
          }
        />
        <Route
          path="/reset-key"
          element={
            authStatus === 'AUTHENTICATED'
              ? <Navigate to="/" replace />
              : <PageWrapper><ResetKey /></PageWrapper>
          }
        />

        {/* Protected Governance Command Center Route */}
        <Route
          path="/command-center"
          element={
            <ProtectedRoute allowedRoles={['admin', 'district', 'super_admin']}>
              <PageWrapper><CommandCenter /></PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PageWrapper><App /></PageWrapper>
            </ProtectedRoute>
          }
        />


        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default AppRoutes;

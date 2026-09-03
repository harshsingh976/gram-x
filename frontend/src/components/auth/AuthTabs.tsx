import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

export interface TabItem {
  id: string;
  label: string;
  path: string;
}

export const AuthTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: TabItem[] = [
    { id: 'login', label: 'Sign In', path: '/login' },
    { id: 'register', label: 'Register', path: '/register' },
    { id: 'reset-key', label: 'Reset Key', path: '/reset-key' },
  ];

  const currentPath = location.pathname;

  return (
    <div
      role="tablist"
      aria-label="Authentication Navigation"
      className="auth-tabs-container"
    >
      {tabs.map((tab) => {
        const isActive =
          currentPath === tab.path ||
          (tab.id === 'login' && (currentPath === '/' || currentPath === ''));

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            className={`auth-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

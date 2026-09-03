import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n';
import '../../styles/auth.css';

export interface TabItem {
  id: string;
  labelKey: string;
  path: string;
}

export const AuthTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const tabs: TabItem[] = [
    { id: 'login',     labelKey: 'auth.tab.sign_in', path: '/login' },
    { id: 'register',  labelKey: 'auth.tab.register', path: '/register' },
    { id: 'reset-key', labelKey: 'auth.tab.reset',    path: '/reset-key' },
  ];

  const currentPath = location.pathname;

  return (
    <nav
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
            {t(tab.labelKey)}
          </button>
        );
      })}
    </nav>
  );
};

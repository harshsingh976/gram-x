import React, { type ReactNode } from 'react';
import { Landmark, Shield, Users, MapPin } from 'lucide-react';
import { useLanguage } from '../../i18n';
import '../../styles/auth.css';

export interface ModalCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  showEmblem?: boolean;
}

export const ModalCard = ({
  title = 'GRAM-X',
  subtitle,
  children,
  headerContent,
  footerContent,
  className = '',
  showEmblem = true,
}: ModalCardProps) => {
  const { t } = useLanguage();

  const brandFeatures = [
    { icon: <Shield className="w-4 h-4" />, text: t('landing.admin_sub') || 'Manage grievances with full accountability' },
    { icon: <Users className="w-4 h-4" />, text: t('citizen.hero_subtitle') || 'Resolve village infrastructure challenges' },
    { icon: <MapPin className="w-4 h-4" />, text: 'Real-time spatial GIS & live field tracking' },
  ];

  return (
    <div className="auth-page">
      <section className={`auth-shell ${className}`} aria-label={title}>

        {/* ── Left Branding Panel (desktop only) ── */}
        <div className="auth-brand-panel" aria-hidden="true">
          {/* Indian flag stripe */}
          <div className="auth-tricolour">
            <div className="auth-tricolour-saffron" />
            <div className="auth-tricolour-white" />
            <div className="auth-tricolour-green" />
          </div>

          {/* Logo */}
          <div className="auth-brand-logo">
            <Landmark className="w-9 h-9" />
          </div>

          {/* GRAM-X wordmark */}
          <div className="auth-brand-wordmark" lang="en">GRAM-X</div>

          {/* Tagline */}
          <p className="auth-brand-tagline">
            {t('splash.tagline')}<br />
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('splash.sub_tagline')}</span>
          </p>

          {/* Feature highlights */}
          <div className="auth-brand-features">
            {brandFeatures.map((f, i) => (
              <div key={i} className="auth-brand-feature">
                <div className="auth-brand-feature-icon">{f.icon}</div>
                <span className="auth-brand-feature-text">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom disclaimer */}
          <div className="auth-brand-footer">
            {t('splash.secure_notice')}
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="auth-form-panel">
          <div className="auth-card-inner">

            {/* Mobile brand strip (shown only on mobile) */}
            <div className="auth-mobile-brand">
              <div className="auth-mobile-brand-logo">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="auth-mobile-brand-text" lang="en">GRAM-X</div>
                <div className="auth-mobile-brand-sub">{t('official_notice')}</div>
              </div>
            </div>

            {/* Form header */}
            <header className="auth-card-header">
              {showEmblem && (
                <div className="auth-emblem-badge" aria-hidden="true">
                  <Landmark className="w-6 h-6" />
                </div>
              )}
              <h1 className="auth-title">{title}</h1>
              {subtitle && <p className="auth-subtitle">{subtitle}</p>}
              {headerContent}
            </header>

            {/* Form body */}
            <main className="auth-card-body">{children}</main>

            {/* Footer */}
            {footerContent !== undefined ? (
              footerContent
            ) : (
              <footer className="auth-card-footer">
                <p>
                  {t('common.toll_free')}:{' '}
                  <strong style={{ color: '#155EEF' }}>{t('common.emergency_contact')}</strong>
                </p>
                <p style={{ marginTop: '4px', fontSize: '0.68rem', color: '#cbd5e1' }}>
                  {t('splash.secure_notice')}
                </p>
              </footer>
            )}
          </div>
        </div>

      </section>
    </div>
  );
};

export default ModalCard;

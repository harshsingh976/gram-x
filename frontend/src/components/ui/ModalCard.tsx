import React, { type ReactNode } from 'react';
import { Landmark } from 'lucide-react';
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
  subtitle = 'National Rural Infrastructure & Governance Network',
  children,
  headerContent,
  footerContent,
  className = '',
  showEmblem = true,
}: ModalCardProps) => {
  return (
    <div className="auth-page">
      <section className={`auth-shell ${className}`} aria-label={title}>
        {/* Header Section */}
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

        {/* Form & Main Content Body */}
        <main className="auth-card-body">{children}</main>

        {/* Footer Section */}
        {footerContent !== undefined ? (
          footerContent
        ) : (
          <footer className="auth-card-footer">
            <p>
              National Panchayat Citizen Helpline:{' '}
              <strong className="text-slate-300">1800-180-1555</strong> (Toll-Free)
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Protected by 256-bit cryptographic signatures &amp; role-based access control.
            </p>
          </footer>
        )}
      </section>
    </div>
  );
};

export default ModalCard;

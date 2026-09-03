import React, { type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import '../../styles/auth.css';

export interface AuthAlertProps {
  type?: 'error' | 'success' | 'info' | 'warning';
  children: ReactNode;
  className?: string;
}

export const AuthAlert = ({
  type = 'error',
  children,
  className = '',
}: AuthAlertProps) => {
  if (!children) return null;

  const iconMap = {
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`auth-alert auth-alert-${type} ${className}`}
    >
      {iconMap[type]}
      <div className="flex-1 leading-snug break-words">{children}</div>
    </div>
  );
};

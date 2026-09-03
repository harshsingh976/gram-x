import React, { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/auth.css';

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  isPassword?: boolean;
  extraLabelAction?: ReactNode;
}

export const AuthInput = ({
  id,
  label,
  error,
  required = false,
  leftIcon,
  isPassword = false,
  extraLabelAction,
  type = 'text',
  className = '',
  disabled,
  ...props
}: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="auth-input-group">
      <div className="auth-label">
        <label htmlFor={id}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {extraLabelAction}
      </div>

      <div className="auth-input-wrapper">
        <input
          id={id}
          type={effectiveType}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`auth-input ${error ? 'has-error' : ''} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            className="auth-input-icon-btn"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && (
        <span id={`${id}-error`} className="auth-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

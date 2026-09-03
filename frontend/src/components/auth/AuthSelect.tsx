import React, { type SelectHTMLAttributes } from 'react';
import '../../styles/auth.css';

export interface OptionItem {
  value: string | number;
  label: string;
}

export interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: OptionItem[];
  error?: string;
  required?: boolean;
}

export const AuthSelect = ({
  id,
  label,
  options,
  error,
  required = false,
  className = '',
  disabled,
  ...props
}: AuthSelectProps) => {
  return (
    <div className="auth-input-group">
      <label htmlFor={id} className="auth-label">
        <span>
          {label} {required && <span className="text-red-400">*</span>}
        </span>
      </label>

      <select
        id={id}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`auth-select ${error ? 'has-error' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span id={`${id}-error`} className="auth-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

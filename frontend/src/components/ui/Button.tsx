import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  noScale?: boolean; // opt-out of scale animation for small/icon buttons
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  disabled,
  type = 'button',
  noScale = false,
  ...props
}: ButtonProps) => {
  // Base classes — light-theme-compatible focus ring
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none will-change-transform';

  const scaleClasses = noScale
    ? ''
    : 'hover:scale-[1.02] active:scale-[0.98]';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-800 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/25 focus:ring-blue-500 focus:ring-offset-white',
    secondary:
      'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm focus:ring-slate-400 focus:ring-offset-white',
    outline:
      'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 focus:ring-offset-white',
    danger:
      'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-md hover:shadow-red-500/25 focus:ring-red-500 focus:ring-offset-white',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400 focus:ring-offset-white',
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs min-h-[36px] gap-1.5',
    md: 'py-3 px-4 text-sm min-h-[48px] gap-2',
    lg: 'py-3.5 px-6 text-base min-h-[52px] gap-2.5',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${scaleClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size={size === 'sm' ? 'sm' : 'md'} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

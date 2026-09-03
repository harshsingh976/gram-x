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
  ...props
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white shadow-lg hover:shadow-blue-900/30 focus:ring-blue-500',
    secondary:
      'bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 focus:ring-slate-400',
    outline:
      'bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white focus:ring-slate-500',
    danger:
      'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-md focus:ring-red-500',
    ghost:
      'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white focus:ring-slate-500',
  };

  const sizeClasses = {
    sm: 'py-2 px-3 text-xs min-h-[36px] gap-1.5',
    md: 'py-3 px-4 text-sm min-h-[48px] gap-2',
    lg: 'py-3.5 px-6 text-base min-h-[52px] gap-2.5',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
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

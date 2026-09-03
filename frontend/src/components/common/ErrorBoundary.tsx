/**
 * GRAM-X Production React Error Boundary
 * Prevents unhandled JavaScript runtime exceptions from crashing the entire application.
 * Provides user-friendly recovery actions without leaking secrets or sensitive stack traces.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { captureException } from '../../services/observability';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, 'ReactErrorBoundary', {
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The application encountered an unexpected issue. Your session data is protected.
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono break-words text-left">
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="w-full text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleReload}
                className="w-full text-xs"
              >
                <Home className="w-3.5 h-3.5 mr-1.5" /> Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

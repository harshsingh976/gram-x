import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ModalCard } from '../../components/ui/ModalCard';
import { AuthTabs } from '../../components/auth/AuthTabs';
import { AuthAlert } from '../../components/auth/AuthAlert';
import { AuthInput } from '../../components/auth/AuthInput';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import '../../styles/auth.css';

export const SignIn = () => {
  const navigate = useNavigate();
  const { login, quickLogin } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: Record<string, string> = {};
    if (!username.trim()) {
      errors.username = 'User ID or Email is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: 'citizen' | 'worker' | 'admin' | 'district') => {
    setErrorMessage(null);
    setFieldErrors({});
    setIsLoading(true);
    try {
      await quickLogin(demoRole);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to sign in as ${demoRole}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalCard
      title="GRAM-X"
      subtitle="National Rural Infrastructure & Governance Network"
      headerContent={<AuthTabs />}
    >
      {/* 1-Click Quick Demo Authority Credentials */}
      <div className="auth-quick-demo">
        <div className="auth-quick-title">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Demo Authority Access
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">1-Click Sign In</span>
        </div>
        <div className="auth-quick-grid">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDemo('citizen')}
            className="auth-quick-btn"
          >
            <div className="auth-quick-role">🇮🇳 {t('role.citizen')}</div>
            <div className="auth-quick-creds">citizen / password123</div>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDemo('worker')}
            className="auth-quick-btn"
          >
            <div className="auth-quick-role">🔧 {t('role.worker')}</div>
            <div className="auth-quick-creds">worker / password123</div>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDemo('admin')}
            className="auth-quick-btn"
          >
            <div className="auth-quick-role">🏛️ {t('role.admin')}</div>
            <div className="auth-quick-creds">admin / admin123</div>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickDemo('district')}
            className="auth-quick-btn"
          >
            <div className="auth-quick-role">🛡️ {t('role.district')}</div>
            <div className="auth-quick-creds">district / district123</div>
          </button>
        </div>
      </div>

      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}

      <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
        <AuthInput
          id="login-username"
          label="User ID or Email"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. citizen, worker, admin"
          error={fieldErrors.username}
          required
          disabled={isLoading}
        />

        <AuthInput
          id="login-password"
          label="Password"
          name="password"
          isPassword
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your account password"
          error={fieldErrors.password}
          required
          disabled={isLoading}
          extraLabelAction={
            <Link
              to="/reset-key"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          }
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <span>Keep session active</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          loadingText="Signing In to GRAM-X..."
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Sign In to GRAM-X
        </Button>
      </form>
    </ModalCard>
  );
};

export default SignIn;

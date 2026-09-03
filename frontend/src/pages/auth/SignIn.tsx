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
      errors.username = t('auth.error.user_id_required');
    }
    if (!password) {
      errors.password = t('auth.error.password_required');
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
      setErrorMessage(err.message || t('auth.error.invalid_credentials'));
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
      subtitle={t('auth.subtitle.sign_in')}
      headerContent={<AuthTabs />}
    >
      {/* 1-Click Quick Demo Authority Credentials */}
      <div className="auth-quick-demo">
        <div className="auth-quick-title">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t('auth.quick_demo_title')}
          </span>
          <span style={{ color: '#16a34a', fontWeight: 700 }}>{t('auth.quick_demo_1click')}</span>
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
          label={t('auth.field.user_id')}
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('auth.field.user_id_placeholder')}
          error={fieldErrors.username}
          required
          disabled={isLoading}
        />

        <AuthInput
          id="login-password"
          label={t('auth.field.password')}
          name="password"
          isPassword
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.field.password_placeholder')}
          error={fieldErrors.password}
          required
          disabled={isLoading}
          extraLabelAction={
            <Link
              to="/reset-key"
              style={{ fontSize: '0.75rem', color: '#155EEF', fontWeight: 600 }}
              className="hover:underline"
            >
              {t('auth.forgot_password')}
            </Link>
          }
        />

        <div className="flex items-center gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontSize: '0.82rem', color: '#475569' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t('auth.field.keep_session')}</span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          loadingText={t('auth.btn.signing_in')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          {t('auth.btn.sign_in')}
        </Button>
      </form>
    </ModalCard>
  );
};

export default SignIn;

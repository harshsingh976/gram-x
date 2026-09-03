import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { ModalCard } from '../../components/ui/ModalCard';
import { AuthTabs } from '../../components/auth/AuthTabs';
import { AuthAlert } from '../../components/auth/AuthAlert';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthSelect } from '../../components/auth/AuthSelect';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import '../../styles/auth.css';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'citizen' | 'worker'>('citizen');
  const [email, setEmail] = useState('');
  const [villageId, setVillageId] = useState<number>(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = t('auth.error.name_required');
    if (!username.trim()) errors.username = t('auth.error.username_required');
    if (username.trim().length < 3) errors.username = t('auth.error.username_min');
    if (!password) errors.password = t('auth.error.password_required');
    if (password.length < 6) errors.password = t('auth.error.password_min');
    if (password !== confirmPassword) errors.confirmPassword = t('auth.error.passwords_mismatch');

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t('auth.error.email_invalid');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        username: username.trim(),
        password,
        email: email.trim() || undefined,
        role,
        village_id: Number(villageId) || 1,
      });
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check the information provided.');
    } finally {
      setIsLoading(false);
    }
  };

  const accountTypeOptions = [
    { value: 'citizen', label: t('auth.account_type.citizen') },
    { value: 'worker',  label: t('auth.account_type.worker') },
  ];

  const panchayatOptions = [
    { value: 1, label: t('panchayat.gp01') },
    { value: 2, label: t('panchayat.gp02') },
    { value: 3, label: t('panchayat.gp03') },
    { value: 4, label: t('panchayat.gp04') },
    { value: 5, label: t('panchayat.gp05') },
  ];

  return (
    <ModalCard
      title={t('auth.register_title')}
      subtitle={t('auth.subtitle.register')}
      headerContent={<AuthTabs />}
    >
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}

      <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
        {/* Full Name — Full Width */}
        <div className="auth-col-full">
          <AuthInput
            id="reg-name"
            label={t('auth.field.name')}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('auth.field.name_placeholder')}
            error={fieldErrors.name}
            required
            disabled={isLoading}
          />
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="auth-grid-2col">
          <AuthInput
            id="reg-username"
            label={t('auth.field.username')}
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.field.username_placeholder')}
            error={fieldErrors.username}
            required
            disabled={isLoading}
          />

          <AuthSelect
            id="reg-role"
            label={t('auth.field.account_type')}
            value={role}
            onChange={(e) => setRole(e.target.value as 'citizen' | 'worker')}
            options={accountTypeOptions}
            required
            disabled={isLoading}
          />
        </div>

        <div className="auth-grid-2col">
          <AuthInput
            id="reg-email"
            label={t('auth.field.email')}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.field.email_placeholder')}
            error={fieldErrors.email}
            disabled={isLoading}
          />

          <AuthSelect
            id="reg-village"
            label={t('auth.field.panchayat')}
            value={villageId}
            onChange={(e) => setVillageId(Number(e.target.value))}
            options={panchayatOptions}
            required
            disabled={isLoading}
          />
        </div>

        {/* Passwords — Full Width */}
        <div className="auth-col-full">
          <AuthInput
            id="reg-password"
            label={t('auth.field.password')}
            name="password"
            isPassword
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.field.new_password_placeholder')}
            error={fieldErrors.password}
            required
            disabled={isLoading}
          />
        </div>

        <div className="auth-col-full">
          <AuthInput
            id="reg-confirm-password"
            label={t('auth.field.confirm_password')}
            name="confirmPassword"
            isPassword
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.field.confirm_password_placeholder')}
            error={fieldErrors.confirmPassword}
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          loadingText={t('auth.btn.registering')}
          rightIcon={<UserPlus className="w-4 h-4" />}
          className="mt-2"
        >
          {t('auth.btn.register')}
        </Button>
      </form>
    </ModalCard>
  );
};

export default Register;

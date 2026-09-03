import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { ModalCard } from '../../components/ui/ModalCard';
import { AuthTabs } from '../../components/auth/AuthTabs';
import { AuthAlert } from '../../components/auth/AuthAlert';
import { AuthInput } from '../../components/auth/AuthInput';
import { Button } from '../../components/ui/Button';
import * as authService from '../../services/authService';
import { useLanguage } from '../../i18n';
import '../../styles/auth.css';

export const ResetKey = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetTicket, setResetTicket] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setFieldErrors({ identifier: t('auth.error.identifier_required') });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authService.forgotPassword(identifier.trim());
      setSuccessMessage(t('auth.success.otp_sent'));
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset code. Please verify the identifier.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setFieldErrors({ otpCode: t('auth.error.otp_required') });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authService.verifyResetOtp(identifier.trim(), otpCode.trim());
      setResetTicket(data.reset_ticket);
      setSuccessMessage(t('auth.success.otp_verified'));
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFieldErrors({ newPassword: t('auth.error.password_min') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('auth.error.passwords_mismatch') });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authService.resetPasswordWithToken({
        username_or_email: identifier.trim(),
        reset_ticket: resetTicket,
        new_password: newPassword,
      });
      setSuccessMessage(t('auth.success.password_reset'));
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalCard
      title={t('auth.reset_key_title')}
      subtitle={t('auth.subtitle.reset')}
      headerContent={<AuthTabs />}
    >
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert type="success">{successMessage}</AuthAlert>}

      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="auth-form" noValidate>
          <AuthInput
            id="forgot-id"
            label={t('auth.field.user_id_or_email')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('auth.field.user_id_placeholder')}
            error={fieldErrors.identifier}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText={t('auth.btn.sending_code')}
            rightIcon={<KeyRound className="w-4 h-4" />}
            className="mt-2"
          >
            {t('auth.btn.send_code')}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="auth-form" noValidate>
          <AuthInput
            id="forgot-otp"
            label={t('auth.field.otp')}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder={t('auth.field.otp_placeholder')}
            error={fieldErrors.otpCode}
            required
            disabled={isLoading}
            maxLength={8}
            className="text-center tracking-widest text-lg font-mono font-bold"
          />

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setStep(1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {t('auth.btn.back')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText={t('auth.btn.verifying')}
              rightIcon={<ShieldCheck className="w-4 h-4" />}
            >
              {t('auth.btn.verify_code')}
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3Submit} className="auth-form" noValidate>
          <AuthInput
            id="new-pass"
            label={t('auth.field.new_password')}
            isPassword
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('auth.field.new_password_placeholder')}
            error={fieldErrors.newPassword}
            required
            disabled={isLoading}
          />

          <AuthInput
            id="confirm-new-pass"
            label={t('auth.field.confirm_password')}
            isPassword
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.field.confirm_password_placeholder')}
            error={fieldErrors.confirmPassword}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText={t('auth.btn.saving_password')}
            rightIcon={<RefreshCw className="w-4 h-4" />}
            className="mt-2"
          >
            {t('auth.btn.save_password')}
          </Button>
        </form>
      )}
    </ModalCard>
  );
};

export default ResetKey;

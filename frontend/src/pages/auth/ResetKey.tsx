import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { ModalCard } from '../../components/ui/ModalCard';
import { AuthTabs } from '../../components/auth/AuthTabs';
import { AuthAlert } from '../../components/auth/AuthAlert';
import { AuthInput } from '../../components/auth/AuthInput';
import { Button } from '../../components/ui/Button';
import * as authService from '../../services/authService';
import '../../styles/auth.css';

export const ResetKey = () => {
  const navigate = useNavigate();

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
      setFieldErrors({ identifier: 'Please enter your registered username or email' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authService.forgotPassword(identifier.trim());
      setSuccessMessage('Verification code dispatched to your registered email/mobile.');
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
      setFieldErrors({ otpCode: 'Please enter the verification OTP code' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authService.verifyResetOtp(identifier.trim(), otpCode.trim());
      setResetTicket(data.reset_ticket);
      setSuccessMessage('Verification confirmed! Please set your new password.');
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
      setFieldErrors({ newPassword: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
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
      setSuccessMessage('Password reset successfully! Redirecting to Sign In...');
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
      title="Reset Security Key"
      subtitle="Recover access using your registered credentials & OTP"
      headerContent={<AuthTabs />}
    >
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert type="success">{successMessage}</AuthAlert>}

      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="auth-form" noValidate>
          <AuthInput
            id="forgot-id"
            label="Registered User ID or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. citizen, admin@gramx.gov.in"
            error={fieldErrors.identifier}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Dispatching OTP..."
            rightIcon={<KeyRound className="w-4 h-4" />}
            className="mt-2"
          >
            Send Verification Code
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="auth-form" noValidate>
          <AuthInput
            id="forgot-otp"
            label="Enter 6-Digit OTP Code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="e.g. 123456"
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
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText="Verifying..."
              rightIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify Code
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3Submit} className="auth-form" noValidate>
          <AuthInput
            id="new-pass"
            label="New Password"
            isPassword
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={fieldErrors.newPassword}
            required
            disabled={isLoading}
          />

          <AuthInput
            id="confirm-new-pass"
            label="Confirm New Password"
            isPassword
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            error={fieldErrors.confirmPassword}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Updating Password..."
            rightIcon={<RefreshCw className="w-4 h-4" />}
            className="mt-2"
          >
            Save New Password
          </Button>
        </form>
      )}
    </ModalCard>
  );
};

export default ResetKey;

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
import '../../styles/auth.css';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

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
    if (!name.trim()) errors.name = 'Full name is required';
    if (!username.trim()) errors.username = 'Username is required';
    if (username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
    if (!password) errors.password = 'Password is required';
    if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
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
    { value: 'citizen', label: 'Citizen (Grievance Filing & Tracking)' },
    { value: 'worker', label: 'Field Worker (Task Execution & SLA)' },
  ];

  const panchayatOptions = [
    { value: 1, label: 'Piparli (GP-01) — Main Village' },
    { value: 2, label: 'Kalyanpura (GP-02)' },
    { value: 3, label: 'Sundarpur (GP-03)' },
    { value: 4, label: 'Bhimnagar (GP-04)' },
    { value: 5, label: 'Devgarh (GP-05)' },
  ];

  return (
    <ModalCard
      title="Create Account"
      subtitle="Register for National Rural Governance & Citizen Services"
      headerContent={<AuthTabs />}
    >
      {errorMessage && <AuthAlert type="error">{errorMessage}</AuthAlert>}

      <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
        {/* Full Name — Full Width */}
        <div className="auth-col-full">
          <AuthInput
            id="reg-name"
            label="Full Name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            error={fieldErrors.name}
            required
            disabled={isLoading}
          />
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="auth-grid-2col">
          <AuthInput
            id="reg-username"
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ramesh_piparli"
            error={fieldErrors.username}
            required
            disabled={isLoading}
          />

          <AuthSelect
            id="reg-role"
            label="Account Type"
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
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ramesh@example.com"
            error={fieldErrors.email}
            disabled={isLoading}
          />

          <AuthSelect
            id="reg-village"
            label="Gram Panchayat"
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
            label="Password"
            name="password"
            isPassword
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={fieldErrors.password}
            required
            disabled={isLoading}
          />
        </div>

        <div className="auth-col-full">
          <AuthInput
            id="reg-confirm-password"
            label="Confirm Password"
            name="confirmPassword"
            isPassword
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
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
          loadingText="Registering Account..."
          rightIcon={<UserPlus className="w-4 h-4" />}
          className="mt-2"
        >
          Create GRAM-X Account
        </Button>
      </form>
    </ModalCard>
  );
};

export default Register;

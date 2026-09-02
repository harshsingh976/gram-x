import React, { useState } from 'react';
import { 
  Lock, User, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, 
  Building2, Users, Wrench, AlertCircle, CheckCircle2, RefreshCw, 
  HelpCircle, KeyRound, Globe, PhoneCall, Sparkles, Landmark
} from 'lucide-react';
import * as api from '../api';
import type { UserRole } from '../types';
import { useLanguage } from '../i18n';

export interface GovAuthPortalProps {
  onLoginSuccess: (token: string, role: UserRole, username: string, name: string) => void;
  onBackToHome?: () => void;
  initialRole?: UserRole;
}

export default function GovAuthPortal({ 
  onLoginSuccess, 
  onBackToHome,
  initialRole = 'citizen' 
}: GovAuthPortalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'citizen' | 'worker'>('citizen');
  const [regVillageId, setRegVillageId] = useState<number>(1);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotTicket, setForgotTicket] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleTabChange = (tab: 'login' | 'register' | 'forgot') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
      const data = await api.login(username.trim(), password);
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
      }

      const me = await api.getMe();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('role', me.role);
        localStorage.setItem('username', me.username);
        localStorage.setItem('fullName', me.name);
      }

      setSuccessMessage(`Welcome back, ${me.name || me.username}!`);
      setTimeout(() => {
        onLoginSuccess(data.access_token, me.role as UserRole, me.username, me.name);
      }, 350);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('connection') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setErrorMessage('Unable to connect to the authentication server. Please check your internet connection.');
      } else if (msg.includes('401') || msg.includes('credentials') || msg.includes('Incorrect') || msg.includes('password')) {
        setErrorMessage('Incorrect User ID or password. Please verify your credentials.');
      } else {
        setErrorMessage(msg || 'Authentication failed. Please verify your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setIsLoading(true);
    try {
      const data = await api.login(user, pass);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
      }
      const me = await api.getMe();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('role', me.role);
        localStorage.setItem('username', me.username);
        localStorage.setItem('fullName', me.name);
      }
      setSuccessMessage(`Logged in as ${me.name || me.username} (${me.role.toUpperCase()})`);
      setTimeout(() => {
        onLoginSuccess(data.access_token, me.role as UserRole, me.username, me.name);
      }, 250);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed. Please verify the credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.regName = 'Full name is required';
    if (!regUsername.trim()) errors.regUsername = 'Username is required';
    if (regUsername.trim().length < 3) errors.regUsername = 'Username must be at least 3 characters';
    if (!regPassword) errors.regPassword = 'Password is required';
    if (regPassword.length < 6) errors.regPassword = 'Password must be at least 6 characters';
    if (regPassword !== regConfirmPassword) errors.regConfirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      await api.signup({
        username: regUsername.trim(),
        password: regPassword,
        name: regName.trim(),
        email: regEmail.trim() || undefined,
        role: regRole,
        village_id: Number(regVillageId) || 1
      });

      setSuccessMessage('Account created successfully! Logging you in...');
      
      const data = await api.login(regUsername.trim(), regPassword);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
      }
      const me = await api.getMe();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('role', me.role);
        localStorage.setItem('username', me.username);
        localStorage.setItem('fullName', me.name);
      }
      setTimeout(() => {
        onLoginSuccess(data.access_token, me.role as UserRole, me.username, me.name);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check the information provided.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setFieldErrors({ forgotIdentifier: 'Enter your registered username or email' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.forgotPassword(forgotIdentifier.trim());
      setSuccessMessage('Verification code dispatched to your registered email/mobile.');
      setForgotStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length < 4) {
      setFieldErrors({ forgotOtp: 'Enter the valid verification OTP code' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.verifyResetOtp(forgotIdentifier.trim(), forgotOtp.trim());
      setForgotTicket(data.reset_ticket);
      setSuccessMessage('OTP verified successfully. Please enter your new password.');
      setForgotStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFieldErrors({ newPassword: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFieldErrors({ confirmNewPassword: 'Passwords do not match' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.resetPasswordWithToken({
        username_or_email: forgotIdentifier.trim(),
        reset_ticket: forgotTicket,
        new_password: newPassword
      });
      setSuccessMessage('Password updated successfully! Please log in with your new password.');
      setTimeout(() => {
        setActiveTab('login');
        setUsername(forgotIdentifier.trim());
        setPassword('');
        setForgotStep(1);
        setForgotIdentifier('');
        setForgotOtp('');
        setForgotTicket('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans antialiased">
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] sm:text-xs">
            Ministry of Rural Development • Digital Governance
          </span>
        </div>
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium min-h-[36px] flex items-center px-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ← Back to Home
          </button>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <div className="w-full max-w-[480px] bg-slate-950/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-5 pt-6 pb-4 sm:px-8 sm:pt-8 text-center border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-transparent">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-950 border border-blue-800/60 text-blue-400 mb-3 shadow-inner">
              <Landmark className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              GRAM-X
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              National Rural Infrastructure & Governance Network
            </p>

            <div 
              role="tablist"
              aria-label="Authentication Options"
              className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 mt-5"
            >
              <button
                type="button"
                role="tab"
                id="tab-login"
                aria-selected={activeTab === 'login'}
                aria-controls="panel-login"
                onClick={() => handleTabChange('login')}
                className={`py-2.5 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                id="tab-register"
                aria-selected={activeTab === 'register'}
                aria-controls="panel-register"
                onClick={() => handleTabChange('register')}
                className={`py-2.5 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                role="tab"
                id="tab-forgot"
                aria-selected={activeTab === 'forgot'}
                aria-controls="panel-forgot"
                onClick={() => handleTabChange('forgot')}
                className={`py-2.5 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center ${
                  activeTab === 'forgot'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Reset Key
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {errorMessage && (
              <div 
                role="alert"
                aria-live="polite"
                className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div 
                role="alert"
                aria-live="polite"
                className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{successMessage}</div>
              </div>
            )}

            {activeTab === 'login' && (
              <>
                {/* 1-Click Quick Demo Credentials Panel */}
                <div className="mb-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Quick Demo Authority Access</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">1-Click Sign In</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin('citizen', 'password123')}
                      className="p-2 text-left bg-slate-950/80 hover:bg-blue-950/60 border border-slate-800/80 hover:border-blue-700/60 rounded-lg transition-all"
                    >
                      <div className="text-xs font-bold text-slate-200">🇮🇳 {t('role.citizen')}</div>
                      <div className="text-[10px] text-slate-400">citizen / password123</div>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin('worker', 'password123')}
                      className="p-2 text-left bg-slate-950/80 hover:bg-emerald-950/60 border border-slate-800/80 hover:border-emerald-700/60 rounded-lg transition-all"
                    >
                      <div className="text-xs font-bold text-slate-200">🔧 {t('role.worker')}</div>
                      <div className="text-[10px] text-slate-400">worker / password123</div>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin('admin', 'admin123')}
                      className="p-2 text-left bg-slate-950/80 hover:bg-indigo-950/60 border border-slate-800/80 hover:border-indigo-700/60 rounded-lg transition-all"
                    >
                      <div className="text-xs font-bold text-slate-200">🏛️ {t('role.admin')}</div>
                      <div className="text-[10px] text-slate-400">admin / admin123</div>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin('district', 'district123')}
                      className="p-2 text-left bg-slate-950/80 hover:bg-purple-950/60 border border-slate-800/80 hover:border-purple-700/60 rounded-lg transition-all"
                    >
                      <div className="text-xs font-bold text-slate-200">🛡️ {t('role.district')}</div>
                      <div className="text-[10px] text-slate-400">district / district123</div>
                    </button>
                  </div>
                </div>

                <form 
                  id="panel-login"
                  role="tabpanel"
                  aria-labelledby="tab-login"
                  onSubmit={handleLoginSubmit} 
                  className="space-y-4"
                >
                <div>
                  <label htmlFor="login-username" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                    User ID or Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. citizen, worker, admin"
                      disabled={isLoading}
                      className={`w-full bg-slate-900/90 border ${
                        fieldErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'
                      } rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]`}
                    />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                  {fieldErrors.username && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.username}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="text-xs sm:text-sm font-semibold text-slate-300">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      disabled={isLoading}
                      className={`w-full bg-slate-900/90 border ${
                        fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'
                      } rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
                    />
                    <span className="text-xs sm:text-sm text-slate-400">Keep session active</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-blue-900/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to GRAM-X</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
              </>
            )}

            {activeTab === 'register' && (
              <form 
                id="panel-register"
                role="tabpanel"
                aria-labelledby="tab-register"
                onSubmit={handleRegisterSubmit} 
                className="space-y-4"
              >
                <div>
                  <label htmlFor="reg-name" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    disabled={isLoading}
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                  />
                  {fieldErrors.regName && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.regName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-username" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                      Username <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      autoComplete="username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. ramesh_piparli"
                      disabled={isLoading}
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                    />
                    {fieldErrors.regUsername && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.regUsername}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-role" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                      Account Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="reg-role"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as 'citizen' | 'worker')}
                      disabled={isLoading}
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-3 py-3 text-slate-100 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                    >
                      <option value="citizen">Citizen (Grievance Filing)</option>
                      <option value="worker">Field Worker (Repairs & SLA)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-email" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ramesh@gramx.gov.in"
                      disabled={isLoading}
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-village" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                      Gram Panchayat <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="reg-village"
                      value={regVillageId}
                      onChange={(e) => setRegVillageId(Number(e.target.value))}
                      disabled={isLoading}
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-3 py-3 text-slate-100 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                    >
                      <option value={1}>Piparli (Raisen)</option>
                      <option value={2}>Ramnagar (Raisen)</option>
                      <option value={3}>Haripura (Raisen)</option>
                      <option value={4}>Madanpur (Raisen)</option>
                      <option value={5}>Khajuraho Rural (Chhatarpur)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={isLoading}
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                    />
                    <button
                      type="button"
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.regPassword && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.regPassword}</p>}
                </div>

                <div>
                  <label htmlFor="reg-confirm-password" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={isLoading}
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                  />
                  {fieldErrors.regConfirmPassword && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.regConfirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] disabled:opacity-60 mt-4"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Complete Registration & Sign In"}
                </button>
              </form>
            )}

            {activeTab === 'forgot' && (
              <div 
                id="panel-forgot"
                role="tabpanel"
                aria-labelledby="tab-forgot"
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-semibold text-slate-400">
                  <span className={forgotStep === 1 ? "text-blue-400" : ""}>1. Request OTP</span>
                  <span>→</span>
                  <span className={forgotStep === 2 ? "text-blue-400" : ""}>2. Verify OTP</span>
                  <span>→</span>
                  <span className={forgotStep === 3 ? "text-blue-400" : ""}>3. New Password</span>
                </div>

                {forgotStep === 1 && (
                  <form onSubmit={handleForgotStep1} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-identifier" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                        Username or Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="forgot-identifier"
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. citizen or citizen@gramx.gov.in"
                        disabled={isLoading}
                        className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                      />
                      {fieldErrors.forgotIdentifier && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.forgotIdentifier}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] disabled:opacity-60"
                    >
                      {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
                    </button>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleForgotStep2} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-otp" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                        Enter 6-Digit OTP Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="forgot-otp"
                        type="text"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        maxLength={8}
                        disabled={isLoading}
                        className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono font-bold text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                      />
                      {fieldErrors.forgotOtp && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.forgotOtp}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-3 rounded-xl transition-all text-sm min-h-[48px]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm min-h-[48px] disabled:opacity-60"
                      >
                        {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Verify Code"}
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 3 && (
                  <form onSubmit={handleForgotStep3} className="space-y-4">
                    <div>
                      <label htmlFor="new-password" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                        New Password <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          disabled={isLoading}
                          className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                        />
                        <button
                          type="button"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.newPassword && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.newPassword}</p>}
                    </div>

                    <div>
                      <label htmlFor="confirm-new-password" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                        Confirm New Password <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="confirm-new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        disabled={isLoading}
                        className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 min-h-[48px]"
                      />
                      {fieldErrors.confirmNewPassword && <p className="text-red-400 text-xs mt-1 font-medium">{fieldErrors.confirmNewPassword}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] disabled:opacity-60"
                    >
                      {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Save New Password"}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-500">
              <p>National Panchayat Citizen Helpline: <span className="text-slate-300 font-semibold">1800-180-1555</span> (Toll-Free)</p>
              <p className="mt-1 text-[11px] text-slate-600">Protected by 256-bit cryptographic session signatures & role-based access control.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-slate-950 border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500">
        <p>© 2026 GRAM-X Rural Infrastructure & Public Trust Network. Government of India.</p>
      </footer>
    </main>
  );
}

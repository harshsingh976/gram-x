import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, 
  User, CheckCircle2, XCircle, ArrowLeft, Building, Users, Wrench, Shield
} from 'lucide-react';
import * as api from '../api';

export interface BlackRockIndiaAuthProps {
  onLoginSuccess?: (token: string, role: string, username: string, name: string) => void;
  onBackToHome?: () => void;
  defaultRole?: string;
}

export default function BlackRockIndiaAuth({ 
  onLoginSuccess, 
  onBackToHome,
  defaultRole = 'citizen'
}: BlackRockIndiaAuthProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    villageId: 1
  });

  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotUsernameOrEmail, setForgotUsernameOrEmail] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotResetTicket, setForgotResetTicket] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // Role Tab Switching for Quick Citizen/Worker Login Pre-population
  const handleRoleTabClick = (roleKey: string) => {
    setSelectedRoleTab(roleKey);
    setErrorMsg(null);
    setRegisterData(prev => ({ ...prev, role: roleKey }));
    if (view === 'login') {
      if (roleKey === 'citizen') {
        setLoginUsername('citizen');
        setLoginPassword('citizen123');
      } else if (roleKey === 'worker') {
        setLoginUsername('worker');
        setLoginPassword('worker123');
      } else if (roleKey === 'admin') {
        setLoginUsername('admin');
        setLoginPassword('admin123');
      } else if (roleKey === 'district') {
        setLoginUsername('district');
        setLoginPassword('district123');
      }
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await api.login(loginUsername.trim(), loginPassword);
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
      
      const me = await api.getMe();
      localStorage.setItem('role', me.role);
      localStorage.setItem('username', me.username);
      localStorage.setItem('fullName', me.name);
      
      if (onLoginSuccess) {
        onLoginSuccess(data.access_token, me.role, me.username, me.name);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect username or password. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (registerData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.registerUser({
        username: registerData.username.trim(),
        email: registerData.email?.trim() || undefined,
        name: registerData.name.trim(),
        password: registerData.password,
        role: registerData.role,
        village_id: Number(registerData.villageId)
      });

      // Automatically login after successful registration
      try {
        const data = await api.login(registerData.username.trim(), registerData.password);
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
        const me = await api.getMe();
        localStorage.setItem('role', me.role);
        localStorage.setItem('username', me.username);
        localStorage.setItem('fullName', me.name);
        if (onLoginSuccess) {
          onLoginSuccess(data.access_token, me.role, me.username, me.name);
          return;
        }
      } catch (loginErr) {
        setSuccessMsg('Account registered successfully! You can now sign in.');
        setView('login');
        setLoginUsername(registerData.username);
        setLoginPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 3-STEP SECURE PASSWORD RESET HANDLERS ────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.forgotPassword(forgotUsernameOrEmail.trim());
      setSuccessMsg(`If an account exists, a 6-digit verification code has been dispatched to your email.`);
      setForgotStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch verification OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.verifyResetOtp(forgotUsernameOrEmail.trim(), forgotOtpCode.trim());
      setForgotResetTicket(res.reset_ticket);
      setSuccessMsg('Verification code confirmed. Please enter your new password.');
      setForgotStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPassword !== forgotConfirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (forgotPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.resetPasswordWithToken({
        username_or_email: forgotUsernameOrEmail.trim(),
        reset_ticket: forgotResetTicket,
        new_password: forgotPassword
      });
      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setView('login');
      setLoginUsername(forgotUsernameOrEmail);
      setLoginPassword('');
      setForgotStep(1);
      setForgotOtpCode('');
      setForgotResetTicket('');
      setForgotPassword('');
      setForgotConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerPasswordsMatch = registerData.password && registerData.confirmPassword && registerData.password === registerData.confirmPassword;
  const registerPasswordMismatch = registerData.confirmPassword.length > 0 && registerData.password !== registerData.confirmPassword;

  const forgotPasswordsMatch = forgotPassword && forgotConfirmPassword && forgotPassword === forgotConfirmPassword;
  const forgotPasswordMismatch = forgotConfirmPassword.length > 0 && forgotPassword !== forgotConfirmPassword;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-[#f8fafc] font-sans overflow-x-hidden overflow-y-auto">
      
      {/* 50% LEFT SIDE PANEL - Desktop Brand & Trust Backdrop (Collapsed into clean header on Mobile) */}
      <div 
        className="w-full md:w-[48%] lg:w-[52%] hidden md:flex flex-col justify-between p-8 lg:p-14 relative text-white bg-cover bg-center shrink-0"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?q=80&w=1200')`,
        }}
      >
        {/* Dark Navy Wash Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/80 pointer-events-none" 
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3.5 mb-10">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-xl border border-white/20">
                <Building className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">GRAM-X</h1>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Grassroots Resource Network</p>
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-light leading-tight mb-4 max-w-lg">
              Digital infrastructure <br />
              <span className="font-semibold text-sky-400">intelligence for grassroots governance.</span>
            </h2>
            <p className="text-zinc-300 text-xs lg:text-sm leading-relaxed max-w-sm mb-8">
              Designed for local Panchayat operations, field technician telemetry, and transparent citizen grievance resolution.
            </p>

            {/* Role Portals Indicator */}
            <div className="space-y-2.5 text-xs font-semibold text-zinc-300">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Citizen Service Registry
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white" /> Field Worker Operations
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Panchayat Admin Command Center
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400" /> District Collector Oversight
              </div>
            </div>
          </div>

          {/* Infrastructure status */}
          <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-bold tracking-wider uppercase mt-8">
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-400" /> 256-Bit SHA Audit</div>
            <div className="h-3 w-px bg-zinc-700" />
            <div>Piparli Panchayat Live</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL - Mobile-First Responsive Government Login Container */}
      <div className="flex-1 flex flex-col justify-between bg-white relative min-w-0 min-h-[100dvh] overflow-y-auto">
        
        {/* Tricolor identity strip on top */}
        <div className="flex h-1.5 w-full shrink-0">
          <div className="bg-[#FF9933] flex-1" />
          <div className="bg-white flex-1" />
          <div className="bg-[#138808] flex-1" />
        </div>

        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
          {onBackToHome ? (
            <button 
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold hover:text-slate-900 transition-colors min-h-[44px] px-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 tracking-wider">GRAM-X</span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold uppercase">Gov.in</span>
          </div>
        </div>

        {/* Main Scrollable Form Area */}
        <div className="w-full max-w-md mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-center">
          
          {/* Role Switcher Pills (Citizen / Worker / Admin / Collector) */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Select Governance Portal Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleTabClick('citizen')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[40px] ${
                  selectedRoleTab === 'citizen' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabClick('worker')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[40px] ${
                  selectedRoleTab === 'worker' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Worker</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabClick('admin')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[40px] ${
                  selectedRoleTab === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabClick('district')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[40px] ${
                  selectedRoleTab === 'district' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">Collector</span>
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs text-red-700 flex items-start gap-2.5 animate-fade-in" style={{ overflowWrap: 'anywhere' }}>
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> 
              <span className="flex-1 leading-relaxed">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-xs text-emerald-700 flex items-start gap-2.5 animate-fade-in" style={{ overflowWrap: 'anywhere' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> 
              <span className="flex-1 leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">
                  {selectedRoleTab.toUpperCase()} PORTAL
                </h3>
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">Secure Sign In</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sign in to your authorized Gram Panchayat governance account.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Username / Mobile / User ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      autoComplete="username"
                      placeholder="e.g. citizen, worker, admin" 
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 pl-10 focus:border-slate-400 focus:bg-white transition-all font-semibold min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => { setErrorMsg(null); setView('forgot'); }} 
                      className="text-xs text-sky-600 hover:underline font-bold min-h-[36px] flex items-center"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      autoComplete="current-password"
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 pl-10 pr-11 focus:border-slate-400 focus:bg-white transition-all min-h-[44px]"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] justify-center"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-xl mt-6 flex items-center justify-center gap-2 hover:bg-[#142e52] active:scale-[0.99] transition-all disabled:opacity-50 min-h-[48px] shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Sign In to Workspace <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-slate-500 font-semibold border-t border-slate-100 pt-5 flex items-center justify-center gap-1.5 flex-wrap">
                <span>Don't have an account?</span>
                <button 
                  type="button" 
                  onClick={() => { setErrorMsg(null); setView('register'); }} 
                  className="text-sky-600 hover:underline font-bold min-h-[36px] flex items-center"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <div className="space-y-5">
              <div>
                <button 
                  type="button" 
                  onClick={() => { setErrorMsg(null); setView('login'); }} 
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-2 transition-all font-bold min-h-[36px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Account</h4>
                <p className="text-xs text-slate-500 mt-0.5">Register for Citizen or Field Worker service access.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Full Legal Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder="e.g. Rajesh Kumar" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[44px]" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Username / ID</label>
                    <input 
                      type="text" 
                      name="username" 
                      required 
                      value={registerData.username}
                      onChange={handleRegisterChange}
                      placeholder="e.g. rajesh" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[44px]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email (Optional)</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="user@example.com" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[44px]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Role</label>
                    <select 
                      name="role"
                      value={registerData.role}
                      onChange={handleRegisterChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 font-semibold focus:border-slate-400 min-h-[44px]"
                    >
                      <option value="citizen">Citizen Portal</option>
                      <option value="worker">Field Worker / Tech</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Panchayat Village</label>
                    <select 
                      name="villageId"
                      value={registerData.villageId}
                      onChange={handleRegisterChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 font-semibold focus:border-slate-400 min-h-[44px]"
                    >
                      <option value="1">Piparli Panchayat</option>
                      <option value="2">Borpada Panchayat</option>
                      <option value="3">Kaundhiyar Panchayat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      required 
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[44px]" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex justify-between">
                      Confirm
                      {registerPasswordsMatch && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {registerPasswordMismatch && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    </label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      required 
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="••••••••" 
                      className={`w-full bg-slate-50 border text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:bg-white min-h-[44px] ${registerPasswordMismatch ? 'border-red-400' : registerPasswordsMatch ? 'border-emerald-400' : 'border-slate-200'}`} 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || registerPasswordMismatch} 
                  className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-xl mt-4 hover:bg-[#142e52] transition-all disabled:opacity-50 min-h-[48px]"
                >
                  {isSubmitting ? 'Registering...' : 'Register Account'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-5">
              <div>
                <button 
                  type="button" 
                  onClick={() => { setErrorMsg(null); setSuccessMsg(null); setView('login'); setForgotStep(1); }} 
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-2 transition-all font-bold min-h-[36px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h4>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                    Step {forgotStep} of 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {forgotStep === 1 && "Enter your username or email to receive a secure OTP code."}
                  {forgotStep === 2 && `Enter the 6-digit OTP code sent to your registered email.`}
                  {forgotStep === 3 && "Create a new strong password for your governance account."}
                </p>
              </div>

              {/* STEP 1: REQUEST OTP */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Username or Email</label>
                    <input 
                      type="text" 
                      required 
                      value={forgotUsernameOrEmail}
                      onChange={(e) => setForgotUsernameOrEmail(e.target.value)}
                      placeholder="e.g. citizen, worker, or user@example.gov.in" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[44px]" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !forgotUsernameOrEmail.trim()} 
                    className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-xl mt-4 hover:bg-[#142e52] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {isSubmitting ? 'Dispatching OTP...' : 'Send Verification OTP'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">6-Digit Verification Code (OTP)</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={8}
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value.trim())}
                      placeholder="e.g. 849201" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-xl font-bold tracking-widest text-center rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[48px]" 
                    />
                    <p className="text-[11px] text-slate-400 text-center mt-1">Code expires in 15 minutes</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="w-1/3 bg-slate-100 text-slate-700 font-bold text-sm py-3.5 rounded-xl hover:bg-slate-200 transition-all min-h-[48px]"
                    >
                      Resend
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || forgotOtpCode.length < 6} 
                      className="w-2/3 bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#142e52] transition-all disabled:opacity-50 min-h-[48px]"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SET NEW PASSWORD */}
              {forgotStep === 3 && (
                <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:border-slate-400 focus:bg-white min-h-[44px]" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex justify-between">
                        Confirm 
                        {forgotPasswordsMatch && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {forgotPasswordMismatch && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      </label>
                      <input 
                        type="password" 
                        required 
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="••••••••" 
                        className={`w-full bg-slate-50 border text-slate-950 text-base sm:text-sm rounded-xl outline-none block p-3 focus:bg-white min-h-[44px] ${forgotPasswordMismatch ? 'border-red-400' : forgotPasswordsMatch ? 'border-emerald-400' : 'border-slate-200'}`} 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || forgotPasswordMismatch || !forgotPassword} 
                    className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-xl mt-4 hover:bg-[#142e52] transition-all disabled:opacity-50 min-h-[48px]"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="p-4 sm:p-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 shrink-0">
          Secure Government Operations • Multi-Role RBAC • SHA-256 Protected Session
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, 
  User, CheckCircle2, XCircle, ArrowLeft, Building
} from 'lucide-react';
import * as api from '../api';

export default function BlackRockIndiaAuth({ 
  onLoginSuccess, 
  onBackToHome 
}: { 
  onLoginSuccess?: (token: string, role: string, username: string, name: string) => void;
  onBackToHome?: () => void;
}) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
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
    role: 'citizen',
    villageId: 1
  });

  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotUsernameOrEmail, setForgotUsernameOrEmail] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotResetTicket, setForgotResetTicket] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await api.login(loginUsername, loginPassword);
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
      setErrorMsg(err.message || 'Incorrect username or password');
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
        username: registerData.username,
        email: registerData.email || undefined,
        name: registerData.name,
        password: registerData.password,
        role: registerData.role,
        village_id: Number(registerData.villageId)
      });

      // Automatically login after successful registration
      try {
        const data = await api.login(registerData.username, registerData.password);
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
        setSuccessMsg('Account registered successfully! You can now log in.');
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
      await api.forgotPassword(forgotUsernameOrEmail);
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
      const res = await api.verifyResetOtp(forgotUsernameOrEmail, forgotOtpCode);
      setForgotResetTicket(res.reset_ticket);
      setSuccessMsg('Verification code confirmed. Please set your new secure password.');
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
        username_or_email: forgotUsernameOrEmail,
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
    <div className="min-h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* 55% LEFT SIDE PANEL - Documentary Image with Navy Overlay */}
      <div 
        className="w-[55%] hidden md:flex flex-col justify-between p-16 relative text-white bg-cover bg-center"
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
            <div className="flex items-center gap-3.5 mb-16">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-xl border border-white/20">
                <Building className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">GRAM-X</h1>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Grassroots Resource Network</p>
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-light leading-tight mb-6 max-w-lg">
              Digital infrastructure <br />
              <span className="font-semibold text-sky-400">intelligence for grassroots governance.</span>
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-sm mb-12">
              Designed for local Panchayat operations, real-time asset telemetry, and transparent citizen service delivery workflows.
            </p>

            {/* Restrained Trust Indicators */}
            <div className="space-y-3.5 text-sm font-semibold text-zinc-300">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400" /> Citizen Services
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white" /> Field Operations
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> Panchayat Administration
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sky-400" /> District Oversight
              </div>
            </div>
          </div>

          {/* Infrastructure status */}
          <div className="flex items-center gap-6 text-xs text-zinc-400 font-bold tracking-wider uppercase">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4.5 h-4.5 text-teal-400" /> NIC Standard</div>
            <div className="h-4 w-px bg-zinc-700" />
            <div>Piparli Panchayat Active State</div>
          </div>
        </div>
      </div>

      {/* 45% RIGHT SIDE PANEL - White Government Workspaces */}
      <div className="flex-1 flex flex-col justify-between bg-white relative">
        
        {/* Tricour identity strip on top */}
        <div className="flex h-1.5 w-full">
          <div className="bg-[#FF9933] flex-1" />
          <div className="bg-white flex-1" />
          <div className="bg-[#138808] flex-1" />
        </div>

        {/* Back navigation */}
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="absolute top-8 left-10 flex items-center gap-2 text-xs text-slate-500 font-bold hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
        )}

        {/* Form area */}
        <div className="max-w-[360px] w-full mx-auto my-auto p-6">
          
          {/* Status Indicators */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 flex items-center gap-2">
              <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" /> {successMsg}
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-black text-slate-500 tracking-widest uppercase mb-1">GRAM-X</h3>
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Secure Access</h4>
                <p className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-wide">Welcome back</p>
                <p className="text-sm text-slate-500 mt-1">Sign in to your authorized governance workspace.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mobile / Email / User ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. admin, citizen, worker" 
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 pl-10 focus:border-slate-400 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setErrorMsg(null); setView('forgot'); }} 
                      className="text-xs text-sky-600 hover:underline font-bold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 pl-10 pr-10 focus:border-slate-400 focus:bg-white transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-lg mt-8 flex items-center justify-center gap-2 hover:bg-[#142e52] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight className="w-4.5 h-4.5" /></>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-slate-500 font-semibold border-t border-slate-100 pt-6">
                Don't have an account? <button type="button" onClick={() => { setErrorMsg(null); setView('register'); }} className="text-sky-600 hover:underline font-bold ml-1">Create Account</button>
              </div>
            </div>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <div className="space-y-6">
              <div>
                <button type="button" onClick={() => { setErrorMsg(null); setView('login'); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4 transition-all font-bold">
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </button>
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h4>
                <p className="text-sm text-slate-500 mt-1">Register to file and track service requests.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Full Legal Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder="e.g. Rajesh Kumar" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Username / ID</label>
                    <input 
                      type="text" 
                      name="username" 
                      required 
                      value={registerData.username}
                      onChange={handleRegisterChange}
                      placeholder="e.g. rajesh" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Email Address (Optional)</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="e.g. user@gramx.gov.in" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Role</label>
                    <select 
                      name="role"
                      value={registerData.role}
                      onChange={handleRegisterChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 font-semibold appearance-none focus:border-slate-400"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="worker">Worker / Tech</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Village</label>
                    <select 
                      name="villageId"
                      value={registerData.villageId}
                      onChange={handleRegisterChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 font-semibold appearance-none focus:border-slate-400"
                    >
                      <option value="1">Piparli</option>
                      <option value="2">Borpada</option>
                      <option value="3">Kaundhiyar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      required 
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block flex justify-between">
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
                      className={`w-full bg-slate-50 border text-slate-950 text-sm rounded-lg outline-none block p-3 focus:bg-white ${registerPasswordMismatch ? 'border-red-400' : registerPasswordsMatch ? 'border-emerald-400' : 'border-slate-200'}`} 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || registerPasswordMismatch} 
                  className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-lg mt-6 hover:bg-[#142e52] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Account'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD (3-STEP SECURE OTP WORKFLOW) */}
          {view === 'forgot' && (
            <div className="space-y-6">
              <div>
                <button type="button" onClick={() => { setErrorMsg(null); setSuccessMsg(null); setView('login'); setForgotStep(1); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4 transition-all font-bold">
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </button>
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h4>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                    Step {forgotStep} of 3
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {forgotStep === 1 && "Enter your username or email to receive a secure OTP code."}
                  {forgotStep === 2 && `Enter the 6-digit OTP code sent to your registered email.`}
                  {forgotStep === 3 && "Create a new strong password for your governance account."}
                </p>
              </div>

              {/* STEP 1: REQUEST OTP */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Username or Email</label>
                    <input 
                      type="text" 
                      required 
                      value={forgotUsernameOrEmail}
                      onChange={(e) => setForgotUsernameOrEmail(e.target.value)}
                      placeholder="e.g. rajesh or rajesh@example.gov.in" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !forgotUsernameOrEmail.trim()} 
                    className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-lg mt-6 hover:bg-[#142e52] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Dispatching OTP...' : 'Send Verification OTP'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">6-Digit Verification Code (OTP)</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={8}
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value.trim())}
                      placeholder="e.g. 849201" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-xl font-bold tracking-widest text-center rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                    />
                    <p className="text-[11px] text-slate-400 text-center mt-1">Code expires in 15 minutes</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="w-1/3 bg-slate-100 text-slate-700 font-bold text-sm py-3.5 rounded-lg hover:bg-slate-200 transition-all"
                    >
                      Resend
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || forgotOtpCode.length < 6} 
                      className="w-2/3 bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-lg hover:bg-[#142e52] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SET NEW PASSWORD */}
              {forgotStep === 3 && (
                <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-lg outline-none block p-3 focus:border-slate-400 focus:bg-white" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block flex justify-between">
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
                        className={`w-full bg-slate-50 border text-slate-950 text-sm rounded-lg outline-none block p-3 focus:bg-white ${forgotPasswordMismatch ? 'border-red-400' : forgotPasswordsMatch ? 'border-emerald-400' : 'border-slate-200'}`} 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || forgotPasswordMismatch || !forgotPassword} 
                    className="w-full bg-[#0c1e36] text-white font-bold text-sm py-3.5 rounded-lg mt-6 hover:bg-[#142e52] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="p-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100">
          Secure Government Operations • Role-based access • Protected Session
        </div>
      </div>
    </div>
  );
}



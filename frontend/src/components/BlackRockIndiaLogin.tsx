import React, { useState } from 'react';
import { 
  Lock, Mail, Phone, Eye, EyeOff, 
  ShieldCheck, ArrowRight, Globe, TrendingUp 
} from 'lucide-react';

export default function BlackRockIndiaLogin() {
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate network request
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans relative overflow-hidden selection:bg-zinc-800">
      
      {/* Abstract Financial Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden z-10 mx-4">
        
        {/* Left Side: Brand & Value Proposition */}
        <div className="p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-zinc-900/80">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              {/* BlackRock Logo Abstraction */}
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-950" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">BlackRock</h1>
              <div className="h-5 w-px bg-zinc-700 mx-2" />
              <span className="text-sm font-semibold text-zinc-400 tracking-widest uppercase">India</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-light text-white leading-tight mb-6">
              Institutional wealth, <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
                built for India.
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Access global markets, intelligent portfolios, and unparalleled financial technology designed for the next billion ambitions.
            </p>
          </div>

          <div className="relative z-10 mt-16 md:mt-0 flex items-center gap-6 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
              SEBI Registered
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> 
              AUM $10T+ Global
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="p-10 lg:p-14 flex flex-col justify-center relative">
          
          {/* Top Right Language/Region Toggle */}
          <div className="absolute top-6 right-8 flex items-center gap-2 text-xs text-zinc-400 font-semibold cursor-pointer hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            ENG (IN)
          </div>

          <div className="max-w-sm w-full mx-auto">
            <h3 className="text-2xl font-bold text-white mb-2">Access Portfolio</h3>
            <p className="text-sm text-zinc-400 mb-8">Sign in to manage your institutional assets.</p>

            {/* Auth Toggle (Phone vs Email) */}
            <div className="flex p-1 bg-zinc-950/50 border border-zinc-800 rounded-lg mb-8">
              <button 
                type="button"
                onClick={() => setAuthMode('phone')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${authMode === 'phone' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Mobile / OTP
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('email')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${authMode === 'email' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Email ID
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Dynamic Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {authMode === 'phone' ? 'Mobile Number' : 'Corporate Email'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {authMode === 'phone' ? (
                      <span className="text-zinc-300 font-semibold text-sm border-r border-zinc-700 pr-2">+91</span>
                    ) : (
                      <Mail className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                    )}
                  </div>
                  <input 
                    type={authMode === 'phone' ? 'tel' : 'email'}
                    required
                    placeholder={authMode === 'phone' ? '98765 43210' : 'name@company.com'}
                    className={`w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-lg focus:ring-1 focus:ring-white focus:border-white outline-none block p-3 transition-all ${authMode === 'phone' ? 'pl-16' : 'pl-10'}`}
                  />
                </div>
              </div>

              {/* Password / OTP Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {authMode === 'phone' ? 'Secure OTP' : 'Password'}
                  </label>
                  <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors font-medium">
                    {authMode === 'phone' ? 'Resend OTP' : 'Forgot?'}
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={authMode === 'phone' ? '• • • • • •' : '••••••••'}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-lg focus:ring-1 focus:ring-white focus:border-white outline-none block p-3 pl-10 pr-10 transition-all tracking-widest placeholder:tracking-normal"
                  />
                  {authMode === 'email' && (
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-white text-zinc-950 font-bold text-sm py-3.5 rounded-lg mt-6 hover:bg-zinc-200 focus:ring-4 focus:ring-zinc-800 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Secure Login <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

            </form>

            <p className="text-center text-xs text-zinc-600 mt-8 font-medium">
              Don't have an account? <a href="#" className="text-white hover:underline">Apply for Private Wealth</a>
            </p>

          </div>
        </div>
      </div>
      
      {/* Footer Security Badge */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
        <Lock className="w-3 h-3" /> 256-Bit TLS Encryption
      </div>
    </div>
  );
}

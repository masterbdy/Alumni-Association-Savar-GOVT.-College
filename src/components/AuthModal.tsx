import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus,
  LogIn,
  ArrowLeft,
  ShieldCheck,
  Check,
  KeyRound,
  RotateCw,
  Send
} from 'lucide-react';
import { getCooldownRemainingSeconds } from '../services/otpService';
import { sendFirebaseAuthPasswordReset } from '../services/firebaseService';

export const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    isAuthenticated, 
    login, 
    appLogo,
    sendOtpCode,
    verifyOtpCode,
    resetPasswordWithOtp,
    registerWithOtp
  } = useApp();

  // 3D Flip State: false = Login (Front), true = Register (Back)
  const [isFlipped, setIsFlipped] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [isRegEmailVerified, setIsRegEmailVerified] = useState(false);
  const [regCooldownSec, setRegCooldownSec] = useState(0);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotCooldownSec, setForgotCooldownSec] = useState(0);
  const [forgotOtpDispatched, setForgotOtpDispatched] = useState(false);

  // Status & feedback state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Check for remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('nexus_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  // Cooldown timers interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (regCooldownSec > 0) {
        setRegCooldownSec(prev => Math.max(0, prev - 1));
      }
      if (forgotCooldownSec > 0) {
        setForgotCooldownSec(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [regCooldownSec, forgotCooldownSec]);

  // Sync cooldown on email change
  useEffect(() => {
    if (regEmail.trim()) {
      const cd = getCooldownRemainingSeconds(regEmail.trim(), 'email_verification');
      setRegCooldownSec(cd);
    }
  }, [regEmail]);

  useEffect(() => {
    if (forgotEmail.trim()) {
      const cd = getCooldownRemainingSeconds(forgotEmail.trim(), 'password_reset');
      setForgotCooldownSec(cd);
    }
  }, [forgotEmail]);

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'Empty', score: 0, color: 'bg-slate-300' };
    if (pass.length < 6) return { label: 'Too Weak', score: 1, color: 'bg-rose-500' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass);

    if (pass.length >= 8 && hasLetters && hasNumbers && hasSymbols) {
      return { label: 'Strong Security', score: 3, color: 'bg-cyan-500' };
    }
    if (pass.length >= 6 && ((hasLetters && hasNumbers) || hasSymbols)) {
      return { label: 'Moderate', score: 2, color: 'bg-sky-500' };
    }
    return { label: 'Weak', score: 1, color: 'bg-amber-500' };
  };

  const passwordStrength = getPasswordStrength(regPassword);

  // Don't render modal when user is already authenticated unless explicitly toggled
  if (!showAuthModal && isAuthenticated) return null;

  // Handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (!email.trim() || !password) {
      setLoading(false);
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      try {
        if (rememberMe) {
          localStorage.setItem('nexus_remember_email', email.trim().toLowerCase());
        } else {
          localStorage.removeItem('nexus_remember_email');
        }
      } catch {}

      setShowAuthModal(false);
    }
  };

  // Dispatch Registration Email OTP
  const handleSendRegOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setErrorMessage('Please enter a valid email address to receive your verification code.');
      return;
    }

    setSendingOtp(true);
    const res = await sendOtpCode(regEmail.trim(), 'email_verification');
    setSendingOtp(false);

    if (!res.success) {
      setErrorMessage(res.message);
      if (res.cooldownRemaining) {
        setRegCooldownSec(res.cooldownRemaining);
      }
    } else {
      setSuccessMessage(res.message);
      setRegCooldownSec(60);
    }
  };

  // Verify Registration Email OTP
  const handleVerifyRegOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!regOtpCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    const res = await verifyOtpCode(regEmail.trim(), regOtpCode.trim(), 'email_verification');
    setVerifyingOtp(false);

    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setIsRegEmailVerified(true);
      setSuccessMessage('Email verified successfully! You can now complete account registration.');
    }
  };

  // Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Full name and email address are required.');
      return;
    }

    if (!isRegEmailVerified) {
      setErrorMessage('Please verify your email address using the 6-digit code before creating an account.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    const res = await registerWithOtp(
      regName.trim(),
      regEmail.trim(),
      regPassword,
      regOtpCode.trim(),
      '+880 1700-000000',
      'Management Alumni Member'
    );
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    } else {
      setSuccessMessage('Account registered successfully! Welcome to Alumni Association.');
      setTimeout(() => {
        setShowAuthModal(false);
        setSuccessMessage('');
      }, 1500);
    }
  };

  // Dispatch Forgot Password OTP
  const handleSendForgotOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setErrorMessage('Please enter your registered account email address.');
      return;
    }

    setSendingOtp(true);
    // Dispatch OTP verification code
    const res = await sendOtpCode(forgotEmail.trim(), 'password_reset');
    // Also dispatch official Firebase Auth password reset email in parallel
    sendFirebaseAuthPasswordReset(forgotEmail.trim()).catch(() => null);
    setSendingOtp(false);

    if (!res.success) {
      setErrorMessage(res.message);
      if (res.cooldownRemaining) {
        setForgotCooldownSec(res.cooldownRemaining);
      }
    } else {
      setForgotOtpDispatched(true);
      setSuccessMessage(res.message);
      setForgotCooldownSec(60);
    }
  };

  // Submit Forgot Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotEmail.trim() || !forgotOtpCode.trim() || !forgotNewPassword) {
      setErrorMessage('Please fill in your email, 6-digit OTP code, and new password.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordWithOtp(forgotEmail.trim(), forgotOtpCode.trim(), forgotNewPassword);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Password reset could not be completed.');
    } else {
      setSuccessMessage(res.message || 'Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setShowForgot(false);
        setPassword('');
        setEmail(forgotEmail.trim());
        setSuccessMessage('');
      }, 2000);
    }
  };

  return (
    <div 
      className={`${
        isAuthenticated ? 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm' : 'w-full'
      } flex items-center justify-center p-3 sm:p-4`}
    >
      {/* 3D Perspective Container */}
      <div className="w-full max-w-[440px] perspective-1200 py-2">
        {/* Flippable 3D Inner Card */}
        <div 
          className={`relative w-full preserve-3d transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ minHeight: isFlipped ? '660px' : '600px' }}
        >
          {/* ========================================================= */}
          {/* FRONT FACE: PREMIUM NEUMORPHIC LOGIN CARD                 */}
          {/* ========================================================= */}
          <div 
            className={`w-full rounded-[30px] neu-card p-6 sm:p-8 flex flex-col justify-between border border-white/60 backface-hidden ${
              isFlipped ? 'pointer-events-none opacity-0 select-none' : 'opacity-100'
            }`}
            style={{ 
              transition: 'opacity 0.25s ease',
              minHeight: '600px'
            }}
          >
            {/* Top Brand & Close Bar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                {/* Brand Logo & Department Bio */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20 overflow-hidden flex items-center justify-center">
                    <img 
                      src={appLogo.url} 
                      alt="Alumni Association Logo" 
                      className="w-full h-full object-cover rounded-[14px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                      Alumni Association
                    </h3>
                    <p className="text-[11px] font-semibold text-cyan-700 tracking-tight">
                      Dept. of Management, Savar Govt. College
                    </p>
                  </div>
                </div>

                {isAuthenticated && (
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="w-8 h-8 rounded-full neu-button flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                    aria-label="Close"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Title Header */}
              <div className="mb-4">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {showForgot ? 'Reset Password' : 'Sign In'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {showForgot 
                    ? 'Enter your verified email and OTP code to restore access' 
                    : 'Enter your credentials to access your alumni portal'}
                </p>
              </div>

              {/* Status Feedback */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50/90 border border-rose-200/80 flex items-start gap-2.5 text-rose-700 text-xs animate-fadeIn">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2.5 text-emerald-800 text-xs animate-fadeIn">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span className="leading-snug">{successMessage}</span>
                </div>
              )}

              {/* ===================================================== */}
              {/* FORGOT PASSWORD SUBFLOW (OTP BASED)                   */}
              {/* ===================================================== */}
              {showForgot ? (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Account Email
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        disabled={sendingOtp || forgotCooldownSec > 0 || !forgotEmail.trim()}
                        className="px-3 py-2 rounded-2xl neu-button text-xs font-semibold text-cyan-700 disabled:opacity-50 shrink-0"
                      >
                        {sendingOtp ? 'Sending...' : forgotCooldownSec > 0 ? `${forgotCooldownSec}s` : 'Send Code'}
                      </button>
                    </div>
                  </div>

                  {forgotOtpDispatched && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          6-Digit Verification Code
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={forgotOtpCode}
                            onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl neu-inset text-xs tracking-widest font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type={showForgotNewPassword ? 'text' : 'password'}
                            required
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showForgotNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="password"
                            required
                            value={forgotConfirmPassword}
                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !forgotOtpDispatched}
                      className="w-full py-3 rounded-2xl neu-accent-btn text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <RotateCw size={15} className="animate-spin" />
                      ) : (
                        <KeyRound size={15} />
                      )}
                      <span>Update Password</span>
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(false);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-cyan-700 transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* ===================================================== */
                /* STANDARD SIGN IN FORM                                 */
                /* ===================================================== */
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgot(true);
                          setForgotEmail(email);
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                      />
                      <span className="text-slate-600 text-xs font-medium">Remember me</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl neu-accent-btn text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <RotateCw size={15} className="animate-spin" />
                      ) : (
                        <LogIn size={15} />
                      )}
                      <span>Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom 3D Flip Trigger Bar */}
            <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between mt-3">
              <div className="text-left">
                <p className="text-xs font-bold text-slate-700 leading-tight">New Alumni Member?</p>
                <p className="text-[10px] text-slate-500">Create an account with email OTP</p>
              </div>

              {/* 3D Flip Switch Button (Plus / User Icon) */}
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-11 h-11 rounded-2xl neu-button flex items-center justify-center text-cyan-700 hover:text-cyan-800 shadow-md group transition-all"
                title="Switch to Account Registration (3D Flip)"
                aria-label="Switch to Account Registration"
              >
                <UserPlus size={18} className="group-hover:scale-110 transition-transform text-cyan-600" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BACK FACE: PREMIUM NEUMORPHIC REGISTRATION CARD          */}
          {/* ========================================================= */}
          <div 
            className={`absolute inset-0 w-full rounded-[30px] neu-card p-6 sm:p-8 flex flex-col justify-between border border-white/60 backface-hidden rotate-y-180 ${
              !isFlipped ? 'pointer-events-none opacity-0 select-none' : 'opacity-100'
            }`}
            style={{ 
              transition: 'opacity 0.25s ease',
              minHeight: '660px'
            }}
          >
            {/* Top Brand & Flip Back Bar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20 overflow-hidden flex items-center justify-center">
                    <img 
                      src={appLogo.url} 
                      alt="Alumni Association Emblem" 
                      className="w-full h-full object-cover rounded-[14px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                      Alumni Registration
                    </h3>
                    <p className="text-[10px] font-semibold text-cyan-700">
                      Dept. of Management, Savar Govt. College
                    </p>
                  </div>
                </div>

                {/* Flip Back to Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="w-8 h-8 rounded-full neu-button flex items-center justify-center text-slate-500 hover:text-cyan-700 transition-colors"
                  title="Return to Login"
                  aria-label="Return to Login"
                >
                  <ArrowLeft size={15} />
                </button>
              </div>

              {/* Title Header */}
              <div className="mb-3">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Create Account
                </h2>
                <p className="text-[11px] text-slate-500">
                  Verify your email address via OTP to register your alumni profile
                </p>
              </div>

              {/* Status Feedback */}
              {errorMessage && (
                <div className="mb-3 p-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 flex items-start gap-2 text-rose-700 text-xs animate-fadeIn">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-3 p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2 text-emerald-800 text-xs animate-fadeIn">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span className="leading-snug">{successMessage}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-2.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>
                </div>

                {/* Email Address with Send OTP Button */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address & OTP Verification
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="email"
                        required
                        disabled={isRegEmailVerified}
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          setIsRegEmailVerified(false);
                        }}
                        className="w-full pl-9 pr-3.5 py-2 rounded-2xl neu-inset text-xs text-slate-800 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendRegOtp}
                      disabled={sendingOtp || regCooldownSec > 0 || isRegEmailVerified || !regEmail.trim()}
                      className="px-3 py-2 rounded-2xl neu-button text-[11px] font-bold text-cyan-700 disabled:opacity-50 shrink-0"
                    >
                      {sendingOtp ? 'Sending...' : regCooldownSec > 0 ? `${regCooldownSec}s` : 'Send Code'}
                    </button>
                  </div>
                </div>

                {/* 6-Digit OTP Code Input & Verify Button */}
                {!isRegEmailVerified ? (
                  <div className="p-2.5 rounded-2xl bg-cyan-50/60 border border-cyan-200/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">Enter 6-Digit Code</span>
                      <span className="text-[10px] text-cyan-700">10 min expiry • Max 5 tries</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={regOtpCode}
                        onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3 py-1.5 rounded-xl neu-inset text-xs font-mono tracking-widest text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyRegOtp}
                        disabled={verifyingOtp || regOtpCode.trim().length < 6}
                        className="px-3 py-1.5 rounded-xl neu-accent-btn text-white text-[11px] font-bold disabled:opacity-50 shrink-0"
                      >
                        {verifyingOtp ? 'Checking...' : 'Verify Email'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Email address verified</span>
                  </div>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Confirm
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 rounded-2xl neu-inset text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showRegConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength */}
                {regPassword && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Security: {passwordStrength.label}</span>
                      <span>Min 6 characters</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}

                {/* Submit Account Creation */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !isRegEmailVerified}
                    className="w-full py-2.5 rounded-2xl neu-accent-btn text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RotateCw size={15} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={15} />
                    )}
                    <span>Create Account</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Flip Back Trigger Bar */}
            <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between mt-2">
              <div className="text-left">
                <p className="text-xs font-bold text-slate-700 leading-tight">Already Registered?</p>
                <p className="text-[10px] text-slate-500">Return to sign in to your account</p>
              </div>

              {/* 3D Flip Back Switch Button (Login / Arrow Icon) */}
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-cyan-700 hover:text-cyan-800 shadow-md group transition-all"
                title="Switch back to Sign In (3D Flip)"
                aria-label="Switch back to Sign In"
              >
                <LogIn size={16} className="group-hover:-translate-x-0.5 transition-transform text-cyan-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

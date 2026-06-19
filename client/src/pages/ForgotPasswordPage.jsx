import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, KeyRound, Shield, Zap } from 'lucide-react';
import Logo from '../components/ui/Logo';
import api from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validateEmail() {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateOtp() {
    const errs = {};
    if (!otp.trim()) errs.otp = 'OTP is required';
    else if (!/^\d{6}$/.test(otp)) errs.otp = 'OTP must be 6 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validatePassword() {
    const errs = {};
    if (!newPassword) errs.newPassword = 'Password is required';
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!validateEmail()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!validateOtp()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-forgot-password-otp', { email: email.trim(), otp: otp.trim() });
      setResetToken(res.data.data.resetToken);
      toast.success('OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Shield, title: 'Bank-grade Security', desc: 'End-to-end encrypted password reset' },
    { icon: KeyRound, title: 'OTP Verification', desc: 'Secure email-based verification' },
    { icon: Zap, title: 'Quick Recovery', desc: 'Reset your password in minutes' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] bg-grid-pattern flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="mb-12">
            <Logo size={48} textSize="text-2xl" />
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold text-[var(--text-primary)] leading-tight mb-6">
            Reset<br /><span className="text-gradient">password.</span>
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-md mb-12">
            Secure your account with a new password. Follow the steps to regain access.
          </p>
          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent-200 transition-colors">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-medium text-sm">{f.title}</h3>
                  <p className="text-muted text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 lg:hidden">
            <Logo size={40} textSize="text-xl" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s ? 'bg-accent text-white' : step > s ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted'}`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 transition-colors ${step > s ? 'bg-accent' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Forgot password?</h2>
              <p className="text-muted mb-8">Enter your email and we'll send you a reset OTP.</p>
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label htmlFor="email" className="input-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input id="email" name="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({}); }} placeholder="you@example.com" className={`input-base pl-12 ${errors.email ? 'border-sell/50' : ''}`} autoComplete="email" />
                  </div>
                  {errors.email && <p className="input-error">{errors.email}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Sending OTP...</> : <>Send OTP<ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Enter OTP</h2>
              <p className="text-muted mb-8">A 6-digit OTP has been sent to <span className="text-accent">{email}</span>.</p>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="input-label">OTP Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input id="otp" name="otp" type="text" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); if (errors.otp) setErrors({}); }} placeholder="Enter 6-digit OTP" className={`input-base pl-12 tracking-widest text-center text-lg ${errors.otp ? 'border-sell/50' : ''}`} autoComplete="one-time-code" maxLength={6} />
                  </div>
                  {errors.otp && <p className="input-error">{errors.otp}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Verifying...</> : <>Verify OTP<ArrowRight className="w-5 h-5" /></>}
                </button>
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mx-auto">
                  <ArrowLeft className="w-4 h-4" />Back to email
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">New password</h2>
              <p className="text-muted mb-8">Choose a strong password for your account.</p>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="input-label">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input id="newPassword" name="newPassword" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors({}); }} placeholder="At least 8 characters" className={`input-base pl-12 pr-12 ${errors.newPassword ? 'border-sell/50' : ''}`} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text-primary)] transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="input-error">{errors.newPassword}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({}); }} placeholder="Re-enter your password" className={`input-base pl-12 ${errors.confirmPassword ? 'border-sell/50' : ''}`} autoComplete="new-password" />
                  </div>
                  {errors.confirmPassword && <p className="input-error">{errors.confirmPassword}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Resetting...</> : <>Reset Password<ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm text-muted">
            Remember your password? <Link to="/login" className="link-accent">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

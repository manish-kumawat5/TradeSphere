import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OtpModal from '../components/OtpModal';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Must include uppercase, lowercase, and a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(data.message || 'Registration successful!');
      setShowOtp(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
      if (err.response?.data?.errors) {
        const fe = {};
        err.response.data.errors.forEach((e) => { fe[e.field] = e.message; });
        setErrors(fe);
      }
    } finally { setLoading(false); }
  }

  async function handleOtpVerify(otp) {
    await verifyOtp(form.email.trim(), otp);
    toast.success('Email verified! Welcome to TradeSphere 🎉');
    navigate('/dashboard');
  }

  async function handleOtpResend() {
    const data = await resendOtp(form.email.trim());
    toast.success(data.message || 'New OTP sent!');
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  }

  const getStrength = () => {
    if (form.password.length < 8) return 0;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])/.test(form.password)) return 4;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) return 3;
    if (/(?=.*[a-z])(?=.*\d)/.test(form.password)) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] bg-grid-pattern flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="mb-12">
            <Logo size={48} textSize="text-2xl" />
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Start your<br /><span className="text-gradient">investing journey</span><br />today.
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-md">
            Join millions of investors. Trade stocks, mutual funds, and more with zero commission.
          </p>
          <div className="flex gap-8 mt-12">
            {[{ value: '2M+', label: 'Active Users' }, { value: '₹50K Cr', label: 'Trading Volume' }, { value: '500+', label: 'Stocks Listed' }].map((s) => (
              <div key={s.label}><p className="text-2xl font-bold text-accent">{s.value}</p><p className="text-muted text-sm mt-1">{s.label}</p></div>
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
          <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-muted mb-8">Already have an account? <Link to="/login" className="link-accent" id="login-link">Log in</Link></p>

          <form onSubmit={handleSubmit} className="space-y-5" id="signup-form">
            <div>
              <label htmlFor="name" className="input-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="John Doe" className={`input-base pl-12 ${errors.name ? 'border-red-500/50' : ''}`} autoComplete="name" />
              </div>
              {errors.name && <p className="input-error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="input-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={`input-base pl-12 ${errors.email ? 'border-red-500/50' : ''}`} autoComplete="email" />
              </div>
              {errors.email && <p className="input-error">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min. 8 characters" className={`input-base pl-12 pr-12 ${errors.password ? 'border-red-500/50' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors" id="toggle-password">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password}</p>}
              <div className="flex gap-1.5 mt-3">
                {[1,2,3,4].map((l) => (
                  <div key={l} className={`h-1 flex-1 rounded-full transition-all duration-300 ${l <= getStrength() ? (getStrength() <= 1 ? 'bg-sell' : getStrength() <= 2 ? 'bg-yellow-500' : 'bg-accent') : 'bg-surface-light'}`} />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" id="signup-submit">
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Creating Account...</>) : (<>Create Account<ArrowRight className="w-5 h-5" /></>)}
            </button>
          </form>
          <p className="text-muted text-xs text-center mt-6 leading-relaxed">
            By creating an account, you agree to our <span className="text-muted-light hover:text-white cursor-pointer transition-colors">Terms of Service</span> and <span className="text-muted-light hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </div>
      </div>

      <OtpModal isOpen={showOtp} onClose={() => setShowOtp(false)} onVerify={handleOtpVerify} onResend={handleOtpResend} email={form.email} />
    </div>
  );
}

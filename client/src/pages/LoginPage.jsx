import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, TrendingUp, BarChart3, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname || '/dashboard';

  function validate() {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back! 🚀');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      toast.error(msg);
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        toast('Please verify your email first.', { icon: '📧' });
      }
    } finally { setLoading(false); }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  }

  const features = [
    { icon: BarChart3, title: 'Real-time Charts', desc: 'Advanced charting with live data' },
    { icon: Shield, title: 'Bank-grade Security', desc: 'Your data is always encrypted' },
    { icon: Zap, title: 'Instant Execution', desc: 'Lightning-fast trade execution' },
  ];

  return (
    <div className="min-h-screen bg-dark bg-grid-pattern flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-glow">
              <TrendingUp className="w-6 h-6 text-dark" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TradeSphere</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Welcome<br /><span className="text-gradient">back.</span>
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-md mb-12">
            Your portfolio is waiting. Log in to access your investments, watchlists, and market insights.
          </p>
          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent-200 transition-colors">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{f.title}</h3>
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
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-dark" />
            </div>
            <span className="text-xl font-bold text-white">TradeSphere</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Log in to your account</h2>
          <p className="text-muted mb-8">Don't have an account? <Link to="/signup" className="link-accent" id="signup-link">Sign up</Link> | <Link to="/forgot-password" className="link-accent" id="forgot-password-link">Forgot password?</Link></p>

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            <div>
              <label htmlFor="email" className="input-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={`input-field pl-12 ${errors.email ? 'border-sell/50' : ''}`} autoComplete="email" />
              </div>
              {errors.email && <p className="input-error">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Enter your password" className={`input-field pl-12 pr-12 ${errors.password ? 'border-sell/50' : ''}`} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors" id="toggle-password-login">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password}</p>}
            </div>
            <div className="flex flex-col items-start w-full">
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" id="login-submit">
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Logging in...</>) : (<>Log In<ArrowRight className="w-5 h-5" /></>)}
            </button>
            </div>
          </form>
      </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2, CheckCircle2, RotateCw, ShieldCheck } from 'lucide-react';

export default function OtpModal({ isOpen, onClose, onVerify, onResend, email }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // ── Resend cooldown timer ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    setResendCooldown(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // ── Auto-focus first input ─────────────────────────────────────
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // ── Handle input change ────────────────────────────────────────
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Handle key down ────────────────────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // ── Handle paste ───────────────────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  // ── Submit OTP ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(otpString);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, onVerify]);

  // ── Auto-submit when all digits filled ─────────────────────────
  useEffect(() => {
    if (otp.every((digit) => digit !== '')) {
      handleSubmit();
    }
  }, [otp, handleSubmit]);

  // ── Resend OTP ─────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;

    try {
      await onResend();
      setCanResend(false);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();

      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-md animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-white 
                     hover:bg-surface-light rounded-lg transition-all duration-200"
          id="otp-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 
                          bg-accent-100 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-muted text-sm">
            We've sent a 6-digit code to
            <br />
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`otp-input ${
                digit ? 'border-accent bg-accent-50' : ''
              } ${error ? 'border-sell/50' : ''}`}
              id={`otp-input-${index}`}
              disabled={loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center mb-4 animate-fade-in">
            <p className="text-sell text-sm">{error}</p>
          </div>
        )}

        {/* Verify button */}
        <button
          onClick={handleSubmit}
          disabled={loading || otp.some((d) => !d)}
          className="btn-primary w-full mb-4"
          id="otp-verify-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Verify Email
            </>
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-2 text-accent text-sm font-medium
                         hover:text-accent-light transition-colors duration-200"
              id="otp-resend-btn"
            >
              <RotateCw className="w-4 h-4" />
              Resend Code
            </button>
          ) : (
            <p className="text-muted text-sm">
              Resend code in{' '}
              <span className="text-white font-mono font-medium">
                {String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:
                {String(resendCooldown % 60).padStart(2, '0')}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

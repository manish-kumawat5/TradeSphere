import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input if filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Submit OTP ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async (currentOtp = otp) => {
    const otpString = currentOtp.join('');
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

  // ── Handle key down (Backspace Polish) ─────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) {
        // Clear current index
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Clear previous index and focus
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // ── Handle paste (Pasting Polish) ──────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    // Trim, strip non-digits, take max 6
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasteData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (i < pasteData.length) {
          newOtp[i] = pasteData[i];
        }
      }
      setOtp(newOtp);
      
      // Auto-submit if complete
      if (pasteData.length === 6) {
        handleSubmit(newOtp);
      } else {
        // Focus the next empty box
        const focusIndex = Math.min(pasteData.length, 5);
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

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
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-all"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative glass-card p-8 w-full max-w-md bg-[#0F172A] border border-slate-100 dark:border-surface-border shadow-2xl animate-scale-in z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white 
                     hover:bg-slate-800 dark:hover:bg-surface-light/30 rounded-xl transition-all duration-200"
          id="otp-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 
                          bg-[#00D09C]/10 rounded-2xl mb-4 border border-[#00D09C]/20">
            <ShieldCheck className="w-8 h-8 text-[#00D09C]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Verify Your Email</h2>
          <p className="text-slate-400 dark:text-muted-light text-sm">
            We've sent a 6-digit verification code to
            <br />
            <span className="text-[#00D09C] font-semibold">{email}</span>
          </p>
        </div>

        {/* OTP Input Fields */}
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
                digit ? 'border-[#00D09C] bg-[#00D09C]/5' : ''
              } ${error ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
              id={`otp-input-${index}`}
              disabled={loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl py-2 px-3 animate-fade-in">
            <p className="text-rose-500 text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Verification Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading || otp.some((d) => !d)}
          className="btn-primary w-full py-3 mb-4 justify-center"
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

        {/* Resend Cooldown Action */}
        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-2 text-[#00D09C] text-sm font-bold
                         hover:text-[#00E8AD] transition-colors duration-200"
              id="otp-resend-btn"
            >
              <RotateCw className="w-4 h-4 animate-spin-hover" />
              Resend Code
            </button>
          ) : (
            <p className="text-slate-400 dark:text-muted-light text-xs font-semibold">
              Resend code in{' '}
              <span className="text-white font-mono font-bold">
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

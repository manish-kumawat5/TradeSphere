import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function SIPSetup() {
  const { id } = useParams(); // fund id
  const navigate = useNavigate();
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(monthlyAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid monthly amount');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/funds/${id}/sip`, {
        monthlyAmount: amount,
        startDate,
        endDate,
      });
      if (res.data.success) {
        toast.success('SIP setup successfully');
        setTimeout(() => navigate(`/funds/${id}`), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create SIP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      
      {/* Back Link */}
      <Link to={`/funds/${id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-[#00D09C] transition-colors mb-6 text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Fund Detail
      </Link>

      {/* Form Card */}
      <div className="glass-card p-6 md:p-8 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-2xl shadow-xl">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#00D09C]" />
            Setup Monthly SIP
          </h1>
          <p className="text-slate-500 dark:text-muted mt-1 text-xs font-semibold">
            Invest a fixed amount automatically every month.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Monthly Amount */}
          <div>
            <label className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block mb-1.5">
              Monthly Installment Amount (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="e.g. ₹2,000"
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-xl text-sm text-slate-800 dark:text-white font-bold focus:outline-none focus:border-[#00D09C]"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-xl text-sm text-slate-800 dark:text-white font-bold focus:outline-none focus:border-[#00D09C]"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-xl text-sm text-slate-800 dark:text-white font-bold focus:outline-none focus:border-[#00D09C]"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-3 justify-center gap-2 mt-2 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up SIP...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Initialize SIP
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}

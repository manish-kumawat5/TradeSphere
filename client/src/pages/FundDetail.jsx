import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  ArrowLeft, TrendingUp, Info, DollarSign, Calendar, 
  ShieldAlert, Activity, Sparkles, CheckCircle2, ChevronRight, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvest, setShowInvest] = useState(false);
  const [investmentAmt, setInvestmentAmt] = useState('');
  const [message, setMessage] = useState('');
  const [investing, setInvesting] = useState(false);

  // NAV history generator based on final NAV
  const navHistory = fund ? [
    { date: 'Jan 24', nav: fund.nav * 0.88 },
    { date: 'Feb 24', nav: fund.nav * 0.91 },
    { date: 'Mar 24', nav: fund.nav * 0.95 },
    { date: 'Apr 24', nav: fund.nav * 0.93 },
    { date: 'May 24', nav: fund.nav * 0.98 },
    { date: 'Jun 24', nav: fund.nav }
  ] : [];

  useEffect(() => {
    async function fetchFund() {
      try {
        const res = await api.get(`/funds/${id}`);
        setFund(res.data.data);
      } catch (err) {
        console.error('Failed to load fund', err);
        setMessage('Fund not found');
      } finally {
        setLoading(false);
      }
    }
    fetchFund();
  }, [id]);

  const handleInvest = async () => {
    const amount = parseFloat(investmentAmt);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid investment amount');
      return;
    }
    if (amount < (fund?.minInvestment || 500)) {
      toast.error(`Minimum investment is ₹${fund?.minInvestment}`);
      return;
    }

    setInvesting(true);
    try {
      const res = await api.post(`/funds/${id}/invest`, { amount });
      if (res.data.success) {
        toast.success('Investment successful!');
        setShowInvest(false);
        setInvestmentAmt('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00D09C] animate-spin mb-3" />
        <p className="text-muted text-sm font-semibold">Loading fund information...</p>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center p-8 glass-card bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{message || 'Fund not found'}</h3>
        <Link to="/mutual-funds" className="btn-primary mt-4 inline-flex items-center gap-2 justify-center py-2 px-4">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Back Link */}
      <Link to="/mutual-funds" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#00D09C] transition-colors mb-6 text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Mutual Funds
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Overview & Chart */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Card */}
          <div className="glass-card p-6 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-2xl">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{fund.name}</h1>
            <p className="text-xs text-slate-400 dark:text-muted mt-1.5 font-bold flex items-center gap-1.5">
              <span>{fund.fundHouse}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-indigo-400 uppercase font-extrabold">{fund.category} Fund</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-3 bg-slate-50 dark:bg-surface/50 border border-slate-100 dark:border-surface-border rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block">Net Asset Value (NAV)</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono block mt-1">₹{fund.nav.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-surface/50 border border-slate-100 dark:border-surface-border rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block">Expense Ratio</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono block mt-1">{fund.expenseRatio}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-surface/50 border border-slate-100 dark:border-surface-border rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block">Assets Under Mgt (AUM)</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono block mt-1">₹{fund.aum} Cr</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-surface/50 border border-slate-100 dark:border-surface-border rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block">3Y Returns</span>
                <span className="text-base font-black text-emerald-400 font-mono block mt-1">+{fund.return3Y?.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Chart Card */}
          <div className="glass-card p-6 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00D09C]" />
              NAV Growth Trend
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={navHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px' 
                    }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 600, fontSize: '12px' }}
                    itemStyle={{ color: '#F8FAFC', fontWeight: 700, fontSize: '13px' }}
                  />
                  <Line type="monotone" dataKey="nav" stroke="#00D09C" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fund Details Information */}
          <div className="glass-card p-6 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-2xl space-y-4 text-xs font-semibold">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Fund Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-surface-border/30">
                <span className="text-slate-400 dark:text-muted">Launch Date</span>
                <span className="text-slate-900 dark:text-white">{fund.launchDate ? new Date(fund.launchDate).toLocaleDateString('en-IN') : 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-surface-border/30">
                <span className="text-slate-400 dark:text-muted">Fund Manager</span>
                <span className="text-slate-900 dark:text-white">{fund.fundManager}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-surface-border/30">
                <span className="text-slate-400 dark:text-muted">Min One‑Time Investment</span>
                <span className="text-slate-900 dark:text-white font-mono">₹{fund.minInvestment}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-surface-border/30">
                <span className="text-slate-400 dark:text-muted">Min Monthly SIP Amount</span>
                <span className="text-slate-900 dark:text-white font-mono">₹{fund.minSipAmount}</span>
              </div>
            </div>
            {fund.description && (
              <div className="pt-2">
                <span className="text-slate-400 dark:text-muted block mb-1">About this Scheme</span>
                <p className="text-slate-600 dark:text-muted-light font-medium leading-relaxed">{fund.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Investing & Operations */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Invest Card */}
          <div className="glass-card p-6 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Invest in Scheme</h2>
            
            <div className="space-y-4">
              
              {/* Setup SIP */}
              <button
                onClick={() => navigate(`/funds/${id}/sip`)}
                className="btn-primary w-full py-3 justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Setup Monthly SIP
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-surface-border/50"></div>
                <span className="flex-shrink mx-4 text-xs font-extrabold text-slate-400 dark:text-muted">OR</span>
                <div className="flex-grow border-t border-slate-200 dark:border-surface-border/50"></div>
              </div>

              {/* Toggle One-Time Form */}
              {!showInvest ? (
                <button
                  onClick={() => setShowInvest(true)}
                  className="btn-outlined w-full py-3 justify-center gap-2 border-slate-200 dark:border-surface-border text-slate-700 dark:text-white hover:border-[#00D09C] hover:text-[#00D09C]"
                >
                  <DollarSign className="w-5 h-5" />
                  Invest One‑Time
                </button>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-surface/50 border border-slate-100 dark:border-surface-border rounded-2xl space-y-4 animate-scale-in">
                  <div>
                    <label className="text-[10px] text-slate-400 dark:text-muted uppercase font-extrabold tracking-wider block mb-1">One-Time Amount (₹)</label>
                    <input
                      type="number"
                      placeholder={`Min ₹${fund.minInvestment}`}
                      value={investmentAmt}
                      onChange={(e) => setInvestmentAmt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-dark border border-slate-200 dark:border-surface-border rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#00D09C] font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleInvest}
                      disabled={investing}
                      className="btn-primary flex-1 py-2 text-xs justify-center font-bold"
                    >
                      {investing ? 'Investing...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowInvest(false)}
                      className="btn-outlined py-2 px-3 text-xs justify-center font-bold border-slate-200 dark:border-surface-border text-slate-600 dark:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

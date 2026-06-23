import { useState, useEffect } from 'react';
import { BarChart3, Search, TrendingUp, PieChart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function MutualFundsPage() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchFunds() {
      try {
        const { data } = await api.get('/funds', { params: { limit: 10 } });
        if (data.success) setFunds(data.data);
      } catch (err) {
        console.error('Failed to load funds', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFunds();
  }, []);

  const filtered = funds.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MODERATE': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-300 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-accent" />
            Mutual Funds
          </h1>
          <p className="text-gray-300 mt-1 text-sm font-semibold">Explore a wide range of mutual fund schemes and invest.</p>
        </div>
        <button
          onClick={() => navigate('/funds')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-[#00B889] transition-colors"
        >
          View Full Directory <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-card p-4 bg-neutral-800 border border-white/5 rounded-2xl mb-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search funds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-transparent border-t-accent rounded-full animate-spin mb-3" />
          <p className="text-gray-300 text-sm font-semibold">Loading mutual funds...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 bg-neutral-800 border border-white/5 rounded-2xl text-center">
          <p className="text-gray-300 text-sm">
            {search ? 'No funds match your search.' : 'No mutual funds available yet. Check back later!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((fund) => (
            <div
              key={fund.id}
              onClick={() => navigate(`/funds/${fund.id}`)}
              className="glass-card p-6 bg-neutral-800 border border-white/5 rounded-2xl hover:border-accent/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm leading-tight truncate">{fund.name}</h3>
                  <p className="text-gray-300 text-xs mt-1">{fund.fundHouse}</p>
                </div>
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getRiskColor(fund.riskLevel)}`}>
                  {fund.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-300 block">NAV</span>
                  <span className="text-white font-bold font-mono">₹{fund.nav.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-300 block">3Y Returns</span>
                  <span className="text-accent font-bold">{fund.return3Y ? `+${fund.return3Y.toFixed(2)}%` : '—'}</span>
                </div>
                <div>
                  <span className="text-gray-300 block">Expense Ratio</span>
                  <span className="text-white font-bold">{fund.expenseRatio}%</span>
                </div>
                <div>
                  <span className="text-gray-300 block">Min Investment</span>
                  <span className="text-white font-bold font-mono">₹{fund.minInvestment}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                  {fund.category}
                </span>
                <span className="text-accent text-xs font-bold flex items-center gap-1">
                  Invest <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

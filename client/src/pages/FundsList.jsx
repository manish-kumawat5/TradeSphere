import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Search, ChevronRight, TrendingUp, Info, PieChart, ShieldAlert } from 'lucide-react';
import api from '../lib/api';

export default function FundsList() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '' });

  useEffect(() => {
    async function fetchFunds() {
      try {
        const params = {};
        if (filters.category) params.category = filters.category;
        if (filters.search) params.search = filters.search;
        const res = await api.get('/funds', { params });
        setFunds(res.data.data);
      } catch (err) {
        console.error('Failed to load funds', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFunds();
  }, [filters]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MODERATE': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'EQUITY': return <PieChart className="w-4 h-4 text-indigo-400" />;
      case 'DEBT': return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      default: return <Info className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <PieChart className="w-8 h-8 text-[#00D09C]" />
          Mutual Funds Directory
        </h1>
        <p className="text-slate-500 dark:text-muted mt-1 text-sm font-semibold">
          Explore top-performing mutual funds across equity, debt, and hybrid assets.
        </p>
      </div>

      {/* Filter Row */}
      <div className="glass-card p-4 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4">
        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="w-full md:w-56 px-4 py-2.5 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-xl text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#00D09C] font-semibold"
        >
          <option value="">All Categories</option>
          <option value="EQUITY">Equity (Stocks)</option>
          <option value="DEBT">Debt (Bonds)</option>
          <option value="HYBRID">Hybrid (Multi-asset)</option>
        </select>

        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-muted" />
          <input
            type="text"
            placeholder="Search by fund name, house, or manager..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-xl text-[13px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-muted focus:outline-none focus:border-[#00D09C] font-semibold"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-transparent border-t-[#00D09C] rounded-full animate-spin mb-3" />
          <p className="text-muted text-sm font-semibold">Loading mutual funds list...</p>
        </div>
      ) : funds.length === 0 ? (
        <div className="glass-card p-10 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border text-center">
          <p className="text-sm text-slate-400 dark:text-muted">No mutual funds match your search filters.</p>
        </div>
      ) : (
        <div className="glass-card bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border overflow-hidden rounded-2xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-surface-border/50 bg-slate-50/50 dark:bg-surface-light/5 text-slate-400 dark:text-muted text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Fund Scheme Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Risk Profile</th>
                  <th className="p-4 text-right">NAV (₹)</th>
                  <th className="p-4 text-right">3Y Returns</th>
                  <th className="p-4 pl-6">Fund Manager</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-border/40 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {funds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-slate-50/30 dark:hover:bg-surface-light/20 transition-colors">
                    <td className="p-4 pl-6">
                      <Link to={`/funds/${fund.id}`} className="text-slate-900 dark:text-white hover:text-[#00D09C] dark:hover:text-[#00D09C] transition-all font-bold block">
                        {fund.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 dark:text-muted mt-0.5 block">{fund.fundHouse}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                        {getCategoryIcon(fund.category)}
                        {fund.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getRiskColor(fund.riskLevel)}`}>
                        {fund.riskLevel}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{fund.nav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right text-emerald-400 font-mono font-bold">
                      {fund.return3Y ? `+${fund.return3Y.toFixed(2)}%` : '—'}
                    </td>
                    <td className="p-4 pl-6 text-slate-600 dark:text-muted-light font-bold">
                      {fund.fundManager}
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        to={`/funds/${fund.id}`} 
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-surface-border hover:border-[#00D09C] text-slate-700 dark:text-white hover:text-[#00D09C] transition-colors"
                      >
                        Invest
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

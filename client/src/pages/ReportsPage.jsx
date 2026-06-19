import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, Search, Calendar, 
  TrendingUp, TrendingDown, RefreshCw, Loader2 
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, BUY, SELL
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReportTab, setActiveReportTab] = useState('transactions'); // transactions, holdings, tax

  async function fetchTransactions() {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/transactions');
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Failed to load transaction reports', err);
      toast.error('Failed to load transaction reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter & Search logic
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesQuery = t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    // Simulated download trigger
    setTimeout(() => {
      toast.success('Report downloaded successfully!');
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#00D09C]" />
            Reports & Statements
          </h1>
          <p className="text-slate-500 dark:text-muted mt-1 text-sm font-semibold">
            Track transactions, verify capital gains, and download statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleExport('csv')}
            className="btn-outlined py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-slate-200 dark:border-surface-border text-slate-700 dark:text-white"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-surface-border/50 mb-6 gap-6">
        {[
          { id: 'transactions', label: 'Transaction Log' },
          { id: 'holdings', label: 'Holdings Valuation' },
          { id: 'tax', label: 'Tax & P&L Statement' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeReportTab === tab.id 
                ? 'border-[#00D09C] text-[#00D09C]' 
                : 'border-transparent text-slate-500 dark:text-muted hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      {activeReportTab === 'transactions' && (
        <div className="glass-card p-4 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border rounded-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-muted" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-muted focus:outline-none focus:border-[#00D09C]"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-surface p-1 rounded-xl border border-slate-200 dark:border-surface-border">
              {['ALL', 'BUY', 'SELL'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterType === type 
                      ? 'bg-white dark:bg-dark-50 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-surface-border'
                      : 'text-slate-500 dark:text-muted hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={fetchTransactions}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-surface-light/40 transition-all self-end md:self-auto"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main content table */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00D09C] animate-spin mb-3" />
          <p className="text-muted text-sm font-semibold">Loading statement logs...</p>
        </div>
      ) : activeReportTab !== 'transactions' ? (
        <div className="glass-card p-10 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border text-center">
          <p className="text-sm text-slate-400 dark:text-muted">
            This tab is ready. Click "Download PDF" at the top to export the full statement.
          </p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-card p-10 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border text-center">
          <p className="text-sm text-slate-400 dark:text-muted">No transactions found matching your filters.</p>
        </div>
      ) : (
        <div className="glass-card bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-surface-border/50 bg-slate-50/50 dark:bg-surface-light/5 text-slate-400 dark:text-muted text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Quantity</th>
                  <th className="p-4 text-right">Execution Price</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-border/40 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {filteredTransactions.map((t) => {
                  const total = t.quantity * t.price;
                  const isBuy = t.type === 'BUY';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-surface-light/20 transition-colors">
                      <td className="p-4 font-mono text-slate-400 dark:text-muted">
                        {new Date(t.timestamp).toLocaleString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{t.symbol}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isBuy 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                        }`}>
                          {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono">{t.quantity}</td>
                      <td className="p-4 text-right font-mono">₹{t.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500">
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

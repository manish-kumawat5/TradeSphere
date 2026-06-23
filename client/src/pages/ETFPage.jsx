import { useState } from 'react';
import { Database, TrendingUp, TrendingDown, Search, BarChart3 } from 'lucide-react';

const MOCK_ETFS = [
  { symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty 50', assetClass: 'Equity', expenseRatio: 0.05, nav: 228.45, change: 1.20, changePercent: 0.53, aum: 28500, high52w: 234.00, low52w: 198.50 },
  { symbol: 'JUNIORBEES', name: 'Nippon India ETF Junior Nifty', assetClass: 'Equity', expenseRatio: 0.10, nav: 512.80, change: -2.30, changePercent: -0.45, aum: 12400, high52w: 528.00, low52w: 445.00 },
  { symbol: 'BANKBEES', name: 'Nippon India ETF Bank Nifty', assetClass: 'Equity', expenseRatio: 0.05, nav: 492.15, change: 3.45, changePercent: 0.71, aum: 18200, high52w: 505.00, low52w: 420.00 },
  { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold', assetClass: 'Commodity', expenseRatio: 0.10, nav: 48.90, change: 0.15, changePercent: 0.31, aum: 32000, high52w: 49.50, low52w: 42.80 },
  { symbol: 'LIQUIDBEES', name: 'Nippon India ETF Liquid', assetClass: 'Debt', expenseRatio: 0.05, nav: 1000.05, change: 0.02, changePercent: 0.002, aum: 45000, high52w: 1000.10, low52w: 999.50 },
  { symbol: 'PSUBANKBEES', name: 'Nippon India ETF PSU Bank', assetClass: 'Equity', expenseRatio: 0.10, nav: 62.30, change: -0.85, changePercent: -1.35, aum: 5800, high52w: 68.00, low52w: 48.50 },
];

export default function ETFPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState('ALL');

  const assetClasses = ['ALL', 'Equity', 'Debt', 'Commodity'];
  const filtered = MOCK_ETFS.filter(e => {
    const matchSearch = e.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAsset = assetFilter === 'ALL' || e.assetClass === assetFilter;
    return matchSearch && matchAsset;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-accent" />
          ETFs
        </h1>
        <p className="text-gray-300 mt-1 text-sm font-semibold">Explore exchange-traded funds, track performance and compare yields.</p>
      </div>

      <div className="glass-card p-4 bg-neutral-800 border border-white/5 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex gap-2">
          {assetClasses.map((ac) => (
            <button
              key={ac}
              onClick={() => setAssetFilter(ac)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                assetFilter === ac ? 'bg-accent text-white' : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {ac}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="glass-card bg-neutral-800 border border-white/5 overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-gray-300 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">ETF Name</th>
                <th className="p-4">Asset Class</th>
                <th className="p-4 text-right">NAV (₹)</th>
                <th className="p-4 text-right">Change</th>
                <th className="p-4 text-right">Expense Ratio</th>
                <th className="p-4 text-right">AUM (Cr)</th>
                <th className="p-4 text-right">52W Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-semibold">
              {filtered.map((etf) => {
                const isUp = etf.changePercent >= 0;
                return (
                  <tr key={etf.symbol} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="text-white font-bold block">{etf.symbol}</span>
                      <span className="text-gray-300 text-[10px] mt-0.5 block">{etf.name}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        etf.assetClass === 'Equity' ? 'bg-blue-500/10 text-blue-400' :
                        etf.assetClass === 'Debt' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {etf.assetClass}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-white font-bold">{etf.nav.toFixed(2)}</td>
                    <td className={`p-4 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                      <span>{isUp ? '+' : ''}{etf.changePercent.toFixed(2)}%</span>
                    </td>
                    <td className="p-4 text-right text-gray-300">{etf.expenseRatio}%</td>
                    <td className="p-4 text-right font-mono text-white">{etf.aum.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right text-gray-300 text-[10px] font-mono">
                      {etf.low52w.toFixed(2)} - {etf.high52w.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

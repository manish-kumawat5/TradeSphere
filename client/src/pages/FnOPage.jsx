import { useState } from 'react';
import { Shield, TrendingUp, TrendingDown, Search, Activity, AlertTriangle } from 'lucide-react';

const MOCK_FNO = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', expiry: '25 Jul 2026', ltp: 2456.80, change: 12.45, changePercent: 0.51, premium: 156.75, oi: 2845000, volume: 12500000 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', expiry: '25 Jul 2026', ltp: 3892.45, change: -8.20, changePercent: -0.21, premium: 89.30, oi: 1920000, volume: 8700000 },
  { symbol: 'INFY', name: 'Infosys Ltd.', expiry: '25 Jul 2026', ltp: 1678.30, change: 5.75, changePercent: 0.34, premium: 72.50, oi: 2150000, volume: 9400000 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', expiry: '25 Jul 2026', ltp: 1542.60, change: -3.90, changePercent: -0.25, premium: 68.25, oi: 3280000, volume: 15600000 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', expiry: '25 Jul 2026', ltp: 1123.90, change: 8.35, changePercent: 0.75, premium: 45.80, oi: 2450000, volume: 11200000 },
  { symbol: 'SBIN', name: 'State Bank of India', expiry: '25 Jul 2026', ltp: 750.00, change: -2.10, changePercent: -0.28, premium: 38.45, oi: 1980000, volume: 7800000 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', expiry: '25 Jul 2026', ltp: 6800.00, change: 28.50, changePercent: 0.42, premium: 245.60, oi: 1560000, volume: 5200000 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', expiry: '25 Jul 2026', ltp: 480.00, change: -1.15, changePercent: -0.24, premium: 22.30, oi: 1240000, volume: 4100000 },
];

export default function FnOPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('futures');

  const filtered = MOCK_FNO.filter(s =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            F&O Derivatives
          </h1>
          <p className="text-gray-300 mt-1 text-sm font-semibold">Trade futures and options with live market data.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="flex gap-2">
          {['futures', 'options', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                view === tab ? 'bg-accent text-white' : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search symbol..."
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
                <th className="p-4 pl-6">Contract</th>
                <th className="p-4">Expiry</th>
                <th className="p-4 text-right">Spot Price</th>
                <th className="p-4 text-right">Change</th>
                <th className="p-4 text-right">Premium</th>
                <th className="p-4 text-right">Open Interest</th>
                <th className="p-4 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-semibold">
              {filtered.map((item) => {
                const isUp = item.changePercent >= 0;
                return (
                  <tr key={item.symbol} className="hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="p-4 pl-6">
                      <span className="text-white font-bold block">{item.symbol}</span>
                      <span className="text-gray-300 text-[10px] mt-0.5 block">{item.name}</span>
                    </td>
                    <td className="p-4 text-gray-300 text-xs">{item.expiry}</td>
                    <td className="p-4 text-right font-mono text-white font-bold">₹{item.ltp.toFixed(2)}</td>
                    <td className={`p-4 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                      <span className="flex items-center justify-end gap-1">
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-white">₹{item.premium.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-white">{(item.oi / 100000).toFixed(1)}L</td>
                    <td className="p-4 text-right font-mono text-gray-300">{(item.volume / 100000).toFixed(1)}L</td>
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

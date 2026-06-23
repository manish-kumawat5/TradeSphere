import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, BarChart3, Search, RefreshCw, Activity } from 'lucide-react';
import api from '../lib/api';
import { formatINR, formatPct } from '../utils/formatters';

const INDEX_SYMBOLS = ['NIFTY50', 'SENSEX', 'BANKNIFTY'];
const POPULAR_STOCKS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'SBIN', 'BAJFINANCE'];

export default function MarketsPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const allSymbols = [...INDEX_SYMBOLS, ...POPULAR_STOCKS];
        const { data } = await api.get('/market/quotes', { params: { symbols: allSymbols.join(',') } });
        if (data.success) setPrices(data.data);
      } catch (err) {
        console.error('Failed to load market data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, []);

  const indices = INDEX_SYMBOLS.map(sym => ({
    symbol: sym,
    price: prices[sym] || 0,
  }));

  const stocks = useMemo(() => {
    return POPULAR_STOCKS.map(sym => {
      const price = prices[sym] || 0;
      const basePrice = sym === 'RELIANCE' ? 2456.80 : sym === 'TCS' ? 3892.45 : sym === 'INFY' ? 1678.30 : sym === 'HDFCBANK' ? 1542.60 : sym === 'ICICIBANK' ? 1123.90 : sym === 'WIPRO' ? 480.00 : sym === 'SBIN' ? 750.00 : 6800.00;
      const change = price - basePrice;
      const changePercent = (change / basePrice) * 100;
      return { symbol: sym, price, change, changePercent };
    });
  }, [prices]);

  const filteredStocks = stocks.filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-accent" />
            Markets
          </h1>
          <p className="text-gray-300 mt-1 text-sm">Live market data, indices, and top movers.</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {indices.map((index) => {
          const base = index.symbol === 'NIFTY50' ? 22850.50 : index.symbol === 'SENSEX' ? 75120.30 : 49200.80;
          const change = index.price - base;
          const isUp = change >= 0;
          return (
            <div key={index.symbol} className="glass-card p-6 bg-[#0F172A] border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-xs font-bold uppercase tracking-wider">{index.symbol}</span>
                <Activity className={`w-5 h-5 ${isUp ? 'text-accent' : 'text-sell'}`} />
              </div>
              <p className="text-2xl font-black text-white font-mono">₹{formatINR(index.price)}</p>
              <p className={`text-sm font-bold font-mono mt-1 ${isUp ? 'text-accent' : 'text-sell'}`}>
                {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{((change / base) * 100).toFixed(2)}%)
              </p>
            </div>
          );
        })}
      </div>

      <div className="glass-card bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Popular Stocks</h2>
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
        {loading ? (
          <div className="p-10 text-center text-gray-300 text-sm font-semibold">Loading market data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-300 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Symbol</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-right">Change</th>
                  <th className="p-4 text-right">Change %</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-semibold">
                {filteredStocks.map((stock) => {
                  const isUp = stock.changePercent >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/stock/${stock.symbol}`)}>
                      <td className="p-4 pl-6 font-bold text-white">{stock.symbol}</td>
                      <td className="p-4 text-right font-mono text-white">₹{formatINR(stock.price)}</td>
                      <td className={`p-4 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                        {isUp ? '+' : ''}{stock.change.toFixed(2)}
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-lg border border-white/10 text-white hover:border-accent hover:text-accent transition-colors">
                          Trade <TrendingUp className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

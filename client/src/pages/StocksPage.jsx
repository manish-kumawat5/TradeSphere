import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Search, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../lib/api';
import { formatINR } from '../utils/formatters';

const ALL_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy & Conglomerate', basePrice: 2456.80 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', basePrice: 3892.45 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Information Technology', basePrice: 1678.30 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financial Services', basePrice: 1542.60 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Financial Services', basePrice: 1123.90 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'Information Technology', basePrice: 480.00 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', basePrice: 750.00 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'Financial Services', basePrice: 6800.00 },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 185.50 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', basePrice: 415.60 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', basePrice: 175.20 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', basePrice: 178.40 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', basePrice: 172.50 },
];

export default function StocksPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const symbols = ALL_STOCKS.map(s => s.symbol).join(',');
        const { data } = await api.get('/market/quotes', { params: { symbols } });
        if (data.success) setPrices(data.data);
      } catch (err) {
        console.error('Failed to load stock prices', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const sectors = useMemo(() => {
    const set = new Set(ALL_STOCKS.map(s => s.sector));
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredStocks = useMemo(() => {
    return ALL_STOCKS.filter(s => {
      const matchSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = sectorFilter === 'ALL' || s.sector === sectorFilter;
      return matchSearch && matchSector;
    }).map(s => {
      const price = prices[s.symbol] || s.basePrice;
      const change = price - s.basePrice;
      const changePercent = (change / s.basePrice) * 100;
      return { ...s, price, change, changePercent };
    });
  }, [prices, searchQuery, sectorFilter]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-accent" />
          Stocks
        </h1>
        <p className="text-gray-300 mt-1 text-sm font-semibold">Browse and trade individual equities with live price feeds.</p>
      </div>

      <div className="glass-card p-4 bg-neutral-800 border border-white/5 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4">
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="w-full md:w-56 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-accent font-semibold"
        >
          {sectors.map(s => (
            <option key={s} value={s} className="bg-neutral-800">{s === 'ALL' ? 'All Sectors' : s}</option>
          ))}
        </select>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by symbol or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent font-semibold"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-transparent border-t-accent rounded-full animate-spin mb-3" />
          <p className="text-gray-300 text-sm font-semibold">Loading stock data...</p>
        </div>
      ) : (
        <div className="glass-card bg-neutral-800 border border-white/5 overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-300 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Company</th>
                  <th className="p-4">Sector</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-right">Change</th>
                  <th className="p-4 text-right">Change %</th>
                  <th className="p-4 text-center">Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-semibold">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-300">No stocks match your filters.</td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const isUp = stock.changePercent >= 0;
                    return (
                      <tr key={stock.symbol} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/stock/${stock.symbol}`)}>
                        <td className="p-4 pl-6">
                          <span className="text-white font-bold block">{stock.symbol}</span>
                          <span className="text-gray-300 text-[10px] mt-0.5 block">{stock.name}</span>
                        </td>
                        <td className="p-4 text-gray-300 text-xs">{stock.sector}</td>
                        <td className="p-4 text-right font-mono text-white font-bold">${formatINR(stock.price)}</td>
                        <td className={`p-4 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                          {isUp ? '+' : ''}{stock.change.toFixed(2)}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                          <span className="flex items-center justify-end gap-1">
                            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-white/10 text-white hover:border-accent hover:text-accent transition-colors">
                            Trade
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useLivePrices from '../hooks/useLivePrices';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie as RechartsPie, Cell
} from 'recharts';
import {
  TrendingUp, LogOut, Wallet, BarChart3, Star, ArrowUpRight,
  ArrowDownRight, Search, Bell, Activity, Sun, Moon,
  MessageSquare, Send, Sparkles, Sliders, Award,
  Globe, Briefcase, Plus, Minus, Info, X, ChevronUp, ChevronDown, Check,
  Newspaper, RefreshCw, Flame, PieChart, ShieldAlert, Settings, HelpCircle
} from 'lucide-react';
import OrderModal from '../components/OrderModal';

// Mock news items for widgets
const MOCK_NEWS = [
  { id: 1, title: 'RBI maintains status quo on repo rates for 6th consecutive meeting', source: 'FinTech Daily', time: '10m ago' },
  { id: 2, title: 'TCS bags $1.5 billion deal from UK insurance provider', source: 'StockWire', time: '45m ago' },
  { id: 3, title: 'Gold prices hit all-time high amid global rate cut expectations', source: 'BullionWatch', time: '2h ago' },
  { id: 4, title: 'Reliance Retail expands offline footprints with 120 new premium outlets', source: 'BizJournal', time: '3h ago' }
];

// Mock sectors
const MOCK_SECTORS = [
  { name: 'Information Technology', change: 2.45, count: 18 },
  { name: 'Financial Services', change: -0.58, count: 24 },
  { name: 'Energy & Conglomerates', change: 1.88, count: 12 },
  { name: 'Automotive & EV', change: -1.22, count: 8 },
  { name: 'Healthcare & Pharma', change: 0.95, count: 15 }
];

// Popular stocks initial metadata
const POPULAR_STOCKS_METADATA = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', logoText: 'RI', sparkline: [2420, 2435, 2410, 2450, 2465, 2445, 2456.80] },
  { symbol: 'TCS', name: 'Tata Consultancy Services', logoText: 'TC', sparkline: [3810, 3840, 3825, 3860, 3895, 3880, 3892.45] },
  { symbol: 'INFY', name: 'Infosys Ltd.', logoText: 'IF', sparkline: [1620, 1645, 1610, 1660, 1680, 1650, 1678.30] },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', logoText: 'HD', sparkline: [1510, 1530, 1505, 1525, 1545, 1535, 1542.60] }
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Core Data State
  const [portfolioData, setPortfolioData] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [moversTab, setMoversTab] = useState('gainers');
  const [moversSort, setMoversSort] = useState({ column: 'changePercent', asc: false });
  const [moversPage, setMoversPage] = useState(1);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  
  // Custom Dashboard Widgets Config
  const [visibleWidgets, setVisibleWidgets] = useState({
    sentiment: true,
    fearGreed: true,
    sectors: true,
    news: true,
    allocation: true,
    riskScore: true,
  });
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  // Quick Trade Panel Sidebar State
  const [quickTradeOpen, setQuickTradeOpen] = useState(false);
  const [quickTradeSymbol, setQuickTradeSymbol] = useState('RELIANCE');
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  // AI Assistant Widget State
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState([
    { role: 'assistant', text: 'Hi! I am TradeSphere AI. Ask me about your portfolio balance, top gainers, or active stocks.' }
  ]);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const { data } = await api.get(`/market/search?q=${encodeURIComponent(searchQuery)}`);
          if (data.success) {
            setSearchResults(data.data);
            setShowSearchDropdown(true);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch Core Portfolio & Watchlist Data
  async function fetchData() {
    try {
      const [portfolioRes, watchlistRes, profileRes] = await Promise.all([
        api.get('/orders/portfolio'),
        api.get('/watchlist'),
        api.get('/user/profile')
      ]);

      if (portfolioRes.data.success) {
        setPortfolioData(portfolioRes.data.data);
      }
      if (watchlistRes.data.success) {
        setWatchlist(watchlistRes.data.data);
      }
      if (profileRes.data.success) {
        setWalletBalance(profileRes.data.data.walletBalance);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load portfolio statistics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Setup symbols to subscribe for Live Prices
  const popularSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];
  const indexSymbols = ['NIFTY50', 'SENSEX', 'BANKNIFTY'];
  const holdingsSymbols = portfolioData?.holdings?.map(h => h.symbol) || [];
  const watchlistSymbols = watchlist?.map(w => w.symbol) || [];

  const allSymbols = useMemo(() => {
    const set = new Set([...popularSymbols, ...indexSymbols, ...holdingsSymbols, ...watchlistSymbols]);
    return Array.from(set);
  }, [holdingsSymbols, watchlistSymbols]);

  const { prices: livePrices, prevPrices } = useLivePrices(allSymbols);

  // Recharts simulated growth data (historical area chart points)
  const portfolioHistory = useMemo(() => {
    const points = [];
    const baseVal = 108000;
    const currentVal = 124520;
    const diff = currentVal - baseVal;
    
    for (let i = 0; i < 7; i++) {
      const ratio = i / 6;
      // create a nice smooth S-curve growth with minor fluctuations
      const fluctuation = Math.sin(ratio * Math.PI) * 4000 + (Math.random() - 0.5) * 1200;
      points.push({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: Math.floor(baseVal + ratio * diff + fluctuation)
      });
    }
    return points;
  }, [portfolioData]);

  // Handle Logout
  async function handleLogout() {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  // Handle Wallet Fund Deposit
  async function handleDepositSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      return toast.error('Please enter a valid amount');
    }
    try {
      const { data } = await api.post('/funds/add', { amount });
      if (data.success) {
        setWalletBalance(data.newBalance);
        toast.success(`Successfully deposited ₹${amount.toLocaleString('en-IN')}`);
        setIsDepositOpen(false);
        setDepositAmount('');
        fetchData();
      }
    } catch {
      toast.error('Deposit transaction failed');
    }
  }

  // Handle Wallet Fund Withdrawal
  async function handleWithdraw() {
    const amount = parseFloat(prompt('Enter amount to withdraw (₹):'));
    if (isNaN(amount) || amount <= 0) return;
    if (amount > (walletBalance || 0)) {
      return toast.error('Insufficient wallet balance');
    }
    try {
      const { data } = await api.post('/funds/withdraw', { amount });
      if (data.success) {
        setWalletBalance(data.newBalance);
        toast.success(`Withdrew ₹${amount.toLocaleString('en-IN')} successfully`);
        fetchData();
      }
    } catch {
      toast.error('Withdrawal transaction failed');
    }
  }

  // Real-time market indices mapping
  const indexNifty = livePrices['NIFTY50'] || 22850.50;
  const prevNifty = prevPrices['NIFTY50'] || indexNifty;
  const niftyChange = indexNifty - 22850.50;
  const niftyChangePercent = (niftyChange / 22850.50) * 100;

  const indexSensex = livePrices['SENSEX'] || 75120.30;
  const prevSensex = prevPrices['SENSEX'] || indexSensex;
  const sensexChange = indexSensex - 75120.30;
  const sensexChangePercent = (sensexChange / 75120.30) * 100;

  const indexBankNifty = livePrices['BANKNIFTY'] || 49200.80;
  const prevBankNifty = prevPrices['BANKNIFTY'] || indexBankNifty;
  const bankNiftyChange = indexBankNifty - 49200.80;
  const bankNiftyChangePercent = (bankNiftyChange / 49200.80) * 100;

  // Build the list of simulated market movers based on live quotes or presets
  const marketMovers = useMemo(() => {
    const stocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
      { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'IT' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Finance' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Finance' },
      { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT' },
      { symbol: 'SBIN', name: 'State Bank of India', sector: 'Finance' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance' }
    ];

    return stocks.map(stock => {
      const price = livePrices[stock.symbol] || 1500;
      const prevPrice = prevPrices[stock.symbol] || price;
      
      // Calculate daily change based on starting base Price
      let base = 1500;
      if (stock.symbol === 'RELIANCE') base = 2456.80;
      if (stock.symbol === 'TCS') base = 3892.45;
      if (stock.symbol === 'INFY') base = 1678.30;
      if (stock.symbol === 'HDFCBANK') base = 1542.60;
      if (stock.symbol === 'ICICIBANK') base = 1123.90;
      if (stock.symbol === 'WIPRO') base = 480.00;
      if (stock.symbol === 'SBIN') base = 750.00;
      if (stock.symbol === 'BAJFINANCE') base = 6800.00;

      const change = price - base;
      const changePercent = (change / base) * 100;
      const volume = Math.floor(1200000 + (price * 300));
      const sparklineData = Array.from({ length: 6 }, (_, i) => ({ value: base + (change * (i / 5)) + (Math.random() - 0.5) * 20 }));

      return {
        ...stock,
        price,
        change,
        changePercent,
        volume,
        sparklineData
      };
    });
  }, [livePrices, prevPrices]);

  // Split into tabs
  const filteredMovers = useMemo(() => {
    let list = [...marketMovers];
    if (moversTab === 'gainers') {
      list = list.filter(m => m.changePercent > 0);
    } else if (moversTab === 'losers') {
      list = list.filter(m => m.changePercent < 0);
    } else if (moversTab === 'active') {
      // Sort by volume descending
      list.sort((a, b) => b.volume - a.volume);
    } else if (moversTab === 'shokers') {
      // Volume shockers (just random filter logic for visual layout)
      list = list.filter(m => Math.abs(m.changePercent) > 1);
    }

    // Sort column
    const { column, asc } = moversSort;
    list.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (typeof valA === 'string') {
        return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return asc ? valA - valB : valB - valA;
    });

    return list;
  }, [marketMovers, moversTab, moversSort]);

  // Paginated movers
  const paginatedMovers = useMemo(() => {
    const start = (moversPage - 1) * 4;
    return filteredMovers.slice(start, start + 4);
  }, [filteredMovers, moversPage]);

  // User details
  const summary = portfolioData?.summary || {
    balance: 0,
    totalInvested: 108000,
    currentValue: 124520,
    totalPnL: 16520,
    totalPnLPercent: 12.4,
    up: true
  };
  const holdings = portfolioData?.holdings || [];

  // Toggle sorting in table
  const handleSort = (col) => {
    setMoversSort(prev => ({
      column: col,
      asc: prev.column === col ? !prev.asc : false
    }));
  };

  // AI Assistant Chat Submit
  const handleAiAssistantSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage = { role: 'user', text: aiInput };
    setAiChat(prev => [...prev, userMessage]);
    const query = aiInput.toLowerCase().trim();
    setAiInput('');

    // Formulate a smart response based on local data
    setTimeout(() => {
      let botResponse = '';
      if (query.includes('balance') || query.includes('funds') || query.includes('cash')) {
        botResponse = `Your current wallet balance is ₹${(walletBalance !== null ? walletBalance : summary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. You can deposit or withdraw funds instantly from the Investment Overview hero card.`;
      } else if (query.includes('portfolio') || query.includes('value') || query.includes('returns')) {
        botResponse = `Your total wealth value is ₹${((walletBalance || 0) + summary.currentValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Your holdings represent ₹${summary.currentValue.toLocaleString('en-IN')} with an overall gain of +${summary.totalPnLPercent.toFixed(2)}% (₹${summary.totalPnL.toLocaleString('en-IN')}).`;
      } else if (query.includes('gainer') || query.includes('loser') || query.includes('movers')) {
        const topGainer = [...marketMovers].sort((a, b) => b.changePercent - a.changePercent)[0];
        botResponse = `The top gainer in simulated assets today is ${topGainer.symbol} at ₹${topGainer.price.toFixed(2)} (+${topGainer.changePercent.toFixed(2)}%).`;
      } else if (query.includes('buy') || query.includes('sell') || query.includes('trade')) {
        botResponse = "To place an order, click the BUY/SELL buttons in the popular stocks grid or open the 'Quick Trade Panel' from the top tools widget sidebar.";
      } else {
        botResponse = "I have scanned the real-time tickers. The Indian markets are showing minor bullish consolidation, with Nifty trading around " + indexNifty.toFixed(2) + ". Let me know if you want to pull a stock detail chart or review settings!";
      }

      setAiChat(prev => [...prev, { role: 'assistant', text: botResponse }]);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-accent animate-pulse mb-3" />
        <p className="text-slate-500 dark:text-muted font-semibold text-sm">Loading TradeSphere Workspace...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-300 ${isDark ? 'dark bg-dark' : 'bg-slate-50'}`}>
      
      {/* ── SECTION 1: TOP STICKY NAVIGATION BAR (72px) ────────────────────── */}
      <nav className="sticky top-0 z-40 h-[72px] bg-white/80 dark:bg-dark/80 backdrop-blur-xl border-b border-slate-100 dark:border-surface-border transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Left Side: Logo & Main Navigation Links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">TradeSphere</span>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {['Markets', 'Stocks', 'F&O', 'Mutual Funds', 'ETF', 'IPO'].map((item) => (
                <button
                  key={item}
                  className="px-3.5 py-2 text-[14px] font-semibold text-slate-600 dark:text-muted-light hover:text-accent dark:hover:text-accent transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-surface-light/40"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Center: Large Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-lg hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-muted" />
            <input
              type="text"
              placeholder="Search stocks, ETFs, mutual funds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(searchResults.length > 0)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-surface border border-slate-200 dark:border-surface-border rounded-2xl text-[14px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-muted focus:outline-none focus:border-accent dark:focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
              id="search-stocks-input"
            />
            {showSearchDropdown && (
              <div className="absolute top-[52px] left-0 right-0 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                <div className="py-2">
                  {searchResults.map((res) => (
                    <Link
                      key={res.symbol}
                      to={`/stock/${res.symbol}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-surface-light/60 transition-colors"
                      onClick={() => setShowSearchDropdown(false)}
                    >
                      <div>
                        <p className="text-slate-900 dark:text-white font-bold text-sm">{res.symbol}</p>
                        <p className="text-slate-400 dark:text-muted text-xs">{res.name}</p>
                      </div>
                      <span className="text-slate-500 dark:text-muted text-xs bg-slate-100 dark:bg-dark-50 px-2 py-1 rounded border border-slate-200 dark:border-surface-border uppercase font-semibold">
                        {res.sector}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Widgets & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-100 dark:border-surface-border bg-slate-50/50 dark:bg-surface-light/20 hover:bg-slate-100 dark:hover:bg-surface-light/40 text-slate-500 dark:text-muted-light transition-all"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="p-2.5 rounded-xl border border-slate-100 dark:border-surface-border bg-slate-50/50 dark:bg-surface-light/20 hover:bg-slate-100 dark:hover:bg-surface-light/40 text-slate-500 dark:text-muted-light relative transition-all"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-ping" />
            </button>

            {/* Profile Avatar Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1 border border-slate-100 dark:border-surface-border rounded-full hover:bg-slate-50 dark:hover:bg-surface-light/30 transition-all"
              >
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center border border-accent/20">
                  <span className="text-accent font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <span className="text-slate-800 dark:text-white font-semibold text-sm pr-2 hidden sm:inline-block">{user?.name?.split(' ')[0] || 'Investor'}</span>
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-52 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border rounded-2xl shadow-xl z-50 py-2 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-surface-border mb-1">
                      <p className="text-slate-900 dark:text-white font-bold text-sm">{user?.name}</p>
                      <p className="text-slate-400 dark:text-muted text-xs truncate">{user?.email}</p>
                    </div>
                    {[
                      { label: 'Profile', path: '/profile', icon: Settings },
                      { label: 'Portfolio', path: '/dashboard', icon: Briefcase },
                      { label: 'Wallet Settings', onClick: handleWithdraw, icon: Wallet },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setShowProfileDropdown(false);
                          if (item.onClick) item.onClick();
                          else navigate(item.path);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-slate-700 dark:text-muted-light hover:bg-slate-50 dark:hover:bg-surface-light/40 hover:text-accent transition-colors text-left"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-sell hover:bg-sell/5 border-t border-slate-50 dark:border-surface-border/50 transition-colors text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SECTION 2: LIVE MARKET INDEX TICKER (48px) ──────────────────────── */}
      <div className="w-full h-12 bg-white dark:bg-surface/50 border-b border-slate-100 dark:border-surface-border/50 overflow-hidden flex items-center transition-colors duration-300">
        <div className="w-full flex items-center justify-between max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Scrollable container for marquee indices */}
          <div className="flex items-center gap-8 w-full overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { name: 'NIFTY 50', value: indexNifty, change: niftyChange, changePercent: niftyChangePercent, prev: prevNifty },
              { name: 'BANK NIFTY', value: indexBankNifty, change: bankNiftyChange, changePercent: bankNiftyChangePercent, prev: prevBankNifty },
              { name: 'SENSEX', value: indexSensex, change: sensexChange, changePercent: sensexChangePercent, prev: prevSensex },
              { name: 'FINNIFTY', value: 21250.40, change: 104.20, changePercent: 0.49, prev: 21250.40 },
              { name: 'MIDCAP NIFTY', value: 10850.80, change: -45.10, changePercent: -0.41, prev: 10850.80 }
            ].map((idx) => {
              const isUp = idx.change >= 0;
              const isUpdated = idx.value !== idx.prev;
              return (
                <div
                  key={idx.name}
                  className="flex items-center gap-2 text-xs font-semibold shrink-0"
                >
                  <span className="text-slate-400 dark:text-muted uppercase tracking-wider">{idx.name}</span>
                  <span
                    className={`font-mono text-slate-800 dark:text-white transition-all duration-300 rounded px-1 ${
                      isUpdated ? (isUp ? 'bg-accent/20 text-accent' : 'bg-sell/25 text-sell') : ''
                    }`}
                  >
                    ₹{idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isUp ? 'bg-accent/10 text-accent' : 'bg-sell/10 text-sell'
                    }`}
                  >
                    {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 shrink-0 border-l border-slate-100 dark:border-surface-border pl-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-slate-400 dark:text-muted font-bold tracking-tight uppercase">Live Connection</span>
          </div>
        </div>
      </div>

      {/* ── MAIN 12-COLUMN RESPONSIBLE GRID LAYOUT ─────────────────────────── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Dashboard Title & Welcome Banner */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Trading Terminal
            </h1>
            <p className="text-slate-500 dark:text-muted text-sm mt-1">
              Hi, {user?.name?.split(' ')[0] || 'Investor'}. Explore assets, manage your custom widgets, and execute transactions.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWidgetConfig(!showWidgetConfig)}
              className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-xs text-slate-700 dark:text-white border-slate-200 dark:border-surface-border shadow-sm bg-white dark:bg-surface hover:bg-slate-50 dark:hover:bg-surface-light/40"
            >
              <Sliders className="w-3.5 h-3.5 text-accent" />
              Customize Widgets
            </button>
            <button
              onClick={() => setQuickTradeOpen(true)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-xs shadow-md shadow-accent/20"
            >
              <Flame className="w-3.5 h-3.5 animate-pulse text-white" />
              Quick Trade
            </button>
          </div>
        </div>

        {/* Dashboard Widget Config Checkbox Banner */}
        <AnimatePresence>
          {showWidgetConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-accent" />
                  Toggle Dashboard Widgets
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.keys(visibleWidgets).map((key) => (
                    <label
                      key={key}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer text-xs font-semibold select-none transition-all ${
                        visibleWidgets[key]
                          ? 'border-accent bg-accent/5 text-accent dark:border-accent dark:bg-accent/5'
                          : 'border-slate-200 bg-white text-slate-500 dark:border-surface-border dark:bg-dark-50 dark:text-muted'
                      }`}
                    >
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <input
                        type="checkbox"
                        checked={visibleWidgets[key]}
                        onChange={() => setVisibleWidgets(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="hidden"
                      />
                      {visibleWidgets[key] ? <Check className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5 opacity-55" />}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════════ LEFT GRID COLUMN (Span 8) ════════ */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ── SECTION 3: INVESTMENT OVERVIEW HERO CARD ──────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
              
              {/* Portfolio Value Summary Info */}
              <div className="md:col-span-5 flex flex-col justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-muted uppercase tracking-wider block mb-1">
                    Current Portfolio Value
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight font-mono">
                    ₹{((walletBalance || 0) + summary.currentValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h2>
                  
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold py-1 border-b border-slate-100 dark:border-surface-border/50">
                      <span className="text-slate-400 dark:text-muted">Total Returns</span>
                      <span className="text-accent font-bold font-mono">+{summary.totalPnLPercent.toFixed(2)}% (+₹{summary.totalPnL.toLocaleString('en-IN')})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold py-1 border-b border-slate-100 dark:border-surface-border/50">
                      <span className="text-slate-400 dark:text-muted">Invested Capital</span>
                      <span className="text-slate-800 dark:text-white font-mono">₹{summary.totalInvested.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold py-1">
                      <span className="text-slate-400 dark:text-muted">Available Cash</span>
                      <span className="text-slate-800 dark:text-white font-mono">₹{(walletBalance !== null ? walletBalance : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setIsDepositOpen(true)}
                    className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md shadow-accent/20 shrink-0"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="btn-secondary py-2.5 px-4 text-xs font-bold border-slate-200 dark:border-surface-border text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-surface-light/40 grow text-center justify-center"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Portfolio Growth Graph Area */}
              <div className="md:col-span-7 h-[220px] bg-slate-50 dark:bg-dark-50 rounded-2xl p-3 border border-slate-100 dark:border-surface-border/50 flex flex-col justify-between relative z-10">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-muted flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    Portfolio Growth (7D)
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-muted bg-slate-200 dark:bg-surface border border-slate-300 dark:border-surface-border px-1.5 py-0.5 rounded uppercase">
                    Equities
                  </span>
                </div>
                
                <div className="w-full flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D09C" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#00D09C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#8A8F98" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8A8F98" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? '#131722' : '#ffffff',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: isDark ? '#ffffff' : '#0B0E11'
                        }}
                        formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Valuation']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#00D09C" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* ── SECTION 4: POPULAR STOCKS & WATCHLIST SPLIT ─────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <Flame className="w-4.5 h-4.5 text-amber-500 fill-amber-500/20" />
                  Popular Stocks
                </h2>
                <span className="text-xs font-semibold text-slate-400 dark:text-muted italic">
                  Inspired by Kite & Robinhood
                </span>
              </div>

              {/* 4 Premium Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {POPULAR_STOCKS_METADATA.map((meta) => {
                  const price = livePrices[meta.symbol] || 1000;
                  const prev = prevPrices[meta.symbol] || price;
                  const isUp = price >= prev;
                  const priceDiff = price - prev;
                  const pct = prev > 0 ? (priceDiff / prev) * 100 : 0.00;

                  // Sparkline chart data format
                  const sparkData = meta.sparkline.map((v, i) => ({ value: i === 6 ? price : v }));

                  return (
                    <motion.div
                      key={meta.symbol}
                      whileHover={{ scale: 1.03, y: -4 }}
                      onClick={() => navigate(`/stock/${meta.symbol}`)}
                      className="glass-card-hover p-4 cursor-pointer flex flex-col justify-between h-[175px] bg-white dark:bg-surface border border-slate-100 dark:border-surface-border"
                    >
                      <div className="flex items-start justify-between">
                        {/* Logo representation */}
                        <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 dark:bg-dark-50 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-white border border-slate-200 dark:border-surface-border">
                          {meta.logoText}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-muted uppercase">
                          {meta.symbol}
                        </span>
                      </div>

                      <div className="my-2.5">
                        <p className="text-xs font-bold text-slate-500 dark:text-muted truncate">
                          {meta.name}
                        </p>
                        <p className="text-md font-bold text-slate-800 dark:text-white font-mono mt-0.5">
                          ₹{price.toFixed(2)}
                        </p>
                        <p className={`text-[11px] font-bold mt-0.5 flex items-center gap-0.5 ${isUp ? 'text-accent' : 'text-sell'}`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isUp ? '+' : ''}{pct.toFixed(2)}%
                        </p>
                      </div>

                      {/* Sparkline chart mini area */}
                      <div className="w-full h-8 overflow-hidden opacity-80 mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkData}>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={isUp ? '#00D09C' : '#FF5252'}
                              strokeWidth={1.5}
                              fill={isUp ? 'rgba(0,208,156,0.05)' : 'rgba(255,82,82,0.05)'}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 5: MARKET MOVERS TABLE CARD ────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Top Movers Today
                  </h2>
                  <p className="text-slate-400 dark:text-muted text-xs mt-0.5">
                    Sortable and paginated real-time indicators
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-dark-50 p-1 rounded-xl border border-slate-200 dark:border-surface-border/50 w-fit">
                  {[
                    { id: 'gainers', label: 'Gainers' },
                    { id: 'losers', label: 'Losers' },
                    { id: 'active', label: 'Most Active' },
                    { id: 'shokers', label: 'Shockers' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMoversTab(tab.id);
                        setMoversPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        moversTab === tab.id
                          ? 'bg-white dark:bg-surface text-accent dark:text-accent shadow-sm border border-slate-200 dark:border-surface-border'
                          : 'text-slate-500 dark:text-muted-light hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-surface-border/50 text-slate-400 dark:text-muted text-[11px] font-bold uppercase tracking-wider">
                      <th className="pb-3 cursor-pointer" onClick={() => handleSort('symbol')}>Company</th>
                      <th className="pb-3 text-center">Sparkline</th>
                      <th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('price')}>Market Price</th>
                      <th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('changePercent')}>Daily Change</th>
                      <th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('volume')}>Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-surface-border/40 font-semibold text-xs text-slate-700 dark:text-muted-light">
                    {paginatedMovers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-muted italic">
                          No items match the active filter tab today.
                        </td>
                      </tr>
                    ) : (
                      paginatedMovers.map((mover) => {
                        const isUp = mover.changePercent >= 0;
                        return (
                          <tr
                            key={mover.symbol}
                            onClick={() => navigate(`/stock/${mover.symbol}`)}
                            className="group hover:bg-slate-50/50 dark:hover:bg-surface-light/30 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5">
                              <span className="text-slate-900 dark:text-white font-bold group-hover:text-accent transition-colors block">
                                {mover.symbol}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-muted mt-0.5 block">{mover.name}</span>
                            </td>
                            
                            <td className="py-3.5 align-middle">
                              <div className="w-20 h-6 mx-auto opacity-75">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={mover.sparklineData}>
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke={isUp ? '#00D09C' : '#FF5252'}
                                      strokeWidth={1}
                                      fill={isUp ? 'rgba(0,208,156,0.02)' : 'rgba(255,82,82,0.02)'}
                                      dot={false}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </td>

                            <td className="py-3.5 text-right font-mono text-slate-800 dark:text-white">
                              ₹{mover.price.toFixed(2)}
                            </td>

                            <td className={`py-3.5 text-right font-mono font-bold ${isUp ? 'text-accent' : 'text-sell'}`}>
                              <div>{isUp ? '+' : ''}{mover.change.toFixed(2)}</div>
                              <div className="text-[10px] opacity-75">{isUp ? '+' : ''}{mover.changePercent.toFixed(2)}%</div>
                            </td>

                            <td className="py-3.5 text-right font-mono text-slate-500 dark:text-muted">
                              {mover.volume.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-surface-border/50 pt-4 mt-2">
                <span className="text-slate-400 dark:text-muted text-[11px] font-bold">
                  Showing {paginatedMovers.length > 0 ? (moversPage - 1) * 4 + 1 : 0}-{Math.min(moversPage * 4, filteredMovers.length)} of {filteredMovers.length} stocks
                </span>
                
                <div className="flex gap-2">
                  <button
                    disabled={moversPage === 1}
                    onClick={() => setMoversPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-surface-border text-slate-500 dark:text-muted-light disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-surface-light/40 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 rotate-270" />
                  </button>
                  <button
                    disabled={moversPage * 4 >= filteredMovers.length}
                    onClick={() => setMoversPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-surface-border text-slate-500 dark:text-muted-light disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-surface-light/40 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 rotate-270" />
                  </button>
                </div>
              </div>
            </motion.div>

          </div>

          {/* ════════ RIGHT GRID COLUMN (Span 4) ════════ */}
          <div className="lg:col-span-4 space-y-8">

            {/* ── SECTION 6: PRODUCTS & TOOLS WIDGET PANEL ───────────────────── */}
            <div className="glass-card p-6 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
              <h2 className="text-md font-bold text-slate-900 dark:text-white tracking-tight mb-4.5 flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-accent" />
                Products & Tools
              </h2>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { title: 'IPO Explorer', desc: 'Invest in upcoming public offerings', count: '3 Open', path: '/funds', icon: Star, color: 'text-amber-500' },
                  { title: 'ETF Screener', desc: 'Filter index tracker performance', path: '/funds', icon: Briefcase, color: 'text-blue-500' },
                  { title: 'Bond Market', desc: 'Secure high-yield corporate bonds', path: '/funds', icon: Globe, color: 'text-teal-500' },
                  { title: 'Options Chain', desc: 'Real-time F&O call/put indexes', path: '/funds', icon: TrendingUp, color: 'text-accent' },
                  { title: 'Stock Screener', desc: 'Advanced analysis filters', path: '/tools/sip-calculator', icon: BarChart3, color: 'text-pink-500' },
                  { title: 'Mutual Fund', desc: 'Explore SIP & lumpsum explorer', path: '/funds', icon: PieChart, color: 'text-indigo-500' }
                ].map((tool) => (
                  <div
                    key={tool.title}
                    onClick={() => navigate(tool.path)}
                    className="p-3 bg-slate-50 dark:bg-dark-50 hover:bg-slate-100 dark:hover:bg-surface-light/30 border border-slate-200 dark:border-surface-border rounded-xl cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between min-h-[110px] group"
                    style={{ borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    <div className="flex items-start justify-between">
                      <tool.icon className={`w-4.5 h-4.5 ${tool.color}`} />
                      {tool.count && (
                        <span className="text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full">
                          {tool.count}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-accent transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-muted mt-0.5 leading-tight truncate">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ADDITIONAL WIDGETS COLUMN ──────────────────────────────────── */}
            
            {/* Fear & Greed Index Widget */}
            {visibleWidgets.fearGreed && (
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border relative overflow-hidden">
                <h3 className="text-xs font-bold text-slate-400 dark:text-muted uppercase tracking-wider mb-3">
                  Fear & Greed Index
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full bg-slate-100 dark:bg-dark-50 border border-slate-200 dark:border-surface-border flex items-center justify-center font-black text-slate-800 dark:text-white text-md">
                    72
                    {/* Glow outline */}
                    <div className="absolute inset-1 rounded-full border-2 border-accent border-r-transparent animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-accent">Greed</h4>
                    <p className="text-[11px] text-slate-400 dark:text-muted leading-tight mt-0.5">
                      Market momentum is strong. Bulls are driving volume upwards.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Market Sentiment Widget */}
            {visibleWidgets.sentiment && (
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-muted uppercase tracking-wider">
                    Market Sentiment
                  </h3>
                  <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    Bullish
                  </span>
                </div>
                
                {/* Horizontal scale */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-dark-50 relative overflow-hidden flex">
                  <div className="h-full bg-accent" style={{ width: '68%' }} />
                  <div className="h-full bg-sell" style={{ width: '32%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-muted font-bold mt-2">
                  <span>68% Buy Sentiment</span>
                  <span>32% Sell Sentiment</span>
                </div>
              </div>
            )}

            {/* Asset Allocation Pie Chart */}
            {visibleWidgets.allocation && (
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
                <h3 className="text-xs font-bold text-slate-400 dark:text-muted uppercase tracking-wider mb-3">
                  Asset Allocation
                </h3>
                <div className="flex items-center justify-between">
                  <div className="w-[120px] h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsPie
                          data={[
                            { name: 'Equities', value: 65, color: '#00D09C' },
                            { name: 'Mutual Funds', value: 25, color: '#4F46E5' },
                            { name: 'Cash', value: 10, color: '#F59E0B' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#00D09C" />
                          <Cell fill="#4F46E5" />
                          <Cell fill="#F59E0B" />
                        </RechartsPie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 pl-4">
                    {[
                      { name: 'Equities', pct: '65%', color: 'bg-accent' },
                      { name: 'Mutual Funds', pct: '25%', color: 'bg-indigo-600' },
                      { name: 'Cash', pct: '10%', color: 'bg-amber-500' }
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-muted">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          {item.name}
                        </span>
                        <span className="text-slate-800 dark:text-white font-mono">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Risk Score Widget */}
            {visibleWidgets.riskScore && (
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
                <h3 className="text-xs font-bold text-slate-400 dark:text-muted uppercase tracking-wider mb-2.5">
                  Portfolio Risk Score
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-850 dark:text-white">Moderate-Low Risk</h4>
                    <p className="text-[10px] text-slate-400 dark:text-muted leading-tight mt-0.5">
                      Diversified holdings mitigate equity volatility.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-xs font-bold border border-indigo-500/20">
                    B+ Rating
                  </div>
                </div>
              </div>
            )}

            {/* Trending Sectors Widget */}
            {visibleWidgets.sectors && (
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
                <h3 className="text-xs font-bold text-slate-400 dark:text-muted uppercase tracking-wider mb-3">
                  Trending Sectors
                </h3>
                <div className="space-y-3">
                  {MOCK_SECTORS.map((sector) => {
                    const isUp = sector.change >= 0;
                    return (
                      <div key={sector.name} className="flex items-center justify-between text-xs font-semibold">
                        <div>
                          <p className="text-slate-700 dark:text-white">{sector.name}</p>
                          <p className="text-[9px] text-slate-400 dark:text-muted mt-0.5">{sector.count} active components</p>
                        </div>
                        <span className={`font-bold font-mono ${isUp ? 'text-accent' : 'text-sell'}`}>
                          {isUp ? '+' : ''}{sector.change.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Market News Widget */}
            {visibleWidgets.news && (
              <div className="glass-card p-5 bg-white dark:bg-surface border border-slate-100 dark:border-surface-border">
                <h3 className="text-xs font-bold text-slate-400 dark:text-muted uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Newspaper className="w-3.5 h-3.5 text-accent" />
                  Top Financial News
                </h3>
                <div className="space-y-3">
                  {MOCK_NEWS.map((news) => (
                    <div key={news.id} className="border-b border-slate-100 dark:border-surface-border/30 pb-2.5 last:border-b-0 last:pb-0 cursor-pointer group">
                      <p className="text-[12px] text-slate-700 dark:text-muted-light font-bold group-hover:text-accent transition-colors leading-tight">
                        {news.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-muted font-bold mt-1">
                        <span>{news.source}</span>
                        <span>{news.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* ── MOBILE VERSION BOTTOM NAVIGATION ──────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-dark border-t border-slate-100 dark:border-surface-border flex md:hidden items-center justify-around z-40 transition-colors shadow-2xl">
        {[
          { label: 'Home', path: '/dashboard', icon: TrendingUp },
          { label: 'Markets', path: '/dashboard', icon: BarChart3 },
          { label: 'Portfolio', path: '/dashboard', icon: Briefcase },
          { label: 'Notifications', path: '/notifications', icon: Bell },
          { label: 'Profile', path: '/profile', icon: Settings }
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center text-slate-400 dark:text-muted-light hover:text-accent focus:text-accent"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── WALLET DEPOSIT DIALOG MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {isDepositOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDepositOpen(false)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-surface border border-slate-100 dark:border-surface-border rounded-3xl p-6 shadow-2xl z-10"
            >
              <button
                onClick={() => setIsDepositOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 dark:text-muted hover:bg-slate-100 dark:hover:bg-surface-light/40"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-md font-bold text-slate-900 dark:text-white mb-2">
                Deposit Virtual Funds
              </h3>
              <p className="text-xs text-slate-400 dark:text-muted mb-4">
                Instantly deposit practice capital to your TradeSphere wallet.
              </p>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-muted mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter deposit amount..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-50 border border-slate-200 dark:border-surface-border rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDepositOpen(false)}
                    className="btn-secondary w-full py-2.5 text-xs border-slate-200 dark:border-surface-border text-slate-700 dark:text-white justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary w-full py-2.5 text-xs justify-center font-bold"
                  >
                    Deposit Funds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BONUS FEATURE: QUICK TRADE PANEL SIDEBAR ───────────────────────── */}
      <AnimatePresence>
        {quickTradeOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickTradeOpen(false)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-surface border-l border-slate-100 dark:border-surface-border shadow-2xl z-10 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-border mb-6">
                  <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Flame className="w-5 h-5 text-accent animate-pulse" />
                    Quick Trade
                  </h3>
                  <button
                    onClick={() => setQuickTradeOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-light/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-muted mb-1">
                      Choose Equity Asset
                    </label>
                    <select
                      value={quickTradeSymbol}
                      onChange={(e) => setQuickTradeSymbol(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-50 border border-slate-200 dark:border-surface-border rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-accent"
                    >
                      {allSymbols.filter(s => !indexSymbols.includes(s)).map(sym => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-dark-50 rounded-2xl border border-slate-200 dark:border-surface-border/50">
                    <span className="text-[10px] text-slate-450 dark:text-muted uppercase font-bold tracking-wider">
                      Current Live Price
                    </span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                      ₹{(livePrices[quickTradeSymbol.toUpperCase()] || 1000).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-muted italic mt-0.5">
                      Includes 3s WebSocket polling tick rate.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsOrderOpen(true);
                  }}
                  className="btn-primary w-full py-3 text-xs justify-center font-bold"
                >
                  Configure BUY / SELL Order
                </button>
                <button
                  onClick={() => setQuickTradeOpen(false)}
                  className="btn-secondary w-full py-3 text-xs border-slate-200 dark:border-surface-border text-slate-700 dark:text-white justify-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BONUS FEATURE: AI ASSISTANT FLOATING CHAT WIDGET ──────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
          className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-full shadow-lg shadow-accent/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white"
          title="TradeSphere AI Assistant"
        >
          {aiAssistantOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </button>

        <AnimatePresence>
          {aiAssistantOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="absolute right-0 bottom-16 w-80 sm:w-96 h-[400px] bg-white dark:bg-surface border border-slate-100 dark:border-surface-border rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-accent to-accent-dark text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">TradeSphere CoPilot</h4>
                  <p className="text-[10px] text-white/80 leading-none">Powered by Advanced Agentic Intelligence</p>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth no-scrollbar">
                {aiChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-semibold leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-accent text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-dark-50 text-slate-800 dark:text-muted-light rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleAiAssistantSubmit} className="p-3 border-t border-slate-100 dark:border-surface-border/60 flex items-center gap-2 bg-slate-50/50 dark:bg-surface">
                <input
                  type="text"
                  placeholder="Ask about balance, portfolio, movers..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-dark-50 border border-slate-200 dark:border-surface-border rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-muted focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="p-2 bg-accent text-white rounded-xl hover:bg-accent-dark transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Modal Config */}
      {isOrderOpen && (
        <OrderModal
          isOpen={isOrderOpen}
          onClose={() => {
            setIsOrderOpen(false);
            setQuickTradeOpen(false);
          }}
          symbol={quickTradeSymbol}
          currentPrice={livePrices[quickTradeSymbol.toUpperCase()] || 1000}
          onOrderSuccess={() => {
            fetchData();
          }}
        />
      )}

    </div>
  );
}

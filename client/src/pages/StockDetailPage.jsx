import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { ArrowLeft, Plus, Trash2, ArrowUpRight, ArrowDownRight, TrendingUp, HelpCircle, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useWebSocket } from '../context/WebSocketContext';
import OrderModal from '../components/OrderModal';

function generateFallbackOHLCV(symbol, timeframe, currentPrice = null) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  const rand = () => { hash = Math.sin(hash) * 10000; return hash - Math.floor(hash); };

  const count = timeframe === '1D' ? 78 : timeframe === '1W' ? 100 : 100;
  const targetPrice = currentPrice || 100 + (rand() * 900);

  // Get today's NSE session timestamps (9:15–15:30 IST)
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istNowMs = utcMs + istOffset;
  const istDate = new Date(istNowMs);
  const todayStartMs = Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate());
  const marketOpenMs = todayStartMs + (9 * 60 + 15) * 60000;
  const marketCloseMs = todayStartMs + (15 * 60 + 30) * 60000;
  const sessionMs = marketCloseMs - marketOpenMs;
  const intervalMs = sessionMs / count;

  let val = targetPrice * (1 - 0.015);
  const stepTrend = (targetPrice - val) / count;
  const data = [];
  const nowUnix = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const time = Math.floor((marketOpenMs + i * intervalMs) / 1000);
    if (time > nowUnix) break;
    const noise = (rand() - 0.5) * targetPrice * 0.004;
    const open = val;
    val = val + stepTrend + noise;
    const close = i === count - 1 ? targetPrice : val;
    const high = Math.max(open, close) + rand() * Math.abs(close - open) * 0.5;
    const low = Math.min(open, close) - rand() * Math.abs(close - open) * 0.5;
    data.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
  }
  return data;
}

export default function StockDetailPage() {
  const { isDark } = useTheme();
  const { symbol } = useParams();
  const { ticks, lastTicks, subscribe, unsubscribe } = useWebSocket();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [stockInfo, setStockInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [dataSource, setDataSource] = useState(null);
  const historyRef = useRef([]);

  function isMarketOpen() {
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = ist.getDay();
    if (day === 0 || day === 6) return false;
    const totalMins = ist.getHours() * 60 + ist.getMinutes();
    return totalMins >= (9 * 60 + 15) && totalMins <= (15 * 60 + 30);
  }

  const [marketOpen, setMarketOpen] = useState(isMarketOpen());

  useEffect(() => {
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to WebSocket ticks for this symbol
  useEffect(() => {
    if (symbol) {
      subscribe(symbol);
      return () => unsubscribe(symbol);
    }
  }, [symbol]);

  // Fetch initial stock info and history
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [quoteRes, historyRes, watchlistRes] = await Promise.all([
          api.get(`/market/quote/${symbol}`),
          api.get(`/market/history/${symbol}?range=${timeframe}`),
          api.get('/watchlist')
        ]);

        if (quoteRes.data.success) {
          setStockInfo(quoteRes.data.data);
        }
        if (historyRes.data.success && historyRes.data.data.length > 0) {
          const candles = historyRes.data.data;
          setHistory(candles);
          historyRef.current = [...candles];
          setDataSource(historyRes.data.source || 'fallback');
        } else {
          const fallback = generateFallbackOHLCV(symbol, timeframe, quoteRes.data.data?.price);
          setHistory(fallback);
          historyRef.current = [...fallback];
          setDataSource('fallback');
        }
        if (watchlistRes.data.success) {
          const list = watchlistRes.data.data || [];
          setInWatchlist(list.some(item => item.symbol.toUpperCase() === symbol.toUpperCase()));
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load stock details');
        const fallback = generateFallbackOHLCV(symbol, timeframe, stockInfo?.price);
        setHistory(fallback);
        historyRef.current = [...fallback];
        setDataSource('fallback');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol, timeframe]);

  // Real-time price updating from WebSocket ticks
  const upperSymbol = symbol ? symbol.toUpperCase() : '';
  const liveData = upperSymbol ? ticks[upperSymbol] : null;
  const prevLiveData = upperSymbol ? lastTicks[upperSymbol] : null;
  const currentPrice = liveData ? liveData.price : stockInfo?.price;
  const currentChange = liveData ? liveData.change : stockInfo?.change;
  const currentChangePct = liveData ? liveData.changePercent : stockInfo?.changePercent;

  // Determine price movement direction for flash animation
  const [flashDirection, setFlashDirection] = useState(null); // 'UP' or 'DOWN'
  useEffect(() => {
    if (liveData && prevLiveData) {
      if (liveData.price > prevLiveData.price) {
        setFlashDirection('UP');
        const t = setTimeout(() => setFlashDirection(null), 1000);
        return () => clearTimeout(t);
      } else if (liveData.price < prevLiveData.price) {
        setFlashDirection('DOWN');
        const t = setTimeout(() => setFlashDirection(null), 1000);
        return () => clearTimeout(t);
      }
    }
  }, [liveData]);

  // Update chart series when live tick arrives (5-min candle windows)
  useEffect(() => {
    if (!seriesRef.current || !liveData || historyRef.current.length === 0) return;
    if (!marketOpen) return;

    const livePrice = liveData.price;
    const now = Math.floor(Date.now() / 1000);
    const candleInterval = 300;
    const currentCandleTime = Math.floor(now / candleInterval) * candleInterval;
    const candles = historyRef.current;
    const lastCandle = candles[candles.length - 1];

    if (lastCandle.time === currentCandleTime) {
      const updated = {
        time: currentCandleTime,
        high: Math.max(lastCandle.high, livePrice),
        low: Math.min(lastCandle.low, livePrice),
        close: livePrice,
      };
      seriesRef.current.update(updated);
      candles[candles.length - 1] = updated;
    } else if (currentCandleTime > lastCandle.time && currentCandleTime <= now + 300) {
      const newCandle = {
        time: currentCandleTime,
        open: lastCandle.close,
        high: livePrice,
        low: livePrice,
        close: livePrice,
      };
      seriesRef.current.update(newCandle);
      candles.push(newCandle);
    }
  }, [liveData, marketOpen]);

  // Initialize and Render Chart
  useEffect(() => {
    if (!chartContainerRef.current || history.length === 0) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { color: '#131722' },
        textColor: '#8A8F98',
      },
      grid: {
        vertLines: { color: '#1e2433' },
        horzLines: { color: '#1e2433' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        timeFormatter: (time) => {
          return new Date(time * 1000).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        },
      },
    });

    chartRef.current = chart;

    // Add Candlestick Series (lightweight-charts v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00D09C',
      downColor: '#FF5252',
      borderUpColor: '#00D09C',
      borderDownColor: '#FF5252',
      wickUpColor: '#00D09C',
      wickDownColor: '#FF5252',
    });

    // Sort history chronologically before pushing
    const sourceData = historyRef.current.length > 0 ? historyRef.current : history;
    const sortedData = [...sourceData].sort((a, b) => a.time - b.time);
    candleSeries.setData(sortedData);
    seriesRef.current = candleSeries;

    // Fit chart to viewport scale
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [history]);

  // Toggle watchlist item
  async function handleWatchlistToggle() {
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${symbol}`);
        setInWatchlist(false);
        toast.success(`${symbol} removed from watchlist`);
      } else {
        await api.post('/watchlist', { symbol });
        setInWatchlist(true);
        toast.success(`${symbol} added to watchlist`);
      }
    } catch {
      toast.error('Failed to update watchlist');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-accent animate-pulse" />
          <p className="text-muted text-sm">Loading market details...</p>
        </div>
      </div>
    );
  }

  const isUp = currentChange >= 0;

  return (
    <div className="min-h-screen pb-16 transition-colors duration-300 bg-[#0A0E17]">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#0A0E17]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleWatchlistToggle}
              className={`btn-ghost border border-surface-border text-sm flex items-center gap-1.5 ${
                inWatchlist ? 'text-sell hover:bg-sell/5 border-sell/20' : 'text-accent hover:bg-accent/5 border-accent/20'
              }`}
              id="watchlist-toggle-btn"
            >
              {inWatchlist ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  Remove Watchlist
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Watchlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Area: Chart & Performance */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">

              {/* Header Info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{symbol.toUpperCase()}</h1>
                  <p className="text-muted text-sm mt-0.5">{stockInfo?.name}</p>
                </div>

                {/* Price Display with flash effect */}
                <div className="text-right">
                  <div className={`text-3xl font-bold text-white transition-all duration-300 rounded-lg px-2 py-0.5 -mx-2 ${
                    flashDirection === 'UP' ? 'bg-accent-100 text-accent font-semibold shadow-glow' :
                    flashDirection === 'DOWN' ? 'bg-sell/10 text-sell font-semibold shadow-lg shadow-sell/10' : ''
                  }`}>
                    ₹{currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className={`text-sm font-medium flex items-center justify-end gap-1 mt-1 ${
                    isUp ? 'text-accent' : 'text-sell'
                  }`}>
                    {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{isUp ? '+' : ''}{currentChange?.toFixed(2)} ({isUp ? '+' : ''}{currentChangePct?.toFixed(2)}%)</span>
                  </p>
                </div>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1 p-1 bg-dark-50 rounded-full w-fit border border-surface-border">
                  {['1D', '1W', '1M', '3M', '1Y'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                        timeframe === t
                          ? 'bg-[#00D09C]/10 text-[#00D09C] border-[#00D09C]'
                          : 'border-transparent text-muted hover:text-white'
                      }`}
                      id={`timeframe-${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {!marketOpen && (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                    Market Closed
                  </span>
                )}
                {dataSource && (
                  <span className={`text-[10px] font-mono font-semibold px-2 py-1 rounded-md border ${
                    dataSource === 'alphavantage'
                      ? 'text-[#00D09C] bg-[#00D09C]/10 border-[#00D09C]/20'
                      : dataSource === 'yahoo'
                      ? 'text-sky-400 bg-sky-400/10 border-sky-400/20'
                      : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                  }`}>
                    {dataSource === 'alphavantage' ? 'Live' : dataSource === 'yahoo' ? 'Yahoo' : 'Delayed'}
                  </span>
                )}
              </div>

              {/* Chart Element */}
              <div ref={chartContainerRef} className="w-full h-[380px] bg-[#131722] rounded-2xl overflow-hidden relative" id="chart-container" />
            </div>

            {/* Fundamentals Metrics */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Stock Fundamentals</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Sector', value: stockInfo?.sector || 'N/A' },
                  { label: 'Market Cap', value: stockInfo?.marketCap || 'N/A' },
                  { label: 'P/E Ratio', value: stockInfo?.pe || 'N/A' },
                  { label: '52W High', value: `₹${stockInfo?.high52W?.toFixed(2) || 'N/A'}` },
                  { label: '52W Low', value: `₹${stockInfo?.low52W?.toFixed(2) || 'N/A'}` },
                  { label: 'Volume', value: stockInfo?.volume?.toLocaleString('en-IN') || 'N/A' },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-muted text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      {m.label} <HelpCircle className="w-3 h-3 opacity-30 cursor-pointer" />
                    </p>
                    <p className="text-white font-semibold text-sm">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action sidebar: Order box */}
          <div className="space-y-6">
            <div className="glass-card p-6 flex flex-col justify-between h-[250px] relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-lg font-semibold text-white mb-2">Trade Stock</h2>
                <p className="text-muted text-sm">Place an instant BUY or SELL order for {symbol.toUpperCase()}. Real-time execution details will apply.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <button
                  onClick={() => {
                    setIsOrderOpen(true);
                  }}
                  className="btn-primary w-full shadow-glow"
                  id="trade-buy-btn"
                >
                  BUY
                </button>
                <button
                  onClick={() => {
                    setIsOrderOpen(true);
                  }}
                  className="w-full py-3 bg-sell text-white font-semibold rounded-xl transition-all hover:bg-sell-light hover:shadow-lg hover:shadow-sell/25 active:scale-[0.98]"
                  id="trade-sell-btn"
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="glass-card p-5 border border-dashed border-surface-border">
              <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-accent" />
                Investing Note
              </h3>
              <p className="text-muted text-xs leading-relaxed">
                Equity delivery trading is subject to market risks. Make sure to review basic fundamentals, trend chart setups, and news updates before executing order confirmations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Placement Modal */}
      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        symbol={symbol}
        currentPrice={currentPrice}
        onOrderSuccess={() => {
          // Re-fetch info to refresh fundamentals or state
        }}
      />
    </div>
  );
}

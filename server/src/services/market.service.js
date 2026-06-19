const axios = require('axios');

// Predefined set of popular stocks with metadata for realistic quotes
const STOCKS_METADATA = {
  // Indian Stocks
  'RELIANCE': { name: 'Reliance Industries Ltd.', sector: 'Energy & Conglomerate', marketCap: '₹16.8T', pe: 24.5, high52W: 2650.00, low52W: 2180.00, basePrice: 2456.80 },
  'TCS': { name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', marketCap: '₹14.2T', pe: 30.1, high52W: 4100.00, low52W: 3200.00, basePrice: 3892.45 },
  'INFY': { name: 'Infosys Ltd.', sector: 'Information Technology', marketCap: '₹7.0T', pe: 26.2, high52W: 1750.00, low52W: 1350.00, basePrice: 1678.30 },
  'HDFCBANK': { name: 'HDFC Bank Ltd.', sector: 'Financial Services', marketCap: '₹11.7T', pe: 19.8, high52W: 1720.00, low52W: 1380.00, basePrice: 1542.60 },
  'ICICIBANK': { name: 'ICICI Bank Ltd.', sector: 'Financial Services', marketCap: '₹7.8T', pe: 18.2, high52W: 1150.00, low52W: 880.00, basePrice: 1123.90 },

  // US Stocks
  'AAPL': { name: 'Apple Inc.', sector: 'Technology', marketCap: '$3.02T', pe: 31.4, high52W: 198.23, low52W: 164.08, basePrice: 185.50 },
  'MSFT': { name: 'Microsoft Corporation', sector: 'Technology', marketCap: '$3.15T', pe: 36.8, high52W: 430.82, low52W: 315.18, basePrice: 415.60 },
  'TSLA': { name: 'Tesla Inc.', sector: 'Automotive', marketCap: '$560B', pe: 45.2, high52W: 299.29, low52W: 138.80, basePrice: 175.20 },
  'AMZN': { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', marketCap: '$1.85T', pe: 41.7, high52W: 189.77, low52W: 112.91, basePrice: 178.40 },
  'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', marketCap: '$2.12T', pe: 27.5, high52W: 178.42, low52W: 115.82, basePrice: 172.50 },

  // Indices
  'NIFTY50': { name: 'Nifty 50 Index', sector: 'Index', marketCap: 'N/A', pe: 21.2, high52W: 23400.00, low52W: 18800.00, basePrice: 22850.50 },
  'SENSEX': { name: 'BSE Sensex Index', sector: 'Index', marketCap: 'N/A', pe: 23.4, high52W: 77000.00, low52W: 62000.00, basePrice: 75120.30 },
  'BANKNIFTY': { name: 'Nifty Bank Index', sector: 'Index', marketCap: 'N/A', pe: 16.5, high52W: 50500.00, low52W: 42000.00, basePrice: 49200.80 }
};

// Map client symbol format to Alpha Vantage format
function mapToAVSymbol(symbol) {
  const indianStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'SBIN', 'BAJFINANCE'];
  if (indianStocks.includes(symbol)) {
    return `${symbol}.NS`;
  }
  const indexMap = {
    'NIFTY50': '^NSEI',
    'NIFTY': '^NSEI',
    'SENSEX': '^BSESN',
    'BANKNIFTY': '^NSEBANK'
  };
  if (indexMap[symbol]) return indexMap[symbol];
  return symbol;
}

function mapToYahooSymbol(symbol) {
  const indianStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'SBIN', 'BAJFINANCE'];
  if (indianStocks.includes(symbol)) return `${symbol}.NS`;
  const indexMap = {
    'NIFTY50': '^NSEI',
    'NIFTY': '^NSEI',
    'SENSEX': '^BSESN',
    'BANKNIFTY': '^NSEBANK'
  };
  if (indexMap[symbol]) return indexMap[symbol];
  return symbol;
}

function getTodayNSEStamps() {
  const now = new Date();
  const localOffset = now.getTimezoneOffset() * 60000;
  const istOffset = -330 * 60000;
  const istNowMs = now.getTime() + (istOffset - localOffset);
  const istNow = new Date(istNowMs);
  const day = istNow.getUTCDay();
  if (day === 0 || day === 6) return null;
  const todayStartMs = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())).getTime();
  const marketOpenMs = todayStartMs + (9 * 60 + 15) * 60000;
  const marketCloseMs = todayStartMs + (15 * 60 + 30) * 60000;
  return { open: marketOpenMs, close: marketCloseMs };
}

function avTimestampToUnix(avTimestamp) {
  const month = parseInt(avTimestamp.substring(5, 7), 10);
  const offset = (month >= 3 && month <= 10) ? '-04:00' : '-05:00';
  return Math.floor(new Date(avTimestamp.replace(' ', 'T') + offset).getTime() / 1000);
}

const AV_BASE = 'https://www.alphavantage.co/query';

// In-memory store for active live prices (updated by background job)
const activeQuotes = {};

// Alpha Vantage rate limiting (free tier: 25 requests/day)
let avCallsToday = 0;
let avCallsDate = new Date().toDateString();
const AV_DAILY_LIMIT = 25;

// Initialize prices
Object.keys(STOCKS_METADATA).forEach(symbol => {
  const meta = STOCKS_METADATA[symbol];
  activeQuotes[symbol] = {
    symbol,
    price: meta.basePrice,
    change: 0,
    changePercent: 0,
    volume: Math.floor(500000 + Math.random() * 5000000),
    high: meta.basePrice,
    low: meta.basePrice,
    open: meta.basePrice,
    lastUpdated: new Date()
  };
});

/**
 * Update stock prices incrementally (simulating market trading)
 */
function tickPrices() {
  Object.keys(activeQuotes).forEach(symbol => {
    const quote = activeQuotes[symbol];
    const meta = STOCKS_METADATA[symbol];
    
    // Random fluctuation between -0.4% and +0.4%
    const pctChange = (Math.random() - 0.49) * 0.008; // slight upward drift
    const priceDiff = quote.price * pctChange;
    const newPrice = Math.max(0.1, Number((quote.price + priceDiff).toFixed(2)));
    
    const absoluteChange = Number((newPrice - meta.basePrice).toFixed(2));
    const changePercent = Number(((absoluteChange / meta.basePrice) * 100).toFixed(2));
    
    quote.price = newPrice;
    quote.change = absoluteChange;
    quote.changePercent = changePercent;
    quote.volume += Math.floor(Math.random() * 5000);
    quote.high = Math.max(quote.high, newPrice);
    quote.low = Math.min(quote.low, newPrice);
    quote.lastUpdated = new Date();
  });
}

// Start price ticks every 3 seconds
setInterval(tickPrices, 3000);

/**
 * Fetch a quote for a symbol. Try Alpha Vantage first, then Yahoo Finance, fallback to mock.
 */
async function getQuote(symbol) {
  const uppercaseSymbol = symbol.toUpperCase();
  const cached = activeQuotes[uppercaseSymbol];
  const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '2TJCE6O0KAEMJ31L';
  
  // 1. Try Alpha Vantage with symbol mapping and rate limiting
  try {
    // Check rate limit
    const today = new Date().toDateString();
    if (today !== avCallsDate) {
      // Reset counter for new day
      avCallsToday = 0;
      avCallsDate = today;
    }

    if (avCallsToday >= AV_DAILY_LIMIT) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Market Service] Alpha Vantage daily limit reached for ${uppercaseSymbol}`);
      }
    } else {
      // Map symbol to Alpha Vantage format
      const avSymbol = mapToAVSymbol(uppercaseSymbol);
      const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${avSymbol}&apikey=${ALPHA_VANTAGE_KEY}`, { timeout: 3000 });
      const globalQuote = response.data?.["Global Quote"];
      if (globalQuote && globalQuote["05. price"]) {
        avCallsToday++;
        const quote = {
          symbol: uppercaseSymbol,
          price: parseFloat(globalQuote["05. price"]),
          change: parseFloat(globalQuote["09. change"]) || 0,
          changePercent: parseFloat(globalQuote["10. change percent"]?.replace('%', '')) || 0,
          volume: parseInt(globalQuote["06. volume"], 10) || (cached ? cached.volume : 1000000),
          high: parseFloat(globalQuote["03. high"]) || parseFloat(globalQuote["05. price"]),
          low: parseFloat(globalQuote["04. low"]) || parseFloat(globalQuote["05. price"]),
          open: parseFloat(globalQuote["02. open"]) || parseFloat(globalQuote["05. price"]),
          lastUpdated: new Date()
        };
        activeQuotes[uppercaseSymbol] = quote;
        return quote;
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Market Service] Alpha Vantage Quote failed for ${uppercaseSymbol}: ${error.message}`);
    }
  }

  // 2. Try Yahoo Finance (adjust symbol for Yahoo format)
  try {
    const yahooSymbol = mapToYahooSymbol(uppercaseSymbol);
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 3000
    });
    
    const result = response.data?.chart?.result?.[0];
    if (result) {
      const meta = result.meta;
      const quote = {
        symbol: uppercaseSymbol,
        price: meta.regularMarketPrice,
        change: Number((meta.regularMarketPrice - meta.previousClose).toFixed(2)),
        changePercent: Number((((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2)),
        volume: meta.regularMarketVolume || (cached ? cached.volume : 1000000),
        high: meta.high || (cached ? cached.high : meta.regularMarketPrice),
        low: meta.low || (cached ? cached.low : meta.regularMarketPrice),
        open: meta.chartPreviousClose || meta.regularMarketPrice,
        lastUpdated: new Date()
      };
      activeQuotes[uppercaseSymbol] = quote;
      return quote;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Market Service] Yahoo Quote failed for ${uppercaseSymbol}. Using mock data.`);
    }
  }

  // 3. Fallback to mock data
  if (cached) {
    return cached;
  }

  // If new symbol, create metadata and cache
  const basePrice = 100 + Math.random() * 900;
  STOCKS_METADATA[uppercaseSymbol] = {
    name: `${uppercaseSymbol} Corp`,
    sector: 'General Industries',
    marketCap: `$${(Math.random() * 500).toFixed(1)}B`,
    pe: Number((15 + Math.random() * 25).toFixed(1)),
    high52W: Number((basePrice * 1.3).toFixed(2)),
    low52W: Number((basePrice * 0.8).toFixed(2)),
    basePrice
  };
  
  activeQuotes[uppercaseSymbol] = {
    symbol: uppercaseSymbol,
    price: basePrice,
    change: 0,
    changePercent: 0,
    volume: 100000,
    high: basePrice,
    low: basePrice,
    open: basePrice,
    lastUpdated: new Date()
  };

  return activeQuotes[uppercaseSymbol];
}

/**
 * Generate historical points anchored to today's NSE session (9:15 AM – 3:30 PM IST)
 */
function generateMockHistory(basePrice, pointsCount, trend = 0.0001, currentPrice = null) {
  const data = [];
  const finalPrice = currentPrice || basePrice;
  let price = finalPrice * (1 - 0.015);
  const stepTrend = (finalPrice - price) / pointsCount;
  const session = getTodayNSEStamps();
  if (!session) return data;
  const nowMs = Date.now();
  const sessionMs = session.close - session.open;
  const intervalMs = sessionMs / pointsCount;

  for (let i = 0; i < pointsCount; i++) {
    const candleTimeMs = session.open + i * intervalMs;
    if (candleTimeMs > nowMs) break;
    const noise = (Math.random() - 0.5) * finalPrice * 0.004;
    const open = price;
    price = price + stepTrend + noise;
    const close = i === pointsCount - 1 ? finalPrice : price;
    const volatility = 0.002;
    const high = Number((Math.max(open, close) * (1 + Math.random() * volatility)).toFixed(2));
    const low = Number((Math.min(open, close) * (1 - Math.random() * volatility)).toFixed(2));

    data.push({
      time: Math.floor(candleTimeMs / 1000),
      open: +open.toFixed(2),
      high,
      low,
      close: +close.toFixed(2),
      volume: Math.floor(5000 + Math.random() * 95000)
    });
  }
  return data;
}

/**
 * Fetch historical data for a symbol.
 * Tries Alpha Vantage intraday/daily first, then Yahoo, then mock fallback.
 * Returns { candles, source } where source is 'alphavantage' | 'yahoo' | 'fallback'.
 */
async function getHistory(symbol, range = '1D') {
  const uppercaseSymbol = symbol.toUpperCase();
  const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '2TJCE6O0KAEMJ31L';
  const r = range.toUpperCase();

  // 1. Try Alpha Vantage with proper symbol mapping and IST-converted timestamps
  try {
    const avSymbol = mapToAVSymbol(uppercaseSymbol);
    const isIntraday = r === '1D' || r === '1W';
    const intervalMap = { '1D': '5min', '1W': '15min' };
    const interval = intervalMap[r] || '15min';

    let url;
    let seriesKey;
    if (isIntraday) {
      url = `${AV_BASE}?function=TIME_SERIES_INTRADAY&symbol=${avSymbol}&interval=${interval}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`;
      seriesKey = `Time Series (${interval})`;
    } else {
      url = `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${avSymbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`;
      seriesKey = 'Time Series (Daily)';
    }

    const response = await axios.get(url, { timeout: 8000 });
    const timeSeries = response.data?.[seriesKey];

    if (timeSeries) {
      const ohlcv = Object.entries(timeSeries)
        .map(([timestamp, point]) => ({
          time: avTimestampToUnix(timestamp),
          open: parseFloat(point["1. open"]) || 0,
          high: parseFloat(point["2. high"]) || 0,
          low: parseFloat(point["3. low"]) || 0,
          close: parseFloat(point["4. close"]) || 0,
          volume: parseInt(point["5. volume"], 10) || 0
        }))
        .sort((a, b) => a.time - b.time);

      if (ohlcv.length > 5) {
        return { candles: ohlcv, source: 'alphavantage' };
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Market Service] Alpha Vantage History failed for ${uppercaseSymbol}: ${error.message}`);
    }
  }

  // 2. Try Yahoo Finance
  try {
    const yahooSymbol = mapToYahooSymbol(uppercaseSymbol);
    const intervalMap = { '1D': '5m', '1W': '15m', '1M': '1h', '3M': '1d', '1Y': '1d' };
    const periodMap = { '1D': '1d', '1W': '5d', '1M': '1mo', '3M': '3mo', '1Y': '1y' };
    const interval = intervalMap[r] || '15m';
    const period = periodMap[r] || '1d';

    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${period}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );

    const result = response.data?.chart?.result?.[0];
    if (result) {
      const timestamps = result.timestamp || [];
      const quote = result.indicators.quote[0];
      const ohlcv = [];

      for (let i = 0; i < timestamps.length; i++) {
        if (quote.open[i] && quote.close[i]) {
          ohlcv.push({
            time: timestamps[i],
            open: Number(quote.open[i].toFixed(2)),
            high: Number(quote.high[i].toFixed(2)),
            low: Number(quote.low[i].toFixed(2)),
            close: Number(quote.close[i].toFixed(2)),
            volume: Math.floor(quote.volume[i] || 0)
          });
        }
      }

      if (ohlcv.length > 5) {
        return { candles: ohlcv, source: 'yahoo' };
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Market Service] Yahoo History failed for ${uppercaseSymbol}. Using mock data.`);
    }
  }

  // 3. Fallback to mock data anchored to today's NSE session
  const meta = STOCKS_METADATA[uppercaseSymbol] || { basePrice: 500 };
  const liveQuote = activeQuotes[uppercaseSymbol];
  const anchorPrice = liveQuote ? liveQuote.price : meta.basePrice;
  let points = 100;
  let trend = 0.00005;

  switch (r) {
    case '1D': points = 78; break;
    case '1W': points = 150; break;
    case '1M': points = 300; break;
    case '3M': points = 90; trend = 0.0005; break;
    case '1Y': points = 250; trend = 0.001; break;
  }

  return { candles: generateMockHistory(anchorPrice, points, trend, anchorPrice), source: 'fallback' };
}

/**
 * Search symbols
 */
async function searchSymbols(query) {
  const q = query.toLowerCase();
  
  // Try local search first
  const localResults = Object.keys(STOCKS_METADATA)
    .filter(symbol => symbol.toLowerCase().includes(q) || STOCKS_METADATA[symbol].name.toLowerCase().includes(q))
    .map(symbol => ({
      symbol,
      name: STOCKS_METADATA[symbol].name,
      sector: STOCKS_METADATA[symbol].sector,
      price: activeQuotes[symbol]?.price || STOCKS_METADATA[symbol].basePrice
    }));

  if (localResults.length > 0) {
    return localResults;
  }

  try {
    // Try Yahoo autocomplete API
    const response = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 3000
    });
    
    const quotes = response.data?.quotes || [];
    return quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'INDEX')
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        sector: q.sector || 'Equities',
        price: 0 // Will fetch live price when clicked
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Get additional stock metadata/metrics
 */
function getMetadata(symbol) {
  const uppercaseSymbol = symbol.toUpperCase();
  return STOCKS_METADATA[uppercaseSymbol] || {
    name: `${uppercaseSymbol} Corp`,
    sector: 'Technology Services',
    marketCap: '$120B',
    pe: 25.4,
    high52W: 150.00,
    low52W: 90.00,
    basePrice: 100.00
  };
}

module.exports = {
  getQuote,
  getHistory,
  searchSymbols,
  getMetadata,
  activeQuotes
};

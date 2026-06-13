const { WebSocketServer } = require('ws');
const marketService = require('./market.service');

function initWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle client upgrades from the HTTP server
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    console.log('🔌 New WS Client connected');
    const subscriptions = new Set();

    // Default subscriptions: Indices
    subscriptions.add('NIFTY 50');
    subscriptions.add('SENSEX');
    subscriptions.add('BANKNIFTY');

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        const { action, symbols } = parsed;

        if (!action || !Array.isArray(symbols)) return;

        if (action === 'subscribe') {
          symbols.forEach(symbol => subscriptions.add(symbol.toUpperCase()));
        } else if (action === 'unsubscribe') {
          symbols.forEach(symbol => subscriptions.delete(symbol.toUpperCase()));
        }
      } catch (error) {
        console.error('❌ WS message parse error:', error.message);
      }
    });

    // Send initial update immediately
    const sendUpdates = async () => {
      if (ws.readyState !== ws.OPEN) return;
      
      const updates = {};
      for (const symbol of subscriptions) {
        const quote = marketService.activeQuotes[symbol];
        if (quote) {
          updates[symbol] = {
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume
          };
        }
      }
      
      if (Object.keys(updates).length > 0) {
        ws.send(JSON.stringify({ type: 'ticks', data: updates }));
      }
    };

    sendUpdates();

    // Send tick updates every 3 seconds
    const interval = setInterval(sendUpdates, 3000);

    ws.on('close', () => {
      console.log('🔌 WS Client disconnected');
      clearInterval(interval);
    });
  });

  return wss;
}

module.exports = { initWebSocketServer };

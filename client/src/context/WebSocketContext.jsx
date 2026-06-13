import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [ticks, setTicks] = useState({});
  const [lastTicks, setLastTicks] = useState({});
  const [reconnectCount, setReconnectCount] = useState(0);
  const socketRef = useRef(null);
  const subscriptionsRef = useRef(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setTicks({});
      setLastTicks({});
      return;
    }

    const wsUrl = `ws://${window.location.hostname}:5001/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('🔌 WebSocket Connected');
      
      // Resubscribe to existing subscriptions
      if (subscriptionsRef.current.size > 0) {
        socket.send(JSON.stringify({
          action: 'subscribe',
          symbols: Array.from(subscriptionsRef.current)
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ticks') {
          setTicks((prev) => {
            setLastTicks(prev);
            return {
              ...prev,
              ...message.data
            };
          });
        }
      } catch (err) {
        console.error('❌ WebSocket message error:', err);
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket Disconnected. Retrying in 3s...');
      setTimeout(() => {
        setReconnectCount(c => c + 1);
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, reconnectCount]);

  // Subscribe to symbols
  const subscribe = useCallback((symbols) => {
    const symbolsArr = Array.isArray(symbols) ? symbols : [symbols];
    const newSymbols = [];

    symbolsArr.forEach(symbol => {
      const upper = symbol.toUpperCase();
      if (!subscriptionsRef.current.has(upper)) {
        subscriptionsRef.current.add(upper);
        newSymbols.push(upper);
      }
    });

    if (newSymbols.length > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'subscribe',
        symbols: newSymbols
      }));
    }
  }, []);

  // Unsubscribe from symbols
  const unsubscribe = useCallback((symbols) => {
    const symbolsArr = Array.isArray(symbols) ? symbols : [symbols];
    const removeSymbols = [];

    symbolsArr.forEach(symbol => {
      const upper = symbol.toUpperCase();
      if (subscriptionsRef.current.has(upper)) {
        subscriptionsRef.current.delete(upper);
        removeSymbols.push(upper);
      }
    });

    if (removeSymbols.length > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'unsubscribe',
        symbols: removeSymbols
      }));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ ticks, lastTicks, subscribe, unsubscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

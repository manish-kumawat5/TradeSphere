import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';

export default function useLivePrices(symbols = []) {
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const symbolsRef = useRef(symbols);

  // Update symbolsRef when symbols array changes
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // 1. Fetch initial prices on mount/symbols change
  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    let active = true;
    async function fetchInitialPrices() {
      try {
        const response = await api.get('/market/quotes', {
          params: { symbols: symbols.join(',') }
        });
        if (active && response.data?.success) {
          const initialData = response.data.data;
          setPrices(prev => {
            const nextPrices = { ...prev, ...initialData };
            setPrevPrices(prevPrev => ({ ...prevPrev, ...initialData }));
            return nextPrices;
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch initial prices in hook:', err);
        if (active) setLoading(false);
      }
    }

    fetchInitialPrices();

    return () => {
      active = false;
    };
  }, [JSON.stringify(symbols)]);

  // 2. Connect to WebSocket
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let retryCount = 0;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      console.log('Connecting to price ticker WS...');
      // Connect to backend WebSocket (same host, backend port 5003)
    const backendPort = '5003';
    const wsUrl = `ws://${window.location.hostname}:${backendPort}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'PRICE_TICK') {
            const tickData = message.data; // { RELIANCE: 1234, TCS: 4567, ... }
            
            // Only update symbols this component cares about
            const currentSymbols = symbolsRef.current || [];
            const updatedPrices = {};
            let hasChange = false;

            currentSymbols.forEach(sym => {
              const upperSym = sym.toUpperCase();
              if (tickData[upperSym] !== undefined) {
                updatedPrices[upperSym] = tickData[upperSym];
                hasChange = true;
              }
            });

            if (hasChange) {
              setPrices(prev => {
                setPrevPrices(prevPrev => {
                  const nextPrev = { ...prevPrev };
                  Object.keys(updatedPrices).forEach(sym => {
                    if (prev[sym] !== undefined && prev[sym] !== updatedPrices[sym]) {
                      nextPrev[sym] = prev[sym];
                    } else if (prev[sym] === undefined) {
                      nextPrev[sym] = updatedPrices[sym];
                    }
                  });
                  return nextPrev;
                });
                return { ...prev, ...updatedPrices };
              });
            }
          }
        } catch (err) {
          console.error('Error parsing WS message in useLivePrices:', err);
        }
      };

      ws.onclose = () => {
        console.log('Price ticker WS closed.');
        if (isUnmounted) return;

        if (retryCount < 5) {
          retryCount++;
          console.log(`Reconnecting to WS in 3s... (Attempt ${retryCount}/5)`);
          reconnectTimeout = setTimeout(connect, 3000);
        } else {
          console.warn('Max WS reconnect retries reached.');
        }
      };

      ws.onerror = (err) => {
        console.error('Price ticker WS error:', err);
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return { prices, prevPrices, loading };
}

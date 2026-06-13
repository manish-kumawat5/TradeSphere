import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import api from '../lib/api';

export default function PortfolioSparkline({ walletBalance }) {
  const chartContainerRef = useRef(null);
  const [data, setData] = useState(null);
  const [hasTrades, setHasTrades] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        const res = await api.get('/portfolio/history');
        if (res.data.success && res.data.data.length > 0) {
          if (isMounted) {
            setData(res.data.data);
            setHasTrades(true);
          }
        } else {
          throw new Error('No data');
        }
      } catch (err) {
        if (isMounted) {
          setHasTrades(false);
          // Generate flat line if no history
          const flatData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
              time: Math.floor(date.getTime() / 1000),
              value: walletBalance || 0,
            };
          });
          setData(flatData);
        }
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [walletBalance]);

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 100,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { mode: 0 },
      handleScroll: false,
      handleScale: false,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(0,208,156,0.3)',
      bottomColor: 'rgba(0,208,156,0)',
      lineColor: '#00D09C',
      lineWidth: 2,
    });

    // Sort data chronologically just in case
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    areaSeries.setData(sortedData);
    chart.timeScale().fitContent();

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
  }, [data]);

  return (
    <div className="w-full mt-4 flex flex-col items-center">
      <div ref={chartContainerRef} className="w-full h-[100px]" />
      {!hasTrades && (
        <p className="text-muted text-xs mt-2 italic text-center">
          Start trading to see your growth
        </p>
      )}
    </div>
  );
}

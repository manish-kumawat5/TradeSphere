import React from 'react';

// Simple placeholder sparkline – shows a colored bar indicating up (green) or down (red)
export default function IndexSparkline({ symbol, isUp }) {
  const barColor = isUp ? '#00D09C' : '#FF5252';
  return (
    <div className="w-[80px] h-[36px] flex items-center" title={symbol}>
      <div
        className="h-full"
        style={{
          width: '100%',
          background: `linear-gradient(to right, ${barColor} 0%, ${barColor} 100%)`,
        }}
      />
    </div>
  );
}

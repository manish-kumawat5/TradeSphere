import { Activity } from 'lucide-react';

export default function Logo({ size = 40, textSize = 'text-xl' }) {
  return (
    <div className="flex items-center gap-2">
      <Activity style={{ width: size, height: size }} className="text-accent" />
      <span className={`font-bold text-white ${textSize}`}>TradeSphere</span>
    </div>
  );
}

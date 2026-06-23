import { useState } from 'react';
import { LineChart, Calendar, Building2, TrendingUp, Clock } from 'lucide-react';

const MOCK_IPOS = [
  { id: 1, name: 'TechNova Innovations Ltd.', symbol: 'TECHNOVA', priceBand: '₹425-450', openDate: '15 Jul 2026', closeDate: '17 Jul 2026', listingDate: '22 Jul 2026', lotSize: 35, minAmount: 15750, status: 'Upcoming', sector: 'Information Technology' },
  { id: 2, name: 'GreenEnergy Solutions Ltd.', symbol: 'GREEN', priceBand: '₹180-195', openDate: '20 Jul 2026', closeDate: '22 Jul 2026', listingDate: '29 Jul 2026', lotSize: 75, minAmount: 14625, status: 'Upcoming', sector: 'Renewable Energy' },
  { id: 3, name: 'MediLife Hospitals Ltd.', symbol: 'MEDILIFE', priceBand: '₹310-340', openDate: '25 Jul 2026', closeDate: '27 Jul 2026', listingDate: '3 Aug 2026', lotSize: 45, minAmount: 15300, status: 'Upcoming', sector: 'Healthcare' },
  { id: 4, name: 'FinFirst Microfinance Ltd.', symbol: 'FINFIRST', priceBand: '₹95-105', openDate: '1 Aug 2026', closeDate: '3 Aug 2026', listingDate: '10 Aug 2026', lotSize: 145, minAmount: 15225, status: 'Upcoming', sector: 'Financial Services' },
  { id: 5, name: 'AeroSpace Dynamics Ltd.', symbol: 'AEROSPC', priceBand: '₹560-590', openDate: '5 Aug 2026', closeDate: '7 Aug 2026', listingDate: '14 Aug 2026', lotSize: 25, minAmount: 14750, status: 'Upcoming', sector: 'Aerospace & Defence' },
];

export default function IPOPage() {
  const [filter, setFilter] = useState('ALL');

  const filteredIPOs = filter === 'ALL' ? MOCK_IPOS : MOCK_IPOS.filter(ipo => ipo.status === filter);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <LineChart className="w-8 h-8 text-accent" />
          IPOs
        </h1>
        <p className="text-gray-300 mt-1 text-sm font-semibold">Discover upcoming initial public offerings, view details and subscribe.</p>
      </div>

      <div className="flex gap-2 mb-8">
        {['ALL', 'Upcoming', 'Ongoing', 'Listed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab ? 'bg-accent text-white' : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIPOs.map((ipo) => (
          <div key={ipo.id} className="glass-card p-6 bg-[var(--bg-base)] border border-white/5 rounded-2xl hover:border-accent/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">{ipo.name}</h3>
                <span className="text-accent text-xs font-bold font-mono mt-1 block">{ipo.symbol}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                ipo.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                ipo.status === 'Ongoing' ? 'bg-accent/10 text-accent border border-accent/20' :
                'bg-gray-500/10 text-gray-300 border border-gray-500/20'
              }`}>
                {ipo.status}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Price Band</span>
                <span className="text-white font-bold">{ipo.priceBand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Lot Size</span>
                <span className="text-white font-bold">{ipo.lotSize} shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Min Investment</span>
                <span className="text-white font-bold">₹{ipo.minAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sector</span>
                <span className="text-gray-300">{ipo.sector}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px]">
              <div className="text-center">
                <Calendar className="w-3.5 h-3.5 text-accent mx-auto mb-1" />
                <span className="text-gray-300 block">Open</span>
                <span className="text-white font-bold">{ipo.openDate}</span>
              </div>
              <div className="text-center">
                <Clock className="w-3.5 h-3.5 text-sell mx-auto mb-1" />
                <span className="text-gray-300 block">Close</span>
                <span className="text-white font-bold">{ipo.closeDate}</span>
              </div>
              <div className="text-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                <span className="text-gray-300 block">Listing</span>
                <span className="text-white font-bold">{ipo.listingDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

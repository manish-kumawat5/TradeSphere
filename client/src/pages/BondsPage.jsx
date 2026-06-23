import { useState } from 'react';
import { Wallet, Building2, Percent, Calendar, TrendingUp, Shield } from 'lucide-react';

const MOCK_BONDS = [
  { id: 1, name: 'Government of India 2032', issuer: 'Government of India', couponRate: 7.25, maturityDate: '15 Aug 2032', faceValue: 1000, rating: 'AAA', type: 'Government', yield: 7.18 },
  { id: 2, name: 'HDFC Ltd. Debentures 2029', issuer: 'HDFC Ltd.', couponRate: 8.50, maturityDate: '22 Mar 2029', faceValue: 1000, rating: 'AAA', type: 'Corporate', yield: 8.42 },
  { id: 3, name: 'Reliance Industries Bonds 2030', issuer: 'Reliance Industries Ltd.', couponRate: 7.80, maturityDate: '10 Nov 2030', faceValue: 1000, rating: 'AAA', type: 'Corporate', yield: 7.75 },
  { id: 4, name: 'State Bank of India Perpetual', issuer: 'State Bank of India', couponRate: 8.25, maturityDate: 'Perpetual', faceValue: 1000, rating: 'AA+', type: 'Corporate', yield: 8.20 },
  { id: 5, name: 'NHPC Ltd. Green Bonds 2028', issuer: 'NHPC Ltd.', couponRate: 7.60, maturityDate: '05 Jun 2028', faceValue: 1000, rating: 'AAA', type: 'Green', yield: 7.55 },
  { id: 6, name: 'Power Finance Corp. Bonds 2031', issuer: 'Power Finance Corp.', couponRate: 7.95, maturityDate: '18 Dec 2031', faceValue: 1000, rating: 'AAA', type: 'Corporate', yield: 7.88 },
];

export default function BondsPage() {
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = typeFilter === 'ALL' ? MOCK_BONDS : MOCK_BONDS.filter(b => b.type === typeFilter);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Wallet className="w-8 h-8 text-accent" />
          Bonds Market
        </h1>
        <p className="text-gray-300 mt-1 text-sm">Explore bond listings, yields and maturity dates.</p>
      </div>

      <div className="flex gap-2 mb-8">
        {['ALL', 'Government', 'Corporate', 'Green'].map((tab) => (
          <button
            key={tab}
            onClick={() => setTypeFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              typeFilter === tab ? 'bg-accent text-white' : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((bond) => (
          <div key={bond.id} className="glass-card p-6 bg-[#0F172A] border border-white/5 rounded-2xl hover:border-accent/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm leading-tight truncate">{bond.name}</h3>
                <p className="text-gray-300 text-xs mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {bond.issuer}
                </p>
              </div>
              <span className={`ml-2 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                bond.rating === 'AAA' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {bond.rating}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Coupon Rate</span>
                <span className="text-accent font-bold">{bond.couponRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Current Yield</span>
                <span className="text-white font-bold">{bond.yield}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Face Value</span>
                <span className="text-white font-bold font-mono">₹{bond.faceValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Maturity</span>
                <span className="text-white font-bold">{bond.maturityDate}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-gray-300 text-[10px]">{bond.type} Bond</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

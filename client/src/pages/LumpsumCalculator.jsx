import React, { useState } from 'react';

/**
 * Lumpsum calculator – computes future value of a single investment.
 * Formula: FV = P * (1 + r)^n
 *   P = principal amount
 *   r = annual interest rate / 100
 *   n = years
 */
export default function LumpsumCalculator() {
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const P = parseFloat(principal);
    const r = parseFloat(annualRate) / 100;
    const n = parseFloat(years);
    if (!P || !r || !n) {
      setResult('Please provide valid inputs');
      return;
    }
    const fv = P * Math.pow(1 + r, n);
    setResult(`Future Value: ₹${fv.toFixed(2)}`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Lumpsum Calculator</h1>
      <form onSubmit={calculate} className="space-y-4">
        <div>
          <label className="block mb-1">Principal (₹)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Expected Annual Return (%)</label>
          <input
            type="number"
            step="0.01"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Investment Period (years)</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
          Calculate
        </button>
      </form>
      {result && <p className="mt-4">{result}</p>}
    </div>
  );
}

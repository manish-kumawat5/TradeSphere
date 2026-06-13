import React, { useState } from 'react';

/**
 * Simple SIP calculator – computes future value of a monthly investment.
 * Formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
 * where:
 *   P = monthly amount
 *   r = monthly interest rate (annualRate / 12 / 100)
 *   n = total months (years * 12)
 */
export default function SIPCalculator() {
  const [monthlyAmt, setMonthlyAmt] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const P = parseFloat(monthlyAmt);
    const r = parseFloat(annualRate) / 12 / 100;
    const n = parseFloat(years) * 12;
    if (!P || !r || !n) {
      setResult('Please provide valid inputs');
      return;
    }
    const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    setResult(`Future Value: ₹${fv.toFixed(2)}`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">SIP Calculator</h1>
      <form onSubmit={calculate} className="space-y-4">
        <div>
          <label className="block mb-1">Monthly Investment (₹)</label>
          <input
            type="number"
            value={monthlyAmt}
            onChange={(e) => setMonthlyAmt(e.target.value)}
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

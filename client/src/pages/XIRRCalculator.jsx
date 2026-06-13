import React, { useState } from 'react';

/**
 * Simple XIRR calculator – approximates the annualized internal rate of return.
 * For this demo we ask the user for:
 *   - Initial investment (negative cash flow)
 *   - Final value (positive cash flow)
 *   - Investment period in years
 * Then we compute: XIRR ≈ (FV / |PV|)^(1 / years) - 1
 * This is a reasonable approximation when there are only two cash flows.
 */
export default function XIRRCalculator() {
  const [initial, setInitial] = useState(''); // negative
  const [final, setFinal] = useState(''); // positive
  const [years, setYears] = useState('');
  const [result, setResult] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    const PV = parseFloat(initial);
    const FV = parseFloat(final);
    const n = parseFloat(years);
    if (!PV || !FV || !n || PV >= 0 || FV <= 0) {
      setResult('Please provide valid cash flows (initial negative, final positive) and years.');
      return;
    }
    const irr = Math.pow(FV / Math.abs(PV), 1 / n) - 1;
    setResult(`Approx. XIRR: ${(irr * 100).toFixed(2)}%`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">XIRR Calculator</h1>
      <form onSubmit={calculate} className="space-y-4">
        <div>
          <label className="block mb-1">Initial Investment (₹, negative)</label>
          <input
            type="number"
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Final Value (₹, positive)</label>
          <input
            type="number"
            value={final}
            onChange={(e) => setFinal(e.target.value)}
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
          Calculate XIRR
        </button>
      </form>
      {result && <p className="mt-4">{result}</p>}
    </div>
  );
}

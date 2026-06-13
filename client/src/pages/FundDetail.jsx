import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvest, setShowInvest] = useState(false);
  const [investmentAmt, setInvestmentAmt] = useState('');
  const [message, setMessage] = useState('');

  // Placeholder NAV history – in a real app this would be fetched from an endpoint
  const navHistory = [
    { date: '2024-01-01', nav: fund?.nav || 0 },
    { date: '2024-04-01', nav: (fund?.nav || 0) * 1.02 },
    { date: '2024-07-01', nav: (fund?.nav || 0) * 1.05 },
    { date: '2024-10-01', nav: (fund?.nav || 0) * 1.08 },
  ];

  useEffect(() => {
    async function fetchFund() {
      try {
        const res = await api.get(`/funds/${id}`);
        setFund(res.data.data);
      } catch (err) {
        console.error('Failed to load fund', err);
        setMessage('Fund not found');
      } finally {
        setLoading(false);
      }
    }
    fetchFund();
  }, [id]);

  const handleInvest = async () => {
    const amount = parseFloat(investmentAmt);
    if (!amount || amount <= 0) {
      setMessage('Enter a valid amount');
      return;
    }
    try {
      const res = await api.post(`/funds/${id}/invest`, { amount });
      setMessage('Investment successful!');
      setShowInvest(false);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Investment failed');
    }
  };

  if (loading) return <div className="p-4">Loading fund details...</div>;
  if (!fund) return <div className="p-4">{message || 'Fund not found'}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2">{fund.name}</h1>
      <p className="mb-4">Category: {fund.category} | Manager: {fund.fundManager}</p>
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">NAV History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={navHistory}>
            <XAxis dataKey="date" />
            <YAxis domain={['dataMin', 'dataMax']} />
            <Tooltip />
            <Line type="monotone" dataKey="nav" stroke="#00D09C" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button
        className="bg-blue-600 text-white py-2 px-4 rounded mr-2"
        onClick={() => setShowInvest(true)}
      >
        Invest One‑Time
      </button>
      <button
        className="bg-green-600 text-white py-2 px-4 rounded"
        onClick={() => navigate(`/funds/${id}/sip`)}
      >
        Setup SIP
      </button>

      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

      {showInvest && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-2">One‑Time Investment</h3>
          <input
            type="number"
            placeholder="Amount (₹)"
            value={investmentAmt}
            onChange={(e) => setInvestmentAmt(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white py-1 px-3 rounded"
              onClick={handleInvest}
            >
              Confirm
            </button>
            <button
              className="bg-gray-400 text-white py-1 px-3 rounded"
              onClick={() => setShowInvest(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function SIPSetup() {
  const { id } = useParams(); // fund id
  const navigate = useNavigate();
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(monthlyAmount);
    if (!amount || amount <= 0) {
      setMessage('Enter a valid monthly amount');
      return;
    }
    if (!startDate || !endDate) {
      setMessage('Select start and end dates');
      return;
    }
    try {
      await api.post(`/funds/${id}/sip`, {
        monthlyAmount: amount,
        startDate,
        endDate,
      });
      setMessage('SIP created successfully');
      // redirect back to fund detail after short delay
      setTimeout(() => navigate(`/funds/${id}`), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create SIP');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Setup SIP</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Monthly Amount (₹)</label>
          <input
            type="number"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded">
          Create SIP
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
    </div>
  );
}

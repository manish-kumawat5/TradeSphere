import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function FundsList() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '' });

  useEffect(() => {
    async function fetchFunds() {
      try {
        const params = {};
        if (filters.category) params.category = filters.category;
        if (filters.search) params.search = filters.search;
        const res = await api.get('/funds', { params });
        setFunds(res.data.data);
      } catch (err) {
        console.error('Failed to load funds', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFunds();
  }, [filters]);

  if (loading) return <div className="p-4">Loading funds...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Mutual Funds</h1>
      <div className="flex gap-4 mb-4">
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="border rounded p-2"
        >
          <option value="">All Categories</option>
          <option value="EQUITY">Equity</option>
          <option value="DEBT">Debt</option>
          <option value="HYBRID">Hybrid</option>
        </select>
        <input
          type="text"
          placeholder="Search by name or manager"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border rounded p-2 flex-1"
        />
      </div>
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">NAV</th>
            <th className="p-2 text-left">Manager</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund) => (
            <tr key={fund.id} className="border-t hover:bg-gray-50">
              <td className="p-2">
                <Link to={`/funds/${fund.id}`} className="text-blue-600 hover:underline">
                  {fund.name}
                </Link>
              </td>
              <td className="p-2">{fund.category}</td>
              <td className="p-2">{fund.nav.toFixed(2)}</td>
              <td className="p-2">{fund.fundManager}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

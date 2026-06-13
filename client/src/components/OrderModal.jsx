import { useState, useEffect } from 'react';
import { X, Wallet, ArrowRightLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function OrderModal({ isOpen, onClose, symbol, currentPrice, onOrderSuccess }) {
  const { checkAuth } = useAuth();
  const [type, setType] = useState('BUY'); // BUY or SELL
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(currentPrice || '');
  const [balance, setBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Sync limit price with current price when symbol or currentPrice changes
  useEffect(() => {
    if (currentPrice) {
      setLimitPrice(currentPrice);
    }
  }, [currentPrice, symbol]);

  // Fetch available balance & holdings
  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen]);

  async function fetchBalance() {
    try {
      const { data } = await api.get('/orders/portfolio');
      if (data.success) {
        setBalance(data.data.summary.balance);
      }
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  }

  if (!isOpen) return null;

  const executionPrice = orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice);
  const totalCost = (quantity || 0) * (executionPrice || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      return toast.error('Please enter a valid quantity');
    }
    if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
      return toast.error('Please enter a valid limit price');
    }

    if (type === 'BUY' && balance < totalCost) {
      return toast.error('Insufficient balance');
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders/place', {
        symbol,
        type,
        orderType,
        quantity: parseInt(quantity, 10),
        price: Number(executionPrice.toFixed(2))
      });

      if (data.success) {
        toast.success(data.message);
        // Refresh auth state (to sync user balance if stored globally)
        checkAuth();
        if (onOrderSuccess) {
          onOrderSuccess();
        }
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative glass-card w-full max-w-md p-6 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-white hover:bg-surface-light rounded-lg transition-colors"
          id="order-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <ArrowRightLeft className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-white">Place Order — {symbol}</h2>
        </div>

        {/* BUY / SELL Switcher */}
        <div className="grid grid-cols-2 p-1 bg-dark-50 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setType('BUY')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              type === 'BUY'
                ? 'bg-accent text-dark shadow-glow'
                : 'text-muted hover:text-white'
            }`}
            id="order-buy-toggle"
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setType('SELL')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              type === 'SELL'
                ? 'bg-sell text-white shadow-lg shadow-sell/20'
                : 'text-muted hover:text-white'
            }`}
            id="order-sell-toggle"
          >
            SELL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Type */}
          <div>
            <label className="input-label">Order Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['MARKET', 'LIMIT'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all ${
                    orderType === t
                      ? 'border-accent/40 bg-accent-5 text-accent'
                      : 'border-surface-border bg-dark-50 text-muted hover:text-white'
                  }`}
                  id={`order-type-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="input-label">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || ''))}
              className="input-field"
              placeholder="Enter quantity"
              disabled={submitting}
              required
            />
          </div>

          {/* Price (Conditional on LIMIT order) */}
          {orderType === 'LIMIT' ? (
            <div>
              <label htmlFor="limitPrice" className="input-label">Limit Price (₹)</label>
              <input
                id="limitPrice"
                type="number"
                step="0.05"
                min="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Math.max(0, parseFloat(e.target.value) || ''))}
                className="input-field border-accent/20"
                placeholder="Enter limit price"
                disabled={submitting}
                required
              />
            </div>
          ) : (
            <div>
              <label className="input-label">Market Price (₹)</label>
              <div className="input-field bg-dark-50 border-surface-border text-muted-light select-none">
                ₹{currentPrice?.toFixed(2)}
              </div>
            </div>
          )}

          {/* Order Summary & Balance info */}
          <div className="bg-dark-50 border border-surface-border rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between items-center text-muted">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-accent" />
                Available Balance
              </span>
              <span className="text-white font-medium">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted">Est. Total Cost</span>
              <span className="text-lg font-bold text-white">
                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              type === 'BUY'
                ? 'bg-accent text-dark hover:bg-accent-light hover:shadow-glow'
                : 'bg-sell text-white hover:bg-sell-light hover:shadow-lg hover:shadow-sell/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            id="order-submit-btn"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                Confirm {type === 'BUY' ? 'Buy' : 'Sell'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

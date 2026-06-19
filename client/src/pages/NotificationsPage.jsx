import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, ShieldCheck, TrendingUp, Percent, 
  ArrowDownLeft, ArrowUpRight, Loader2, Trash2, Zap, CheckCircle2 
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const { data } = await api.post('/notifications/read-all');
      if (data.success) {
        toast.success('All notifications marked as read');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      const { data } = await api.put(`/notifications/${id}/read`);
      if (data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PRICE_ALERT':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'ORDER_CONFIRMATION':
        return <TrendingUp className="w-5 h-5 text-[#00D09C]" />;
      case 'SIP_DEDUCTION':
        return <Percent className="w-5 h-5 text-indigo-400" />;
      case 'KYC_UPDATE':
        return <ShieldCheck className="w-5 h-5 text-[#00D09C]" />;
      case 'FUND_CREDIT':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-400" />;
      case 'FUND_WITHDRAWAL':
        return <ArrowUpRight className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'PRICE_ALERT': return 'bg-amber-400/10 border-amber-400/20';
      case 'ORDER_CONFIRMATION': return 'bg-emerald-400/10 border-emerald-400/20';
      case 'SIP_DEDUCTION': return 'bg-indigo-400/10 border-indigo-400/20';
      case 'KYC_UPDATE': return 'bg-teal-400/10 border-teal-400/20';
      case 'FUND_CREDIT': return 'bg-emerald-400/10 border-emerald-400/20';
      case 'FUND_WITHDRAWAL': return 'bg-rose-400/10 border-rose-400/20';
      default: return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#00D09C]" />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-muted mt-1 text-sm">
            Stay up to date with price alerts, orders, and wallet activities.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="btn-outlined py-2 px-4 text-xs font-bold flex items-center gap-2 self-start border-slate-200 dark:border-surface-border text-slate-700 dark:text-white"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00D09C] animate-spin mb-3" />
          <p className="text-muted text-sm font-semibold">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-10 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#00D09C]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
          <p className="text-sm text-slate-400 dark:text-muted max-w-sm mt-1">
            You don't have any notifications right now. We'll let you know when something happens!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => { if (!notif.isRead) handleMarkOneRead(notif.id); }}
              className={`glass-card p-5 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-surface-border flex items-start gap-4 transition-all duration-200 ${
                notif.isRead 
                  ? 'opacity-75 hover:opacity-100' 
                  : 'border-l-4 border-l-[#00D09C] bg-slate-50/50 dark:bg-surface-light/10 shadow-md'
              } cursor-pointer`}
            >
              {/* Icon Container */}
              <div className={`p-2.5 rounded-xl border shrink-0 ${getNotificationBg(notif.type)}`}>
                {getNotificationIcon(notif.type)}
              </div>

              {/* Text Area */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-muted font-bold font-mono">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-muted-light mt-1.5 leading-relaxed font-semibold">
                  {notif.message}
                </p>
              </div>

              {/* Status Badge */}
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 bg-[#00D09C] rounded-full shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

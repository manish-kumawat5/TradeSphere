import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, BarChart3, TrendingUp, PieChart, Shield,
  LineChart, Database, Wallet, Bell, User, Settings,
  HelpCircle, LogOut, Menu, X, Search, ChevronDown,
  Sun, Moon, Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/markets', label: 'Markets', icon: BarChart3 },
  { path: '/stocks', label: 'Stocks', icon: TrendingUp },
  { path: '/fno', label: 'F&O', icon: Shield },
  { path: '/mutual-funds', label: 'Mutual Funds', icon: PieChart },
  { path: '/etf', label: 'ETFs', icon: Database },
  { path: '/ipo', label: 'IPOs', icon: LineChart },
  { path: '/bonds', label: 'Bonds', icon: Wallet },
  { path: '/funds', label: 'Funds', icon: Wallet },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-base)] border-r border-white/5 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold text-white">TradeSphere</span>
          </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/5">
                      </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-300 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  className="w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/notifications" className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors group" onClick={handleLogout}>
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-medium text-white leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-gray-400">{user?.email || ''}</p>
                </div>
                <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors ml-1" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

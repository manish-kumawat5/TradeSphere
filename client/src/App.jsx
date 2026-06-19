import { Routes, Route, Navigate } from 'react-router-dom';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import FundsList from './pages/FundsList';
import FundDetail from './pages/FundDetail';
import SIPSetup from './pages/SIPSetup';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StockDetailPage from './pages/StockDetailPage';
import MarketsPage from './pages/MarketsPage';
import StocksPage from './pages/StocksPage';
import FnOPage from './pages/FnOPage';
import MutualFundsPage from './pages/MutualFundsPage';
import ETFPage from './pages/ETFPage';
import IPOPage from './pages/IPOPage';
import BondsPage from './pages/BondsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import SIPCalculator from './pages/SIPCalculator';
import LumpsumCalculator from './pages/LumpsumCalculator';
import XIRRCalculator from './pages/XIRRCalculator';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/markets" element={<ProtectedRoute><MarketsPage /></ProtectedRoute>} />
        <Route path="/stocks" element={<ProtectedRoute><StocksPage /></ProtectedRoute>} />
        <Route path="/stocks/:symbol" element={<ProtectedRoute><StockDetailPage /></ProtectedRoute>} />
        <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetailPage /></ProtectedRoute>} />
        <Route path="/fno" element={<ProtectedRoute><FnOPage /></ProtectedRoute>} />
        <Route path="/mutual-funds" element={<ProtectedRoute><MutualFundsPage /></ProtectedRoute>} />
        <Route path="/etf" element={<ProtectedRoute><ETFPage /></ProtectedRoute>} />
        <Route path="/ipo" element={<ProtectedRoute><IPOPage /></ProtectedRoute>} />
        <Route path="/bonds" element={<ProtectedRoute><BondsPage /></ProtectedRoute>} />
        <Route path="/funds" element={<ProtectedRoute><FundsList /></ProtectedRoute>} />
        <Route path="/funds/:id" element={<ProtectedRoute><FundDetail /></ProtectedRoute>} />
        <Route path="/funds/:id/sip" element={<ProtectedRoute><SIPSetup /></ProtectedRoute>} />
        <Route path="/tools/sip-calculator" element={<ProtectedRoute><SIPCalculator /></ProtectedRoute>} />
        <Route path="/tools/lumpsum-calculator" element={<ProtectedRoute><LumpsumCalculator /></ProtectedRoute>} />
        <Route path="/tools/xirr-calculator" element={<ProtectedRoute><XIRRCalculator /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

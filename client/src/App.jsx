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
import Layout from './components/Layout';
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

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/markets" element={<ProtectedLayout><MarketsPage /></ProtectedLayout>} />
        <Route path="/stocks" element={<ProtectedLayout><StocksPage /></ProtectedLayout>} />
        <Route path="/stocks/:symbol" element={<ProtectedLayout><StockDetailPage /></ProtectedLayout>} />
        <Route path="/stock/:symbol" element={<ProtectedLayout><StockDetailPage /></ProtectedLayout>} />
        <Route path="/fno" element={<ProtectedLayout><FnOPage /></ProtectedLayout>} />
        <Route path="/mutual-funds" element={<ProtectedLayout><MutualFundsPage /></ProtectedLayout>} />
        <Route path="/etf" element={<ProtectedLayout><ETFPage /></ProtectedLayout>} />
        <Route path="/ipo" element={<ProtectedLayout><IPOPage /></ProtectedLayout>} />
        <Route path="/bonds" element={<ProtectedLayout><BondsPage /></ProtectedLayout>} />
        <Route path="/funds" element={<ProtectedLayout><FundsList /></ProtectedLayout>} />
        <Route path="/funds/:id" element={<ProtectedLayout><FundDetail /></ProtectedLayout>} />
        <Route path="/funds/:id/sip" element={<ProtectedLayout><SIPSetup /></ProtectedLayout>} />
        <Route path="/tools/sip-calculator" element={<ProtectedLayout><SIPCalculator /></ProtectedLayout>} />
        <Route path="/tools/lumpsum-calculator" element={<ProtectedLayout><LumpsumCalculator /></ProtectedLayout>} />
        <Route path="/tools/xirr-calculator" element={<ProtectedLayout><XIRRCalculator /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><NotificationsPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

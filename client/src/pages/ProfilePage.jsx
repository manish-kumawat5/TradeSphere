// Minimal placeholder for the user profile page
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-center text-gray-600">
          You must be logged in to view your profile.{' '}
          <Link to="/login" className="text-[#00D09C] font-medium underline">
            Login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-[#1A1A2E]">Profile</h1>
      <div className="bg-white rounded-xl shadow p-4">
        <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p className="mt-2 text-sm text-gray-500">
          This is a placeholder page. Replace with the full profile UI when ready.
        </p>
      </div>
    </section>
  );
}

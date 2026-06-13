// Placeholder Notifications page
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  return (
    <section className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-[#1A1A2E]">Notifications</h1>
      <p className="text-gray-600">This page is under construction. Stay tuned for updates.</p>
      <p className="mt-4">
        <Link to="/" className="text-[#00D09C] underline">
          Return to Home
        </Link>
      </p>
    </section>
  );
}

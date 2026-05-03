import { Link, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import useAuthStore from '../../store/authStore';

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <span className="font-bold text-lg">Workshop</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/customers" label="Customers" />
          <NavItem to="/vehicles" label="Vehicles" />
          <NavItem to="/work-orders" label="Work Orders" />
        </nav>
        <div className="px-4 py-3 border-t border-gray-700">
          <p className="text-sm text-gray-400 truncate">{user?.name ?? '—'}</p>
          <button
            onClick={handleLogout}
            className="mt-1 text-sm text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-sm"
    >
      {label}
    </Link>
  );
}

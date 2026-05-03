import useAuthStore from '../../store/authStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500">Welcome back, {user?.name ?? 'User'}.</p>
    </div>
  );
}

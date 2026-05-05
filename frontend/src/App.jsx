import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import VehiclesPage from './pages/vehicles/VehiclesPage';
import WorkOrdersPage from './pages/work-orders/WorkOrdersPage';
import WorkOrderDetailPage from './pages/work-orders/WorkOrderDetailPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="work-orders" element={<WorkOrdersPage />} />
            <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

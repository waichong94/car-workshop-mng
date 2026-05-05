import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppointments, deleteAppointment } from '../../api/appointments';
import StatusBadge from '../../components/ui/StatusBadge';
import AppointmentForm from './AppointmentForm';

const STATUSES = ['', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const STATUS_LABELS = {
  '':          'All',
  pending:     'Pending',
  confirmed:   'Confirmed',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value.replace(' ', 'T')).toLocaleString();
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointments', { status, page }],
    queryFn: () => getAppointments({ status: status || undefined, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete appointment.'),
  });

  const handleDelete = (appt) => {
    if (!confirm(`Delete appointment on ${formatDateTime(appt.scheduled_at)}?`)) return;
    deleteMutation.mutate(appt.id);
  };

  const appointments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + New Appointment
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              status === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-500">Failed to load appointments. Please try again.</p>}

      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Date &amp; Time</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      No appointments found.
                    </td>
                  </tr>
                )}
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">
                      <Link
                        to={`/appointments/${appt.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {formatDateTime(appt.scheduled_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{appt.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {appt.vehicle ? `${appt.vehicle.plate} · ${appt.vehicle.make} ${appt.vehicle.model}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link to={`/appointments/${appt.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                      {!['completed', 'cancelled'].includes(appt.status) && (
                        <button
                          onClick={() => setEditingId(appt.id)}
                          className="text-gray-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(appt)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {creating && <AppointmentForm appointmentId={undefined} onClose={() => setCreating(false)} />}
      {editingId && (
        <AppointmentForm appointmentId={editingId} onClose={() => setEditingId(null)} />
      )}
    </div>
  );
}

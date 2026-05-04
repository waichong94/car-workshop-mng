import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppointment, transitionAppointment, deleteAppointment } from '../../api/appointments';
import StatusBadge from '../../components/ui/StatusBadge';
import AppointmentForm from './AppointmentForm';

const TRANSITION_ACTIONS = {
  pending:     [{ label: 'Confirm',   status: 'confirmed',  style: 'blue' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  confirmed:   [{ label: 'Start',     status: 'in_progress', style: 'amber' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  in_progress: [{ label: 'Complete',  status: 'completed',  style: 'green' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  completed:   [],
  cancelled:   [],
};

const BTN_STYLES = {
  blue:  'bg-blue-600 hover:bg-blue-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  red:   'border border-red-400 text-red-600 hover:bg-red-50',
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value.replace(' ', 'T')).toLocaleString();
}

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };

  const transitionMutation = useMutation({
    mutationFn: (status) => transitionAppointment(id, status),
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.message ?? 'Transition failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAppointment(id),
    onSuccess: () => navigate('/appointments'),
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete appointment.'),
  });

  const handleDelete = () => {
    if (!confirm('Delete this appointment? This cannot be undone.')) return;
    deleteMutation.mutate();
  };

  const handleTransition = (action) => {
    if (action.status === 'completed') {
      setConfirmComplete(true);
    } else {
      transitionMutation.mutate(action.status);
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (isError)   return <div className="p-6 text-red-500">Failed to load appointment.</div>;

  const appt = data?.data;
  if (!appt) return <div className="p-6 text-gray-400">Appointment not found.</div>;

  const actions = TRANSITION_ACTIONS[appt.status] ?? [];
  const canEdit = !['completed', 'cancelled'].includes(appt.status);

  return (
    <div className="p-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/appointments" className="text-blue-600 hover:underline">Appointments</Link>
        <span className="mx-1">/</span>
        <span>{formatDateTime(appt.scheduled_at)}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded shadow p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-800">{formatDateTime(appt.scheduled_at)}</h1>
              <StatusBadge status={appt.status} />
            </div>
            <p className="text-sm text-gray-600">
              Customer:{' '}
              <Link to={`/customers/${appt.customer?.id}`} className="text-blue-600 hover:underline">
                {appt.customer?.name ?? '—'}
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Vehicle:{' '}
              <span className="font-mono">{appt.vehicle?.plate}</span>
              {appt.vehicle && ` — ${appt.vehicle.make} ${appt.vehicle.model} (${appt.vehicle.year})`}
            </p>
            {appt.notes && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{appt.notes}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {canEdit && (
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">
                Edit
              </button>
            )}
            <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">
              Delete
            </button>
            {actions.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-end mt-1">
                {actions.map((a) => (
                  <button
                    key={a.status}
                    disabled={transitionMutation.isPending}
                    onClick={() => handleTransition(a)}
                    className={`px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 ${BTN_STYLES[a.style]}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <AppointmentForm appointmentId={Number(id)} onClose={() => setEditing(false)} />
      )}

      {/* Complete confirmation modal */}
      {confirmComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Mark as Completed?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This appointment will be marked as completed.
            </p>
            <p className="text-sm text-red-600 font-medium mb-5">
              This cannot be undone — the appointment will be locked for editing.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmComplete(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                disabled={transitionMutation.isPending}
                onClick={() => {
                  transitionMutation.mutate('completed');
                  setConfirmComplete(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {transitionMutation.isPending ? 'Completing…' : 'Yes, Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

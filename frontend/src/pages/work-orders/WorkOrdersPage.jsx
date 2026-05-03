import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkOrders, deleteWorkOrder } from '../../api/workOrders';
import StatusBadge from '../../components/ui/StatusBadge';
import WorkOrderForm from './WorkOrderForm';

const STATUSES = ['', 'draft', 'open', 'in_progress', 'pending_parts', 'completed', 'cancelled'];
const STATUS_LABELS = { '': 'All', draft: 'Draft', open: 'Open', in_progress: 'In Progress', pending_parts: 'Pending Parts', completed: 'Completed', cancelled: 'Cancelled' };

export default function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['work-orders', { search, status, page }],
    queryFn: () => getWorkOrders({ search: search || undefined, status: status || undefined, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete work order.'),
  });

  const handleDelete = (id, ref) => {
    if (!confirm(`Delete work order "${ref}"?`)) return;
    deleteMutation.mutate(id);
  };

  const workOrders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Work Orders</h1>
        <button onClick={() => setCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          + New Work Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by reference or customer…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1 flex-wrap">
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
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-500">Failed to load work orders. Please try again.</p>}

      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No work orders found.</td>
                  </tr>
                )}
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">
                      <Link to={`/work-orders/${wo.id}`} className="text-blue-700 hover:underline">{wo.reference}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{wo.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {wo.vehicle ? `${wo.vehicle.plate} · ${wo.vehicle.make} ${wo.vehicle.model}` : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={wo.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link to={`/work-orders/${wo.id}`} className="text-blue-600 hover:underline">View</Link>
                      {['draft', 'cancelled'].includes(wo.status) && (
                        <button onClick={() => handleDelete(wo.id, wo.reference)} className="text-red-500 hover:underline">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page}</span>
              <button disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {creating && <WorkOrderForm workOrderId={null} onClose={() => setCreating(false)} />}
    </div>
  );
}

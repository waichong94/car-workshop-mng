import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, deleteInvoice } from '../../api/invoices';
import StatusBadge from '../../components/ui/StatusBadge';

const STATUSES = ['', 'draft', 'issued', 'paid', 'void'];
const STATUS_LABELS = {
  '':     'All',
  draft:  'Draft',
  issued: 'Issued',
  paid:   'Paid',
  void:   'Void',
};

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoices', { status, page }],
    queryFn: () => getInvoices({ status: status || undefined, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete invoice.'),
  });

  const handleDelete = (inv) => {
    if (!confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return;
    deleteMutation.mutate(inv.id);
  };

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
      </div>

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
      {isError && <p className="text-red-500">Failed to load invoices. Please try again.</p>}

      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Work Order</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                      No invoices found.
                    </td>
                  </tr>
                )}
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/invoices/${inv.id}`} className="text-blue-700 hover:underline font-mono">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{inv.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {inv.work_order ? (
                        <Link to={`/work-orders/${inv.work_order.id}`} className="text-blue-600 hover:underline">
                          {inv.work_order.reference}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">RM {Number(inv.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">RM {Number(inv.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(inv)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
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
    </div>
  );
}

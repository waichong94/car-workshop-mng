import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoice, updateInvoice, deleteInvoice, transitionInvoice } from '../../api/invoices';
import StatusBadge from '../../components/ui/StatusBadge';

const TRANSITION_ACTIONS = {
  draft:  [{ label: 'Issue Invoice', status: 'issued', style: 'blue' }, { label: 'Void', status: 'void', style: 'red' }],
  issued: [{ label: 'Mark as Paid', status: 'paid', style: 'green' }, { label: 'Void', status: 'void', style: 'red' }],
  paid:   [],
  void:   [],
};

const BTN_STYLES = {
  blue:  'bg-blue-600 hover:bg-blue-700 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  red:   'border border-red-400 text-red-600 hover:bg-red-50',
};

const inputCls = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ tax_rate: '', discount: '', notes: '', due_at: '' });
  const [editErrors, setEditErrors] = useState({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  const transitionMutation = useMutation({
    mutationFn: (status) => transitionInvoice(id, status),
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.message ?? 'Transition failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateInvoice(id, payload),
    onSuccess: () => { invalidate(); setEditing(false); },
    onError: (err) => {
      const errs = err.response?.data?.errors ?? {};
      if (!Object.keys(errs).length) errs._ = [err.response?.data?.message ?? 'Update failed.'];
      setEditErrors(errs);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
    },
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete invoice.'),
  });

  const openEdit = (inv) => {
    setEditForm({
      tax_rate: inv.tax_rate,
      discount: inv.discount,
      notes:    inv.notes ?? '',
      due_at:   inv.due_at ?? '',
    });
    setEditErrors({});
    setEditing(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditErrors({});
    updateMutation.mutate({
      tax_rate: Number(editForm.tax_rate),
      discount: Number(editForm.discount),
      notes:    editForm.notes || null,
      due_at:   editForm.due_at || null,
    });
  };

  const set = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (isError)   return <div className="p-6 text-red-500">Failed to load invoice.</div>;

  const inv = data?.data;
  if (!inv) return <div className="p-6 text-gray-400">Invoice not found.</div>;

  const actions = TRANSITION_ACTIONS[inv.status] ?? [];
  const isDraft = inv.status === 'draft';

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/invoices" className="text-blue-600 hover:underline">Invoices</Link>
        <span className="mx-1">/</span>
        <span className="font-mono">{inv.invoice_number}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded shadow p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-800 font-mono">{inv.invoice_number}</h1>
              <StatusBadge status={inv.status} />
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              {inv.customer && (
                <p>Customer: <Link to={`/customers/${inv.customer.id}`} className="text-blue-600 hover:underline">{inv.customer.name}</Link></p>
              )}
              {inv.work_order && (
                <p>Work Order: <Link to={`/work-orders/${inv.work_order.id}`} className="text-blue-600 hover:underline font-mono">{inv.work_order.reference}</Link></p>
              )}
              {inv.issued_at && <p>Issued: {new Date(inv.issued_at).toLocaleDateString()}</p>}
              {inv.due_at && <p>Due: {new Date(inv.due_at).toLocaleDateString()}</p>}
              {inv.paid_at && <p className="text-green-700 font-medium">Paid: {new Date(inv.paid_at).toLocaleDateString()}</p>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {isDraft && (
              <button onClick={() => openEdit(inv)} className="text-sm text-blue-600 hover:underline">
                Edit
              </button>
            )}
            {isDraft && (
              <button
                onClick={() => {
                  if (confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) {
                    deleteMutation.mutate();
                  }
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Delete
              </button>
            )}
            {actions.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-end mt-1">
                {actions.map((a) => (
                  <button
                    key={a.status}
                    disabled={transitionMutation.isPending}
                    onClick={() => transitionMutation.mutate(a.status)}
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

      {/* Financial summary */}
      <div className="bg-white rounded shadow p-5 mb-5">
        <h2 className="font-semibold text-gray-700 mb-3">Financial Summary</h2>
        <div className="max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>RM {Number(inv.subtotal).toFixed(2)}</span>
          </div>
          {Number(inv.tax_rate) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({Number(inv.tax_rate)}%)</span>
              <span>RM {Number(inv.tax_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(inv.discount) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span className="text-red-600">− RM {Number(inv.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>RM {Number(inv.total).toFixed(2)}</span>
          </div>
        </div>
        {inv.notes && (
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap border-t border-gray-100 pt-3">{inv.notes}</p>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Invoice</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.01"
                  value={editForm.tax_rate} onChange={set('tax_rate')} className={inputCls} />
                {editErrors.tax_rate && <p className="text-red-500 text-xs mt-0.5">{editErrors.tax_rate[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (RM)</label>
                <input type="number" min="0" step="0.01"
                  value={editForm.discount} onChange={set('discount')} className={inputCls} />
                {editErrors.discount && <p className="text-red-500 text-xs mt-0.5">{editErrors.discount[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={editForm.due_at} onChange={set('due_at')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={editForm.notes} onChange={set('notes')} className={inputCls} />
              </div>
              {editErrors._ && <p className="text-red-500 text-sm">{editErrors._[0]}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

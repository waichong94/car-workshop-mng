import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkOrder, transitionWorkOrder, addWorkOrderLine, updateWorkOrderLine, deleteWorkOrderLine } from '../../api/workOrders';
import { getServices, getParts } from '../../api/catalog';
import StatusBadge from '../../components/ui/StatusBadge';
import WorkOrderForm from './WorkOrderForm';

const TRANSITION_ACTIONS = {
  draft:         [{ label: 'Open Work Order', status: 'open', style: 'blue' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  open:          [{ label: 'Start Work', status: 'in_progress', style: 'amber' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  in_progress:   [{ label: 'Pending Parts', status: 'pending_parts', style: 'orange' }, { label: 'Complete', status: 'completed', style: 'green' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  pending_parts: [{ label: 'Resume Work', status: 'in_progress', style: 'amber' }, { label: 'Cancel', status: 'cancelled', style: 'red' }],
  completed:     [],
  cancelled:     [],
};

const BTN_STYLES = {
  blue:   'bg-blue-600 hover:bg-blue-700 text-white',
  amber:  'bg-amber-500 hover:bg-amber-600 text-white',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white',
  green:  'bg-green-600 hover:bg-green-700 text-white',
  red:    'border border-red-400 text-red-600 hover:bg-red-50',
};

const EMPTY_LINE = { type: 'labour', service_id: '', part_id: '', description: '', qty: 1, unit_price: 0, discount: 0 };

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [addingLine, setAddingLine] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [lineForm, setLineForm] = useState(EMPTY_LINE);
  const [lineErrors, setLineErrors] = useState({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => getWorkOrder(id),
  });

  // Only fetch catalogs when the line form is open
  const { data: servicesData } = useQuery({ queryKey: ['services'], queryFn: getServices, enabled: addingLine });
  const { data: partsData }    = useQuery({ queryKey: ['parts'],    queryFn: getParts,    enabled: addingLine });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['work-order', id] });

  const transitionMutation = useMutation({
    mutationFn: ({ status }) => transitionWorkOrder(id, status),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: (err) => alert(err.response?.data?.message ?? 'Transition failed.'),
  });

  const addLineMutation = useMutation({
    mutationFn: (data) => addWorkOrderLine(id, data),
    onSuccess: () => { invalidate(); setAddingLine(false); setLineForm(EMPTY_LINE); setLineErrors({}); },
    onError: (err) => setLineErrors(err.response?.data?.errors ?? {}),
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, data }) => updateWorkOrderLine(id, lineId, data),
    onSuccess: () => { invalidate(); setEditingLine(null); setAddingLine(false); setLineForm(EMPTY_LINE); setLineErrors({}); },
    onError: (err) => setLineErrors(err.response?.data?.errors ?? {}),
  });

  const deleteLineMutation = useMutation({
    mutationFn: (lineId) => deleteWorkOrderLine(id, lineId),
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete line.'),
  });

  const handleLineSubmit = (e) => {
    e.preventDefault();
    setLineErrors({});
    const payload = { ...lineForm };
    if (payload.type !== 'service') delete payload.service_id;
    if (payload.type !== 'part')    delete payload.part_id;
    if (!payload.discount) payload.discount = 0;
    if (editingLine) updateLineMutation.mutate({ lineId: editingLine, data: payload });
    else addLineMutation.mutate(payload);
  };

  const openEditLine = (line) => {
    setLineForm({
      type: line.type, description: line.description,
      service_id: line.service?.id ?? '', part_id: line.part?.id ?? '',
      qty: line.qty, unit_price: line.unit_price, discount: line.discount ?? 0,
    });
    setEditingLine(line.id);
    setAddingLine(true);
  };

  const handleServiceChange = (e) => {
    const svc = services.find((s) => String(s.id) === e.target.value);
    setLineForm((f) => ({ ...f, service_id: e.target.value, description: svc?.name ?? f.description, unit_price: svc?.default_price ?? f.unit_price }));
  };

  const handlePartChange = (e) => {
    const part = parts.find((p) => String(p.id) === e.target.value);
    setLineForm((f) => ({ ...f, part_id: e.target.value, description: part?.name ?? f.description, unit_price: part?.unit_price ?? f.unit_price }));
  };

  const setLine = (key) => (e) => setLineForm((f) => ({ ...f, [key]: e.target.value }));

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (isError)   return <div className="p-6 text-red-500">Failed to load work order.</div>;

  const wo = data?.data;
  if (!wo) return <div className="p-6 text-gray-400">Work order not found.</div>;

  const lines    = wo.lines ?? [];
  const totals   = wo.totals ?? { subtotal: 0, tax: 0, total: 0 };
  const actions  = TRANSITION_ACTIONS[wo.status] ?? [];
  const services = servicesData?.data ?? [];
  const parts    = partsData?.data    ?? [];
  const canEdit  = !['completed', 'cancelled'].includes(wo.status);
  const inputCls = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="p-6 max-w-5xl">
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/work-orders" className="text-blue-600 hover:underline">Work Orders</Link>
        <span className="mx-1">/</span>
        <span>{wo.reference}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded shadow p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800 font-mono">{wo.reference}</h1>
              <StatusBadge status={wo.status} />
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>Customer: <Link to={`/customers/${wo.customer?.id}`} className="text-blue-600 hover:underline">{wo.customer?.name}</Link></p>
              <p>Vehicle: <span className="font-mono">{wo.vehicle?.plate}</span> — {wo.vehicle?.make} {wo.vehicle?.model} ({wo.vehicle?.year})</p>
              {wo.mileage_in && <p>Mileage In: {wo.mileage_in.toLocaleString()} km</p>}
              {wo.description && <p className="mt-1 text-gray-700 whitespace-pre-wrap">{wo.description}</p>}
              {wo.started_at   && <p className="text-gray-400 text-xs">Started: {new Date(wo.started_at).toLocaleString()}</p>}
              {wo.completed_at && <p className="text-gray-400 text-xs">Completed: {new Date(wo.completed_at).toLocaleString()}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {canEdit && <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">Edit</button>}
            {actions.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-end">
                {actions.map((a) => (
                  <button key={a.status} disabled={transitionMutation.isPending}
                    onClick={() => transitionMutation.mutate({ status: a.status })}
                    className={`px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 ${BTN_STYLES[a.style]}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded shadow overflow-hidden mb-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Line Items</h2>
          {canEdit && !addingLine && (
            <button onClick={() => { setLineForm(EMPTY_LINE); setEditingLine(null); setAddingLine(true); }}
              className="text-sm text-blue-600 hover:underline">+ Add Line</button>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Unit Price</th>
              <th className="px-4 py-2 text-right">Disc %</th>
              <th className="px-4 py-2 text-right">Total</th>
              {canEdit && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 && !addingLine && (
              <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-5 text-center text-gray-400">No line items yet.</td></tr>
            )}
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 capitalize text-gray-500">{line.type}</td>
                <td className="px-4 py-2 text-gray-800">{line.description}</td>
                <td className="px-4 py-2 text-right text-gray-600">{Number(line.qty)}</td>
                <td className="px-4 py-2 text-right text-gray-600">RM {Number(line.unit_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{Number(line.discount)}%</td>
                <td className="px-4 py-2 text-right font-medium">RM {Number(line.line_total).toFixed(2)}</td>
                {canEdit && (
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => openEditLine(line)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => { if (confirm('Remove this line?')) deleteLineMutation.mutate(line.id); }}
                      className="text-red-500 hover:underline">Remove</button>
                  </td>
                )}
              </tr>
            ))}

            {/* Inline add/edit form */}
            {addingLine && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-4 py-3 bg-blue-50">
                  <form onSubmit={handleLineSubmit}>
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-2">
                        <select value={lineForm.type} onChange={setLine('type')} className={inputCls + ' w-full'}>
                          <option value="labour">Labour</option>
                          <option value="service">Service</option>
                          <option value="part">Part</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {lineForm.type === 'service' && (
                        <div className="col-span-3">
                          <select value={lineForm.service_id} onChange={handleServiceChange} className={inputCls + ' w-full'}>
                            <option value="">Pick service…</option>
                            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          {lineErrors.service_id && <p className="text-red-500 text-xs mt-0.5">{lineErrors.service_id[0]}</p>}
                        </div>
                      )}

                      {lineForm.type === 'part' && (
                        <div className="col-span-3">
                          <select value={lineForm.part_id} onChange={handlePartChange} className={inputCls + ' w-full'}>
                            <option value="">Pick part…</option>
                            {parts.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
                          </select>
                          {lineErrors.part_id && <p className="text-red-500 text-xs mt-0.5">{lineErrors.part_id[0]}</p>}
                        </div>
                      )}

                      <div className={lineForm.type === 'labour' || lineForm.type === 'other' ? 'col-span-5' : 'col-span-2'}>
                        <input value={lineForm.description} onChange={setLine('description')} placeholder="Description" className={inputCls + ' w-full'} required />
                        {lineErrors.description && <p className="text-red-500 text-xs mt-0.5">{lineErrors.description[0]}</p>}
                      </div>

                      <div className="col-span-1">
                        <input type="number" value={lineForm.qty} onChange={setLine('qty')} min="0.01" step="0.01" placeholder="Qty" className={inputCls + ' w-full'} required />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={lineForm.unit_price} onChange={setLine('unit_price')} min="0" step="0.01" placeholder="Unit Price" className={inputCls + ' w-full'} required />
                      </div>
                      <div className="col-span-1">
                        <input type="number" value={lineForm.discount} onChange={setLine('discount')} min="0" max="100" placeholder="Disc%" className={inputCls + ' w-full'} />
                      </div>
                      <div className="col-span-1 flex gap-1">
                        <button type="submit" disabled={addLineMutation.isPending || updateLineMutation.isPending}
                          className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50">
                          {editingLine ? 'Update' : 'Add'}
                        </button>
                        <button type="button" onClick={() => { setAddingLine(false); setEditingLine(null); setLineErrors({}); }}
                          className="px-2 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50">✕</button>
                      </div>
                    </div>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-100 px-4 py-3 flex justify-end">
          <div className="w-48 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>RM {Number(totals.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-200 pt-1">
              <span>Total</span>
              <span>RM {Number(totals.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {editing && <WorkOrderForm workOrderId={Number(id)} onClose={() => setEditing(false)} />}
    </div>
  );
}

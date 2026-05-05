import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPart, createPart, updatePart } from '../../api/parts';

const EMPTY = {
  name: '', sku: '', description: '',
  unit_cost: '0', unit_price: '0',
  stock_qty: '0', reorder_level: '0',
};

const inputCls = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full';

export default function PartForm({ partId, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(partId);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const { data: existing } = useQuery({
    queryKey: ['part', partId],
    queryFn: () => getPart(partId),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing?.data) {
      const d = existing.data;
      setForm({
        name:          d.name,
        sku:           d.sku ?? '',
        description:   d.description ?? '',
        unit_cost:     d.unit_cost,
        unit_price:    d.unit_price,
        stock_qty:     d.stock_qty,
        reorder_level: d.reorder_level,
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updatePart(partId, data) : createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['part', partId] });
      onClose();
    },
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      name:          form.name,
      sku:           form.sku || null,
      description:   form.description || null,
      unit_cost:     Number(form.unit_cost),
      unit_price:    Number(form.unit_price),
      reorder_level: Number(form.reorder_level),
    };
    if (!isEdit) {
      payload.stock_qty = Number(form.stock_qty);
    }
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{isEdit ? 'Edit Part' : 'Add Part'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={form.name} onChange={set('name')} className={inputCls} required />
            {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input value={form.sku} onChange={set('sku')} placeholder="e.g. OIL-5W30-1L" className={inputCls} />
            {errors.sku && <p className="text-red-500 text-xs mt-0.5">{errors.sku[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={set('description')} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (RM) *</label>
              <input type="number" min="0" step="0.01"
                value={form.unit_cost} onChange={set('unit_cost')} className={inputCls} required />
              {errors.unit_cost && <p className="text-red-500 text-xs mt-0.5">{errors.unit_cost[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (RM) *</label>
              <input type="number" min="0" step="0.01"
                value={form.unit_price} onChange={set('unit_price')} className={inputCls} required />
              {errors.unit_price && <p className="text-red-500 text-xs mt-0.5">{errors.unit_price[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock Qty</label>
                <input type="number" min="0" step="1"
                  value={form.stock_qty} onChange={set('stock_qty')} className={inputCls} />
              </div>
            )}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                <div className="border border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-sm text-gray-500">
                  {form.stock_qty} — use Adjust Stock to change
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input type="number" min="0" step="1"
                value={form.reorder_level} onChange={set('reorder_level')} className={inputCls} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Part'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

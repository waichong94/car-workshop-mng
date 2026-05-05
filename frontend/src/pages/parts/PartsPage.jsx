import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getParts, deletePart, adjustPartStock } from '../../api/parts';
import PartForm from './PartForm';

export default function PartsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adjustingPart, setAdjustingPart] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ qty: 1, type: 'add' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['parts', { search, lowStockOnly, page }],
    queryFn: () => getParts({
      search:    search || undefined,
      low_stock: lowStockOnly ? 1 : undefined,
      page,
      per_page:  20,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts'] }),
    onError: (err) => alert(err.response?.data?.message ?? 'Failed to delete part.'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, type }) => adjustPartStock(id, qty, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setAdjustingPart(null);
    },
    onError: (err) => alert(err.response?.data?.message ?? 'Stock adjustment failed.'),
  });

  const handleDelete = (part) => {
    if (!confirm(`Delete "${part.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(part.id);
  };

  const openAdjust = (part) => {
    setAdjustingPart(part);
    setAdjustForm({ qty: 1, type: 'add' });
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    adjustMutation.mutate({
      id:   adjustingPart.id,
      qty:  Number(adjustForm.qty),
      type: adjustForm.type,
    });
  };

  const parts = data?.data ?? [];
  const meta  = data?.meta;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Parts Inventory</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + Add Part
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Low stock only
        </label>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError   && <p className="text-red-500">Failed to load parts. Please try again.</p>}

      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-right">Cost (RM)</th>
                  <th className="px-4 py-3 text-right">Price (RM)</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Reorder At</th>
                  <th className="px-4 py-3 text-left">Alert</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                      No parts found.
                    </td>
                  </tr>
                )}
                {parts.map((part) => (
                  <tr key={part.id} className={`hover:bg-gray-50 ${part.is_low_stock ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{part.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{part.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(part.unit_cost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(part.unit_price).toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${part.is_low_stock ? 'text-red-600' : 'text-gray-800'}`}>
                      {part.stock_qty}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{part.reorder_level}</td>
                    <td className="px-4 py-3">
                      {part.is_low_stock && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => openAdjust(part)} className="text-gray-600 hover:underline">
                        Adjust
                      </button>
                      <button onClick={() => setEditingId(part.id)} className="text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(part)} className="text-red-500 hover:underline">
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
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-600">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {/* Adjust Stock modal */}
      {adjustingPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Adjust Stock</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-800">{adjustingPart.name}</span>
              {' '}— current stock:{' '}
              <strong className={adjustingPart.is_low_stock ? 'text-red-600' : 'text-gray-800'}>
                {adjustingPart.stock_qty}
              </strong>
            </p>
            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <div className="flex gap-2">
                  {[{ id: 'add', label: '+ Add' }, { id: 'subtract', label: '− Remove' }].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAdjustForm((f) => ({ ...f, type: id }))}
                      className={`flex-1 py-1.5 rounded text-sm border transition-colors ${
                        adjustForm.type === id
                          ? id === 'add'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number" min="1" step="1"
                  value={adjustForm.qty}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, qty: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAdjustingPart(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={adjustMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {adjustMutation.isPending ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {creating  && <PartForm partId={undefined} onClose={() => setCreating(false)} />}
      {editingId && <PartForm partId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}

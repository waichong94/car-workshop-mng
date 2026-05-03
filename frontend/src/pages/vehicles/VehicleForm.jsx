import useVehicleForm from '../../hooks/useVehicleForm';

export default function VehicleForm({ vehicleId, customerId, onClose }) {
  const {
    form, errors, set, handleSubmit, isPending, isEdit, needsCustomerPicker, customers,
  } = useVehicleForm({ vehicleId, customerId, onClose });

  const field = (key, label, type = 'text', props = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {needsCustomerPicker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                value={form.customer_id}
                onChange={set('customer_id')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id[0]}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {field('plate', 'Plate *', 'text', { placeholder: 'e.g. ABC 1234' })}
            {field('year', 'Year *', 'number', { min: 1900, max: new Date().getFullYear() + 1 })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('make', 'Make *', 'text', { placeholder: 'e.g. Toyota' })}
            {field('model', 'Model *', 'text', { placeholder: 'e.g. Camry' })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('color', 'Color', 'text', { placeholder: 'e.g. Silver' })}
            {field('mileage', 'Mileage (km)', 'number', { min: 0 })}
          </div>
          {field('vin', 'VIN', 'text', { maxLength: 17, placeholder: '17-character VIN' })}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

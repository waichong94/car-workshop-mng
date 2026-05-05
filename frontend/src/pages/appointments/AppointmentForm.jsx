import useAppointmentForm from '../../hooks/useAppointmentForm';

export default function AppointmentForm({ appointmentId, onClose }) {
  const {
    form, errors, set, handleSubmit, isPending, isEdit,
    handleCustomerChange, customers, vehicles,
  } = useAppointmentForm({ appointmentId, onClose });

  const fieldClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {isEdit ? 'Edit Appointment' : 'New Appointment'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select value={form.customer_id} onChange={handleCustomerChange} className={fieldClass}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-red-500 text-xs mt-1">{errors.customer_id[0]}</p>
            )}
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
            <select
              value={form.vehicle_id}
              onChange={set('vehicle_id')}
              className={fieldClass}
              disabled={!form.customer_id}
            >
              <option value="">
                {form.customer_id ? 'Select vehicle…' : 'Select a customer first'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.make} {v.model} ({v.year})
                </option>
              ))}
            </select>
            {errors.vehicle_id && (
              <p className="text-red-500 text-xs mt-1">{errors.vehicle_id[0]}</p>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={set('scheduled_at')}
              className={fieldClass}
            />
            {errors.scheduled_at && (
              <p className="text-red-500 text-xs mt-1">{errors.scheduled_at[0]}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className={fieldClass}
              placeholder="Optional notes…"
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

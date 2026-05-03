import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVehicle, createVehicle, updateVehicle } from '../../api/vehicles';
import { getCustomers } from '../../api/customers';

const EMPTY = {
  customer_id: '',
  plate: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  vin: '',
  mileage: '',
  notes: '',
};

export default function VehicleForm({ vehicleId, customerId, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!vehicleId;
  const needsCustomerPicker = !isEdit && !customerId;

  const { data: existing } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicle(vehicleId),
    enabled: isEdit,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => getCustomers({ per_page: 200 }),
    enabled: needsCustomerPicker,
  });

  const [form, setForm] = useState({ ...EMPTY, customer_id: customerId ?? '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existing?.data) {
      const d = existing.data;
      setForm({
        customer_id: d.customer_id,
        plate: d.plate ?? '',
        make: d.make ?? '',
        model: d.model ?? '',
        year: d.year ?? '',
        color: d.color ?? '',
        vin: d.vin ?? '',
        mileage: d.mileage ?? '',
        notes: d.notes ?? '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? updateVehicle(vehicleId, data) : createVehicle(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate(form);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const textField = (key, label, type = 'text', props = {}) => (
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

  const customers = customersData?.data ?? [];

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
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="text-red-500 text-xs mt-1">{errors.customer_id[0]}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {textField('plate', 'Plate *', 'text', { required: true, placeholder: 'e.g. ABC 1234' })}
            {textField('year', 'Year *', 'number', {
              required: true,
              min: 1900,
              max: new Date().getFullYear() + 1,
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {textField('make', 'Make *', 'text', { required: true, placeholder: 'e.g. Toyota' })}
            {textField('model', 'Model *', 'text', { required: true, placeholder: 'e.g. Camry' })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {textField('color', 'Color', 'text', { placeholder: 'e.g. Silver' })}
            {textField('mileage', 'Mileage (km)', 'number', { min: 0, placeholder: '0' })}
          </div>
          {textField('vin', 'VIN', 'text', {
            maxLength: 17,
            placeholder: 'Vehicle Identification Number',
          })}
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
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

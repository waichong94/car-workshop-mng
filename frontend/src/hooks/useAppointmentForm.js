import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomers } from '../api/customers';
import { getVehicles } from '../api/vehicles';
import { getAppointment, createAppointment, updateAppointment } from '../api/appointments';

const EMPTY = {
  customer_id: '',
  vehicle_id: '',
  scheduled_at: '',
  notes: '',
};

function validate(form) {
  const errs = {};
  if (!form.customer_id) errs.customer_id = ['Customer is required.'];
  if (!form.vehicle_id) errs.vehicle_id = ['Vehicle is required.'];
  if (!form.scheduled_at) errs.scheduled_at = ['Date and time is required.'];
  return errs;
}

export default function useAppointmentForm({ appointmentId, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!appointmentId;

  const { data: existing } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => getAppointment(appointmentId),
    enabled: isEdit,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => getCustomers({ per_page: 200 }),
  });

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-for-customer', selectedCustomerId],
    queryFn: () => getVehicles({ customer_id: selectedCustomerId, per_page: 100 }),
    enabled: !!selectedCustomerId,
  });

  useEffect(() => {
    if (existing?.data) {
      const d = existing.data;
      const cid = String(d.customer?.id ?? '');
      // Convert "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm" for datetime-local input
      const scheduledAt = d.scheduled_at
        ? d.scheduled_at.replace(' ', 'T').slice(0, 16)
        : '';
      setForm({
        customer_id: cid,
        vehicle_id: String(d.vehicle?.id ?? ''),
        scheduled_at: scheduledAt,
        notes: d.notes ?? '',
      });
      setSelectedCustomerId(cid);
    }
  }, [existing]);

  const handleCustomerChange = (e) => {
    const cid = e.target.value;
    setForm((prev) => ({ ...prev, customer_id: cid, vehicle_id: '' }));
    setSelectedCustomerId(cid);
  };

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateAppointment(appointmentId, data) : createAppointment(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      } else {
        const newId = String(response?.data?.id);
        if (newId) queryClient.setQueryData(['appointment', newId], response);
      }
      onClose();
    },
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientErrors = validate(form);
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }
    setErrors({});
    // Convert datetime-local value "YYYY-MM-DDTHH:mm" → "YYYY-MM-DD HH:mm:ss" for backend
    const payload = {
      ...form,
      scheduled_at: form.scheduled_at
        ? form.scheduled_at.replace('T', ' ') + ':00'
        : '',
    };
    if (!payload.notes) delete payload.notes;
    mutation.mutate(payload);
  };

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return {
    form, errors, set, handleSubmit, isPending: mutation.isPending, isEdit,
    handleCustomerChange,
    customers: customersData?.data ?? [],
    vehicles: vehiclesData?.data ?? [],
  };
}

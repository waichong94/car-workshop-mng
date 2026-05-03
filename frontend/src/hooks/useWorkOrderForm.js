import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomers } from '../api/customers';
import { getVehicles } from '../api/vehicles';
import { getWorkOrder, createWorkOrder, updateWorkOrder } from '../api/workOrders';

const EMPTY = {
  customer_id: '',
  vehicle_id: '',
  assigned_to: '',
  description: '',
  mileage_in: '',
};

function validate(form) {
  const errs = {};
  if (!form.customer_id) errs.customer_id = ['Customer is required.'];
  if (!form.vehicle_id) errs.vehicle_id = ['Vehicle is required.'];
  return errs;
}

export default function useWorkOrderForm({ workOrderId, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!workOrderId;

  const { data: existing } = useQuery({
    queryKey: ['work-order', workOrderId],
    queryFn: () => getWorkOrder(workOrderId),
    enabled: isEdit,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => getCustomers({ per_page: 200 }),
  });

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // When customer changes, reset vehicle selection
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
      setForm({
        customer_id: cid,
        vehicle_id:  String(d.vehicle?.id ?? ''),
        assigned_to: String(d.assigned_to?.id ?? ''),
        description: d.description ?? '',
        mileage_in:  d.mileage_in ?? '',
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
    mutationFn: (data) => (isEdit ? updateWorkOrder(workOrderId, data) : createWorkOrder(data)),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] });
      } else {
        // Pre-populate the detail cache so navigation to the new WO is instant
        const newId = String(response?.data?.id);
        if (newId) queryClient.setQueryData(['work-order', newId], response);
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
    const payload = { ...form };
    if (!payload.assigned_to) delete payload.assigned_to;
    if (!payload.mileage_in) delete payload.mileage_in;
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

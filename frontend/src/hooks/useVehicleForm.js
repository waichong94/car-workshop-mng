import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVehicle, createVehicle, updateVehicle } from '../api/vehicles';
import { getCustomers } from '../api/customers';

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

function validate(form, needsCustomerPicker) {
  const errs = {};
  if (needsCustomerPicker && !form.customer_id) errs.customer_id = ['Customer is required.'];
  if (!form.plate.trim()) errs.plate = ['Plate is required.'];
  if (!form.make.trim()) errs.make = ['Make is required.'];
  if (!form.model.trim()) errs.model = ['Model is required.'];
  const yr = Number(form.year);
  if (!yr || yr < 1900 || yr > new Date().getFullYear() + 1) errs.year = ['Enter a valid year.'];
  if (form.vin && form.vin.length !== 17) errs.vin = ['VIN must be exactly 17 characters.'];
  if (form.mileage !== '' && Number(form.mileage) < 0) errs.mileage = ['Mileage cannot be negative.'];
  return errs;
}

export default function useVehicleForm({ vehicleId, customerId, onClose }) {
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
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      onClose();
    },
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientErrors = validate(form, needsCustomerPicker);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    mutation.mutate(form);
  };

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return {
    form,
    errors,
    set,
    handleSubmit,
    isPending: mutation.isPending,
    isEdit,
    needsCustomerPicker,
    customers: customersData?.data ?? [],
  };
}

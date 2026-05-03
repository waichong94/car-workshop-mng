import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomer } from '../../api/customers';
import { getVehicles, deleteVehicle } from '../../api/vehicles';
import CustomerForm from './CustomerForm';
import VehicleForm from '../vehicles/VehicleForm';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
  });

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles', { customer_id: id }],
    queryFn: () => getVehicles({ customer_id: id, per_page: 50 }),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['vehicles', { customer_id: id }] }),
  });

  const handleDeleteVehicle = (vehicleId, plate) => {
    if (!confirm(`Delete vehicle "${plate}"?`)) return;
    deleteVehicleMutation.mutate(vehicleId);
  };

  if (customerLoading) return <div className="p-6 text-gray-500">Loading…</div>;

  const customer = customerData?.data;
  if (!customer) return <div className="p-6 text-red-500">Customer not found.</div>;

  const vehicles = vehiclesData?.data ?? [];

  return (
    <div className="p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/customers" className="text-blue-600 hover:underline">Customers</Link>
        <span className="mx-1">/</span>
        <span>{customer.name}</span>
      </div>

      {/* Customer info card */}
      <div className="bg-white rounded shadow p-5 mb-6">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
          <button
            onClick={() => setEditingCustomer(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-800">{customer.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-800">{customer.email ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Address</dt>
            <dd className="text-gray-800 whitespace-pre-wrap">{customer.address ?? '—'}</dd>
          </div>
          {customer.notes && (
            <div className="col-span-2">
              <dt className="text-gray-500">Notes</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{customer.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Vehicles section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">
            Vehicles
            {vehicles.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({vehicles.length})</span>
            )}
          </h2>
          <button
            onClick={() => setEditingVehicle('new')}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            + Add Vehicle
          </button>
        </div>

        {vehiclesLoading ? (
          <p className="text-gray-400 text-sm">Loading vehicles…</p>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Plate</th>
                  <th className="px-4 py-3 text-left">Make / Model</th>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-right">Mileage</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No vehicles yet. Add one above.
                    </td>
                  </tr>
                )}
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{v.plate}</td>
                    <td className="px-4 py-3 text-gray-700">{v.make} {v.model}</td>
                    <td className="px-4 py-3 text-gray-600">{v.year}</td>
                    <td className="px-4 py-3 text-gray-600">{v.color ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {v.mileage != null ? v.mileage.toLocaleString() + ' km' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setEditingVehicle(v.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id, v.plate)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingCustomer && (
        <CustomerForm
          customerId={Number(id)}
          onClose={() => setEditingCustomer(false)}
        />
      )}

      {editingVehicle !== null && (
        <VehicleForm
          vehicleId={editingVehicle === 'new' ? null : editingVehicle}
          customerId={editingVehicle === 'new' ? Number(id) : null}
          onClose={() => setEditingVehicle(null)}
        />
      )}
    </div>
  );
}

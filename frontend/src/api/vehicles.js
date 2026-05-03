import client from './client';

export const getVehicles = (params) =>
  client.get('/vehicles', { params }).then((r) => r.data);

export const getVehicle = (id) =>
  client.get(`/vehicles/${id}`).then((r) => r.data);

export const createVehicle = (data) =>
  client.post('/vehicles', data).then((r) => r.data);

export const updateVehicle = (id, data) =>
  client.put(`/vehicles/${id}`, data).then((r) => r.data);

export const deleteVehicle = (id) =>
  client.delete(`/vehicles/${id}`);

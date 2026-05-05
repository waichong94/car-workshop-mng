import client from './client';

export const getParts = (params) =>
  client.get('/parts', { params }).then((r) => r.data);

export const getPart = (id) =>
  client.get(`/parts/${id}`).then((r) => r.data);

export const createPart = (data) =>
  client.post('/parts', data).then((r) => r.data);

export const updatePart = (id, data) =>
  client.put(`/parts/${id}`, data).then((r) => r.data);

export const deletePart = (id) =>
  client.delete(`/parts/${id}`).then(() => null);

export const adjustPartStock = (id, qty, type) =>
  client.patch(`/parts/${id}/adjust-stock`, { qty, type }).then((r) => r.data);

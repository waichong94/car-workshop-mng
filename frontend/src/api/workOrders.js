import client from './client';

export const getWorkOrders = (params) =>
  client.get('/work-orders', { params }).then((r) => r.data);

export const getWorkOrder = (id) =>
  client.get(`/work-orders/${id}`).then((r) => r.data);

export const createWorkOrder = (data) =>
  client.post('/work-orders', data).then((r) => r.data);

export const updateWorkOrder = (id, data) =>
  client.put(`/work-orders/${id}`, data).then((r) => r.data);

export const deleteWorkOrder = (id) =>
  client.delete(`/work-orders/${id}`).then(() => null);

export const transitionWorkOrder = (id, status) =>
  client.patch(`/work-orders/${id}/transition`, { status }).then((r) => r.data);

export const addWorkOrderLine = (workOrderId, data) =>
  client.post(`/work-orders/${workOrderId}/lines`, data).then((r) => r.data);

export const updateWorkOrderLine = (workOrderId, lineId, data) =>
  client.put(`/work-orders/${workOrderId}/lines/${lineId}`, data).then((r) => r.data);

export const deleteWorkOrderLine = (workOrderId, lineId) =>
  client.delete(`/work-orders/${workOrderId}/lines/${lineId}`).then(() => null);

import client from './client';

export const getInvoices = (params) =>
  client.get('/invoices', { params }).then((r) => r.data);

export const getInvoice = (id) =>
  client.get(`/invoices/${id}`).then((r) => r.data);

export const generateInvoice = (data) =>
  client.post('/invoices', data).then((r) => r.data);

export const updateInvoice = (id, data) =>
  client.put(`/invoices/${id}`, data).then((r) => r.data);

export const deleteInvoice = (id) =>
  client.delete(`/invoices/${id}`).then(() => null);

export const transitionInvoice = (id, status) =>
  client.patch(`/invoices/${id}/transition`, { status }).then((r) => r.data);

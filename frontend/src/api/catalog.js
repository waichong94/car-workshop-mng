import client from './client';

export const getServices = (params) =>
  client.get('/services', { params }).then((r) => r.data);

export const getParts = (params) =>
  client.get('/parts', { params }).then((r) => r.data);

import client from './client';

export const login = (email, password) =>
  client.post('/login', { email, password }).then((r) => r.data);

export const logout = () =>
  client.post('/logout').then((r) => r.data);

export const getMe = () =>
  client.get('/me').then((r) => r.data);

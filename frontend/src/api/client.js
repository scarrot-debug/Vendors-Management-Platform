const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() { return localStorage.getItem('token'); }

async function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (username, password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getVendors: (params = {}) => req(`/vendors?${new URLSearchParams(params)}`),
  getCategories: () => req('/vendors/categories'),
  createVendor: (data) => req('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id, data) => req(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id) => req(`/vendors/${id}`, { method: 'DELETE' }),
  getUsers: () => req('/users'),
  createUser: (data) => req('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => req(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => req(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id, password) => req(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  updateProduct: (distId, pid, data) => req(`/vendors/${distId}/products/${pid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (distId, pid) => req(`/vendors/${distId}/products/${pid}`, { method: 'DELETE' }),
};

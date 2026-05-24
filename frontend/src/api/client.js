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

async function download(path) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vendors-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  login: (username, password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getVendors: (params = {}) => req(`/vendors?${new URLSearchParams(params)}`),
  getCategories: () => req('/vendors/categories'),
  exportCSV: () => download('/vendors/export'),
  createVendor: (data) => req('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id, data) => req(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id) => req(`/vendors/${id}`, { method: 'DELETE' }),
  addProduct: (distId, data) => req(`/vendors/${distId}/products`, { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (distId, pid, data) => req(`/vendors/${distId}/products/${pid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (distId, pid) => req(`/vendors/${distId}/products/${pid}`, { method: 'DELETE' }),
  getUsers: () => req('/users'),
  createUser: (data) => req('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => req(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => req(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id, password) => req(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  getHistory: (params = {}) => req(`/history?${new URLSearchParams(params)}`),
  getSettings: () => req('/settings'),
  getMyPermissions: () => req('/settings/my-permissions'),
  setSessionTimeout: (value) => req('/settings/session-timeout', { method: 'PUT', body: JSON.stringify({ value }) }),
  setLogo: (logo) => req('/settings/logo', { method: 'PUT', body: JSON.stringify({ logo }) }),
  getUserPermissions: (id) => req(`/users/${id}/permissions`),
  updateUserPermissions: (id, perms) => req(`/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify(perms) }),
};

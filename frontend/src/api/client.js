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
  const res = await fetch(`${BASE}${path}`, { headers: { 'Authorization': `Bearer ${token}` } });
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
  getSystemCategories: () => req('/settings/categories'),
  setSystemCategories: (categories) => req('/settings/categories', { method: 'PUT', body: JSON.stringify({ categories }) }),
  getSystemManufacturers: () => req('/settings/manufacturers'),
  setSystemManufacturers: (manufacturers) => req('/settings/manufacturers', { method: 'PUT', body: JSON.stringify({ manufacturers }) }),
  getMyProfile: () => req('/users/me'),
  updateMyProfile: (data) => req('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  changeMyPassword: (data) => req('/users/me/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getUserPermissions: (id) => req(`/users/${id}/permissions`),
  updateUserPermissions: (id, perms) => req(`/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify(perms) }),
  getDocuments: (distId) => req(`/documents/${distId}`),
  uploadDocument: (distId, data) => req(`/documents/${distId}`, { method: 'POST', body: JSON.stringify(data) }),
  deleteDocument: (distId, docId) => req(`/documents/${distId}/${docId}`, { method: 'DELETE' }),
  downloadDocument: (distId, docId) => `${BASE}/documents/${distId}/${docId}/download`,
  getRequests: () => req('/requests'),
  getRequest: (id) => req(`/requests/${id}`),
  createRequest: (data) => req('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (id, data) => req(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitRequest: (id) => req(`/requests/${id}/submit`, { method: 'POST' }),
  approveRequest: (id, data) => req(`/requests/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectRequest: (id, data) => req(`/requests/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  deleteRequest: (id) => req(`/requests/${id}`, { method: 'DELETE' }),
  downloadRequestDoc: (reqId, docId) => `${BASE}/requests/${reqId}/documents/${docId}/download`,
  getPageTitles: () => req('/settings/page-titles'),
  setPageTitles: (titles) => req('/settings/page-titles', { method: 'PUT', body: JSON.stringify({ titles }) }),
  getAllowedIps: () => req('/settings/allowed-ips'),
  setAllowedIps: (ips) => req('/settings/allowed-ips', { method: 'PUT', body: JSON.stringify({ ips }) }),
};// Add these lines before the closing };

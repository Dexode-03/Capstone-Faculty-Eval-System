import api from './api';

const authService = {
  // Existing auth methods
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),

  // Admin account management CRUD operations
  getAllAccounts: (role) => api.get(`/auth/admin/accounts?role=${role}`),
  getAccountById: (id, role) => api.get(`/auth/admin/accounts/${id}?role=${role}`),
  createAccount: (data) => api.post('/auth/admin/accounts', data),
  updateAccount: (id, role, data) => api.put(`/auth/admin/accounts/${id}?role=${role}`, data),
  deleteAccount: (id, role) => api.delete(`/auth/admin/accounts/${id}?role=${role}`),
};

export default authService;

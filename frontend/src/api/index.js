import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => API.post('/api/auth/register', data);
export const loginUser    = (data) => API.post('/api/auth/login', data);
export const getMe        = ()     => API.get('/api/auth/me');

// Admin
export const getAllUsers      = ()          => API.get('/api/admin/users');
export const getUserById      = (id)        => API.get(`/api/admin/users/${id}`);
export const markCompleted    = (id)        => API.patch(`/api/admin/complete/${id}`);
export const sendCertificate  = (id, data) => API.post(`/api/admin/send-certificate/${id}`, data);

// Student
export const getMyCertificates = () => API.get('/api/student/certificates');

export default API;

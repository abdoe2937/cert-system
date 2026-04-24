  import axios from 'axios';

  const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
    timeout: 15000,
  });

  API.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  API.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  // Auth
  export const registerUser    = (formData) => API.post('/api/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  export const loginUser       = (data) => API.post('/api/auth/login', data);
  export const getMe           = ()     => API.get('/api/auth/me');

  // Admin
  export const getAllUsers      = ()          => API.get('/api/admin/users');
  export const getUserById      = (id)        => API.get(`/api/admin/users/${id}`);
  export const markCompleted    = (id)        => API.patch(`/api/admin/complete/${id}`);
  export const sendCertificate  = (id, data) => API.post(`/api/admin/send-certificate/${id}`, data);
  export const generateCard     = (id, data = {}) => API.post(`/api/admin/generate-card/${id}`, data);

  // Student
  export const getMyCertificates = () => API.get('/api/student/certificates');
  export const getMyCard         = () => API.get('/api/student/my-card');

  export default API;
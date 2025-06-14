import axios from 'axios';

const api = axios.create({
  baseURL: 'https://billing-system-server-ten.vercel.app/api' || process.env.REACT_APP_API_URL, // Your backend base URL
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login on unauthorized
    }
    return Promise.reject(error);
  }
);

export default api;
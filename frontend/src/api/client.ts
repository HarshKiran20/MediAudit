import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://mediaudit-api.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

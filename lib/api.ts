// lib/api.js

import axios from "axios";

// Create an Axios instance
const api = axios.create({
  // baseURL: "http://localhost:5000/api", // Previous local URL
  baseURL: 'https://personal-finance-app-4ux4.onrender.com/api', // Updated Render URL
  headers: { // Add headers configuration
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    // Check if running in a browser environment before accessing localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      // Use bracket notation for Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

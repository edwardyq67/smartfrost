// lib/axios-config.ts
import axios from 'axios';

// Crear una instancia de axios
export const axiosInstance = axios.create();

// Función para manejar redirección de auth
const handleAuthRedirect = () => {
  if (typeof window !== 'undefined') {
    // Limpiar almacenamiento local
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
    sessionStorage.clear();
    
    // Redirigir a login
    window.location.href = '/auth/login';
  }
};

// Interceptor de respuesta para manejar errores globalmente
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      handleAuthRedirect();
    }
    
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de request para agregar tokens
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
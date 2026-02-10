// lib/auth/auth.ts
import axios from 'axios';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Crear instancia base de axios
const authApi = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para responses - manejar errores
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Error de autenticación';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Error de red - verifica tu conexión');
    } else {
      throw new Error('Error en la configuración de la solicitud');
    }
  }
);

export const authService = {
  login: async (credentials: { usuario: string; clave: string }) => {
    const response = await authApi.post(API_ENDPOINTS.login, credentials);
    
    if (response.data.data?.accessToken) {
      const userData = {
        id: response.data.data.userId || '',
        nombre: response.data.data.nombre || response.data.data.usuario || '',
        rol: response.data.data.rol || '',
        empresa: response.data.data.id_empresa || '',
        avatar:response.data.data.avatar,
        tutorial:response.data.data.tutorial
      };
      
      // Usar setAuth para guardar todo junto
      useAuthStore.getState().setAuth(
        response.data.data.accessToken,
        userData,
        response.data.data.permisos || []
      );
    }
    
    return response.data;
  }
};

export { authApi };
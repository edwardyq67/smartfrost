// lib/permisos/UsePermisos.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';
// Interfaces para los permisos individuales
export interface Permiso {
  descripcion: string;
  uuid_permiso: string;
  uuid_detalle: string;
  valor: number;
}

// Interface para el módulo con permisos
export interface ModuloPermisos {
  modulo: string;
  permisos: Permiso[];
}

// Interface para la respuesta completa de la API
export interface PermisosResponse {
  status: number;
  message: string;
  data: ModuloPermisos[]; // data es directamente un array de ModuloPermisos
  description: string;
}

// Interface para permisos simplificados (sin el nivel de módulo)
export interface PermisoSimplificado {
  descripcion: string;
  valor: number;
  uuid_permiso: string;
  uuid_detalle: string;
}

// Interface para la respuesta cuando se usa el parámetro módulo
export interface PermisosPorRolYModuloResponse {
  status: number;
  message: string;
   data: ModuloPermisos[], // En este caso data es un solo ModuloPermisos
  description: string;
}

// Resto de las interfaces permanecen igual...
export interface ActualizarPermisoData {
  deleted_at: 0 | 1;
}

export interface CrearPermisoData {
  id_permiso: string;
  id_rol: string;
}

export interface ActualizarPermisoResponse {
  status: number;
  message: string;
  data: {
    message: string;
  };
  description: string;
}

export interface CrearPermisoResponse {
  status: number;
  message: string;
  data: {
    message: string;
  };
  description: string;
}

export interface PermisosPorRolParams {
  id_rol: string;
}

export interface PermisosPorRolYModuloParams {
  id_rol: string;
  modulo: string;
}

export const permisosService = {
  // Obtener permisos por rol
  getPermisosPorRol: async (params: PermisosPorRolParams): Promise<PermisosResponse> => {
    const { id_rol } = params;
    
    const response = await axiosInstance.get(`${API_ENDPOINTS.permisos}/permisosPorRol`, {
      params: { 
        id_rol
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data.data;
  },

  // Obtener permisos por rol y módulo específico
  getPermisosPorRolYModulo: async (params: PermisosPorRolYModuloParams): Promise<PermisosPorRolYModuloResponse> => {
    const { id_rol, modulo } = params;
    
    const response = await axiosInstance.get(`${API_ENDPOINTS.permisos}/permisosPorRol`, {
      params: { 
        id_rol,
        modulo
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data.data;
  },

  // Resto de los métodos permanecen igual...
  updatePermiso: async (uuid_detalle: string, deleted_at: 0 | 1): Promise<ActualizarPermisoResponse> => {
    const response = await axiosInstance.patch(
      `${API_ENDPOINTS.permisos}/${uuid_detalle}`, 
      { deleted_at },
      { headers: useAuthStore.getState().getAuthHeaders() }
    );
    return response.data;
  },

  createPermiso: async (permisoData: CrearPermisoData): Promise<CrearPermisoResponse> => {
    const response = await axiosInstance.post(
      `${API_ENDPOINTS.permisos}`, 
      permisoData,
      { headers: useAuthStore.getState().getAuthHeaders() }
    );
    return response.data;
  },

  activarPermiso: async (uuid_detalle: string): Promise<ActualizarPermisoResponse> => {
    return permisosService.updatePermiso(uuid_detalle, 0);
  },

  desactivarPermiso: async (uuid_detalle: string): Promise<ActualizarPermisoResponse> => {
    return permisosService.updatePermiso(uuid_detalle, 1);
  }
};
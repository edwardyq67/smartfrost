import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';
// Interfaces para la respuesta de la API de Roles
export interface Rol {
  id: string;
  uuid: string;
  nombre: string;
  descripcion: string;
  estado: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface RolesData {
  data: Rol[];
  pager: Pager;
}

export interface RolesResponse {
  status: number;
  message: string;
  data: RolesData;
  description: string;
}

// Interface para los parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  nombre?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface para crear un rol
export interface CreateRolData {
  nombre: string;
  descripcion: string;
  estado: string;
}

// Interface para actualizar un rol
export interface UpdateRolData {
  nombre?: string;
  descripcion?: string;
  estado?: string;
}

// Interface para eliminar un rol
export interface DeleteRolData {
  deleted_at: number;
}
export const rolesService = {
  // Obtener roles con paginación
  getRoles: async (params: PaginationParams = {}): Promise<RolesResponse> => {
    const { page = 1, size = 10, search, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.roles, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener un rol por ID
  getRolById: async (id: string): Promise<RolesResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.roles}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear un nuevo rol (POST)
  createRol: async (rolData: CreateRolData): Promise<RolesResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.roles, rolData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un rol existente (PATCH)
  updateRol: async (id: string, rolData: UpdateRolData): Promise<RolesResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.roles}/${id}`, rolData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un rol (soft delete - DELETE con body)
  deleteRol: async (id: string): Promise<RolesResponse> => {
    const deleteData: DeleteRolData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.roles}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar un rol eliminado (PATCH)
  restoreRol: async (id: string): Promise<RolesResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.roles}/${id}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
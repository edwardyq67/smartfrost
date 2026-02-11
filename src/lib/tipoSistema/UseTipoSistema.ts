// lib/tipoSistema/UseTipoSistema.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';
// Interfaces para la respuesta de la API de TipoSistema
export interface Creador {
  uuid: string;
  nombre: string;
}

export interface TipoSistema {
  id: string;
  uuid: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  created_at: string;
  creador: Creador;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface TipoSistemaData {
  data: TipoSistema[];
  pager: Pager;
}

export interface TipoSistemaResponse {
  status: number;
  message: string;
  data: TipoSistemaData;
  description: string;
}

export interface SingleTipoSistemaResponse {
  status: number;
  message: string;
  data: {
    data: TipoSistema;
  };
  description: string;
}

// Interface para los parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  nombre?: string; 
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface para crear un tipo de sistema
export interface CreateTipoSistemaData {
  nombre: string;
  descripcion?: string;
  imagen?: string;
}

// Interface para actualizar un tipo de sistema
export interface UpdateTipoSistemaData {
  nombre?: string;
  descripcion?: string;
  imagen?: string;
}

// Interface para eliminar un tipo de sistema
export interface DeleteTipoSistemaData {
  deleted_at: number;
}

export const TipoSistemaService = {
  // Obtener tipos de sistema con paginación
  getTipoSistemas: async (params: PaginationParams = {}): Promise<TipoSistemaResponse> => {
    const { page = 1, size = 10, nombre, sortBy, sortOrder } = params; // ✅ CAMBIADO de search a nombre
    
    const response = await axiosInstance.get(API_ENDPOINTS.tipoSistema, {
      params: { 
        page, 
        size,
        ...(nombre && { nombre }), // ✅ CAMBIADO de search a nombre
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },


  // Obtener un tipo de sistema por ID
  getTipoSistemaById: async (id: string): Promise<SingleTipoSistemaResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.tipoSistema}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear un nuevo tipo de sistema (POST)
  createTipoSistema: async (tipoSistemaData: CreateTipoSistemaData): Promise<SingleTipoSistemaResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.tipoSistema, tipoSistemaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un tipo de sistema existente (PATCH)
  updateTipoSistema: async (id: string, tipoSistemaData: UpdateTipoSistemaData): Promise<SingleTipoSistemaResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.tipoSistema}/${id}`, tipoSistemaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un tipo de sistema (soft delete - DELETE con body)
  deleteTipoSistema: async (id: string): Promise<SingleTipoSistemaResponse> => {
    const deleteData: DeleteTipoSistemaData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.tipoSistema}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar un tipo de sistema eliminado (PATCH)
  restoreTipoSistema: async (id: string): Promise<SingleTipoSistemaResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.tipoSistema}/${id}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};

// 🔥 Exportar un alias para mantener compatibilidad con tu código existente
export const tiposSistemaService = TipoSistemaService;

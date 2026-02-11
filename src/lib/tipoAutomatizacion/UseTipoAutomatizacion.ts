import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interface para el creador
export interface Creador {
  uuid: string;
  nombre: string;
}

// Interface para relaciones
export interface Relacion {
  uuid: string;
  id_entidad: string;
  tipo_entidad: string;
  cantidad: string;
  nombre_entidad?: string; // Agregado según tu descripción
}

// Interface principal para TipoAutomatizacion
export interface TipoAutomatizacion {
  id: string;
  uuid: string;
  nombre: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  creador: Creador;
  relaciones: Relacion[];
}

// Interface para la respuesta de creación
export interface CreateTipoAutomatizacionResponseData {
  message: string;
  tipo_automatizacion: {
    id: string;
    uuid: string;
    nombre: string;
    estado?: string;
    id_user: string;
    created_at: string;
    modified_at: string;
    deleted_at: string;
  };
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface TipoAutomatizacionData {
  data: TipoAutomatizacion[];
  pager: Pager;
}

// CORREGIDO: Respuesta principal para listado
export interface TipoAutomatizacionResponse {
  status: number;
  message: string;
  data: TipoAutomatizacionData; // Aquí está el cambio
  description: string;
}

// Interface para respuesta individual (GET by ID)
export interface TipoAutomatizacionSingleResponse {
  status: number;
  message: string;
  data: TipoAutomatizacion;
  description: string;
}

// Interface para respuesta de creación
export interface CreateTipoAutomatizacionResponse {
  status: number;
  message: string;
  data: CreateTipoAutomatizacionResponseData;
  description: string;
}

// Interface para los parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface para crear un tipo de automatización
export interface CreateTipoAutomatizacionData {
  nombre: string;
}

// Interface para actualizar un tipo de automatización
export interface UpdateTipoAutomatizacionData {
  nombre?: string;
  estado?: string;
}

// Interface para eliminar un tipo de automatización
export interface DeleteTipoAutomatizacionData {
  deleted_at: number;
}

export const tipoAutomatizacionService = {
  // Obtener tipos de automatización con paginación
  getTipoAutomatizaciones: async (
    params: PaginationParams = {}
  ): Promise<TipoAutomatizacionResponse> => {
    const { 
      page = 1, 
      size = 10, 
      search, 
      sortBy, 
      sortOrder
    } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.tipoAutomatizacion, {
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

  // Obtener un tipo de automatización por ID
  getTipoAutomatizacionById: async (id: string): Promise<TipoAutomatizacionSingleResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.tipoAutomatizacion}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ CREAR un nuevo tipo de automatización
  createTipoAutomatizacion: async (
    data: CreateTipoAutomatizacionData
  ): Promise<CreateTipoAutomatizacionResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.tipoAutomatizacion, data, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un tipo de automatización (PATCH)
  updateTipoAutomatizacion: async (
    id: string, 
    data: UpdateTipoAutomatizacionData
  ): Promise<TipoAutomatizacionSingleResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.tipoAutomatizacion}/${id}`, data, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un tipo de automatización (soft delete - DELETE con body)
  deleteTipoAutomatizacion: async (id: string): Promise<TipoAutomatizacionSingleResponse> => {
    const deleteData: DeleteTipoAutomatizacionData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.tipoAutomatizacion}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
};
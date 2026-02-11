import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';


// Interfaces para la respuesta de la API de Zonas
export interface Point {
  x: number;
  y: number;
}

export interface Zona {
  id: string;
  uuid: string;
  id_mapa: string;
  nombre: string;
  points: string; // string en lugar de Point[]
  escala: number;
  color: number;
  ios: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface ZonasData {
  data: Zona[];
  pager: Pager;
}

export interface ZonaResponse {
  status: number;
  message: string;
  data: ZonasData;
  description: string;
}

export interface SingleZonaResponse {
  status: number;
  message: string;
  data: Zona;
  description: string;
}

// Interface para los parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  id_mapa?: string; // ✅ AGREGADO: filtro por mapa
}

// Interface para crear una zona
export interface CreateZonaData {
  id_mapa: string;
  nombre: string;
  points: string; // string JSON como en Postman
  escala: number;
  color: number;
  ios: string; // string JSON como en Postman
}

// Interface para actualizar una zona
export interface UpdateZonaData {
  id_mapa?: string;
  nombre?: string;
  points?: string;
  escala?: number;
  color?: number;
  ios?: string;
}

// Interface para eliminar una zona
export interface DeleteZonaData {
  deleted_at: number;
}

export const ZonaService = {
  // Obtener zonas con paginación y filtro por id_mapa
  getZonas: async (params: PaginationParams = {}): Promise<ZonaResponse> => {
    const { page = 1, size = 10, search, sortBy, sortOrder, id_mapa } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.zona, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(id_mapa && { id_mapa }) // ✅ AGREGADO: filtro por mapa
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener zonas por id_mapa específico
  getZonasByMapa: async (id_mapa: string, params: Omit<PaginationParams, 'id_mapa'> = {}): Promise<ZonaResponse> => {
    const { page = 1, size = 10, search, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.zona, {
      params: { 
        page, 
        size,
        id_mapa, // ✅ Filtro específico por mapa
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener una zona por ID
  getZonaById: async (id: string): Promise<SingleZonaResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.zona}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear una nueva zona (POST)
  createZona: async (zonaData: CreateZonaData): Promise<SingleZonaResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.zona, zonaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar una zona existente (PATCH)
  updateZona: async (id: string, zonaData: UpdateZonaData): Promise<SingleZonaResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.zona}/${id}`, zonaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar una zona (soft delete - DELETE con body)
  deleteZona: async (id: string): Promise<SingleZonaResponse> => {
    const deleteData: DeleteZonaData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.zona}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar una zona eliminada (PATCH)
  restoreZona: async (id: string): Promise<SingleZonaResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.zona}/${id}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
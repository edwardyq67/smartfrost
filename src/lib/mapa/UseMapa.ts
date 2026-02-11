import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

export interface Mapa {
  uuid: string;
  nombre: string;
  imagen: string;
  creador: string;
  empresa: string;
  id_empresa: string;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface MapasData {
  data: Mapa[];
  pager: Pager;
}

// ✅ CORREGIDO: Interfaces separadas para diferentes respuestas
export interface MapasResponse {
  status: number;
  message: string;
  data: MapasData;
  description: string;
}

export interface MapaResponse {
  status: number;
  message: string;
  data: Mapa; // ✅ Para getMapaById - objeto individual
  description: string;
}

// Interface para los parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  nombre?: string;
  id_empresa?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ CORREGIDO: id_empresa ahora es opcional
export interface CreateMapaData {
  nombre: string;
  imagen?: string;
  id_empresa?: string; // Cambiado a opcional
}

// Interface para actualizar un mapa
export interface UpdateMapaData {
  nombre?: string;
  imagen?: string;
  id_empresa?: string;
}

// Interface para eliminar un mapa
export interface DeleteMapaData {
  deleted_at: number;
}

export const MapaService = {
  // Obtener mapas con paginación
  getMapas: async (params: PaginationParams = {}): Promise<MapasResponse> => {
    const { page = 1, size = 10, nombre, sortBy, sortOrder, id_empresa } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.mapa, {
      params: { 
        page, 
        size,
        ...(nombre && { nombre }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(id_empresa && { id_empresa })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ CORREGIDO: getMapaById devuelve MapaResponse (objeto individual)
  getMapaById: async (uuid: string): Promise<MapaResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.mapa}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear un nuevo mapa (POST)
  createMapa: async (mapaData: CreateMapaData): Promise<MapasResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.mapa, mapaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un mapa existente (PATCH)
  updateMapa: async (uuid: string, mapaData: UpdateMapaData): Promise<MapaResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.mapa}/${uuid}`, mapaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un mapa (soft delete - DELETE con body)
  deleteMapa: async (uuid: string): Promise<MapaResponse> => {
    const deleteData: DeleteMapaData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.mapa}/${uuid}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar un mapa eliminado (PATCH)
  restoreMapa: async (uuid: string): Promise<MapaResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.mapa}/${uuid}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener mapas por empresa
  getMapasByEmpresa: async (empresaId: string, params: PaginationParams = {}): Promise<MapasResponse> => {
    const { page = 1, size = 10, nombre, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(`${API_ENDPOINTS.mapa}/empresa/${empresaId}`, {
      params: { 
        page, 
        size,
        ...(nombre && { nombre }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
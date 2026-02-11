// lib/tipoSensor/UseTipoSensor.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces para la respuesta de la API de TipoSensor
export interface Creador {
  uuid: string;
  nombre: string;
}

export interface TipoSensor {
  id: string;
  uuid: string;
  identificador: string;
  nombre: string;
  imagen: string;
  uMed: string;
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

export interface TipoSensoresData {
  data: TipoSensor[];
  pager: Pager;
}

export interface TipoSensoresResponse {
  status: number;
  message: string;
  data: TipoSensoresData;
  description: string;
}

export interface TipoSensorResponse {
  status: number;
  message: string;
  data: TipoSensor;
  description: string;
}

// Interface para los parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  nombre?: string; // ✅ AGREGADO: Filtro específico por nombre
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface para crear un tipo de sensor
export interface CreateTipoSensorData {
  nombre: string;
  uMed: string;
  imagen?: string;
}

// Interface para actualizar un tipo de sensor
export interface UpdateTipoSensorData {
  nombre?: string;
  uMed?: string;
  imagen?: string;
}

// Interface para eliminar un tipo de sensor
export interface DeleteTipoSensorData {
  deleted_at: number;
}

export const tipoSensorService = {
  // Obtener tipos de sensor con paginación
  getTipoSensores: async (params: PaginationParams = {}): Promise<TipoSensoresResponse> => {
    const { page = 1, size = 20, search, nombre, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.tipoSensor, {
      params: { 
        page, 
        size,
        ...(search && { search }), // ✅ Búsqueda general
        ...(nombre && { nombre }), // ✅ Búsqueda específica por nombre
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener un tipo de sensor por ID
  getTipoSensorById: async (id: string): Promise<TipoSensorResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.tipoSensor}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear un nuevo tipo de sensor (POST)
  createTipoSensor: async (tipoSensorData: CreateTipoSensorData): Promise<TipoSensorResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.tipoSensor, tipoSensorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un tipo de sensor existente (PATCH)
  updateTipoSensor: async (id: string, tipoSensorData: UpdateTipoSensorData): Promise<TipoSensorResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.tipoSensor}/${id}`, tipoSensorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un tipo de sensor (soft delete - DELETE con body)
  deleteTipoSensor: async (id: string): Promise<TipoSensorResponse> => {
    const deleteData: DeleteTipoSensorData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.tipoSensor}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar un tipo de sensor eliminado (PATCH)
  restoreTipoSensor: async (id: string): Promise<TipoSensorResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.tipoSensor}/${id}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
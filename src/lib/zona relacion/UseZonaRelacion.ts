// lib/zonaRelacion/UseZonaRelacion.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces para la respuesta de la API de ZonaRelacion
export interface ZonaRelacion {
  id: string;
  uuid: string;
  id_zona: string;
  id_entidad: string;
  tipo_entidad: 'DAQ' | 'SENSOR'|'ACTUADOR';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ZonaRelacionResponse {
  status: number;
  message: string;
  data: ZonaRelacion;
  description: string;
}

export interface ZonaRelacionesResponse {
  status: number;
  message: string;
  data: ZonaRelacion[];
  description: string;
}

// Interface para los parámetros de filtros
export interface ZonaRelacionParams {
  id_zona?: string;
  id_entidad?: string;
  tipo_entidad?: 'DAQ' | 'SENSOR'|'ACTUADOR';
}

// Interface para crear una relación de zona (ahora acepta array en id_zona)
export interface CreateZonaRelacionData {
  id_zona: string | string[]; // ✅ Ahora acepta string o array de strings
  id_entidad: string;
  tipo_entidad: 'DAQ' | 'SENSOR'|'ACTUADOR';
}

// Interface para actualizar una relación de zona
export interface UpdateZonaRelacionData {
  id_zona?: string;
  id_entidad?: string;
  tipo_entidad?: 'DAQ' | 'SENSOR'|'ACTUADOR';
}

export const ZonaRelacionService = {
  // Obtener todas las relaciones de zona con filtros
  getZonaRelaciones: async (params: ZonaRelacionParams = {}): Promise<ZonaRelacionesResponse> => {
    const { id_zona, id_entidad, tipo_entidad } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.zonaRelacion, {
      params: { 
        ...(id_zona && { id_zona }),
        ...(id_entidad && { id_entidad }),
        ...(tipo_entidad && { tipo_entidad })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener una relación de zona por ID
  getZonaRelacionById: async (id: string): Promise<ZonaRelacionResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.zonaRelacion}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear una nueva relación de zona (POST) - Ahora acepta array en id_zona
  createZonaRelacion: async (zonaRelacionData: CreateZonaRelacionData): Promise<ZonaRelacionResponse> => {
    const response = await axiosInstance.post(`${API_ENDPOINTS.zonaRelacion}/masivo`, zonaRelacionData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear múltiples relaciones de zona en una sola llamada
  createMultipleZonaRelaciones: async (zonaRelacionesData: CreateZonaRelacionData[]): Promise<ZonaRelacionesResponse> => {
    const response = await axiosInstance.post(`${API_ENDPOINTS.zonaRelacion}/bulk`, zonaRelacionesData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar una relación de zona existente (PATCH)
  updateZonaRelacion: async (id: string, zonaRelacionData: UpdateZonaRelacionData): Promise<ZonaRelacionResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.zonaRelacion}/${id}`, zonaRelacionData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar una relación de zona (DELETE)
  deleteZonaRelacion: async (id: string): Promise<ZonaRelacionResponse> => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.zonaRelacion}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar múltiples relaciones de zona por entidad
  deleteZonaRelacionesByEntidad: async (id_entidad: string, tipo_entidad: 'DAQ' | 'SENSOR'): Promise<ZonaRelacionesResponse> => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.zonaRelacion}/entidad/${id_entidad}`, {
      params: { tipo_entidad },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
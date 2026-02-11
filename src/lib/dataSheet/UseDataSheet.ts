// UseDataSheet.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces para DataSheet
export interface DataSheetItem {
  uuid?: string;
  tipo_entidad: string;
  tipo: string;
  valor: string;
  id_entidad: string;
  created_at?: string;
  creador?: string;
}

export interface DataSheetResponse {
  status: number;
  message: string;
  data: {
    data: DataSheetItem[];
    pager: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      perPage: number;
      next: string | null;
      previous: string | null;
    };
  };
  description: string;
}

export interface CreateDataSheetData {
  id_entidad: string;
  tipo_entidad: string;
  items: Array<{
    tipo: string;
    valor: string;
  }>;
}

export interface UpdateDataSheetData {
  tipo?: string;
  valor?: string;
}

// Interface para parámetros de paginación
export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  id_entidad?: string;
  tipo_entidad?: string;
}

export const dataSheetService = {
  // Obtener data sheets con filtros
  getDataSheets: async (params: PaginationParams = {}): Promise<DataSheetResponse> => {
    const { page = 1, size = 10, search, id_entidad, tipo_entidad } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.dataSheet, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(id_entidad && { id_entidad }),
        ...(tipo_entidad && { tipo_entidad })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener data sheet por ID
  getDataSheetById: async (id: string): Promise<DataSheetResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.dataSheet}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear nuevo data sheet (POST con array de items)
  createDataSheet: async (data: CreateDataSheetData): Promise<DataSheetResponse> => {
    const response = await axiosInstance.post(`${API_ENDPOINTS.dataSheet}/masivo`, data, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un data sheet existente (PATCH)
  updateDataSheet: async (id: string, data: UpdateDataSheetData): Promise<DataSheetResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.dataSheet}/${id}`, data, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un data sheet (DELETE)
  deleteDataSheet: async (id: string): Promise<DataSheetResponse> => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.dataSheet}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
// services/auditoriaService.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces basadas en la respuesta del API
export interface AuditoriaDatos {
  status: number;
  request: Record<string, any>;
  response: {
    keys: string[];
  };
}

export interface AuditoriaItem {
  id: string;
  uuid: string;
  id_cambio: string;
  tabla: string;
  accion: string;
  id_user: string;
  path: string;
  metodo: string;
  datos: AuditoriaDatos;
  created_at: string;
  usuario: string
}

export interface AuditoriaPager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

export interface AuditoriaResponse {
  status: number;
  message: string;
  data: {
    data: AuditoriaItem[];
    pager: AuditoriaPager;
  };
  description: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  id_user?: string;
  tabla?: string;
  accion?: string;
  metodo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}
export interface AuditoriaListResponse {
  status: number;
  message: string;
  data: {
    data: AuditoriaItem[];
    pager: AuditoriaPager;
  };
  description: string;
}

export interface AuditoriaSingleResponse {
  status: number;
  message: string;
  data: AuditoriaItem; 
  description: string;
}
export const auditoriaService = {
  // Obtener registros de auditoría con paginación y filtros
  getAuditoria: async (params: PaginationParams = {}): Promise<AuditoriaResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.auditoria, {
      params,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
  getAuditoriaById: async (uuid: string): Promise<AuditoriaSingleResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.auditoria}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
  deleteAuditoria: async (uuid: string): Promise<void> => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.auditoria}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
}
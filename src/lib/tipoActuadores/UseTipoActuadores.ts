import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

export interface TipoActuador {
  uuid: string;
  identificador: string;
  nombre: string;
  codigo: string;
  descripcion: string | null;
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

export interface TipoActuadoresData {
  data: TipoActuador[];
  pager: Pager;
}

export interface TipoActuadorByIdResponse {
  status: number;
  message: string;
  data: TipoActuador;
  description: string;
}

export interface TipoActuadoresResponse {
  status: number;
  message: string;
  data: TipoActuadoresData;
  description: string;
}

export interface TipoActuadoresParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  id_user?: string;
  tabla?: string;
  Datos?: string;
  accion?: string;
  nombre?:string
}

export interface CreateTipoActuadorData {
  nombre: string;
  codigo: string;
  descripcion?: string;
  id_user:string
}

export interface UpdateTipoActuadorData {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  id_user:string
}

export interface DeleteTipoActuadorData {
  deleted_at: number;
}

export const tipoActuadoresService = {
  getTipoActuadores: async (params: TipoActuadoresParams = {}): Promise<TipoActuadoresResponse> => {
    const { 
      page = 1, 
      size = 10, 
      search, 
      sortBy, 
      sortOrder,
      id_user,
      tabla,
      Datos,
      accion,
      nombre
    } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.tipoActuadores, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(id_user && { id_user }),
        ...(tabla && { tabla }),
        ...(Datos && { Datos }),
        ...(accion && { accion }),
        ...(nombre && { nombre })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  getTipoActuadorById: async (uuid: string): Promise<TipoActuadorByIdResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.tipoActuadores}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  createTipoActuador: async (tipoActuadorData: CreateTipoActuadorData): Promise<TipoActuadoresResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.tipoActuadores, tipoActuadorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  updateTipoActuador: async (uuid: string, tipoActuadorData: UpdateTipoActuadorData): Promise<TipoActuadoresResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.tipoActuadores}/${uuid}`, tipoActuadorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  deleteTipoActuador: async (id: string): Promise<TipoActuadoresResponse> => {
    const deleteData: DeleteTipoActuadorData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.tipoActuadores}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
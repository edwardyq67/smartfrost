// lib/trabajos/useTrabajos.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

export interface TrabajoLista {
  uuid: string;
  id_user: string;
  id_tecnico: string;
  id_empresa: string;
  tipo: string;
  fecha_creacion: string;
  fecha_inicio: string;
  fecha_entrega: string;
  fecha_finalizacion: string | null;
  observaciones: string | null;
  creador: string;
  tecnico: string;
  empresa: string;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface TrabajosData {
  data: TrabajoLista[];
  pager: Pager;
}

export interface TrabajosResponse {
  status: number;
  message: string;
  data: TrabajosData;
  description: string;
}

export interface CreateTrabajoData {
  id_tecnico: string;
  id_empresa: string;
  fecha_creacion?: string;
  fecha_inicio?: string;
  fecha_entrega?: string;
  tipo: string;
  observaciones?: string;
}

export interface CreateTrabajoResponse {
  status: number;
  message: string;
  data: {
    trabajo: any;
  };
  description: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  id_empresa?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: string;
  fc_ini?: string;
  fc_fin?: string;
  fi_ini?: string;
  fi_fin?: string;
  fe_ini?: string;
  fe_fin?: string;
  ff_ini?: string;
  ff_fin?: string;
}

export interface UsuarioDetalle {
  uuid: string;
  nombre: string;
}

export interface EmpresaDetalle {
  id: string;
  uuid: string;
  nombre: string;
  logo: string;
  coordenadas: string;
  direccion: string;
  telefono: string;
  imagen: string;
  created_at: string;
  creador: UsuarioDetalle;
}

export interface TrabajoDetalle {
  id: string;
  uuid: string;
  fecha_creacion: string;
  fecha_inicio: string;
  fecha_entrega: string;
  fecha_finalizacion: string | null;
  tipo: string;
  observaciones: string | null;
  created_at: string;
  creador: UsuarioDetalle;
  tecnico: UsuarioDetalle;
  empresa: EmpresaDetalle;
}

export interface TrabajoByIdResponse {
  status: number;
  message: string;
  data: TrabajoDetalle;
  description: string;
}

export interface UpdateTrabajoData {
  id_tecnico?: string;
  id_empresa?: string;
  fecha_inicio?: string| null;
  fecha_entrega?: string| null;
  fecha_finalizacion?: string | null;
  tipo?: string;
  observaciones?: string | null;
}

export interface UpdateTrabajoResponse {
  status: number;
  message: string;
  data: {
    trabajo: any;
  };
  description: string;
}

export interface DeleteTrabajoResponse {
  status: number;
  message: string;
  data: any;
  description: string;
}

export const trabajosService = {
  getTrabajos: async (params: PaginationParams = {}): Promise<TrabajosResponse> => {
    const { 
      page, 
      size, 
      search, 
      sortBy, 
      sortOrder, 
      id_empresa,
      filter,
      fc_ini,
      fc_fin,
      fi_ini,
      fi_fin,
      fe_ini,
      fe_fin,
      ff_ini,
      ff_fin
    } = params;

    const response = await axiosInstance.get(API_ENDPOINTS.trabajos, {
      params: {
        page,
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(id_empresa && { id_empresa }),
        ...(filter && { filter }),
        ...(fc_ini && { fc_ini }),
        ...(fc_fin && { fc_fin }),
        ...(fi_ini && { fi_ini }),
        ...(fi_fin && { fi_fin }),
        ...(fe_ini && { fe_ini }),
        ...(fe_fin && { fe_fin }),
        ...(ff_ini && { ff_ini }),
        ...(ff_fin && { ff_fin })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  getTrabajoById: async (uuid: string): Promise<TrabajoByIdResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.trabajos}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  createTrabajo: async (trabajoData: CreateTrabajoData): Promise<CreateTrabajoResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.trabajos, trabajoData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  updateTrabajo: async (uuid: string, trabajoData: UpdateTrabajoData): Promise<UpdateTrabajoResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.trabajos}/${uuid}`, trabajoData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  deleteTrabajo: async (uuid: string): Promise<DeleteTrabajoResponse> => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.trabajos}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
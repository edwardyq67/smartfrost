import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces para la respuesta de la API de Empresas
export interface Creador {
  uuid: string;
  nombre: string;
}

export interface Empresa {
  id: string;
  uuid: string;
  nombre: string;
  logo: string;
  imagen?: string
  coordenadas: string;
  direccion: string;
  telefono: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  mapas:mapa[]
  creador?: Creador;
}
export interface mapa{
  uuid: string;
  nombre: string;
  imagen:string;
}
export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface EmpresasData {
  data: Empresa[];
  pager: Pager;
}

export interface EmpresasResponse {
  status: number;
  message: string;
  data: EmpresasData;
  description: string;
}

// Interface para el resumen de empresa
export interface EmpresaResumenResponse {
  status: number;
  message: string;
  data: {
    empresa: {
      nombre: string;
      uuid: string;
      logo: string;
    };
    totales: {
      qty_diot: number;
      qty_daq: number;
      qty_sensor: number;
      qty_automatizacion: number;
    };
    datos_en_vivo: string;
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

// Interface para crear una empresa
export interface CreateEmpresaData {
  nombre: string;
  logo?: string;
  imagen?: string;
  coordenadas?: string;
  direccion?: string;
  telefono?: string;
}

// Interface para actualizar una empresa
export interface UpdateEmpresaData {
  nombre?: string;
  logo?: string;
  imagen?: string;
  coordenadas?: string;
  direccion?: string;
  telefono?: string;
}

// Interface para eliminar una empresa
export interface DeleteEmpresaData {
  deleted_at: number;
}

export const EmpresaService = {
  getEmpresas: async (params: PaginationParams = {}): Promise<EmpresasResponse> => {
    const { user } = useAuthStore.getState();
    
    // Si NO es Super Admin, obtener solo su empresa
    if (user && user.rol !== 'Super Admin' && user.empresa) {
      // Usar el endpoint específico para una empresa
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.empresas}/${user.empresa}`, 
        {
          headers: useAuthStore.getState().getAuthHeaders()
        }
      );
      
      // Adaptar la respuesta para que coincida con la interfaz EmpresasResponse
      return {
        ...response.data,
        data: {
          data: [response.data.data],
          pager: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            perPage: 1,
            next: null,
            previous: null
          }
        }
      };
    }
    
    // Si ES Super Admin, obtener todas las empresas con paginación
    const { page = 1, size = 10, nombre, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.empresas, {
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
  },

  // Obtener una empresa por ID
  getEmpresaById: async (id: string): Promise<EmpresasResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.empresas}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener resumen de empresa
  getEmpresaResumen: async (id_empresa: string): Promise<EmpresaResumenResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.empresas}/resumen`, {
      params: { id_empresa },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear una nueva empresa (POST)
  createEmpresa: async (empresaData: CreateEmpresaData): Promise<EmpresasResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.empresas, empresaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar una empresa existente (PATCH)
  updateEmpresa: async (id: string, empresaData: UpdateEmpresaData): Promise<EmpresasResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.empresas}/${id}`, empresaData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar una empresa (soft delete - DELETE con body)
  deleteEmpresa: async (id: string): Promise<EmpresasResponse> => {
    const deleteData: DeleteEmpresaData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.empresas}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar una empresa eliminada (PATCH)
  restoreEmpresa: async (id: string): Promise<EmpresasResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.empresas}/${id}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
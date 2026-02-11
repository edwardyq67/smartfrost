// lib/dispositivos/UseDispositivos.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interface para Creador
export interface Creador {
  uuid: string;
  nombre: string;
}

// Interface para Empresa
export interface Empresa {
  id: string;
  uuid: string;
  nombre: string;
  logo: string;
  coordenadas: string;
  direccion: string;
  telefono: string;
  imagen: string;
  created_at: string;
  creador: Creador;
}

// Interface para Mapa
export interface Mapa {
  id: string;
  uuid: string;
  nombre: string;
  imagen: string;
  created_at: string;
  creador: Creador;
  empresa: Empresa;
}

// Interface para Sistema
export interface Sistema {
  id: string;
  uuid: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  created_at: string;
  creador: Creador;
}

// ✅ INTERFACE PARA DISPOSITIVO EN LISTA (GET /dispositivos)
export interface DispositivoLista {
  uuid: string;
  imei: string;
  nombre: string;
  lan: string;
  wan: string;
  ejeX: string;
  ejeY: string;
  created_at: string;
  creador: string; // string en lista
  id_nombre: string;
  id_empresa: string;
  empresa_nombre: string;
  id_tipo_sistema: string;
  sistema_nombre: string;
  id_mapa: string;
  mapa_nombre: string;
}

// ✅ INTERFACE PARA DISPOSITIVO DETALLADO (GET /dispositivos/{id})
export interface DispositivoDetallado {
  id: string;
  uuid: string;
  imei: string;
  nombre: string;
  lan: string;
  wan: string;
  ejeX: string;
  ejeY: string;
  created_at: string;
  creador: Creador; // objeto en detalle
  mapa: Mapa;
  sistema: Sistema;
}

// ✅ TIPO UNIÓN PARA COMPATIBILIDAD
export type Dispositivo = DispositivoLista | DispositivoDetallado;

// Interface para dispositivo individual response
export interface DispositivoIndividualResponse {
  status: number;
  message: string;
  data: DispositivoDetallado; // ✅ Usar DispositivoDetallado para get by ID
  description: string;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface DispositivosData {
  data: DispositivoLista[]; // ✅ Usar DispositivoLista para la lista
  pager: Pager;
  dispositivo:{
    uuid: string;
  }
}

export interface DispositivosResponse {
  status: number;
  message: string;
  data: DispositivosData;
  description: string;
  
}

interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  imei?: string;
  nombre?: string;
  id_empresa?: string;
  id_dispositivo?: string;
  id_zona?: string;
  id_mapa?:string;
}

// Interface para crear un dispositivo - ACTUALIZADA con nuevo formato
export interface CreateDispositivoData {
  nombre: string;
  imei: string;
  lan?: string;
  wan?: string;
  ejeX?: string;
  ejeY?: string;
  id_tipo_sistema: string;
  id_mapa?: string; 
}

// Interface para actualizar un dispositivo - ACTUALIZADA
export interface patchDispositivoData {
  nombre?: string;
  imei?: string;
  lan?: string;
  wan?: string;
  ejeX?: string;
  ejeY?: string;
  id_tipo_sistema?: string;
  id_mapa?: string; 
}

// Interface para eliminar un dispositivo
export interface DeleteDispositivoData {
  deleted_at: number;
}

// ✅ NUEVA INTERFACE PARA ACTUALIZAR COORDENADAS
export interface CoordenadaDispositivo {
  uuid: string;
  ejeX: string;
  ejeY: string;
  tipo_entidad: 'DIOT' | 'DAQ' | 'SENSOR';
}

export interface ActualizarCoordenadasResponse {
  status: number;
  message: string;
  data: {
    actualizados: number;
    dispositivos: CoordenadaDispositivo[];
  };
  description: string;
}

export const dispositivosService = {
  // Obtener dispositivos con paginación y filtros
  getDispositivos: async (params: PaginationParams = {}): Promise<DispositivosResponse> => {
    const { 
      page = 1, 
      size = 10, 
      search, 
      sortBy, 
      sortOrder,
      imei,
      nombre,
      id_empresa,
      id_dispositivo,
      id_zona,
      id_mapa,
    } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.dispositivos, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(imei && { imei }),
        ...(nombre && { nombre }),
        ...(id_empresa && { id_empresa }),
        ...(id_dispositivo && { id_dispositivo }),
        ...(id_zona && { id_zona }),
        ...(id_mapa && { id_mapa })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener un dispositivo por ID
  getDispositivoById: async (id: string): Promise<DispositivoIndividualResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.dispositivos}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear un nuevo dispositivo (POST) - ACTUALIZADA con nuevo formato
  createDispositivo: async (dispositivoData: CreateDispositivoData): Promise<DispositivosResponse> => {
    // Preparar datos para enviar al backend
    const dataToSend = {
      id_mapa: dispositivoData.id_mapa || "",
      id_tipo_sistema: dispositivoData.id_tipo_sistema,
      nombre: dispositivoData.nombre,
      imei: dispositivoData.imei,
      lan: dispositivoData.lan || "",
      wan: dispositivoData.wan || "",
      ejeX: dispositivoData.ejeX || "",
      ejeY: dispositivoData.ejeY || ""
    };
    const response = await axiosInstance.post(API_ENDPOINTS.dispositivos, dataToSend, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar un dispositivo existente (PATCH) - ACTUALIZADA
  patchDispositivo: async (id: string, dispositivoData: patchDispositivoData): Promise<DispositivosResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.dispositivos}/${id}`, dispositivoData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar un dispositivo (soft delete)
  deleteDispositivo: async (id: string): Promise<DispositivosResponse> => {
    const deleteData: DeleteDispositivoData = { deleted_at: 1 };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.dispositivos}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ NUEVO MÉTODO: Actualizar coordenadas de múltiples dispositivos
  actualizarCoordenadas: async (coordenadas: CoordenadaDispositivo[]): Promise<ActualizarCoordenadasResponse> => {
    const response = await axiosInstance.post(
      `${API_ENDPOINTS.dispositivos}/actualizarCoordenadas`, 
      coordenadas,
      {
        headers: useAuthStore.getState().getAuthHeaders()
      }
    );
    return response.data;
  },

  // ✅ FUNCIONES HELPER PARA VERIFICAR TIPOS
  esDispositivoLista: (dispositivo: Dispositivo): dispositivo is DispositivoLista => {
    return typeof (dispositivo as DispositivoLista).creador === 'string';
  },

  esDispositivoDetallado: (dispositivo: Dispositivo): dispositivo is DispositivoDetallado => {
    return typeof (dispositivo as DispositivoDetallado).creador === 'object';
  }
};
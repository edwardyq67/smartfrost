import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// ✅ INTERFAZ PARA ZONA SIMPLIFICADA (usada en listado)
export interface ZonaSimple {
  uuid: string;
  nombre: string;
}

// ✅ INTERFAZ PARA ZONA COMPLETA (usada en detalle)
export interface ZonaCompleta {
  id: string;
  uuid: string;
  points: string;
  nombre: string;
  escala: string;
  color: string;
  ios: string;
  created_at: string;
  mapa: Mapa;
  creador: Creador;
}

// Interfaces para las relaciones anidadas
export interface Creador {
  uuid: string;
  nombre: string;
}

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

export interface Mapa {
  id: string;
  uuid: string;
  nombre: string;
  imagen: string;
  created_at: string;
  creador: Creador;
  empresa: Empresa;
}

export interface Sistema {
  id: string;
  uuid: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  created_at: string;
  creador: Creador;
}

export interface DispositivoCompleto {
  id: string;
  uuid: string;
  imei: string;
  nombre: string;
  lan: string;
  wan: string;
  ejeX: string;
  ejeY: string;
  created_at: string;
  creador: Creador;
  mapa: Mapa;
  sistema: Sistema;
}

export interface Responsable {
  uuid: string;
  nombre: string;
}

// ✅ INTERFAZ PARA DAQ EN LISTADO
export interface DaqListado {
  uuid: string;
  identificador: string;
  dispositivo: string; // Solo el nombre del dispositivo
  id_dispositivo: string;
  zonas: ZonaSimple[]; // Zonas simplificadas
  responsable: string;
  tipo: string;
  fecha_fabricacion: string;
  version: string;
  cant_sensores: string;
  ejeX?: string;
  ejeY?: string;
  nombre?: string;
  sensores?: any[];
}

// ✅ INTERFAZ PARA DAQ EN DETALLE
export interface DaqDetalle {
  id: string;
  uuid: string;
  identificador: string;
  tipo: string;
  nombre: string;
  fecha_fabricacion: string;
  version: string;
  cant_sensores: string;
  ejeX: string;
  ejeY: string;
  created_at: string;
  zona: string;
  responsable: Responsable;
  dispositivo: DispositivoCompleto;
  creador: Creador;
  zonas: ZonaCompleta[]; // Zonas completas con toda la información
}

// Interfaces para las respuestas
export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface DaqListadoData {
  data: DaqListado[];
  pager: Pager;
}

export interface DaqDetalleData {
  daq: DaqDetalle;
}

export interface DaqListadoResponse {
  status: number;
  message: string;
  data: DaqListadoData;
  description: string;
}

export interface DaqDetalleResponse {
  status: number;
  message: string;
  data: DaqDetalle & {
    daq?: DaqDetalle;
  };
  description: string;
}
export interface patchDaqResponse {
  status: number;
  message: string;
  data: {
    daq: {
      uuid: string;
    };
  };
  description: string;
}

// Interfaces para parámetros
interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  nombre?: string;
  imei?: string;
  id_dispositivo?: string;
  id_daq?: string;
  id_zona?: string;
}

// Interfaces para crear/actualizar (usamos zonas simples)
export interface CreateDaqData {
  nombre?: string;
  identificador: string;
  id_dispositivo?: string;
  zonas?: ZonaSimple[];
  responsable?: string;
  tipo?: string;
  fecha_fabricacion?: string;
  version?: string;
  cant_sensores?: string;
  ejeX?: string;
  ejeY?: string;
}

export interface patchDaqData {
  nombre?: string;
  identificador?: string;
  id_dispositivo?: string;
  zonas?: ZonaSimple[];
  responsable?: string;
  tipo?: string;
  fecha_fabricacion?: string;
  version?: string;
  cant_sensores?: string;
  ejeX?: string;
  ejeY?: string;
}

// Interface para eliminar
export interface DeleteDaqData {
  deleted_at: number;
}

// Interface para error de validación
export interface DaqValidationError {
  status: number;
  error: number;
  messages: {
    identificador?: string;
    zonas?: string;
    responsable?: string;
    tipo?: string;
    fecha_fabricacion?: string;
    version?: string;
    cant_sensores?: string;
    id_dispositivo?: string;
    ejeX?: string;
    ejeY?: string;
  };
}
export interface Daqs {
  daqs: string[]; // Array de UUIDs de DAQs
}

export interface ResetResponse {
  status: number;
  message: string;
  data: {
    success: boolean;
    message: string;
    resumen: {
      sensores: {
        total: number;
        ok: number;
        error: number;
        errores: string[];
      };
      actuadores: {
        total: number;
        ok: number;
        error: number;
        errores: string[];
      };
    };
  };
  description: string;
}
export const DaqService = {
  // ✅ Obtener DAQs con paginación y filtros (retorna lista simplificada)
  getDaqs: async (params: PaginationParams & {
    nombre?: string;
    imei?: string;
    id_dispositivo?: string;
    id_daq?: string;
    id_zona?: string;
    id_mapa?: string;
  } = {}): Promise<DaqListadoResponse> => {
    const {
      page,
      size,
      search,
      sortBy,
      sortOrder,
      nombre,
      imei,
      id_dispositivo,
      id_daq,
      id_zona
    } = params;

    const response = await axiosInstance.get(API_ENDPOINTS.daq, {
      params: {
        page,
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(nombre && { nombre }),
        ...(imei && { imei }),
        ...(id_dispositivo && { id_dispositivo }),
        ...(id_daq && { id_daq }),
        ...(id_zona && { id_zona })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Obtener un DAQ por UUID (retorna detalle completo)
  getDaqById: async (uuid: string): Promise<DaqDetalleResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.daq}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Crear un nuevo DAQ
  createDaq: async (daqData: CreateDaqData): Promise<DaqDetalleResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.daq, daqData, {
        headers: useAuthStore.getState().getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw error;
      }
      throw new Error(error.response?.data?.message || 'Error al crear el DAQ');
    }
  },

  // ✅ Actualizar un DAQ existente
  patchDaq: async (uuid: string, daqData: patchDaqData): Promise<patchDaqResponse> => {
    try {
      const response = await axiosInstance.patch(`${API_ENDPOINTS.daq}/${uuid}`, daqData, {
        headers: useAuthStore.getState().getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw error;
      }
      throw new Error(error.response?.data?.message || 'Error al actualizar el DAQ');
    }
  },

  // ✅ Eliminar un DAQ
  deleteDaq: async (uuid: string): Promise<DaqDetalleResponse> => {
    try {
      const deleteData: DeleteDaqData = {
        deleted_at: 1
      };

      const response = await axiosInstance.delete(`${API_ENDPOINTS.daq}/${uuid}`, {
        data: deleteData,
        headers: useAuthStore.getState().getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el DAQ');
    }
  },

  reset: async (daqs: Daqs): Promise<ResetResponse> => {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.daq}/resetSensores`,
        daqs, // Envía el objeto con el array de daqs
        {
          headers: useAuthStore.getState().getAuthHeaders()
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al resetear el DAQ');
    }
  }
};
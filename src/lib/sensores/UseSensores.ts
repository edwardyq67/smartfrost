// lib/sensores/UseSensores.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

export interface Creador {
  uuid: string;
  nombre: string;
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

export interface Empresa {
  id: string;
  uuid: string;
  nombre: string;
  logo: string;
  coordenadas: string;
  direccion: string;
  telefono: string;
  created_at: string;
  creador: Creador;
}

export interface Dispositivo {
  id: string;
  uuid: string;
  imei: string;
  nombre: string;
  lan: string;
  wan: string;
  created_at: string;
  creador: Creador;
  empresa: Empresa;
  sistema: Sistema;
}

export interface TipoSensor {
  id: string;
  uuid: string;
  nombre: string;
  imagen: string;
  registro: string;
  created_at: string;
  creador: Creador;
}

// ✅ INTERFAZ PARA SENSOR EN LISTA (GET /sensores)
export interface SensorLista {
  uuid: string;
  imei: string;
  nombre: string | null;
  escala: string;
  offset: string;
  registro: string;
  identificador: string;
  marca: string;
  modelo: string;
  install: string;
  created_at: string;
  ejeX: string;
  ejeY: string;
  id_daq: string;
  identificador_daq: string;
  id_dispositivo: string;
  dispositivo_nombre: string;
  id_tipo_sensor: string;
  tipo_sensor: string;
  zonas: Array<{
    uuid: string;
    nombre: string;
  }>;
  eje3D:string| null;
}

// ✅ INTERFAZ PARA SENSOR DETALLADO (GET /sensores/{id})
export interface SensorDetallado {
  id: string;
  uuid: string;
  identificador: string;
  imei: string;
  escala: string;
  offset: string;
  registro: string;
   control?: number;
   funcion: number;
  nombre: string | null;
  marca: string;
  modelo: string;
  install: string;
  maximo: string;
  minimo: string;
  alerta: string;
  ejeX: string;
  ejeY: string;
  json_creacion: string;
  created_at: string;
  tipo_sensor: {
    id: string;
    uuid: string;
    identificador: string;
    nombre: string;
    imagen: string;
    uMed: string;
    created_at: string;
    creador: Creador;
  };
  daq: {
    id: string;
    uuid: string;
    responsable: Creador;
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
    dispositivo: Dispositivo;
    creador: Creador;
    zonas: any[];
  };
  creador: Creador;
  zonas: Array<{
    id: string;
    uuid: string;
    points: string;
    nombre: string;
    escala: string;
    color: string;
    ios: string;
    created_at: string;
    mapa: {
      id: string;
      uuid: string;
      nombre: string;
      imagen: string;
      created_at: string;
      creador: Creador;
      empresa: Empresa;
    };
    creador: Creador;
  }>;
}

// ✅ TIPO UNIÓN PARA COMPATIBILIDAD
export type Sensor = SensorLista | SensorDetallado;

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface SensoresData {
  data: SensorLista[];  // ✅ Usar SensorLista para la lista
  pager: Pager;
}

export interface SensoresResponse {
  status: number;
  message: string;
  data: SensoresData;
  description: string;
}

// ✅ INTERFAZ PARA CREAR SENSOR (POST) - Devuelve estructura anidada
export interface CreateSensorResponse {
  status: number;
  message: string;
  data: {
    sensor: SensorDetallado; // ← Anidado en propiedad "sensor"
  };
  description: string;
}

// ✅ INTERFAZ PARA OBTENER SENSOR (GET) - Devuelve estructura directa  
export interface GetSensorResponse {
  status: number;
  message: string;
  data: SensorDetallado; // ← Directo, sin anidar
  description: string;
}

// ✅ INTERFAZ PARA ACTUALIZAR/ELIMINAR SENSOR - Misma estructura que GET
export interface patchSensorResponse {
  status: number;
  message: string;
  data: {
    sensor: SensorDetallado; // ← Anidado en propiedad "sensor"
  }
  description: string;
}

export interface EstadisticaSensor {
  valor: number;
  minimo: string;
  maximo: string;
  uMEd: string;
  nombreSensor: string;
  actualizacion: string;
  alerta: string;
}

export interface EstadisticaSensorData {
  data: EstadisticaSensor;
}

export interface EstadisticaSensorResponse {
  status: number;
  message: string;
  data: EstadisticaSensorData;
  description: string;
}

export interface Permiso {
  descripcion: string;
  valor: number;
  uuid_permiso: string;
  uuid_detalle: string;
}

export interface ModuloPermisos {
  modulo: string;
  permisos: Permiso[];
}

export interface PermisosPorRolYModuloData {
  data: ModuloPermisos[];
}

export interface PermisosPorRolYModuloResponse {
  status: number;
  message: string;
  data: PermisosPorRolYModuloData;
  description: string;
}

export interface PermisosPorRolYModuloParams {
  id_rol: string;
  modulo: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  id_diot?: string;
  id_daq?: string;
  id_tipo_sensor?: string;
  modbus?: string;
  id_empresa?: string;
  id_zona?: string;
   id_mapa?: string;
}

export interface CreateSensorData {
  id_daq?: string;
  id_tipo_sensor: string;
  registro: string;
  escala?: string;
  funcion: number;
  offset: string;
  imei?:string
  identificador?: string;
  control: number;
  maximo: number;
  minimo: number;
  zona?: string;
  marca?: string;
  modelo?: string;
  ejeX?: string | null;
  ejeY?: string | null;
}

export interface patchSensorData {
  registro?: string;
  escala?: string;
  offset?: string;
  maximo?: number;
  minimo?: number;
  funcion: number;
   control?: number;
  id_daq?: string;
  id_tipo_sensor?: string;
  zona?: string;
  marca?: string;
  modelo?: string;
  ejeX?: string | null;
  ejeY?: string | null;
  eje3D?: string
}

export interface DeleteSensorData {
  deleted_at: number;
}

export const sensoresService = {
  getSensores: async (params: PaginationParams = {}): Promise<SensoresResponse> => {
    const { 
      page, 
      size, 
      search, 
      sortBy, 
      sortOrder,
      id_diot,
      id_daq, 
      id_tipo_sensor,
      modbus,
      id_zona,
      id_empresa,
      id_mapa
    } = params;
    

    const response = await axiosInstance.get(API_ENDPOINTS.sensores, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(id_diot && { id_diot }),
        ...(id_daq && { id_daq }),
        ...(id_tipo_sensor && { id_tipo_sensor }),
        ...(modbus && { modbus }),
        ...(id_zona && { id_zona }),
        ...(id_mapa && { id_mapa }),
        ...(id_empresa && { id_empresa})
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Obtener un sensor por ID - Usa GetSensorResponse
  getSensorById: async (id: string): Promise<GetSensorResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.sensores}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener estadísticas de un sensor
  getEstadisticaSensor: async (id: string): Promise<EstadisticaSensorResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.sensores}/estadisticaSensor/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Crear un nuevo sensor (POST) - Usa CreateSensorResponse
  createSensor: async (sensorData: CreateSensorData): Promise<CreateSensorResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.sensores, sensorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Actualizar un sensor existente (PATCH) - Usa patchSensorResponse
  patchSensor: async (id: string, sensorData: patchSensorData): Promise<patchSensorResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.sensores}/${id}`, sensorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Eliminar un sensor (soft delete - DELETE con body) - Usa patchSensorResponse
  deleteSensor: async (id: string): Promise<patchSensorResponse> => {
    const deleteData: DeleteSensorData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.delete(`${API_ENDPOINTS.sensores}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ Restaurar un sensor eliminado (PATCH) - Usa patchSensorResponse
  restoreSensor: async (id: string): Promise<patchSensorResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.sensores}/${id}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener sensores por diot (método alternativo)
  getSensoresByDiot: async (diotId: string, params: PaginationParams = {}): Promise<SensoresResponse> => {
    const { page = 1, size = 10, search, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(`${API_ENDPOINTS.sensores}/diot/${diotId}`, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener sensores por tipo de sensor (método alternativo)
  getSensoresByTipoSensor: async (tipoSensorId: string, params: PaginationParams = {}): Promise<SensoresResponse> => {
    const { page = 1, size = 10, search, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(`${API_ENDPOINTS.sensores}/tipo-sensor/${tipoSensorId}`, {
      params: { 
        page, 
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener permisos por rol y módulo específico
  getPermisosPorRolYModulo: async (params: PermisosPorRolYModuloParams): Promise<PermisosPorRolYModuloResponse> => {
    const { id_rol, modulo } = params;
    
    const response = await axiosInstance.get(`${API_ENDPOINTS.permisos}/permisosPorRol`, {
      params: { 
        id_rol,
        modulo
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

};
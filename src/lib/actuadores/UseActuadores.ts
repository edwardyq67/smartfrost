import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces actualizadas

export interface TipoActuador {
  id: string;
  uuid: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  id_user?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Dispositivo {
  id: string;
  uuid: string;
  id_tipo_sistema: string;
  id_user: string;
  id_mapa: string;
  imei: string;
  nombre: string;
  lan: string;
  wan: string;
  ejeX: string;
  ejeY: string;
  eje3D?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface Empresa {
  id?: string;
  uuid: string;
  nombre: string;
  logo?: string;
  coordenadas?: string;
  direccion?: string;
  telefono?: string;
  imagen?: string;
  created_at?: string;
  creador?: {
    uuid: string;
    nombre: string;
  };
}

export interface Mapa {
  id: string;
  uuid: string;
  nombre: string;
  imagen?: string;
  imagen3D?: string;
  created_at?: string;
  creador?: {
    uuid: string;
    nombre: string;
  };
  empresa?: Empresa;
}

export interface Creador {
  uuid: string;
  nombre: string;
}

export interface Zona {
  id: string;
  uuid: string;
  points: string; // JSON string de puntos
  nombre: string;
  escala?: string;
  color?: string;
  ios?: string; // JSON string
  created_at: string;
  mapa: Mapa; // ¡Es un objeto, no array!
  creador?: Creador;
}

export interface Daq {
  id: string;
  uuid: string;
  id_user: string;
  id_dispositivo: string;
  responsable: string;
  identificador: string;
  tipo: string;
  nombre: string;
  fecha_fabricacion: string;
  version: string;
  cant_sensores: string;
  ejeX: string;
  ejeY: string;
  eje3D?: string | null;
  zona: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface Actuador {
  id: string;
  uuid: string;
  identificador: string;
  imei: string;
  funcion: string;
  register: string;
  factor: number;
  offset: number;
  value: number;
  install: string;
  control: string;
  recovery: string;
  local: string;
  habilitacion: string;
  created_at: string;
  id_daq: string;
  id_modbus: string;
  identificador_daq: string;
  id_empresa: string;
  nombre_empresa: string;
  dispositivo_nombre: string;
  tipo_uuid: string;
  tipo_nombre: string;
  id_mapa: string;
  tipo_actuador_nombre: string;
  // Campos adicionales de la respuesta
  eje3D?: string | null;
  json_creacion?: string;
  max?: string;
  min?: string;
  conMaxMin?: string;
  deleted_at?: string;
  zonas?: Zona[]; // Agregar zonas aquí también si es necesario
}

export interface ActuadorById {
  id: string;
  imei: string;
  uuid: string;
  id_daq: string;
  id_modbus: string;
  id_tipo_actuador: string;
  funcion: string;
  register: string;
  factor: number;
  offset: number;
  value: number;
  install: string;
  control: string;
  recovery: string;
  local: string;
  habilitacion: string;
  created_at: string;
  identificador: string;
  tipo_actuador: TipoActuador;
  tipo_codigo?: string; // Podría no venir
  tipo_nombre?: string; // Podría no venir
  empresa: {
    uuid: string;
    nombre: string;
  };
  daq: Daq;
  identificador_daq: string;
  dispositivo: Dispositivo;
  dispositivo_nombre: string;
  max?: string; // Cambiar de number a string según respuesta
  min?: string; // Cambiar de number a string según respuesta
  conMaxMin?: string;
  // Campos adicionales de la respuesta
  eje3D?: string | null;
  json_creacion?: string;
  id_dispositivo?: string;
  deleted_at?: string;
  imei_dispositivo?: string;
  // ¡CORREGIR AQUÍ!
  zonas: Zona[]; // Usar la interfaz Zona corregida
}

// Interfaces para la respuesta de creación
export interface CreatedActuador {
  id: string;
  imei: string;
  uuid: string;
  id_dispositivo: string;
  id_daq: string;
  id_tipo_actuador: string;
  id_modbus: string;
  funcion: string;
  register: string;
  value: string;
  install: string;
  control: string;
  recovery: string;
  eje3D: string | null;
  local: string;
  habilitacion: string;
  factor: string;
  json_creacion: string;
  identificador: string;
  max: string | null;
  min: string | null;
  conMaxMin: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface CreateActuadorResponseData {
  message: string;
  actuador: CreatedActuador;
}

export interface CreateActuadorResponse {
  status: number;
  message: string;
  data: CreateActuadorResponseData;
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

export interface ActuadoresListData {
  data: Actuador[];
  pager: Pager;
}

export interface ActuadoresResponse {
  status: number;
  message: string;
  data: ActuadoresListData;
  description: string;
  id_empresa?: string;
}

export interface ActuadorByIdResponse {
  status: number;
  message: string;
  data: ActuadorById;
  description: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  id_user?: number;
  tabla?: number;
  Datos?: string;
  accion?: string;
  id_daq?: string;
  id_tipo_actuador?: string;
  id_empresa?: string;
  id_mapa?: string;
}

export interface CreateActuadorData {
  id_tipo_actuador: string;
  id_daq: string;
  id_modbus: string | number;
  register: string | number;
  factor: string | number;
  offset: string | number;
  value: string | number;
  funcion: string | number;
  identificador?: string | number;
  install: boolean;
  control: boolean;
  recovery: boolean;
  local: boolean;
  habilitacion: boolean;
}

export interface UpdateActuadorData {
  id_tipo_actuador?: string;
  id_daq?: string;
  id_modbus?: string | number;
  register?: string | number;
  factor?: string | number;
  offset?: string | number;
  value?: string | number;
  funcion?: string | number;
  install?: boolean;
  control?: boolean;
  recovery?: boolean;
  local?: boolean;
  habilitacion?: boolean;
  identificador?: string | number;
  max?: number;
  min?: number;
  conMaxMin?: string;
}

export interface DeleteActuadorData {
  deleted_at: number;
}

export const actuadoresService = {
  getActuadores: async (params: PaginationParams = {}): Promise<ActuadoresResponse> => {
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
      id_daq,
      id_tipo_actuador,
      id_empresa,
      id_mapa
    } = params;

    const response = await axiosInstance.get(API_ENDPOINTS.actuadores, {
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
        ...(id_daq && { id_daq }),
        ...(id_tipo_actuador && { id_tipo_actuador }),
        ...(id_empresa && { id_empresa }),
        ...(id_mapa && { id_mapa })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  getActuadorById: async (uuid: string): Promise<ActuadorByIdResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.actuadores}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  createActuador: async (actuadorData: CreateActuadorData): Promise<CreateActuadorResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.actuadores, actuadorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  patchActuador: async (uuid: string, actuadorData: UpdateActuadorData): Promise<ActuadoresResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.actuadores}/${uuid}`, actuadorData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  deleteActuador: async (id: string): Promise<ActuadoresResponse> => {
    const deleteData: DeleteActuadorData = {
      deleted_at: 1
    };

    const response = await axiosInstance.delete(`${API_ENDPOINTS.actuadores}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};
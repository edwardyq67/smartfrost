
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
// Interfaces basadas en tu API
export interface Creador {
  uuid: string;
  nombre: string;
}

export interface Receptor {
  uuid: string;
  nombre: string;
}

export interface Notificacion {
  id: string;
  uuid: string;
  titulo: string;
  mensaje: string;
  notificado: string;
  tipo: string;
  created_at: string;
  creador: Creador;
  receptor: Receptor;
}

export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface NotificacionesResponse {
  status: number;
  message: string;
  data: {
    data: Notificacion[];
    pager: Pager;
  };
  description: string;
}

export interface CreateNotificacionRequest {
  destinatarios: string[];
  titulo: string;
  mensaje: string;
  tipo: "app" | "web";
  icono?: string;
  ruta?: string;
  color?: string;
}

export interface UpdateNotificacionRequest {
  deleted_at?: number;
  notificado?: number;
  [key: string]: any;
}

export interface NotificacionesFilters {
  id_dispositivo?: string;
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Servicio de notificaciones
export const notificacionesService = {
  // Obtener lista de notificaciones
  getNotificaciones: async (params: NotificacionesFilters = {}): Promise<NotificacionesResponse> => {
    const { page = 1, size = 10, id_dispositivo, search, sortBy, sortOrder } = params;
    
    const response = await axiosInstance.get(API_ENDPOINTS.notificaciones, {
      params: { 
        page, 
        size,
        ...(id_dispositivo && { id_dispositivo }),
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Obtener una notificación específica
  getNotificacion: async (uuid: string): Promise<NotificacionesResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.notificaciones}/${uuid}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Crear una nueva notificación
  createNotificacion: async (notificacionData: CreateNotificacionRequest): Promise<NotificacionesResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.notificaciones, notificacionData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
 // Crear una nueva notificación
  createNotificacionOneSignal: async (notificacionData: CreateNotificacionRequest): Promise<NotificacionesResponse> => {
    const response = await axiosInstance.post(`${API_ENDPOINTS.notificaciones}/enviarNotificaciones`, notificacionData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
  // Actualizar una notificación (marcar como leída, eliminar, etc.)
  updateNotificacion: async (uuid: string, notificacionData: UpdateNotificacionRequest): Promise<NotificacionesResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.notificaciones}/${uuid}`, notificacionData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar una notificación (soft delete - PATCH con deleted_at)
  deleteNotificacion: async (uuid: string): Promise<NotificacionesResponse> => {
    const deleteData = {
      deleted_at: 1
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.notificaciones}/${uuid}`, deleteData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Restaurar una notificación eliminada
  restoreNotificacion: async (uuid: string): Promise<NotificacionesResponse> => {
    const restoreData = {
      deleted_at: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.notificaciones}/${uuid}`, restoreData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Marcar notificación como leída
  markAsRead: async (uuid: string): Promise<NotificacionesResponse> => {
    const readData = {
      notificado: 1
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.notificaciones}/${uuid}`, readData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // Marcar notificación como no leída
  markAsUnread: async (uuid: string): Promise<NotificacionesResponse> => {
    const unreadData = {
      notificado: 0
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.notificaciones}/${uuid}`, unreadData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  }
};

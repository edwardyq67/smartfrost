import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces existentes...
export interface Rol {
  id: string;
  uuid: string;
  nombre: string;
}

export interface Empresa {
  id: string;
  uuid: string;
  nombre: string;
}

export interface Creador {
  uuid: string;
  nombre: string;
}

export interface User {
  id: string;
  uuid: string;
  id_empresa: string | null;
  nombre: string;
  dni: string;
  usuario: string;
  email?: string; // tu backend NO lo envía, pero no causa error
  avatar?: string | null; // <-- CORREGIDO
  rol_frontend?: string | null;
  tutorial?: string;
  id_os_web?: string;
  id_os_app?: string;
  created_at?: string;
  rol: Rol | null;
 empresa?: Empresa | null;
  creador: {
    uuid: string;
    nombre: string;
  };
}


export interface Pager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  next: string | null;
  previous: string | null;
}

export interface UsersResponse {
  status: number;
  message: string;
  data: {
    data: User[];
    pager: Pager;
  };
  description: string;
}

export interface UserResponse {
  status: number;
  message: string;
  data: User;
  description: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  nombre?: string; 
  sortBy?: string;
  id_empresa?: string;
  id_rol?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserData {
  nombre: string;
  usuario: string;
  clave: string;
  id_rol: string;
  id_empresa: string | null;
  dni: string;
  avatar?: string;
  id_os_web?: string; // ✅ AÑADIDO
  tutorial?: string; // ✅ AÑADIDO
}

export interface UpdateUserData {
  nombre?: string;
  usuario?: string;
  clave?: string;
  id_rol?: string;
  id_empresa?: string | null;
  dni?: string;
  avatar?: string;
  rol_frontend?: string;
  tutorial?: string; // ✅ AÑADIDO
  id_os_web?: string; // ✅ AÑADIDO
  id_os_app?: string; // ✅ AÑADIDO (opcional)
}

export interface DeleteUserData {
  deleted_at: number;
}

export interface Ruta {
  ruta: string;
  metodo: string | null;
}

export interface Permiso {
  modulo: string;
  rutas: Ruta[];
}

export interface UserPerfil {
  userId: string;
  nombre: string;
  rol: string;
  permisos: Permiso[];
}

export interface UserPerfilResponse {
  status: number;
  message: string;
  data: UserPerfil;
  description: string;
}

// ✅ NUEVA INTERFACE para permisosSidebar
export interface SidebarPermissionItem {
  modulo: string;
}

export interface SidebarPermissionsResponse {
  status: number;
  message: string;
  data: {
    data: SidebarPermissionItem[];
  };
  description: string;
}

export const userService = {
  getUsers: async (params: PaginationParams = {}): Promise<UsersResponse> => {
    const { 
      page = 1, 
      size = 10, 
      search, 
      sortBy, 
      sortOrder,
      id_empresa,
      nombre,
      id_rol
    } = params;

    const response = await axiosInstance.get(API_ENDPOINTS.users, {
      params: {
        page,
        size,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(id_empresa && { id_empresa }),
        ...(nombre && { nombre }),     
        ...(id_rol && { id_rol })
      },
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  getUserPerfil: async (): Promise<UserPerfilResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.users}/perfil`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  getUserById: async (id: string): Promise<UserResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.users}/${id}`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ NUEVO: Obtener permisos para sidebar
  getSidebarPermissions: async (): Promise<SidebarPermissionsResponse> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.users}/permisosSidebar`, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  createUser: async (userData: CreateUserData): Promise<UserResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.users, userData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserData): Promise<UserResponse> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.users}/${id}`, userData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  deleteUser: async (id: string): Promise<UserResponse> => {
    const deleteData: DeleteUserData = {
      deleted_at: 1
    };

    const response = await axiosInstance.delete(`${API_ENDPOINTS.users}/${id}`, {
      data: deleteData,
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ MÉTODO ESPECÍFICO para actualizar solo el ID de OneSignal
  updateOneSignalId: async (userId: string, oneSignalId: string): Promise<UserResponse> => {
    const updateData: UpdateUserData = {
      id_os_web: oneSignalId
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.users}/${userId}`, updateData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },

  // ✅ MÉTODO ESPECÍFICO para actualizar tutorial
  updateTutorial: async (userId: string, tutorial: string): Promise<UserResponse> => {
    const updateData: UpdateUserData = {
      tutorial: tutorial
    };
    
    const response = await axiosInstance.patch(`${API_ENDPOINTS.users}/${userId}`, updateData, {
      headers: useAuthStore.getState().getAuthHeaders()
    });
    return response.data;
  },
};
// store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RoutePermission {
  ruta: string;
  metodo: string | null;
}

export interface ModulePermission {
  modulo: string;
  ruta: RoutePermission[];
}

export interface UserData {
  id: string;
  nombre: string;
  rol: string;
  empresa: string;
  avatar?: string;
  tutorial: string;
}

interface AuthState {
  token: string | null;
  permisos: ModulePermission[];
  user: UserData | null;
  
  setAuth: (token: string, user: UserData, permisos: ModulePermission[]) => void;
  clearAuth: () => void;
  setPermisos: (permisos: ModulePermission[]) => void;
  setToken: (token: string) => void;
  setUser: (user: UserData) => void;
  updateUser: (updatedUserData: Partial<UserData>) => void;
  getAuthHeaders: () => { [key: string]: string };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      permisos: [],
      user: null,
      
      setAuth: (token: string, user: UserData, permisos: ModulePermission[]) => {
        set({ token, user, permisos });
      },
      
      setPermisos: (permisos: ModulePermission[]) => {
        set({ permisos });
      },
      
      setToken: (token: string) => {
        set({ token });
      },
      
      setUser: (user: UserData) => {
        set({ user });
      },
      
      updateUser: (updatedUserData: Partial<UserData>) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...updatedUserData };
          return { ...state, user: updatedUser };
        });
      },
      
      clearAuth: () => {
        set({ token: null, permisos: [], user: null });
      },
      
      getAuthHeaders: () => {
        const { token } = get();
        return {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        };
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
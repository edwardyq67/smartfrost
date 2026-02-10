import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Usuario {
  uuid: string;
  nombre: string;
}

interface UsuariosState {
  usuarios: Usuario[];
  roles: { uuid: string; nombre: string }[];
  empresas: { uuid: string; nombre: string }[]; // Nuevo estado para empresas
  loadingRoles: boolean;
  errorRoles: string | null;
  loadingEmpresas: boolean; // Nuevo estado de loading para empresas
  errorEmpresas: string | null; // Nuevo estado de error para empresas
  setUsuarios: (usuarios: Usuario[]) => void;
  setRoles: (roles: { uuid: string; nombre: string }[]) => void;
  setEmpresas: (empresas: { uuid: string; nombre: string }[]) => void; // Nueva acción
  setLoadingRoles: (loading: boolean) => void;
  setErrorRoles: (error: string | null) => void;
  setLoadingEmpresas: (loading: boolean) => void; // Nueva acción
  setErrorEmpresas: (error: string | null) => void; // Nueva acción
}

export const useUsuariosStore = create<UsuariosState>()(
  devtools(
    (set) => ({
      usuarios: [],
      roles: [],
      empresas: [], // Inicializar array vacío
      loadingRoles: false,
      errorRoles: null,
      loadingEmpresas: false,
      errorEmpresas: null,
      setUsuarios: (usuarios) => set({ usuarios }),
      setRoles: (roles) => set({ roles }),
      setEmpresas: (empresas) => set({ empresas }), // Nueva acción
      setLoadingRoles: (loadingRoles) => set({ loadingRoles }),
      setErrorRoles: (errorRoles) => set({ errorRoles }),
      setLoadingEmpresas: (loadingEmpresas) => set({ loadingEmpresas }), // Nueva acción
      setErrorEmpresas: (errorEmpresas) => set({ errorEmpresas }), // Nueva acción
    })
  )
);
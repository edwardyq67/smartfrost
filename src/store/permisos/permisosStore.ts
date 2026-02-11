// store/permisos/permisosStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PermisoSimplificado {
  descripcion: string;
  valor: number;
  uuid_permiso: string;
  uuid_detalle: string;
}

export interface ModuloPermisosSimplificado {
  modulo: string;
  permisos: PermisoSimplificado[];
}

interface PermisosState {
  modulos: ModuloPermisosSimplificado[];
  modulosDesdeAPI: PermisoSimplificado[];
  moduloSeleccionado: ModuloPermisosSimplificado | null;
  nombreModuloSeleccionado: string;
  roles: { uuid: string; nombre: string }[];
  rolSeleccionado: { uuid: string } | null;
  loading: boolean;
  
  setModulos: (modulos: ModuloPermisosSimplificado[]) => void;
  setModulosDesdeAPI: (permisos: PermisoSimplificado[]) => void;
  setModuloSeleccionado: (modulo: ModuloPermisosSimplificado | null) => void;
  setNombreModuloSeleccionado: (nombre: string) => void;
  setRoles: (roles: { uuid: string; nombre: string }[]) => void;
  // ✅ AHORA SOLO RECIBE UUID
  setRolSeleccionado: (uuid: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearModulos: () => void;
  clearRoles: () => void;
  clearAll: () => void;
  
  actualizarPermisoEnStore: (uuid_detalle: string, nuevoValor: number) => void;
}

export const usePermisosStore = create<PermisosState>()(
  devtools(
    (set) => ({
      modulos: [],
      modulosDesdeAPI: [],
      moduloSeleccionado: null,
      nombreModuloSeleccionado: '',
      roles: [],
      rolSeleccionado: null,
      loading: false,
      
      setModulos: (modulos) => set({ modulos }),
      setModulosDesdeAPI: (permisos) => set({ modulosDesdeAPI: permisos }),
      setModuloSeleccionado: (modulo) => set({ moduloSeleccionado: modulo }),
      setNombreModuloSeleccionado: (nombre) => set({ nombreModuloSeleccionado: nombre }),
      setRoles: (roles) => set({ roles }),
      
      // ✅ NUEVA IMPLEMENTACIÓN - SOLO UUID
      setRolSeleccionado: (uuid) => set((state) => {
        if (!uuid) return { rolSeleccionado: null };
        
        // Buscar el nombre del rol en el array de roles
        const rol = state.roles.find(r => r.uuid === uuid);
        return {
          rolSeleccionado: rol ? { uuid: rol.uuid, nombre: rol.nombre } : { uuid, nombre: '' }
        };
      }),
      
      setLoading: (loading) => set({ loading }),
      clearModulos: () => set({ modulos: [] }),
      clearRoles: () => set({ roles: [], rolSeleccionado: null }),
      clearAll: () => set({ 
        modulos: [], 
        modulosDesdeAPI: [],
        roles: [], 
        rolSeleccionado: null,
        moduloSeleccionado: null,
        loading: false 
      }),
      
      actualizarPermisoEnStore: (uuid_detalle: string, nuevoValor: number) => {
        set((state) => ({
          modulosDesdeAPI: state.modulosDesdeAPI.map(permiso =>
            permiso.uuid_detalle === uuid_detalle
              ? { ...permiso, valor: nuevoValor }
              : permiso
          )
        }));
      },
    }),
    {
      name: 'permisos-store',
    }
  )
);
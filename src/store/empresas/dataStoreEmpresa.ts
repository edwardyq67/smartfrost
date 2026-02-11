// store/empresas/dataStoreEmpresa.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ✅ Interface para Empresa
export interface Empresa {
  uuid: string;
  nombre: string;
}

export interface Mapa {
  uuid: string;
  nombre: string;
  imagen: string;
  creador: string;
  empresa: string;
  id_empresa: string;
}

interface EmpresaState {
  empresa: Empresa | null;
  empresas: Empresa[] | null;
  mapaSeleccionada: Mapa | null; // ✅ Nueva propiedad
  loadingDaq: boolean;
  marcarZonaDaq: boolean;

  setEmpresa: (empresa: any) => void;
  setEmpresas: (empresas: Empresa[] | null) => void;
  setMapaSeleccionada: (mapa: Mapa | null) => void; // ✅ Nueva función
  setMarcarZonaDaq: (marcar: boolean) => void;
  setLoadingDaq: (loading: boolean) => void;
  clearEmpresa: () => void;
  clearAll: () => void;
}

export const useEmpresaStore = create<EmpresaState>()(
  persist(
    (set, get) => ({
      empresa: null,
      empresas: null,
      mapaSeleccionada: null, // ✅ Inicializada como null
      loadingDaq: false,
      marcarZonaDaq: false,
      
      setEmpresa: (empresa) => set({ empresa }),
      
      setEmpresas: (empresas) => set({ empresas }),
      
      setMapaSeleccionada: (mapa: Mapa | null) => set({ mapaSeleccionada: mapa }), // ✅ Nueva función
      
      setMarcarZonaDaq: (marcarZonaDaq: boolean) => set({ marcarZonaDaq }),
      
      setLoadingDaq: (loading: boolean) => set({ loadingDaq: loading }),
      
      clearEmpresa: () => set({ 
        empresa: null, 
        empresas: null,
        mapaSeleccionada: null, // ✅ Limpiar también el mapa
        loadingDaq: false,
        marcarZonaDaq: false
      }),
      
      clearAll: () => set({ 
        empresa: null, 
        empresas: null,
        mapaSeleccionada: null, // ✅ Limpiar también el mapa
        loadingDaq: false,
        marcarZonaDaq: false
      }),
    }),
    {
      name: 'empresa-storage', 
    }
  )
);
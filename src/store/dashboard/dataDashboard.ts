import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Empresa {
  uuid: string;
  nombre: string;
}

interface DashboardState {
  empresa: Empresa | null; // Solo un objeto empresa
  loadingEmpresa: boolean;
  errorEmpresa: string | null;
  setEmpresa: (empresa: Empresa | null) => void;
  setLoadingEmpresa: (loading: boolean) => void;
  setErrorEmpresa: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      empresa: null, // Inicialmente null
      loadingEmpresa: false,
      errorEmpresa: null,
      setEmpresa: (empresa) => set({ empresa }),
      setLoadingEmpresa: (loadingEmpresa) => set({ loadingEmpresa }),
      setErrorEmpresa: (errorEmpresa) => set({ errorEmpresa }),
    })
  )
);
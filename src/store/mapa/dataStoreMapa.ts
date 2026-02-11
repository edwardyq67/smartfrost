import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Desde UseZona.ts
export interface Zona {
  id: string;
  uuid: string;
  id_mapa: string;
  nombre: string;
  points: string;    
  escala: number;    
  color: number;     
  ios: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DIOT {
  uuid: string;
  imei: string;
  nombre: string;
  lan: string;
  wan: string;
  created_at: string;
  creador: string;
  empresa_nombre: string;
  id_tipo_sistema: string;
  sistema_nombre: string;
  id_zona: string;
  zona_nombre: string;
}

interface MapaState {
  zonas: Zona[];
  DIOT: DIOT[];
  loading: boolean;

  setZonas: (zonas: Zona[]) => void;
  setLoading: (loading: boolean) => void;
  clearZonas: () => void;
  setDIOT: (diot: DIOT[]) => void;
}

export const useMapaStore = create<MapaState>()(
  persist(
    (set) => ({
      zonas: [],
      DIOT: [],
      loading: false,

      setZonas: (zonas) => set({ zonas }),
      setLoading: (loading) => set({ loading }),
      setDIOT: (diot) => set({ DIOT: diot }),

      clearZonas: () =>
        set({
          zonas: [],
          DIOT: [],
          loading: false,
        }),
    }),
    {
      name: 'mapa-storage',
      partialize: (state) => ({
        zonas: state.zonas,
        DIOT: state.DIOT,
        // No persistir estados de loading
      }),
    }
  )
);
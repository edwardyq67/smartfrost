import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EstadisticaUnica {
  imei: string | undefined; 
  uuid: string | undefined;  // ✅ AGREGAR ESTA LÍNEA
  estadistica: any;
  id_daq:string | undefined;
  webSocketData: any;
  timestamp: number;
}

interface EstadisticasStore {
  estadisticasUnicas: EstadisticaUnica[];
  setEstadisticasUnicas: (estadisticas: EstadisticaUnica[]) => void;
}

export const useEstadisticasStore = create<EstadisticasStore>()(
  persist(
    (set) => ({
      estadisticasUnicas: [],
      setEstadisticasUnicas: (estadisticas) => set({ estadisticasUnicas: estadisticas }),
    }),
    {
      name: 'estadisticas-sensores-storage',
    }
  )
);
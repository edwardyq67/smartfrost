// store/mapa/dataStoreMapaSinPersist.ts
import { create } from 'zustand';

interface MapaState {
  mapaAgrandado: boolean;
  setMapaAgrandado: (agrandado: boolean) => void;
}

export const useMapaStoreSinPersist = create<MapaState>((set) => ({
  mapaAgrandado: false,
  setMapaAgrandado: (agrandado: boolean) => set({ mapaAgrandado: agrandado }),
}));
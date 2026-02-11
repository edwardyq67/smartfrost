// store/daq/daqStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface DiotInfo {
  uuid: string;
  nombre: string;
  id_mapa: string; // ✅ Cambiado de opcional a requerido
  id_empresa: string; // ✅ Cambiado de opcional a requerido

  imei?: string;
  sistema_nombre?: string;
  empresa_nombre?: string;
}

interface DaqInfo {
  uuid: string;
  numero: string;
}

interface DaqState {
  diot: DiotInfo | null;
  daq: DaqInfo | null;
  identificadores: string[];
  setDiot: (diot: DiotInfo | null) => void;
  setDaq: (daq: DaqInfo | null) => void;
  setIdentificadores: (identificadores: string[]) => void;
  addIdentificador: (identificador: string) => void;
  removeIdentificador: (identificador: string) => void;
  clearIdentificadores: () => void;
  clearDiot: () => void;
  clearDaq: () => void;
  clearAll: () => void;
}

export const useDaqStore = create<DaqState>()(
  devtools(
    persist(
      (set) => ({
        diot: null,
        daq: null,
        identificadores: [],
        setDiot: (diot) => set({ diot }),
        setDaq: (daq) => set({ daq }),
        setIdentificadores: (identificadores) => set({ identificadores }),
        addIdentificador: (identificador) => 
          set((state) => ({ 
            identificadores: [...state.identificadores, identificador] 
          })),
        removeIdentificador: (identificador) => 
          set((state) => ({ 
            identificadores: state.identificadores.filter(id => id !== identificador) 
          })),
        clearIdentificadores: () => set({ identificadores: [] }),
        clearDiot: () => set({ diot: null }),
        clearDaq: () => set({ daq: null }),
        clearAll: () => set({ diot: null, daq: null, identificadores: [] }),
      }),
      {
        name: 'daq-store',
      }
    ),
    {
      name: 'daq-store'
    }
  )
);
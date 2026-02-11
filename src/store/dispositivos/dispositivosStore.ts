// store/dispositivos/dispositivosStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Dispositivo {
  uuid: string;
  nombre: string;
}

interface DispositivosState {
  dispositivo: Dispositivo[]; // ✅ Ahora es un array
  empresas: { uuid: string; nombre: string }[];
  Tiposistemas: { uuid: string; nombre: string }[];
  loadingEmpresas: boolean;
  errorEmpresas: string | null;
  setDispositivo: (dispositivo: Dispositivo[]) => void; // ✅ Ahora acepta array
  setEmpresas: (empresas: { uuid: string; nombre: string }[]) => void;
  setTiposistemas: (Tiposistemas: { uuid: string; nombre: string }[]) => void;
  setLoadingEmpresas: (loading: boolean) => void;
  setErrorEmpresas: (error: string | null) => void;
}

export const useDispositivosStore = create<DispositivosState>()(
  devtools(
    (set) => ({
      dispositivo: [], // ✅ Inicializado como array vacío
      empresas: [],
      Tiposistemas: [],
      loadingEmpresas: false,
      errorEmpresas: null,
      setDispositivo: (dispositivo) => set({ dispositivo }), // ✅ Ahora establece array
      setEmpresas: (empresas) => set({ empresas }),
      setTiposistemas: (Tiposistemas) => set({ Tiposistemas }),
      setLoadingEmpresas: (loadingEmpresas) => set({ loadingEmpresas }),
      setErrorEmpresas: (errorEmpresas) => set({ errorEmpresas }),
    }),
    {
      name: 'dispositivos-store'
    }
  )
);
// store/sensores/sensoresStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SensoresState {
  dispositivos: { uuid: string; nombre: string }[];
  tipoSensores: { uuid: string; nombre: string }[];
  daqs: { uuid: string; nombre: string }[]; // ✅ Nuevo array de DAQs
  loadingDispositivos: boolean;
  errorDispositivos: string | null;
  loadingTipoSensores: boolean;
  errorTipoSensores: string | null;
  loadingDaqs: boolean; // ✅ Nuevo estado de carga para DAQs
  errorDaqs: string | null; // ✅ Nuevo estado de error para DAQs
  setDispositivos: (dispositivos: { uuid: string; nombre: string }[]) => void;
  setTipoSensores: (tipoSensores: { uuid: string; nombre: string }[]) => void;
  setDaqs: (daqs: { uuid: string; nombre: string }[]) => void; // ✅ Nueva función setter
  setLoadingDispositivos: (loading: boolean) => void;
  setErrorDispositivos: (error: string | null) => void;
  setLoadingTipoSensores: (loading: boolean) => void;
  setErrorTipoSensores: (error: string | null) => void;
  setLoadingDaqs: (loading: boolean) => void; // ✅ Nueva función para loading
  setErrorDaqs: (error: string | null) => void; // ✅ Nueva función para error
}

export const useSensoresStore = create<SensoresState>()(
  devtools(
    (set) => ({
      dispositivos: [],
      tipoSensores: [],
      daqs: [], // ✅ Inicializado como array vacío
      loadingDispositivos: false,
      errorDispositivos: null,
      loadingTipoSensores: false,
      errorTipoSensores: null,
      loadingDaqs: false, // ✅ Inicializado en false
      errorDaqs: null, // ✅ Inicializado como null
      setDispositivos: (dispositivos) => set({ dispositivos }),
      setTipoSensores: (tipoSensores) => set({ tipoSensores }),
      setDaqs: (daqs) => set({ daqs }), // ✅ Nueva función setter
      setLoadingDispositivos: (loadingDispositivos) => set({ loadingDispositivos }),
      setErrorDispositivos: (errorDispositivos) => set({ errorDispositivos }),
      setLoadingTipoSensores: (loadingTipoSensores) => set({ loadingTipoSensores }),
      setErrorTipoSensores: (errorTipoSensores) => set({ errorTipoSensores }),
      setLoadingDaqs: (loadingDaqs) => set({ loadingDaqs }), // ✅ Nueva función
      setErrorDaqs: (errorDaqs) => set({ errorDaqs }), // ✅ Nueva función
    }),
    {
      name: 'sensores-store'
    }
  )
);
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface NotificacionesState {
  // Dispositivos
  dispositivos: { uuid: string; nombre: string }[];
  dispositivoSeleccionado: { uuid: string; nombre: string } | null;
  
  // Usuarios
  usuarios: { uuid: string; nombre: string }[];
  usuarioSeleccionado: { uuid: string; nombre: string } | null;
  
  // Setters para dispositivos
  setDispositivos: (dispositivos: { uuid: string; nombre: string }[]) => void;
  setDispositivoSeleccionado: (dispositivo: { uuid: string; nombre: string } | null) => void;
  
  // Setters para usuarios
  setUsuarios: (usuarios: { uuid: string; nombre: string }[]) => void;
  setUsuarioSeleccionado: (usuario: { uuid: string; nombre: string } | null) => void;
  
  // Limpiar datos
  clearDispositivos: () => void;
  clearUsuarios: () => void;
  clearAll: () => void;
}

export const useNotificacionesStore = create<NotificacionesState>()(
  devtools(
    (set) => ({
      // Estado inicial
      dispositivos: [],
      dispositivoSeleccionado: null,
      usuarios: [],
      usuarioSeleccionado: null,
      
      // Setters para dispositivos
      setDispositivos: (dispositivos) => set({ dispositivos }),
      setDispositivoSeleccionado: (dispositivo) => set({ dispositivoSeleccionado: dispositivo }),
      
      // Setters para usuarios
      setUsuarios: (usuarios) => set({ usuarios }),
      setUsuarioSeleccionado: (usuario) => set({ usuarioSeleccionado: usuario }),
      
      // Limpiar datos
      clearDispositivos: () => set({ dispositivos: [], dispositivoSeleccionado: null }),
      clearUsuarios: () => set({ usuarios: [], usuarioSeleccionado: null }),
      clearAll: () => set({ 
        dispositivos: [], 
        dispositivoSeleccionado: null,
        usuarios: [], 
        usuarioSeleccionado: null 
      }),
    }),
    {
      name: 'notificaciones-store',
    }
  )
);
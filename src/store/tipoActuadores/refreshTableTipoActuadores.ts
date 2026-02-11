// store/tipoActuadores/refreshTableTipoActuadores.ts
import { create } from 'zustand';

interface RefreshTableTipoActuadoresState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableTipoActuadores = create<RefreshTableTipoActuadoresState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
// store/tipoDispositivos/refreshTableTipoDispositivos.ts
import { create } from 'zustand';

interface RefreshTableTipoDispositivosState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableTipoSensores = create<RefreshTableTipoDispositivosState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
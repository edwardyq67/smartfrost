// store/actuadores/refreshTableActuadores.ts
import { create } from 'zustand';

interface RefreshTableActuadoresState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableActuadores = create<RefreshTableActuadoresState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
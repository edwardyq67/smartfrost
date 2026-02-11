// store/Mapas/refreshTableMapa.ts
import { create } from 'zustand';

interface RefreshTableMapaState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableMapa = create<RefreshTableMapaState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
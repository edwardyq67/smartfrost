// store/dispositivos/refreshTableDispositivos.ts
import { create } from 'zustand';

interface RefreshTableDispositivosState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableDispositivos = create<RefreshTableDispositivosState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
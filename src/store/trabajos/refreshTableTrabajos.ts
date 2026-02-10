// lib/trabajos/refreshTableTrabajos.ts
import { create } from 'zustand';

interface RefreshTableTrabajosState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableTrabajos = create<RefreshTableTrabajosState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
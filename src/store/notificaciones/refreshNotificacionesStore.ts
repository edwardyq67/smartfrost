import { create } from 'zustand';

interface RefreshNotificacionesState {
  refreshFlag: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshNotificaciones = create<RefreshNotificacionesState>((set) => ({
  refreshFlag: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshFlag: state.refreshFlag + 1 
  })),
  resetRefresh: () => set({ refreshFlag: 0 }),
}));
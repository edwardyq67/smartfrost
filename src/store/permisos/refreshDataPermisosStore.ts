// store/permisos/refreshDataPermisosStore.ts
import { create } from 'zustand';

interface RefreshDataPermisosState {
  refreshFlag: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshDataPermisos = create<RefreshDataPermisosState>((set) => ({
  refreshFlag: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshFlag: state.refreshFlag + 1 
  })),
  resetRefresh: () => set({ refreshFlag: 0 }),
}));
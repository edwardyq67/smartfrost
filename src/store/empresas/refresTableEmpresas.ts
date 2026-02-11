// store/Empresas/refreshTableEmpresas.ts
import { create } from 'zustand';

interface RefreshTableEmpresasState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableEmpresas = create<RefreshTableEmpresasState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
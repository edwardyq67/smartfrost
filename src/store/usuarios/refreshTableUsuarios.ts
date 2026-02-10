// store/usuarios/refreshTableUsuarios.ts
import { create } from 'zustand';

interface RefreshTableUsuariosState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableUsuarios = create<RefreshTableUsuariosState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
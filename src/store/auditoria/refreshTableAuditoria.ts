// store/auditoria/refreshTableAuditoria.ts
import { create } from 'zustand';

interface RefreshTableAuditoriaState {
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

export const useRefreshTableAuditoria = create<RefreshTableAuditoriaState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1 
  })),
  resetRefresh: () => set({ refreshTrigger: 0 }),
}));
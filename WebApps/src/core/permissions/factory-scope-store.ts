import { create } from "zustand";

/**
 * Docs/18-WebApps-UI-UX-Specification.md §6: the Factory Scope selector is
 * global-header state, not a per-screen filter — every screen reads the
 * same selection. `factory-scope.ts` answers "which factories can this user
 * see"; this answers "which one is currently selected," written by TopBar,
 * read by whichever feature is on screen.
 */
interface FactoryScopeState {
  selectedFactoryId: string;
  setSelectedFactoryId: (factoryId: string) => void;
}

export const useFactoryScopeStore = create<FactoryScopeState>((set) => ({
  selectedFactoryId: "all",
  setSelectedFactoryId: (selectedFactoryId) => set({ selectedFactoryId }),
}));

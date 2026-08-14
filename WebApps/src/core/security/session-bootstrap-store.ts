import { create } from "zustand";

/**
 * Client-only prep flag — has the app finished trying to silently restore a
 * session from the stored refresh token yet? Ephemeral UI-timing state, not
 * server data, so Zustand (not TanStack Query) is the right home for it;
 * `useCurrentUser` reads this to know when it's safe to call `GET /auth/me`.
 */
interface SessionBootstrapState {
  ready: boolean;
  setReady: () => void;
}

export const useSessionBootstrapStore = create<SessionBootstrapState>((set) => ({
  ready: false,
  setReady: () => set({ ready: true }),
}));

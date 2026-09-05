import { create } from "zustand";

import { getCurrentUser, logoutUser } from "../auth/authUser"; 

interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly organizationId: string;
  readonly role: "ADMIN" | "OPERATOR" | "COORDINATOR";
}

interface AuthState {
  user: AuthenticatedUser | null;
  /** True only during the initial /auth/me check on app load. */
  isInitializing: boolean;
  setUser: (user: AuthenticatedUser | null) => void;
  /** Call once when the app mounts to restore the session from the cookie. */
  initialize: () => Promise<void>;
  /** Clears the cookie server-side and clears local state. */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitializing: true,

  setUser: (user) => set({ user }),

  initialize: async () => {
    try {
      const user = await getCurrentUser();
      set({ user });
    } catch {
      set({ user: null });
    } finally {
      set({ isInitializing: false });
    }
  },

  logout: async () => {
    try {
      await logoutUser();
    } finally {
      // Clear local state even if the network call fails, so the UI
      // doesn't get stuck showing a logged-in state.
      set({ user: null });
    }
  },
}));
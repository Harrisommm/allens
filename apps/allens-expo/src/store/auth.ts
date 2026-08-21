import { create } from 'zustand';

export type AuthUser = { uid: string; email?: string | null };

type AuthState = {
  user: AuthUser | null;
  isSignedIn: boolean;
  /** False until Firebase reports the restored session, so we don't bounce to login on launch. */
  isReady: boolean;
  setUser: (user: AuthUser | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isSignedIn: false,
  isReady: false,
  setUser: (user) => set({ user, isSignedIn: Boolean(user), isReady: true }),
}));

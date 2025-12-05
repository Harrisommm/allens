import { create } from 'zustand';

type AuthState = {
  isSignedIn: boolean;
  user?: { uid: string; email?: string | null };
  signIn: (user: { uid: string; email?: string | null }) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  isSignedIn: false,
  user: undefined,
  signIn: (user) => set({ isSignedIn: true, user }),
  signOut: () => set({ isSignedIn: false, user: undefined }),
}));

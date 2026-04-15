import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthReady: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isAuthReady: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: () => set({ isAuthReady: true }),
}));

export const useHasPalateVector = () =>
  useAuthStore(s => s.profile?.palate_vector != null);

// src/store/authStore.ts
import { create } from 'zustand';
import { pb } from '@/lib/pocketbase';

interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: pb.authStore.model,
  setUser: (user) => set({ user }),
}));

export function startAuthListener() {
  pb.authStore.onChange((token, model) => {
    useAuthStore.getState().setUser(model);
  }, true);
}
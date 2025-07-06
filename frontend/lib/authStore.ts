"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "./apiClient";

export interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthTokens {
  token: string;
  refreshToken?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  rehydrated: boolean;
  setRehydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      rehydrated: false,
      setRehydrated: () => set({ rehydrated: true }),
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const data = await apiClient.post<{
          token: string;
          user: User;
          refreshToken?: string;
        }>("/login", { email, password });
        set({
          user: data.user,
          accessToken: data.token,
          refreshToken: data.refreshToken ?? null,
          isLoading: false,
        });
      },

      register: async (email, password, role = "user") => {
        set({ isLoading: true });
        await apiClient.post<AuthTokens>("/register", {
          email,
          password,
          role,
        });
        set({ isLoading: false });
      },

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      refreshAccessToken: async () => {
        const token = get().refreshToken;
        if (!token) return false;
        try {
          const data = await apiClient.post<AuthTokens>("/refresh", {
            refreshToken: token,
          });
          set({
            accessToken: data.token,
            refreshToken: data.refreshToken ?? token,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "auth",
      onRehydrateStorage: () => (state) => {
        state.setRehydrated();
      },
    }
  )
);

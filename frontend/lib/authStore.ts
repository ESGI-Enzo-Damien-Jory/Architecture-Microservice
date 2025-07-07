"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "./apiClient";

export interface User {
  id: string;
  email: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  rehydrated: boolean;
  isRefreshing: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  ensureValidAccessToken: () => Promise<boolean>;
  setRehydrated: () => void;
  fetchUserProfile: () => Promise<void>;
}

// Utility function to clear corrupted auth storage
export const clearAuthStorage = () => {
  try {
    localStorage.removeItem("auth-storage");
    console.log("[AUTH_STORE] Cleared auth storage");
  } catch (error) {
    console.error("[AUTH_STORE] Error clearing auth storage:", error);
  }
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      rehydrated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isRefreshing: false,

      setRehydrated: () => {
        set({ rehydrated: true });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          console.log("[AUTH_STORE] Attempting login for:", email);
          
          const response = await apiClient.post<LoginResponse>("/login", { 
            email, 
            password 
          });
          
          console.log("[AUTH_STORE] Login successful for user:", response.user.id);
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          console.error("[AUTH_STORE] Login failed:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, role: string = "client") => {
        set({ isLoading: true });
        try {
          console.log("[AUTH_STORE] Attempting registration for:", email, "with role:", role);
          
          await apiClient.post<RegisterResponse>("/register", {
            email,
            password,
            role,
          });
          
          console.log("[AUTH_STORE] Registration successful for:", email);
          set({ isLoading: false });
        } catch (error) {
          console.error("[AUTH_STORE] Registration failed:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        console.log("[AUTH_STORE] Logging out user");
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null,
          isRefreshing: false,
        });
      },

      refreshAccessToken: async () => {
        const state = get();
        
        // If already refreshing, wait for it to complete
        if (state.isRefreshing) {
          console.log("[AUTH_STORE] Refresh already in progress, waiting...");
          // Wait for the refresh to complete by polling
          while (get().isRefreshing) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          // Return whether we now have an access token
          return !!get().accessToken;
        }

        const currentRefreshToken = state.refreshToken;
        if (!currentRefreshToken) {
          console.log("[AUTH_STORE] No refresh token available");
          return false;
        }
        
        set({ isRefreshing: true });
        
        try {
          console.log("[AUTH_STORE] Attempting to refresh access token");
          
          const response = await apiClient.post<RefreshResponse>("/refresh", {
            refreshToken: currentRefreshToken,
          });
          
          console.log("[AUTH_STORE] Token refresh successful");
          
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isRefreshing: false,
          });
          
          return true;
        } catch (error) {
          console.error("[AUTH_STORE] Token refresh failed:", error);
          // Clear auth state on refresh failure
          set({ 
            user: null, 
            accessToken: null, 
            refreshToken: null,
            isRefreshing: false,
          });
          return false;
        }
      },

      // Helper method to ensure we have a valid access token
      ensureValidAccessToken: async (): Promise<boolean> => {
        const state = get();
        
        // If no access token, try to refresh if we have refresh token
        if (!state.accessToken) {
          if (state.refreshToken) {
            console.log("[AUTH_STORE] No access token, attempting refresh");
            return await state.refreshAccessToken();
          }
          console.log("[AUTH_STORE] No tokens available");
          return false;
        }
        
        // If we have an access token, verify it's still valid
        try {
          console.log("[AUTH_STORE] Verifying access token validity");
          await apiClient.post("/verify");
          console.log("[AUTH_STORE] Access token is valid");
          return true;
        } catch (error) {
          console.log("[AUTH_STORE] Access token invalid/expired, attempting refresh");
          // Token is invalid, try to refresh
          if (state.refreshToken) {
            return await state.refreshAccessToken();
          }
          console.log("[AUTH_STORE] No refresh token available for renewal");
          return false;
        }
      },

      fetchUserProfile: async () => {
        const token = get().accessToken;
        if (!token) {
          console.log("[AUTH_STORE] No access token for profile fetch");
          return;
        }

        try {
          console.log("[AUTH_STORE] Fetching user profile");
          
          const response = await apiClient.get<{ user: User }>("/me");
          
          console.log("[AUTH_STORE] Profile fetch successful:", response.user.id);
          
          set({ user: response.user });
        } catch (error) {
          console.error("[AUTH_STORE] Profile fetch failed:", error);
          // Don't clear auth state here, let the interceptor handle it
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // Add version to handle schema changes
      version: 1,
      migrate: (persistedState: any, version: number) => {
        console.log("[AUTH_STORE] Migrating from version:", version);
        // If version is different or state is corrupted, return default state
        if (version !== 1 || !persistedState || typeof persistedState !== 'object') {
          console.log("[AUTH_STORE] Invalid persisted state, using defaults");
          return {
            user: null,
            accessToken: null,
            refreshToken: null,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => {
        console.log("[AUTH_STORE] Starting rehydration process");
        return (state, error) => {
          if (error) {
            console.error("[AUTH_STORE] Rehydration error:", error);
            // Clear corrupted storage on error
            try {
              localStorage.removeItem("auth-storage");
              console.log("[AUTH_STORE] Cleared corrupted storage");
            } catch (e) {
              console.error("[AUTH_STORE] Error clearing corrupted storage:", e);
            }
            // Set rehydrated even on error
            useAuth.setState({ rehydrated: true });
            return;
          }
          
          console.log("[AUTH_STORE] Rehydration completed", { 
            hasState: !!state,
            hasUser: !!state?.user,
            hasAccessToken: !!state?.accessToken,
            hasRefreshToken: !!state?.refreshToken
          });
          
          // Use the store's methods to set rehydrated state
          if (state) {
            state.setRehydrated();
            
            // If we have tokens, verify them
            if (state.accessToken || state.refreshToken) {
              setTimeout(async () => {
                console.log("[AUTH_STORE] Verifying tokens after rehydration");
                try {
                  const isValid = await state.ensureValidAccessToken();
                  if (!isValid) {
                    console.log("[AUTH_STORE] Token verification failed during rehydration, clearing auth state");
                    state.logout();
                  }
                } catch (verifyError) {
                  console.error("[AUTH_STORE] Error during token verification:", verifyError);
                  state.logout();
                }
              }, 100);
            }
          } else {
            // Handle empty localStorage case
            console.log("[AUTH_STORE] No stored auth state found, setting rehydrated");
            useAuth.setState({ rehydrated: true });
          }
        };
      },
    }
  )
);
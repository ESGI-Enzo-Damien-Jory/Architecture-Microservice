import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthService } from "./auth-service";
import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshAccessToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await AuthService.login(email, password);

          // Vérifier que l'utilisateur est admin
          if (response.user.role !== "admin") {
            throw new Error(
              "Accès refusé : seuls les administrateurs peuvent se connecter"
            );
          }

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAccessToken: async (): Promise<boolean> => {
        const { refreshToken } = get();

        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await AuthService.refreshToken(refreshToken);

          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });

          return true;
        } catch (error) {
          console.error("Erreur de refresh token:", error);
          get().logout();
          return false;
        }
      },

      checkAuth: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const verifyResponse = await AuthService.verifyToken(accessToken);

          if (verifyResponse.valid && verifyResponse.user) {
            if (verifyResponse.user.role !== "admin") {
              get().logout();
              return;
            }

            set({
              user: verifyResponse.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            const refreshed = await get().refreshAccessToken();
            if (refreshed) {
              await get().checkAuth();
            } else {
              set({ isLoading: false });
            }
          }
        } catch (error) {
          console.error("Erreur de vérification:", error);
          // Essayer de rafraîchir le token
          const refreshed = await get().refreshAccessToken();
          if (!refreshed) {
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

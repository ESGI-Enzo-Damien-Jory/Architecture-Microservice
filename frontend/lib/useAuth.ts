import { useAuth } from "@/lib/authStore";
import { useMemo } from "react";

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { accessToken, refreshToken, user, rehydrated } = useAuth();
  
  return useMemo(() => {
    // Consider authenticated if we have either access token or refresh token
    // The system will automatically refresh the access token when needed
    return rehydrated && (!!accessToken || !!refreshToken) && !!user;
  }, [rehydrated, accessToken, refreshToken, user]);
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  
  return useMemo(() => {
    return user?.role === role;
  }, [user, role]);
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useAuth();
  
  return useMemo(() => {
    return user ? roles.includes(user.role) : false;
  }, [user, roles]);
}

/**
 * Hook to get current user's permissions based on role
 */
export function useUserPermissions() {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return { canCreate: false, canRead: false, canUpdate: false, canDelete: false };
    
    const rolePermissions = {
      client: {
        canCreate: true,    // Can create orders
        canRead: true,      // Can read own orders
        canUpdate: false,   // Cannot update orders
        canDelete: false,   // Cannot delete orders
      },
      cook: {
        canCreate: false,   // Cannot create orders
        canRead: true,      // Can read all orders
        canUpdate: true,    // Can update order status
        canDelete: false,   // Cannot delete orders
      },
      delivery: {
        canCreate: false,   // Cannot create orders
        canRead: true,      // Can read orders
        canUpdate: true,    // Can update delivery status
        canDelete: false,   // Cannot delete orders
      },
      admin: {
        canCreate: true,    // Can do everything
        canRead: true,
        canUpdate: true,
        canDelete: true,
      },
    };

    return rolePermissions[user.role as keyof typeof rolePermissions] || {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
    };
  }, [user]);
}

/**
 * Hook to check authentication loading state
 */
export function useAuthLoading(): boolean {
  const { isLoading, rehydrated } = useAuth();
  
  return useMemo(() => {
    return !rehydrated || isLoading;
  }, [rehydrated, isLoading]);
}

/**
 * Hook to get auth status with detailed information
 */
export function useAuthStatus() {
  const auth = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  
  return useMemo(() => ({
    isAuthenticated,
    isLoading,
    user: auth.user,
    role: auth.user?.role,
    hasToken: !!auth.accessToken,
    rehydrated: auth.rehydrated,
  }), [isAuthenticated, isLoading, auth.user, auth.accessToken, auth.rehydrated]);
}

/**
 * Hook to verify current token and refresh if needed
 */
export function useTokenVerification() {
  const { ensureValidAccessToken } = useAuth();
  
  const verifyAndRefresh = async (): Promise<boolean> => {
    try {
      return await ensureValidAccessToken();
    } catch (error) {
      console.error("[TOKEN_VERIFICATION] Failed to verify/refresh token:", error);
      return false;
    }
  };

  return { verifyAndRefresh };
}
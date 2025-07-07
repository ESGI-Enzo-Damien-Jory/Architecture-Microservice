"use client";
import { useAuth } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { rehydrated, user, accessToken, refreshToken, isLoading, isRefreshing, fetchUserProfile, refreshAccessToken, ensureValidAccessToken } = useAuth();
  const router = useRouter();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for store rehydration
      if (!rehydrated) return;

      console.log("[PROTECTED_ROUTE] Checking authentication", {
        hasToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUser: !!user,
        requiredRole,
        userRole: user?.role,
        isLoading,
        isRefreshing
      });

      // If already refreshing tokens, wait
      if (isRefreshing) {
        console.log("[PROTECTED_ROUTE] Token refresh in progress, waiting...");
        return;
      }

      // Ensure we have a valid access token
      if (accessToken || refreshToken) {
        console.log("[PROTECTED_ROUTE] Verifying token validity");
        try {
          const hasValidToken = await ensureValidAccessToken();
          if (!hasValidToken) {
            console.log("[PROTECTED_ROUTE] No valid tokens available, redirecting to login");
            router.replace("/login");
            return;
          }
        } catch (error) {
          console.error("[PROTECTED_ROUTE] Token verification failed:", error);
          router.replace("/login");
          return;
        }
      } else {
        // No tokens at all
        console.log("[PROTECTED_ROUTE] No tokens available, redirecting to login");
        router.replace("/login");
        return;
      }

      // If we have a token but no user, try to fetch user profile
      if (accessToken && !user && !isLoading) {
        console.log("[PROTECTED_ROUTE] Token found but no user, fetching profile");
        try {
          await fetchUserProfile();
        } catch (error) {
          console.error("[PROTECTED_ROUTE] Failed to fetch user profile:", error);
          // fetchUserProfile will handle token refresh through interceptor
          return;
        }
      }

      // Check role-based access
      if (user && requiredRole && user.role !== requiredRole) {
        console.log(`[PROTECTED_ROUTE] Access denied. Required: ${requiredRole}, User: ${user.role}`);
        router.replace("/unauthorized");
        return;
      }

      setInitialLoad(false);
    };

    checkAuth();
  }, [rehydrated, accessToken, refreshToken, user, isLoading, isRefreshing, requiredRole, router, fetchUserProfile, refreshAccessToken, ensureValidAccessToken]);

  // Show loading spinner while checking authentication
  if (
    !rehydrated || 
    initialLoad ||
    isLoading ||
    isRefreshing ||
    (accessToken && !user) ||
    (requiredRole && user && user.role !== requiredRole && user.role !== undefined)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            {!rehydrated ? "Initializing..." : 
             isLoading ? "Authenticating..." :
             isRefreshing ? "Refreshing session..." :
             (accessToken && !user) ? "Loading profile..." :
             "Checking permissions..."}
          </p>
        </div>
      </div>
    );
  }

  // If we get here, authentication is successful
  return <>{children}</>;
}
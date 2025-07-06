"use client";
import { useAuth } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { rehydrated, user, accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!rehydrated || isLoading) return;
    if (!accessToken) {
      router.replace("/login");
    } else if (requiredRole && user?.role !== requiredRole) {
      router.replace("/unauthorized");
    }
  }, [rehydrated, accessToken, isLoading, user, requiredRole, router]);

  if (
    !rehydrated ||
    isLoading ||
    !accessToken ||
    (requiredRole && user?.role !== requiredRole)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

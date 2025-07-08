"use client";

import { AuthProvider } from "@/contexts/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

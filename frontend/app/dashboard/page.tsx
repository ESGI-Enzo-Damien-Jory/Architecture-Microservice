"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserMenu } from "@/components/auth/UserMenu";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <UserMenu />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Votre contenu dashboard */} 
        </div>
      </div>
    </ProtectedRoute>
  );
}

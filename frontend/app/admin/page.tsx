import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        {/* Contenu admin */}
      </div>
    </ProtectedRoute>
  );
}

"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Accès non autorisé</h1>
      <p className="mb-6 text-center">
        Vous n&apos;,avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Button onClick={() => router.back()}>Retour</Button>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helper";

// POST /api/categories/reorder - Réorganiser les catégories
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    // Seuls les admins peuvent réorganiser
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Seuls les administrateurs peuvent réorganiser les catégories",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: "Format de données invalide" },
        { status: 400 }
      );
    }

    // Mettre à jour les positions en utilisant une transaction
    await prisma.$transaction(
      categories.map(({ id, position }) =>
        prisma.productCategory.update({
          where: { id },
          data: { position },
        })
      )
    );

    return NextResponse.json({ message: "Ordre des catégories mis à jour" });
  } catch (error) {
    console.error("Erreur lors de la réorganisation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

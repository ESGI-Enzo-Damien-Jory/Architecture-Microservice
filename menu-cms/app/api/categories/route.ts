import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helper";

// GET /api/categories - Lister toutes les catégories
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user || !["admin", "cook", "client"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const categories = await prisma.productCategory.findMany({
      orderBy: { position: "asc" },
      include: {
        products:
          user.role === "admin"
            ? true
            : {
                where: { available: true },
              },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    // Seuls les admins peuvent créer
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent créer des catégories" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, position } = body;

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    // Si pas de position spécifiée, mettre à la fin
    let finalPosition = position;
    if (finalPosition === undefined) {
      const lastCategory = await prisma.productCategory.findFirst({
        orderBy: { position: "desc" },
      });
      finalPosition = (lastCategory?.position || 0) + 1;
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        position: finalPosition,
      },
      include: {
        products: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

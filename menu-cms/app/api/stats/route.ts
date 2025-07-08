import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    // Seuls les admins peuvent voir les stats complètes
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les statistiques en parallèle
    const [
      categoriesCount,
      productsCount,
      menusCount,
      availableProductsCount,
      standardMenusCount,
      limitedMenusCount,
    ] = await Promise.all([
      prisma.productCategory.count(),
      prisma.product.count(),
      prisma.menu.count(),
      prisma.product.count({ where: { available: true } }),
      prisma.menu.count({ where: { type: "STANDARD" } }),
      prisma.menu.count({ where: { type: "LIMITED" } }),
    ]);

    const stats = {
      categories: {
        total: categoriesCount,
      },
      products: {
        total: productsCount,
        available: availableProductsCount,
        unavailable: productsCount - availableProductsCount,
      },
      menus: {
        total: menusCount,
        standard: standardMenusCount,
        limited: limitedMenusCount,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/menus - Récupérer tous les menus
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        menuProducts: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Erreur lors de la récupération des menus:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des menus" },
      { status: 500 }
    );
  }
}

// POST /api/menus - Créer un nouveau menu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      priceCents,
      type,
      available,
      imageUrl,
      productIds,
    } = body;

    // Validation
    if (!name || !priceCents) {
      return NextResponse.json(
        { error: "Le nom et le prix sont requis" },
        { status: 400 }
      );
    }

    if (priceCents < 0) {
      return NextResponse.json(
        { error: "Le prix ne peut pas être négatif" },
        { status: 400 }
      );
    }

    // Vérifier que les produits existent
    if (productIds && productIds.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      if (existingProducts.length !== productIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs produits n'existent pas" },
          { status: 400 }
        );
      }
    }

    // Créer le menu avec les relations
    const menu = await prisma.menu.create({
      data: {
        name,
        description,
        priceCents,
        type: type || "STANDARD",
        available: available ?? true,
        imageUrl,
        menuProducts: productIds
          ? {
              create: productIds.map((productId: string) => ({
                productId,
              })),
            }
          : undefined,
      },
      include: {
        menuProducts: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du menu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du menu" },
      { status: 500 }
    );
  }
}

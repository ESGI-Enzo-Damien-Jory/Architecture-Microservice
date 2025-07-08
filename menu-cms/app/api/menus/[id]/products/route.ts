import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/menus/[id]/products - Ajouter un produit à un menu
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "L'ID du produit est requis" },
        { status: 400 }
      );
    }

    // Await params pour Next.js 15+
    const { id } = await params;

    // Vérifier que le menu existe
    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu non trouvé" }, { status: 404 });
    }

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que la relation n'existe pas déjà
    const existingRelation = await prisma.menuProduct.findUnique({
      where: {
        menuId_productId: {
          menuId: id,
          productId,
        },
      },
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: "Ce produit est déjà dans ce menu" },
        { status: 400 }
      );
    }

    // Créer la relation
    const menuProduct = await prisma.menuProduct.create({
      data: {
        menuId: id,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(menuProduct, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout du produit au menu:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du produit au menu" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/menus/[id] - Récupérer un menu par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menu = await prisma.menu.findUnique({
      where: { id: params.id },
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

    if (!menu) {
      return NextResponse.json({ error: "Menu non trouvé" }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Erreur lors de la récupération du menu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du menu" },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[id] - Mettre à jour un menu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Vérifier que le menu existe
    const existingMenu = await prisma.menu.findUnique({
      where: { id: params.id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu non trouvé" }, { status: 404 });
    }

    // Validation
    if (priceCents !== undefined && priceCents < 0) {
      return NextResponse.json(
        { error: "Le prix ne peut pas être négatif" },
        { status: 400 }
      );
    }

    // Vérifier que les produits existent si productIds est fourni
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

    // Préparer les données de mise à jour
    const updateData: PrismaClient['menu']['update']['arguments']['data'] = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priceCents !== undefined) updateData.priceCents = priceCents;
    if (type !== undefined) updateData.type = type;
    if (available !== undefined) updateData.available = available;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Mettre à jour les relations produits si spécifié
    if (productIds !== undefined) {
      // Supprimer les anciennes relations
      await prisma.menuProduct.deleteMany({
        where: { menuId: params.id },
      });

      // Créer les nouvelles relations
      if (productIds.length > 0) {
        updateData.menuProducts = {
          create: productIds.map((productId: string) => ({
            productId,
          })),
        };
      }
    }

    // Mettre à jour le menu
    const menu = await prisma.menu.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du menu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du menu" },
      { status: 500 }
    );
  }
}

// DELETE /api/menus/[id] - Supprimer un menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que le menu existe
    const existingMenu = await prisma.menu.findUnique({
      where: { id: params.id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu non trouvé" }, { status: 404 });
    }

    // Supprimer les relations produits en premier (cascade)
    await prisma.menuProduct.deleteMany({
      where: { menuId: params.id },
    });

    // Supprimer le menu
    await prisma.menu.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Menu supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du menu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du menu" },
      { status: 500 }
    );
  }
}

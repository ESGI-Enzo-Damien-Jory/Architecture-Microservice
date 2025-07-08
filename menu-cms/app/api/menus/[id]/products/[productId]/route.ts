import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE /api/menus/[id]/products/[productId] - Retirer un produit d'un menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    // Await params pour Next.js 15+
    const { id, productId } = await params;

    // Vérifier que la relation existe
    const existingRelation = await prisma.menuProduct.findUnique({
      where: {
        menuId_productId: {
          menuId: id,
          productId: productId,
        },
      },
    });

    if (!existingRelation) {
      return NextResponse.json(
        { error: "Cette relation menu-produit n'existe pas" },
        { status: 404 }
      );
    }

    // Supprimer la relation
    await prisma.menuProduct.delete({
      where: {
        menuId_productId: {
          menuId: id,
          productId: productId,
        },
      },
    });

    return NextResponse.json({ message: "Produit retiré du menu avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du produit du menu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du produit du menu" },
      { status: 500 }
    );
  }
}

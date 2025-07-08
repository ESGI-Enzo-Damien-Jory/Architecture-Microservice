import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        menuProducts: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erreur lors de la récupération du produit:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      priceCents,
      categoryId,
      available,
      imageUrl,
      position,
    } = body;

    // Vérifier que le produit existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Si categoryId est fourni, vérifier qu'elle existe
    if (categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Catégorie introuvable" },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priceCents !== undefined) updateData.priceCents = parseInt(priceCents);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (available !== undefined) updateData.available = available;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (position !== undefined) updateData.position = position;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erreur lors de la modification du produit:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que le produit existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        menuProducts: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si le produit est utilisé dans des menus
    if (existingProduct.menuProducts.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce produit car il est utilisé dans des menus",
          menuCount: existingProduct.menuProducts.length,
        },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du produit:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helper";

// GET /api/categories/[id] - Récupérer une catégorie
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);

    if (!user || !["admin", "cook", "client"].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Await params pour Next.js 15+
    const { id } = await params;

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        products:
          user.role === "admin"
            ? true
            : {
                where: { available: true },
              },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Modifier une catégorie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);

    // Seuls les admins peuvent modifier
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent modifier des catégories" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, position } = body;

    // Await params pour Next.js 15+
    const { id } = await params;

    // Vérifier que la catégorie existe
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(position !== undefined && { position }),
      },
      include: {
        products: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erreur lors de la modification de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Supprimer une catégorie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);

    // Seuls les admins peuvent supprimer
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer des catégories" },
        { status: 403 }
      );
    }

    // Await params pour Next.js 15+
    const { id } = await params;

    // Vérifier que la catégorie existe
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de produits dans cette catégorie
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer une catégorie contenant des produits",
        },
        { status: 400 }
      );
    }

    await prisma.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Catégorie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

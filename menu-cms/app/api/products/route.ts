import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const whereClause = categoryId ? { categoryId } : {};

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!name || !categoryId || priceCents === undefined) {
      return NextResponse.json(
        { error: "Nom, prix et catégorie sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la catégorie existe
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    // Si aucune position n'est spécifiée, mettre à la fin
    let finalPosition = position;
    if (finalPosition === undefined) {
      const lastProduct = await prisma.product.findFirst({
        where: { categoryId },
        orderBy: { position: "desc" },
      });
      finalPosition = lastProduct ? lastProduct.position + 1 : 0;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        priceCents: parseInt(priceCents),
        categoryId,
        available: available ?? true,
        imageUrl,
        position: finalPosition,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du produit:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}


import { Menu, MenuType, CreateMenuData, UpdateMenuData } from "@/types/menu";

export class MenuService {
  private static baseUrl = "/api/menus";

  // Récupérer tous les menus
  static async getMenus(): Promise<Menu[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des menus");
    }
    return response.json();
  }

  // Récupérer un menu par ID
  static async getMenu(id: string): Promise<Menu> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du menu");
    }
    return response.json();
  }

  // Créer un menu
  static async createMenu(data: CreateMenuData): Promise<Menu> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur lors de la création du menu");
    }

    return response.json();
  }

  // Mettre à jour un menu
  static async updateMenu(id: string, data: UpdateMenuData): Promise<Menu> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur lors de la modification du menu");
    }

    return response.json();
  }

  // Supprimer un menu
  static async deleteMenu(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur lors de la suppression du menu");
    }
  }

  // Ajouter un produit à un menu
  static async addProductToMenu(
    menuId: string,
    productId: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${menuId}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur lors de l'ajout du produit au menu");
    }
  }

  // Retirer un produit d'un menu
  static async removeProductFromMenu(
    menuId: string,
    productId: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/${menuId}/products/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        error || "Erreur lors de la suppression du produit du menu"
      );
    }
  }

  // Utilitaires pour les prix
  static priceStringToCents(priceString: string): number {
    const price = parseFloat(priceString);
    return Math.round(price * 100);
  }

  static centsToPriceString(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  static formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)} €`;
  }

  // Utilitaires pour les types de menu
  static getMenuTypeText(type: MenuType): string {
    switch (type) {
      case MenuType.STANDARD:
        return "Standard";
      case MenuType.LIMITED:
        return "Édition limitée";
      default:
        return "Standard";
    }
  }

  static getMenuTypeBadgeVariant(
    type: MenuType
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
      case MenuType.STANDARD:
        return "default";
      case MenuType.LIMITED:
        return "secondary";
      default:
        return "default";
    }
  }

  // Utilitaires pour la disponibilité
  static getAvailabilityText(available: boolean): string {
    return available ? "Disponible" : "Indisponible";
  }

  static getAvailabilityBadgeVariant(
    available: boolean
  ): "default" | "secondary" | "destructive" | "outline" {
    return available ? "default" : "secondary";
  }

  // Calculer les économies d'un menu
  static calculateSavings(menuPrice: number, productsPrices: number[]): number {
    const totalProductsPrice = productsPrices.reduce(
      (sum, price) => sum + price,
      0
    );
    return Math.max(0, totalProductsPrice - menuPrice);
  }

  static formatSavings(savingsCents: number): string {
    if (savingsCents <= 0) return "";
    return `-${this.formatPrice(savingsCents)}`;
  }
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  available: boolean;
  imageUrl?: string;
  position: number;
  categoryId: string;
  category?: ProductCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  position: number;
  products?: Product[];
}

export enum MenuType {
  STANDARD = "STANDARD",
  LIMITED = "LIMITED",
}

export interface MenuProduct {
  id: string;
  menuId: string;
  productId: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  type: MenuType;
  available: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  menuProducts?: MenuProduct[];
}

class MenuApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { useAuth } = await import("../authStore");
    const token = useAuth.getState().accessToken;

    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré, essayer de refresh
        const refreshSuccess = await useAuth.getState().refreshAccessToken();
        if (refreshSuccess) {
          // Retry avec le nouveau token
          const newToken = useAuth.getState().accessToken;
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.status}`);
          }

          return retryResponse.json();
        } else {
          // Rediriger vers login si refresh échoue
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error("Session expirée");
        }
      }

      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }
}

const menuApi = new MenuApiClient();

export class MenuService {
  static async getCategories(): Promise<ProductCategory[]> {
    try {
      return await menuApi.get<ProductCategory[]>("/api/categories");
    } catch (error) {
      console.error("[MENU_SERVICE] Error fetching categories:", error);
      throw error;
    }
  }

  static async getProducts(): Promise<Product[]> {
    try {
      return await menuApi.get<Product[]>("/api/products");
    } catch (error) {
      console.error("[MENU_SERVICE] Error fetching products:", error);
      throw error;
    }
  }

  static async getMenus(): Promise<Menu[]> {
    try {
      return await menuApi.get<Menu[]>("/api/menus");
    } catch (error) {
      console.error("[MENU_SERVICE] Error fetching menus:", error);
      throw error;
    }
  }

  static async getCategory(id: string): Promise<ProductCategory> {
    try {
      return await menuApi.get<ProductCategory>(`/api/categories/${id}`);
    } catch (error) {
      console.error(`[MENU_SERVICE] Error fetching category ${id}:`, error);
      throw error;
    }
  }

  static async getProduct(id: string): Promise<Product> {
    try {
      return await menuApi.get<Product>(`/api/products/${id}`);
    } catch (error) {
      console.error(`[MENU_SERVICE] Error fetching product ${id}:`, error);
      throw error;
    }
  }

  static async getMenu(id: string): Promise<Menu> {
    try {
      return await menuApi.get<Menu>(`/api/menus/${id}`);
    } catch (error) {
      console.error(`[MENU_SERVICE] Error fetching menu ${id}:`, error);
      throw error;
    }
  }

  // Utility methods
  static formatPrice(priceCents: number): string {
    return `${(priceCents / 100).toFixed(2)} €`;
  }

  static getMenuTypeText(type: MenuType): string {
    switch (type) {
      case MenuType.STANDARD:
        return "Menu Standard";
      case MenuType.LIMITED:
        return "Édition Limitée";
      default:
        return "Menu";
    }
  }

  static getMenuTypeBadgeVariant(type: MenuType): "default" | "secondary" {
    switch (type) {
      case MenuType.STANDARD:
        return "default";
      case MenuType.LIMITED:
        return "secondary";
      default:
        return "default";
    }
  }

  static calculateMenuSavings(menu: Menu): number {
    if (!menu.menuProducts) return 0;

    const totalProductsPrice = menu.menuProducts.reduce(
      (sum, mp) => sum + (mp.product?.priceCents || 0),
      0
    );

    return Math.max(0, totalProductsPrice - menu.priceCents);
  }

  static getAvailableCategoriesWithProducts(
    categories: ProductCategory[]
  ): ProductCategory[] {
    return categories
      .filter(
        (category) =>
          category.products &&
          category.products.some((product) => product.available)
      )
      .map((category) => ({
        ...category,
        products: category.products?.filter((product) => product.available),
      }))
      .sort((a, b) => a.position - b.position);
  }

  static getAvailableMenus(menus: Menu[]): Menu[] {
    return menus
      .filter((menu) => menu.available)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // Vérifier si l'utilisateur peut accéder au menu (clients uniquement)
  static canAccessMenu(userRole?: string): boolean {
    return userRole === "client";
  }
}

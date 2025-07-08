// lib/product-service.ts
import { useAuthStore } from "@/lib/auth-store";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
} from "@/types/product";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export class ProductService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Une erreur est survenue");
    }

    return response.json();
  }

  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const searchParams = new URLSearchParams();

    if (filters?.categoryId) {
      searchParams.append("categoryId", filters.categoryId);
    }
    if (filters?.available !== undefined) {
      searchParams.append("available", filters.available.toString());
    }
    if (filters?.search) {
      searchParams.append("search", filters.search);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : "/products";

    return this.request<Product[]>(endpoint);
  }

  static async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  static async createProduct(data: CreateProductRequest): Promise<Product> {
    return this.request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateProduct(
    id: string,
    data: UpdateProductRequest
  ): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Méthodes utilitaires
  static formatPrice(priceCents: number): string {
    return (priceCents / 100).toFixed(2) + " €";
  }

  static centsToPriceString(priceCents: number): string {
    return (priceCents / 100).toFixed(2);
  }

  static priceStringToCents(priceString: string): number {
    const price = parseFloat(priceString);
    return Math.round(price * 100);
  }

  static getAvailabilityText(available: boolean): string {
    return available ? "Disponible" : "Indisponible";
  }

  static getAvailabilityBadgeVariant(
    available: boolean
  ): "default" | "secondary" | "destructive" {
    return available ? "default" : "destructive";
  }
}

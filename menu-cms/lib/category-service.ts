import {
  ProductCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/category";
import { useAuthStore } from "@/lib/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class CategoryService {
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

  // READ - Get all categories
  static async getCategories(): Promise<ProductCategory[]> {
    return this.request<ProductCategory[]>("/categories");
  }

  // READ - Get category by ID
  static async getCategory(id: string): Promise<ProductCategory> {
    return this.request<ProductCategory>(`/categories/${id}`);
  }

  // CREATE - Create new category
  static async createCategory(
    data: CreateCategoryInput
  ): Promise<ProductCategory> {
    return this.request<ProductCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // UPDATE - Update category
  static async updateCategory(
    id: string,
    data: UpdateCategoryInput
  ): Promise<ProductCategory> {
    return this.request<ProductCategory>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE - Delete category
  static async deleteCategory(id: string): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  static async reorderCategories(
    categories: { id: string; position: number }[]
  ): Promise<void> {
    return this.request<void>("/categories/reorder", {
      method: "POST",
      body: JSON.stringify({ categories }),
    });
  }
}

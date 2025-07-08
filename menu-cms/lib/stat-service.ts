import { useAuthStore } from "@/lib/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export interface Stats {
  categories: {
    total: number;
  };
  products: {
    total: number;
    available: number;
    unavailable: number;
  };
  menus: {
    total: number;
    standard: number;
    limited: number;
  };
}

export class StatsService {
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

  static async getStats(): Promise<Stats> {
    return this.request<Stats>("/stats");
  }
}

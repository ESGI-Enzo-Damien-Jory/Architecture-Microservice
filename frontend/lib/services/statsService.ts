// lib/services/statsService.ts
import { apiClient } from "../apiClient";

export interface OrderStats {
  total_orders: number;
  orders_by_status: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
  };
  orders_today: number;
  revenue_today: number;
  revenue_total: number;
  popular_items: Array<{
    item_type: string;
    item_id: string;
    name?: string;
    total_quantity: number;
  }>;
  avg_order_value: number;
  orders_this_week: number;
  orders_this_month: number;
}

export interface UserProfile {
  orders_count: number;
  total_spent: number;
  favorite_items: Array<{
    item_type: string;
    item_id: string;
    name?: string;
    order_count: number;
  }>;
  last_order_date?: string;
}

class StatsApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5000";
  }

  private async request<T>(endpoint: string): Promise<T> {
    const { useAuth } = await import("../authStore");
    const token = useAuth.getState().accessToken;

    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
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

  async getOrderStats(): Promise<OrderStats> {
    return this.request<OrderStats>("/api/admin/stats");
  }

  async getUserOrders() {
    return this.request<{ orders: any[]; count: number }>("/api/orders");
  }
}

const statsApi = new StatsApiClient();

export class StatsService {
  // Récupérer les stats générales (admin)
  static async getOrderStats(): Promise<OrderStats> {
    try {
      return await statsApi.getOrderStats();
    } catch (error) {
      console.error("[STATS_SERVICE] Error fetching order stats:", error);
      throw error;
    }
  }

  // Récupérer les commandes de l'utilisateur
  static async getUserOrders() {
    try {
      return await statsApi.getUserOrders();
    } catch (error) {
      console.error("[STATS_SERVICE] Error fetching user orders:", error);
      throw error;
    }
  }

  // Calculer les stats utilisateur à partir de ses commandes
  static calculateUserStats(orders: any[]): {
    ordersThisMonth: number;
    totalSpent: number;
    averageOrderValue: number;
  } {
    console.log("[STATS] Calculating user stats from orders:", orders);

    if (!orders || !Array.isArray(orders)) {
      console.log("[STATS] No orders array provided");
      return { ordersThisMonth: 0, totalSpent: 0, averageOrderValue: 0 };
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Commandes de ce mois (excluant les annulées)
    const ordersThisMonth = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= thisMonth && order.status !== "cancelled";
    }).length;

    // Toutes les commandes non-annulées pour le calcul des dépenses
    const paidOrders = orders.filter((order) => order.status !== "cancelled");

    console.log("[STATS] Paid orders:", paidOrders);

    const totalSpent = paidOrders.reduce((sum, order) => {
      const price = order.total_price_cents || 0;
      console.log(
        `[STATS] Order ${order.id}: ${price} cents (field exists: ${
          order.total_price_cents !== undefined
        })`
      );
      return sum + price;
    }, 0);

    const averageOrderValue =
      paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;

    console.log("[STATS] Final stats:", {
      ordersThisMonth,
      totalSpent,
      averageOrderValue,
      paidOrdersCount: paidOrders.length,
    });

    return {
      ordersThisMonth,
      totalSpent,
      averageOrderValue,
    };
  }

  // Stats pour les cuisiniers
  static calculateCookStats(orders: any[]): {
    ordersToday: number;
    inProgress: number;
    averageTime: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = orders.filter(
      (order) => new Date(order.created_at) >= today
    ).length;

    const inProgress = orders.filter(
      (order) => order.status === "preparing" || order.status === "confirmed"
    ).length;

    // Simulation du temps moyen (en vrai il faudrait calculer depuis les timestamps)
    const averageTime = "18min";

    return {
      ordersToday,
      inProgress,
      averageTime,
    };
  }

  // Stats pour les livreurs
  static calculateDeliveryStats(orders: any[]): {
    deliveriesToday: number;
    inProgress: number;
    averageTime: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deliveriesToday = orders.filter(
      (order) =>
        new Date(order.created_at) >= today && order.status === "delivered"
    ).length;

    const inProgress = orders.filter(
      (order) => order.status === "ready" || order.status === "preparing"
    ).length;

    const averageTime = "25min";

    return {
      deliveriesToday,
      inProgress,
      averageTime,
    };
  }

  // Formatage des prix
  static formatPrice(priceCents: number): string {
    return `${(priceCents / 100).toFixed(2)}€`;
  }

  // Formatage des nombres
  static formatNumber(num: number): string {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  }
}

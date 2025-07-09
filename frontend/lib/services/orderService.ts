import { useAuth } from "@/lib/authStore";

const BASE_URL =
  process.env.NEXT_PUBLIC_ORDER_SERVICE_URL;


export type OrderItemType = "product" | "menu";

export interface OrderItem {
  type: OrderItemType;
  id: string;
  quantity: number;
  price?: number;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  notes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  notes?: string;
  totalPriceCents: number;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    type: OrderItemType;
    refId: string;
    quantity: number;
    unitPriceCents: number;
  }[];
}

class OrderApiClient {
  private base = BASE_URL;

  private async headers() {
    const token = useAuth.getState().accessToken;
    if (!token) throw new Error("Token manquant");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async refreshAndRetry<T>(url: string, opt: RequestInit) {
    const ok = await useAuth.getState().refreshAccessToken();
    if (!ok) {
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expirée");
    }
    const res = await fetch(url, { ...opt, headers: await this.headers() });
    if (!res.ok) throw new Error(`API: ${res.status}`);
    return res.json() as Promise<T>;
  }

  private async request<T>(path: string, opt: RequestInit): Promise<T> {
    const url = `${this.base}/api${path}`;
    const res = await fetch(url, { ...opt, headers: await this.headers() });
    if (res.status === 401) return this.refreshAndRetry<T>(url, opt);
    if (!res.ok) throw new Error(`API: ${res.status}`);
    return res.json() as Promise<T>;
  }

  get<T>(p: string) {
    return this.request<T>(p, { method: "GET" });
  }

  post<T>(p: string, body: unknown) {
    return this.request<T>(p, { method: "POST", body: JSON.stringify(body) });
  }

  patch<T>(p: string, body: unknown) {
    return this.request<T>(p, { method: "PATCH", body: JSON.stringify(body) });
  }
}

const api = new OrderApiClient();

export class OrderService {
  static createOrder(payload: CreateOrderPayload) {
    return api.post<{ order_id: string; status: OrderStatus }>(
      "/orders",
      payload
    );
  }

  static getOrders() {
    return api.get<{ orders: Order[] }>("/orders").then((r) => r.orders);
  }

  static getOrderById(id: string) {
    return api.get<Order>(`/orders/${id}`);
  }

  static updateStatus(id: string, status: OrderStatus) {
    return api.patch(`/orders/${id}/status`, { status });
  }
}

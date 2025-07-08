import { AuthResponse, User } from "@/types/auth";

const BASE_URL = typeof window === 'undefined'
  ? process.env.AUTH_SERVICE_URL     // runtime Docker
  : process.env.NEXT_PUBLIC_AUTH_SERVICE_URL; // client-bundle

export class AuthService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || "Une erreur est survenue");
    }
    return response.json();
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(
    email: string,
    password: string,
    role: string
  ): Promise<User> {
    return this.request<User>("/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    try {
      return this.request<Pick<AuthResponse, "accessToken" | "refreshToken">>(
        "/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async verifyToken(
    token: string
  ): Promise<{ valid: boolean; user?: User }> {
    try {
      return this.request<{ valid: boolean; user?: User }>("/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      return { valid: false };
    }
  }

  static async getMe(token: string): Promise<{ user: User }> {
    return this.request<{ user: User }>("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }
}

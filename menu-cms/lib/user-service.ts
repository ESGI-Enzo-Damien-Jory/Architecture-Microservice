// lib/user-service.ts - Service pour interagir avec ton API d'auth
import {
  User,
  Role,
  CreateUserData,
  UpdateUserData,
  AuthResponse,
} from "@/types/user";

export class UserService {
  // Récupérer le token d'accès depuis le localStorage
  private static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  // Headers avec authentification
  private static getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Login
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur de connexion");
    }

    const data = await response.json();

    // Stocker les tokens
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  }

  // Logout
  static async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refreshToken");

      // Révoquer le refresh token côté serveur si possible
      if (refreshToken) {
        try {
          await fetch(`${process.env.AUTH_SERVICE_URL}/logout`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          console.warn("Erreur lors de la révocation du token:", error);
        }
      }

      // Nettoyer le localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  // Créer un utilisateur (register via l'API)
  static async createUser(data: CreateUserData): Promise<User> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/register`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur lors de la création de l'utilisateur");
    }

    return response.json();
  }

  // Récupérer tous les utilisateurs (nécessite une API étendue)
  static async getUsers(): Promise<User[]> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/users`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "Vous n'avez pas les permissions pour gérer les utilisateurs"
        );
      }
      throw new Error("Erreur lors de la récupération des utilisateurs");
    }

    return response.json();
  }

  // Récupérer un utilisateur par ID
  static async getUser(id: string): Promise<User> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de l'utilisateur");
    }

    return response.json();
  }

  // Mettre à jour un utilisateur
  static async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/users/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        error || "Erreur lors de la modification de l'utilisateur"
      );
    }

    return response.json();
  }

  // Supprimer un utilisateur
  static async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/users/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        error || "Erreur lors de la suppression de l'utilisateur"
      );
    }
  }

  // Récupérer l'utilisateur connecté
  static async getCurrentUser(): Promise<User> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération des informations utilisateur"
      );
    }

    const data = await response.json();
    return data.user;
  }

  // Refresh token
  static async refreshToken(): Promise<AuthResponse> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (!refreshToken) {
      throw new Error("Aucun refresh token disponible");
    }

    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Token expiré, rediriger vers login
      this.logout();
      throw new Error("Session expirée, veuillez vous reconnecter");
    }

    const data = await response.json();

    // Mettre à jour les tokens
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    return data;
  }

  // Vérifier si l'utilisateur est connecté
  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!this.getAccessToken();
  }

  // Récupérer l'utilisateur depuis le localStorage
  static getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Révoquer toutes les sessions d'un utilisateur
  static async revokeAllSessions(userId: string): Promise<void> {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/users/${userId}/revoke-sessions`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la révocation des sessions");
    }
  }

  // Changer le mot de passe
  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/change-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erreur lors du changement de mot de passe");
    }
  }

  // Utilitaires pour les rôles
  static getRoleLabel(role: Role): string {
    const labels = {
      [Role.admin]: "Administrateur",
      [Role.cook]: "Cuisinier",
      [Role.delivery]: "Livreur",
      [Role.client]: "Client",
    };
    return labels[role] || role;
  }

  static getRoleBadgeVariant(
    role: Role
  ): "default" | "secondary" | "destructive" | "outline" {
    const variants = {
      [Role.admin]: "destructive" as const,
      [Role.cook]: "default" as const,
      [Role.delivery]: "secondary" as const,
      [Role.client]: "outline" as const,
    };
    return variants[role] || "default";
  }

  static canManageUsers(userRole: Role): boolean {
    return userRole === Role.admin;
  }

  static canEditUser(currentUserRole: Role, targetUserRole: Role): boolean {
    if (currentUserRole !== Role.admin || targetUserRole === Role.admin) return false;
    return true; // Les admins peuvent tout faire
  }
}

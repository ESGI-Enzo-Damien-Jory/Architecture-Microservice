export enum Role {
  client = "client",
  cook = "cook",
  delivery = "delivery",
  admin = "admin",
}

export interface User {
  id: string;
  email: string;
  role: Role;
  refreshTokens?: RefreshToken[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  user?: User;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: Role;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const ROLE_LABELS = {
  [Role.admin]: "Administrateur",
  [Role.cook]: "Cuisinier",
  [Role.delivery]: "Livreur",
  [Role.client]: "Client",
};

export const ROLE_DESCRIPTIONS = {
  [Role.admin]: "Accès complet à toutes les fonctionnalités",
  [Role.cook]: "Gestion des commandes et production",
  [Role.delivery]: "Gestion des livraisons",
  [Role.client]: "Passation de commandes",
};

export const ROLE_COLORS = {
  [Role.admin]: "destructive",
  [Role.cook]: "default",
  [Role.delivery]: "secondary",
  [Role.client]: "outline",
} as const;

export const PERMISSIONS = {
  // Gestion des utilisateurs (admin seulement)
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",

  // Gestion des produits/menus
  PRODUCTS_MANAGE: "products:manage",
  MENUS_MANAGE: "menus:manage",
  CATEGORIES_MANAGE: "categories:manage",

  // Gestion des commandes
  ORDERS_VIEW_ALL: "orders:view:all",
  ORDERS_MANAGE: "orders:manage",
  ORDERS_VIEW_OWN: "orders:view:own",
};

export const getRolePermissions = (role: Role): string[] => {
  switch (role) {
    case Role.admin:
      return Object.values(PERMISSIONS);
    case Role.cook:
      return [
        PERMISSIONS.ORDERS_VIEW_ALL,
        PERMISSIONS.ORDERS_MANAGE,
        PERMISSIONS.PRODUCTS_MANAGE,
      ];
    case Role.delivery:
      return [PERMISSIONS.ORDERS_VIEW_ALL, PERMISSIONS.ORDERS_MANAGE];
    case Role.client:
      return [PERMISSIONS.ORDERS_VIEW_OWN];
    default:
      return [];
  }
};

export const hasPermission = (userRole: Role, permission: string): boolean => {
  return getRolePermissions(userRole).includes(permission);
};

export enum MenuType {
  STANDARD = "STANDARD",
  LIMITED = "LIMITED",
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  type: MenuType;
  available: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  menuProducts?: MenuProduct[];
}

export interface MenuProduct {
  id: string;
  menuId: string;
  productId: string;
  menu?: Menu;
  product?: Product;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuData {
  name: string;
  description?: string;
  priceCents: number;
  type?: MenuType;
  available?: boolean;
  imageUrl?: string;
  productIds?: string[];
}

export interface UpdateMenuData {
  name?: string;
  description?: string;
  priceCents?: number;
  type?: MenuType;
  available?: boolean;
  imageUrl?: string;
  productIds?: string[];
}

// Import du type Product depuis le fichier product
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
  createdAt: Date;
  updatedAt: Date;
  menuProducts?: MenuProduct[];
}

export interface ProductCategory {
  id: string;
  name: string;
  position: number;
  products?: Product[];
}

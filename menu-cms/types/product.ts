// types/product.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  available: boolean;
  imageUrl?: string;
  position: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    position: number;
  };
  menuProducts?: {
    id: string;
    menuId: string;
    menu: {
      id: string;
      name: string;
      type: string;
    };
  }[];
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  priceCents: number;
  categoryId: string;
  available?: boolean;
  imageUrl?: string;
  position?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  priceCents?: number;
  categoryId?: string;
  available?: boolean;
  imageUrl?: string;
  position?: number;
}

export interface ProductFilters {
  categoryId?: string;
  available?: boolean;
  search?: string;
}

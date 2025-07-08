export interface ProductCategory {
  id: string;
  name: string;
  position: number;
  products?: Product[];
}

export interface CreateCategoryInput {
  name: string;
  position?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  position?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  available: boolean;
  imageUrl?: string;
  position: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

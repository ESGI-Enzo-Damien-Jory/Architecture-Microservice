import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, Menu } from "@/lib/services/menuService";

export interface CartItem {
  type: "product" | "menu";
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  menuProducts?: Product[];
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;

  // Actions
  addItem: (
    item: Product | Menu,
    type: "product" | "menu",
    quantity?: number
  ) => void;
  removeItem: (type: string, id: string) => void;
  updateQuantity: (type: string, id: string, quantity: number) => void;
  clearCart: () => void;

  // Getters
  getTotal: () => number;
  getItemCount: () => number;
  getItem: (type: string, id: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (
        item: Product | Menu,
        type: "product" | "menu",
        quantity = 1
      ) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (cartItem) => cartItem.type === type && cartItem.id === item.id
          );

          const cartItem: CartItem = {
            type,
            id: item.id,
            name: item.name,
            price: item.priceCents,
            quantity,
            image: item.imageUrl,
            ...(type === "menu" && "menuProducts" in item
              ? {
                  menuProducts: item.menuProducts
                    ?.map((mp) => mp.product)
                    .filter(Boolean) as Product[],
                }
              : {}),
          };

          if (existingIndex >= 0) {
            // Update existing item
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          } else {
            // Add new item
            return { items: [...state.items, cartItem] };
          }
        });
      },

      removeItem: (type: string, id: string) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.type === type && item.id === id)
          ),
        }));
      },

      updateQuantity: (type: string, id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(type, id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.type === type && item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getItem: (type: string, id: string) => {
        const { items } = get();
        return items.find((item) => item.type === type && item.id === id);
      },
    }),
    {
      name: "cart-storage",
      // Ne persister que les items, pas les states temporaires
      partialize: (state) => ({ items: state.items }),
    }
  )
);

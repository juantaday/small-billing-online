/**
 * Feature: Add to Cart
 * Funcionalidad para agregar presentaciones al carrito
 */

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { ProductWithRelationsDto, PresentationDto } from '@small-billing/shared';

const CART_STORAGE_KEY = 'small-billing.cart.v1';

export interface CartItem {
  id: string;
  productId: string;
  presentationId: string;
  productName: string;
  presentationName: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
}

interface AddToCartPayload {
  product: ProductWithRelationsDto;
  presentation: PresentationDto;
  imageUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (payload: AddToCartPayload) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function parseStoredCart(value: string | null): CartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) =>
      typeof item?.id === 'string' &&
      typeof item?.productId === 'string' &&
      typeof item?.presentationId === 'string' &&
      typeof item?.productName === 'string' &&
      typeof item?.presentationName === 'string' &&
      typeof item?.unitPrice === 'number' &&
      typeof item?.quantity === 'number'
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = ({ product, presentation, imageUrl }: AddToCartPayload) => {
    const cartItemId = `${product.id}:${presentation.id}`;

    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === cartItemId);

      if (existingItem) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          presentationId: presentation.id,
          productName: product.name,
          presentationName: presentation.presentationType?.name || 'Presentación',
          unitPrice: Number(presentation.salePrice || 0),
          quantity: 1,
          imageUrl,
        },
      ];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

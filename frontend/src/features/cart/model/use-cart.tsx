/**
 * Feature: Add to Cart
 * Funcionalidad para agregar presentaciones al carrito
 */

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { ProductWithRelationsDto, PresentationDto } from '@small-billing/shared';

const CART_STORAGE_KEY = 'small-billing.cart.v1';

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export interface CartItemTax {
  taxValueCode: string;
  taxValueDescription: string;
  percentage: number;
  appliedRate: number;
  base: number;
  valor: number;
}

export interface CartItem {
  id: string;
  productId: string;
  presentationId: string;
  productName: string;
  presentationName: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  taxes: CartItemTax[];
  baseWithoutTax: number;
  productTaxes: ProductWithRelationsDto['productTaxes'];
}

// Resumen de un tipo de impuesto agrupado para mostrar en el resumen del carrito
export interface CartTaxSummary {
  taxValueCode: string;
  taxValueDescription: string;
  percentage: number;
  total: number;
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
  subtotalSinIva: number;       // total sin ningún impuesto
  taxSummary: CartTaxSummary[]; // impuestos agrupados por tipo
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function calculateTaxes(
  totalPrice: number,
  productTaxes: ProductWithRelationsDto['productTaxes']
): { taxes: CartItemTax[]; baseWithoutTax: number } {

  if (!productTaxes || productTaxes.length === 0) {
    return { taxes: [], baseWithoutTax: round2(totalPrice) };
  }

  let result = round2(totalPrice);
  const taxes: CartItemTax[] = [];

  for (const tax of productTaxes.filter(t => t.isDefaultVat)) {
    const base = round2(result / (tax.appliedRate + 1));
    const valor = round2(result - base);

    taxes.push({
      taxValueCode: tax.taxValueCode,
      taxValueDescription: tax.taxValueDescription,
      percentage: tax.percentage,
      appliedRate: tax.appliedRate,
      base,
      valor,
    });

    result = base;
  }
  return { taxes, baseWithoutTax: result };
}

// Agrupa los impuestos de todos los items por taxValueCode
function buildTaxSummary(items: CartItem[]): CartTaxSummary[] {
  const taxMap = new Map<string, CartTaxSummary>();

  for (const item of items) {
    for (const tax of item.taxes) {
      const existing = taxMap.get(tax.taxValueCode);
      if (existing) {
        existing.total = round2(existing.total + tax.valor);
      } else {
        taxMap.set(tax.taxValueCode, {
          taxValueCode: tax.taxValueCode,
          taxValueDescription: tax.taxValueDescription,
          percentage: tax.percentage,
          total: tax.valor,
        });
      }
    }
  }

  return Array.from(taxMap.values());
}

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
    const unitPrice = round2(Number(presentation.salePrice || 0));

    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === cartItemId);

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const newTotal = round2(unitPrice * newQuantity);
        const { taxes, baseWithoutTax } = calculateTaxes(newTotal, product.productTaxes);

        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: newQuantity, taxes, baseWithoutTax, productTaxes: product.productTaxes }
            : item
        );
      }

      const { taxes, baseWithoutTax } = calculateTaxes(unitPrice, product.productTaxes);

      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          presentationId: presentation.id,
          productName: product.name,
          presentationName: presentation.presentationType?.name || 'Presentación',
          unitPrice,
          quantity: 1,
          imageUrl,
          taxes,
          baseWithoutTax,
          productTaxes: product.productTaxes,
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
      prev.map((item) => {
        if (item.id !== cartItemId) return item;

        const newTotal = round2(item.unitPrice * quantity);
        const { taxes, baseWithoutTax } = calculateTaxes(newTotal, item.productTaxes);

        return { ...item, quantity, taxes, baseWithoutTax };
      })
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce(
    (sum, item) => round2(sum + round2(item.unitPrice * item.quantity)),
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalSinIva = items.reduce(
    (sum, item) => round2(sum + item.baseWithoutTax),
    0
  );

  const taxSummary = buildTaxSummary(items);

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
        subtotalSinIva,
        taxSummary,
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
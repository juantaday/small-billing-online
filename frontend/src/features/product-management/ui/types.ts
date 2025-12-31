// Tipos específicos del wizard de productos
// Reutilizamos tipos de @small-billing/shared cuando sea posible

export interface ProductFormData {
  productId?: string;
  name: string;
  shortDescription: string;
  slug: string;
  categoryId: string;
  featured: boolean;
  selectedTaxes: ProductTaxSelection[];
  presentations: PresentationFormData[];
  defaultPurchasePresentationIndex: number | null;
  defaultSalePresentationIndex: number | null;
  defaultPurchaseIndex: number | null;  
  defaultSaleIndex: number | null;  
}

export interface ProductTaxSelection {
  taxValueCode: string;
  taxValueDescription: string;
  percentage: number;
  customPercent?: number;
  isDefaultVat: boolean;
}

export interface PresentationFormData {
  name: string;
  quantity: number;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
}

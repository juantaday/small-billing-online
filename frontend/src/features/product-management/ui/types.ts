// Tipos específicos del wizard de productos
// Reutilizamos tipos de @small-billing/shared cuando sea posible

import { ProductTaxSelectionDto } from '@small-billing/shared';

export interface ProductFormData {
  productId?: string;
  name: string;
  shortDescription: string;
  slug: string;
  categoryId: string;
  featured: boolean;
  selectedTaxes: ProductTaxSelectionDto[];
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
  appliedRate?: number;
  isDefaultVat: boolean;
}

export interface PresentationFormData {
  id?: string;
  presentationTypeId: string;
  presentationTypeName?: string;
  presentationInferenceId?: string | null;
  presentationInferenceTypeId?: string | null;
  baseUnitsQuantity?: number;
  quantity: number;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  active?: boolean;
}

export type InventoryMovementType = 'IN' | 'OUT';

export type InventoryMovementSource =
  | 'QUICK_ADD'
  | 'SALE'
  | 'PURCHASE_INVOICE'
  | 'ADJUSTMENT';

export interface InventoryMovementDto {
  id: string;
  productId: string;
  userId?: string | null;
  presentationId?: string | null;
  movementType: InventoryMovementType;
  source: InventoryMovementSource;
  quantityInPresentation: number;
  factorToBase: number;
  deltaBaseUnits: number;
  stockBefore: number;
  stockAfter: number;
  note?: string | null;
  createdAt: Date;
}

export interface QuickAddInventoryDto {
  presentationId: string;
  quantity: number;
  userId?: string;
  source?: Extract<InventoryMovementSource, 'QUICK_ADD' | 'PURCHASE_INVOICE' | 'ADJUSTMENT'>;
  note?: string;
}

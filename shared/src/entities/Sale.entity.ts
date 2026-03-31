/**
 * DTOs para entidad Sale (Venta/Factura)
 */

import { SaleStatus, PaymentMethodType, CardType } from '../enums';

// ===== Sale Detail =====
export interface SaleDetailDto {
  id: string;
  saleId: string;
  presentationId: string;
  productName: string;
  presentationName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
}

export interface CreateSaleDetailDto {
  presentationId: string;
  quantity: number;
  unitPrice: number;
}

// ===== Sale Product Tax =====
export interface SaleProductTaxDto {
  id: string;
  saleId: string;
  presentationId: string;
  taxCode: string;
  taxDescription: string;
  taxPercentage: number;
  taxableAmount: number;
  taxAmount: number;
  createdAt: Date;
}

export interface CreateSaleProductTaxDto {
  presentationId: string;
  taxCode: string;
  taxDescription: string;
  taxPercentage: number;
  taxableAmount: number;
  taxAmount: number;
}

// ===== Sale Payment =====
export interface SalePaymentDto {
  id: string;
  saleId: string;
  paymentType: PaymentMethodType;
  amount: number;
  // CASH
  cashReceived?: number;
  change?: number;
  // TRANSFER
  bankId?: string;
  bankAccount?: string;
  transferReference?: string;
  // CARD
  cardType?: CardType;
  voucherNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface CreateSalePaymentDto {
  paymentType: PaymentMethodType;
  amount: number;
  // CASH
  cashReceived?: number;
  change?: number;
  // TRANSFER
  bankId?: string;
  bankAccount?: string;
  transferReference?: string;
  // CARD
  cardType?: CardType;
  voucherNumber?: string;
  notes?: string;
}

// ===== Sale (Main) =====
export interface SaleDto {
  id: string;
  invoiceNumber: string;
  customerId: string;
  userId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  discount: number;
  status: SaleStatus;
  saleDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSaleDto {
  customerId: string;
  userId: string;
  details: CreateSaleDetailDto[];
  payments: CreateSalePaymentDto[];
  discount?: number;
  notes?: string;
}

export interface UpdateSaleDto {
  status?: SaleStatus;
  notes?: string;
}

// DTO con relaciones pobladas
export interface SaleWithRelationsDto extends SaleDto {
  details?: SaleDetailDto[];
  payments?: SalePaymentDto[];
  productTaxes?: SaleProductTaxDto[];
}

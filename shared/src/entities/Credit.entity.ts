/**
 * DTOs para entidad Credit (Créditos/Cuentas por Cobrar)
 */

import { PaymentMethodType, CardType } from '../enums';

// ===== Credit Payment (Abonos) =====
export interface CreditPaymentDto {
  id: string;
  creditId: string;
  amount: number;
  paymentType: PaymentMethodType;
  paymentDate: Date;
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

export interface CreateCreditPaymentDto {
  creditId: string;
  amount: number;
  paymentType: PaymentMethodType;
  // TRANSFER
  bankId?: string;
  bankAccount?: string;
  transferReference?: string;
  // CARD
  cardType?: CardType;
  voucherNumber?: string;
  notes?: string;
}

// ===== Credit =====
export interface CreditDto {
  id: string;
  saleId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate?: Date;
  paidDate?: Date;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditDto {
  saleId: string;
  totalAmount: number;
  dueDate?: Date;
}

export interface UpdateCreditDto {
  dueDate?: Date;
}

// DTO con relaciones
export interface CreditWithRelationsDto extends CreditDto {
  payments?: CreditPaymentDto[];
}

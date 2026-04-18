/**
 * DTOs para entidad Sale (Venta/Factura)
 */

import { SaleStatus, PaymentMethodType, CardType } from '../enums';

export enum LogoSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

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
  terminalId?: number;
  documentTypeId: number;
  deviceId?: string;
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
  customerId?: string;
  customerRucCi?: string;
  userId: string;
  terminalId?: number;
  terminalCode?: string;
  deviceToken?: string; // Token del dispositivo que origina la venta
  documentTypeId?: number; // Tipo de documento (por defecto 1 = Factura)
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

// ===== Device (POS Equipment) =====
export interface DeviceDto {
  id: string;
  tokenLast4: string;
  tokenVersion: number;
  status: 'PENDING' | 'PAIRED' | 'REVOKED' | 'RETIRED';
  pairingCode?: string | null;
  pairingCodeExpiresAt?: Date | null;
  fingerprintSignal?: string | null;
  riskScore: number;
  deviceName?: string;
  ipAddress?: string;
  terminalId?: number;
  active: boolean;
  tokenIssuedAt: Date;
  tokenRotatedAt?: Date | null;
  tokenRevokedAt?: Date | null;
  revokeReason?: string | null;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceDto {
  deviceToken: string;
  deviceName?: string;
  ipAddress?: string;
}

export interface RegisterDeviceDto {
  deviceToken: string;
  deviceName?: string;
  fingerprintSignal?: string;
  riskSignals?: Record<string, unknown>;
}

export interface DeviceEnrollmentRequestDto {
  deviceName?: string;
  fingerprintSignal?: string;
  riskSignals?: Record<string, unknown>;
}

export interface DeviceEnrollmentResponseDto {
  id: string;
  deviceToken: string;
  tokenLast4: string;
  pairingCode: string;
  pairingCodeExpiresAt: Date;
  status: 'PENDING' | 'PAIRED' | 'REVOKED' | 'RETIRED';
}

export interface BindTerminalByPairingDto {
  terminalId: number;
  pairingCode: string;
}

export interface RotateDeviceTokenResponseDto {
  id: string;
  tokenVersion: number;
  tokenRotatedAt: Date;
  deviceToken: string;
  tokenLast4: string;
}

export interface RevokeDeviceDto {
  reason?: string;
}

// ===== Terminal Settings =====
export interface TerminalSettingsDto {
  id: string;
  terminalId: number;
  documentTypeId: number;
  namePrinter?: string;
  characterLine?: number;
  withLogo?: LogoSize;
  maxItems: number;
  linesPerTransaction?: number;
  lastSequential: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTerminalSettingsDto {
  terminalId: number;
  documentTypeId: number;
  namePrinter?: string;
  characterLine?: number;
  withLogo?: LogoSize;
  maxItems?: number;
  linesPerTransaction?: number;
  lastSequential?: number;
}

export interface UpdateTerminalSettingsDto {
  namePrinter?: string;
  characterLine?: number;
  withLogo?: LogoSize;
  maxItems?: number;
  linesPerTransaction?: number;
  lastSequential?: number;
  enabled?: boolean;
}


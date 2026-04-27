/**
 * Estados de una venta/factura
 */
export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  CREDIT = 'CREDIT',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
}

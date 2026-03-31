/**
 * Estados de una venta/factura
 */
export enum SaleStatus {
  /** Venta pendiente (en proceso) */
  PENDING = 'PENDING',
  /** Venta completada y pagada */
  COMPLETED = 'COMPLETED',
  /** Venta cancelada/anulada */
  CANCELLED = 'CANCELLED',
  /** Venta a crédito (pendiente de pago) */
  CREDIT = 'CREDIT',
  /** Crédito pagado parcialmente */
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
}

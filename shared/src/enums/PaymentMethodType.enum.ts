/**
 * Tipos de métodos de pago disponibles
 */
export enum PaymentMethodType {
  /** Pago en efectivo */
  CASH = 'CASH',
  /** Transferencia bancaria */
  TRANSFER = 'TRANSFER',
  /** Tarjeta de débito o crédito */
  CARD = 'CARD',
  /** Venta a crédito (pago diferido) */
  CREDIT = 'CREDIT',
}

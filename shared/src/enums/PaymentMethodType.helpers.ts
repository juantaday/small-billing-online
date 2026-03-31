import { PaymentMethodType } from './PaymentMethodType.enum';

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.CASH]: 'Efectivo',
  [PaymentMethodType.TRANSFER]: 'Transferencia',
  [PaymentMethodType.CARD]: 'Tarjeta',
  [PaymentMethodType.CREDIT]: 'Crédito',
};

export function getPaymentMethodTypeLabel(type: PaymentMethodType): string {
  return PAYMENT_METHOD_TYPE_LABELS[type] || type;
}

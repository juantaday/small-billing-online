import { PaymentMethodType } from './PaymentMethodType.enum';

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.CASH]: 'Efectivo',
  [PaymentMethodType.TRANSFER]: 'Transferencia',
  [PaymentMethodType.CARD]: 'Tarjeta',
  [PaymentMethodType.CREDIT]: 'Crédito',
};

export const PAYMENT_METHOD_TYPE_OPTIONS: PaymentMethodType[] = [
  PaymentMethodType.CASH,
  PaymentMethodType.TRANSFER,
  PaymentMethodType.CARD,
  PaymentMethodType.CREDIT,
];

export function getPaymentMethodTypeLabel(type: PaymentMethodType): string {
  return PAYMENT_METHOD_TYPE_LABELS[type] || type;
}

export function getPaymentMethodTypeOptions() {
  return PAYMENT_METHOD_TYPE_OPTIONS.map((value) => ({
    value,
    label: getPaymentMethodTypeLabel(value),
  }));
}

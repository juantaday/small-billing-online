import { SaleStatus } from './SaleStatus.enum';

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  [SaleStatus.PENDING]: 'Pendiente',
  [SaleStatus.COMPLETED]: 'Completada',
  [SaleStatus.CANCELLED]: 'Cancelada',
  [SaleStatus.CREDIT]: 'A Crédito',
  [SaleStatus.PARTIAL_PAYMENT]: 'Pago Parcial',
};

export function getSaleStatusLabel(status: SaleStatus): string {
  return SALE_STATUS_LABELS[status] || status;
}

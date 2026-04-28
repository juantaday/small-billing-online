import { VoucherStatus } from '../enums/voucher-status.enum';

export interface VoucherStatusDto {
  accessKey: string;
  status: VoucherStatus;
  updatedAt: string;
  reason?: string;
}

import { VoucherStatus } from '../enums/voucher-status.enum';

export interface AuthorizationResponseDto {
  accessKey: string;
  status: VoucherStatus;
  authorizationNumber?: string;
  authorizationDate?: string;
}

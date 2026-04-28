import { VoucherStatus } from '../enums/voucher-status.enum';
import { ElectronicDocumentEntity } from './electronic-document.entity';

export class TransmissionAttemptEntity {
  id!: string;
  documentId!: string;
  status!: VoucherStatus;
  attemptNumber!: number;
  requestPayload?: string;
  responsePayload?: string;
  errorMessage?: string;
  startedAt!: Date;
  finishedAt?: Date;

  document?: ElectronicDocumentEntity;
}

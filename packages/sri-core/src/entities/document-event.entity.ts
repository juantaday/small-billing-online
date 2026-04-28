import { VoucherStatus } from '../enums/voucher-status.enum';
import { ElectronicDocumentEntity } from './electronic-document.entity';

export class DocumentEventEntity {
  id!: string;
  documentId!: string;
  status!: VoucherStatus;
  reason?: string;
  createdAt!: Date;

  document?: ElectronicDocumentEntity;
}

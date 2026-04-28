import { EmissionType } from '../enums/emission-type.enum';
import { Environment } from '../enums/environment.enum';
import { VoucherStatus } from '../enums/voucher-status.enum';
import { VoucherType } from '../enums/voucher-type.enum';
import { DocumentEventEntity } from './document-event.entity';
import { FileArtifactEntity } from './file-artifact.entity';
import { SriAuthorizationEntity } from './sri-authorization.entity';
import { TransmissionAttemptEntity } from './transmission-attempt.entity';

export class ElectronicDocumentEntity {
  id!: string;
  accessKey!: string;
  voucherType!: VoucherType;
  status!: VoucherStatus;
  environment!: Environment;
  emissionType!: EmissionType;
  issuerRuc!: string;
  recipientId!: string;
  issuedAt!: Date;
  xmlGeneratedAt?: Date;
  signedAt?: Date;
  sentAt?: Date;
  receivedAt?: Date;
  authorizedAt?: Date;
  rejectedAt?: Date;
  errorReason?: string;
  createdAt!: Date;
  updatedAt!: Date;

  transmissionAttempts?: TransmissionAttemptEntity[];
  authorizations?: SriAuthorizationEntity[];
  events?: DocumentEventEntity[];
  artifacts?: FileArtifactEntity[];
}

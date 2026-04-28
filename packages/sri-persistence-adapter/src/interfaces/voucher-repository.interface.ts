import {
  DocumentEventEntity,
  ElectronicDocumentEntity,
  FileArtifactEntity,
  SriAuthorizationEntity,
  TransmissionAttemptEntity,
  VoucherStatus,
} from '@sri/core';

export interface IVoucherRepository {
  initialize(): Promise<void>;
  createDocument(document: Partial<ElectronicDocumentEntity>): Promise<ElectronicDocumentEntity>;
  updateDocumentStatus(
    accessKey: string,
    status: VoucherStatus,
    reason?: string,
  ): Promise<ElectronicDocumentEntity | null>;
  findByAccessKey(accessKey: string): Promise<ElectronicDocumentEntity | null>;
  addTransmissionAttempt(attempt: Partial<TransmissionAttemptEntity>): Promise<TransmissionAttemptEntity>;
  addAuthorization(authorization: Partial<SriAuthorizationEntity>): Promise<SriAuthorizationEntity>;
  addEvent(event: Partial<DocumentEventEntity>): Promise<DocumentEventEntity>;
  addArtifact(artifact: Partial<FileArtifactEntity>): Promise<FileArtifactEntity>;
}

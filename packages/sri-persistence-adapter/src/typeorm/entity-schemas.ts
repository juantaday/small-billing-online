import { EntitySchema } from 'typeorm';
import {
  DocumentEventEntity,
  ElectronicDocumentEntity,
  FileArtifactEntity,
  SriAuthorizationEntity,
  TransmissionAttemptEntity,
} from '@sri/core';

export const ElectronicDocumentSchema = new EntitySchema<ElectronicDocumentEntity>({
  name: 'ElectronicDocument',
  tableName: 'electronic_documents',
  target: ElectronicDocumentEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    accessKey: { type: 'varchar', length: 49, unique: true },
    voucherType: { type: 'varchar', length: 2 },
    status: { type: 'varchar', length: 32 },
    environment: { type: 'varchar', length: 1 },
    emissionType: { type: 'varchar', length: 1 },
    issuerRuc: { type: 'varchar', length: 13 },
    recipientId: { type: 'varchar', length: 20 },
    issuedAt: { type: 'timestamp' },
    xmlGeneratedAt: { type: 'timestamp', nullable: true },
    signedAt: { type: 'timestamp', nullable: true },
    sentAt: { type: 'timestamp', nullable: true },
    receivedAt: { type: 'timestamp', nullable: true },
    authorizedAt: { type: 'timestamp', nullable: true },
    rejectedAt: { type: 'timestamp', nullable: true },
    errorReason: { type: 'varchar', length: 500, nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
    updatedAt: { type: 'timestamp', updateDate: true },
  },
  relations: {
    transmissionAttempts: {
      type: 'one-to-many',
      target: 'TransmissionAttempt',
      inverseSide: 'document',
      cascade: true,
    },
    authorizations: {
      type: 'one-to-many',
      target: 'SriAuthorization',
      inverseSide: 'document',
      cascade: true,
    },
    events: {
      type: 'one-to-many',
      target: 'DocumentEvent',
      inverseSide: 'document',
      cascade: true,
    },
    artifacts: {
      type: 'one-to-many',
      target: 'FileArtifact',
      inverseSide: 'document',
      cascade: true,
    },
  },
});

export const TransmissionAttemptSchema = new EntitySchema<TransmissionAttemptEntity>({
  name: 'TransmissionAttempt',
  tableName: 'transmission_attempts',
  target: TransmissionAttemptEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    documentId: { type: 'uuid' },
    status: { type: 'varchar', length: 32 },
    attemptNumber: { type: 'int' },
    requestPayload: { type: 'text', nullable: true },
    responsePayload: { type: 'text', nullable: true },
    errorMessage: { type: 'text', nullable: true },
    startedAt: { type: 'timestamp' },
    finishedAt: { type: 'timestamp', nullable: true },
  },
  relations: {
    document: {
      type: 'many-to-one',
      target: 'ElectronicDocument',
      joinColumn: { name: 'documentId' },
      onDelete: 'CASCADE',
    },
  },
});

export const SriAuthorizationSchema = new EntitySchema<SriAuthorizationEntity>({
  name: 'SriAuthorization',
  tableName: 'sri_authorizations',
  target: SriAuthorizationEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    documentId: { type: 'uuid' },
    authorizationNumber: { type: 'varchar', length: 64 },
    authorizationDate: { type: 'timestamp' },
    authorizedXml: { type: 'text' },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    document: {
      type: 'many-to-one',
      target: 'ElectronicDocument',
      joinColumn: { name: 'documentId' },
      onDelete: 'CASCADE',
    },
  },
});

export const DocumentEventSchema = new EntitySchema<DocumentEventEntity>({
  name: 'DocumentEvent',
  tableName: 'document_events',
  target: DocumentEventEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    documentId: { type: 'uuid' },
    status: { type: 'varchar', length: 32 },
    reason: { type: 'varchar', length: 500, nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    document: {
      type: 'many-to-one',
      target: 'ElectronicDocument',
      joinColumn: { name: 'documentId' },
      onDelete: 'CASCADE',
    },
  },
});

export const FileArtifactSchema = new EntitySchema<FileArtifactEntity>({
  name: 'FileArtifact',
  tableName: 'file_artifacts',
  target: FileArtifactEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    documentId: { type: 'uuid' },
    type: { type: 'varchar', length: 32 },
    path: { type: 'varchar', length: 500 },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    document: {
      type: 'many-to-one',
      target: 'ElectronicDocument',
      joinColumn: { name: 'documentId' },
      onDelete: 'CASCADE',
    },
  },
});

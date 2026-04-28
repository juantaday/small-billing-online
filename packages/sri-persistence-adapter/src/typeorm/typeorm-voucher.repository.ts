import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import {
  DocumentEventEntity,
  ElectronicDocumentEntity,
  FileArtifactEntity,
  SriAuthorizationEntity,
  TransmissionAttemptEntity,
  VoucherStatus,
} from '@sri/core';
import { IVoucherRepository } from '../interfaces/voucher-repository.interface';
import {
  DocumentEventSchema,
  ElectronicDocumentSchema,
  FileArtifactSchema,
  SriAuthorizationSchema,
  TransmissionAttemptSchema,
} from './entity-schemas';

export interface TypeormRepositoryConfig {
  connectionString: string;
}

export class TypeormVoucherRepository implements IVoucherRepository {
  private readonly dataSource: DataSource;
  private documentRepo!: Repository<ElectronicDocumentEntity>;
  private attemptRepo!: Repository<TransmissionAttemptEntity>;
  private authorizationRepo!: Repository<SriAuthorizationEntity>;
  private eventRepo!: Repository<DocumentEventEntity>;
  private artifactRepo!: Repository<FileArtifactEntity>;

  constructor(config: TypeormRepositoryConfig) {
    this.dataSource = new DataSource({
      type: 'postgres',
      url: config.connectionString,
      entities: [
        ElectronicDocumentSchema,
        TransmissionAttemptSchema,
        SriAuthorizationSchema,
        DocumentEventSchema,
        FileArtifactSchema,
      ],
      synchronize: false,
    });
  }

  async initialize(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
      this.documentRepo = this.dataSource.getRepository(ElectronicDocumentEntity);
      this.attemptRepo = this.dataSource.getRepository(TransmissionAttemptEntity);
      this.authorizationRepo = this.dataSource.getRepository(SriAuthorizationEntity);
      this.eventRepo = this.dataSource.getRepository(DocumentEventEntity);
      this.artifactRepo = this.dataSource.getRepository(FileArtifactEntity);
    }
  }

  async createDocument(
    document: Partial<ElectronicDocumentEntity>,
  ): Promise<ElectronicDocumentEntity> {
    await this.initialize();
    const entity = this.documentRepo.create(document);
    return this.documentRepo.save(entity);
  }

  async updateDocumentStatus(
    accessKey: string,
    status: VoucherStatus,
    reason?: string,
  ): Promise<ElectronicDocumentEntity | null> {
    await this.initialize();
    const document = await this.documentRepo.findOne({ where: { accessKey } });
    if (!document) {
      return null;
    }
    document.status = status;
    document.errorReason = reason;
    return this.documentRepo.save(document);
  }

  async findByAccessKey(accessKey: string): Promise<ElectronicDocumentEntity | null> {
    await this.initialize();
    return this.documentRepo.findOne({ where: { accessKey } });
  }

  async addTransmissionAttempt(
    attempt: Partial<TransmissionAttemptEntity>,
  ): Promise<TransmissionAttemptEntity> {
    await this.initialize();
    const entity = this.attemptRepo.create(attempt);
    return this.attemptRepo.save(entity);
  }

  async addAuthorization(
    authorization: Partial<SriAuthorizationEntity>,
  ): Promise<SriAuthorizationEntity> {
    await this.initialize();
    const entity = this.authorizationRepo.create(authorization);
    return this.authorizationRepo.save(entity);
  }

  async addEvent(event: Partial<DocumentEventEntity>): Promise<DocumentEventEntity> {
    await this.initialize();
    const entity = this.eventRepo.create(event);
    return this.eventRepo.save(entity);
  }

  async addArtifact(artifact: Partial<FileArtifactEntity>): Promise<FileArtifactEntity> {
    await this.initialize();
    const entity = this.artifactRepo.create(artifact);
    return this.artifactRepo.save(entity);
  }
}

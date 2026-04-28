import { ElectronicDocumentEntity } from './electronic-document.entity';

export class SriAuthorizationEntity {
  id!: string;
  documentId!: string;
  authorizationNumber!: string;
  authorizationDate!: Date;
  authorizedXml!: string;
  createdAt!: Date;

  document?: ElectronicDocumentEntity;
}

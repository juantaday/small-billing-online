import { FileArtifactType } from '../enums/file-artifact-type.enum';
import { ElectronicDocumentEntity } from './electronic-document.entity';

export class FileArtifactEntity {
  id!: string;
  documentId!: string;
  type!: FileArtifactType;
  path!: string;
  createdAt!: Date;

  document?: ElectronicDocumentEntity;
}

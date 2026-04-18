/**
 * DTOs para catálogo de tipos de documento
 */

export interface DocumentTypeDto {
  id: number;
  documentName: string;
  itemsAutoGenerate: number;
  indefinite: boolean;
  documentCategoryId: number;
  idGroupNumeration: number;
  codSRI?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentTypeDto {
  documentName: string;
  itemsAutoGenerate: number;
  indefinite: boolean;
  documentCategoryId: number;
  idGroupNumeration: number;
  codSRI?: string | null;
  active?: boolean;
}

export interface UpdateDocumentTypeDto extends Partial<CreateDocumentTypeDto> {
  id: number;
}

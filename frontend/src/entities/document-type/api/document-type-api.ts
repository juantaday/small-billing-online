import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  CreateDocumentTypeDto,
  DocumentTypeDto,
  UpdateDocumentTypeDto,
} from '@small-billing/shared';

class DocumentTypeApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<DocumentTypeDto[]> {
    return this.get<DocumentTypeDto[]>('/document-types');
  }

  async create(data: CreateDocumentTypeDto): Promise<DocumentTypeDto> {
    return this.post<DocumentTypeDto>('/document-types', data);
  }

  async update(id: number, data: UpdateDocumentTypeDto): Promise<DocumentTypeDto> {
    return this.put<DocumentTypeDto>(`/document-types/${id}`, data);
  }
}

export const documentTypeApi = new DocumentTypeApi();

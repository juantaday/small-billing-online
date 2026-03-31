import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  CreatePresentationTypeDto,
  PresentationTypeDto,
  UpdatePresentationTypeDto,
} from '@small-billing/shared';

class PresentationTypeApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<PresentationTypeDto[]> {
    return this.get<PresentationTypeDto[]>('/presentation-types');
  }

  async create(data: CreatePresentationTypeDto): Promise<PresentationTypeDto> {
    return this.post<PresentationTypeDto>('/presentation-types', data);
  }

  async update(id: string, data: UpdatePresentationTypeDto): Promise<PresentationTypeDto> {
    return this.put<PresentationTypeDto>(`/presentation-types/${id}`, data);
  }

  async delete(id: string): Promise<PresentationTypeDto> {
    return this.deleteBase<PresentationTypeDto>(`/presentation-types/${id}`);
  }
}

export const presentationTypeApi = new PresentationTypeApi();

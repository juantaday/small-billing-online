/**
 * Entity: Business Type
 * API para tipos de negocio (SRI)
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { BusinessTypeDto, CreateBusinessTypeDto, UpdateBusinessTypeDto } from '@small-billing/shared';

class BusinessTypeApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<BusinessTypeDto[]> {
    return this.get<BusinessTypeDto[]>('/business-types');
  }

  async create(data: CreateBusinessTypeDto): Promise<BusinessTypeDto> {
    return this.post<BusinessTypeDto>('/business-types', data);
  }

  async update(id: number, data: UpdateBusinessTypeDto): Promise<BusinessTypeDto> {
    return this.put<BusinessTypeDto>(`/business-types/${id}`, data);
  }
}

export const businessTypeApi = new BusinessTypeApi();

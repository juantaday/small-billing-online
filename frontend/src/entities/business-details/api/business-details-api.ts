/**
 * Entity: Business Details
 * API para datos del negocio
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { BusinessDetailsDto, CreateBusinessDetailsDto, UpdateBusinessDetailsDto } from '@small-billing/shared';

class BusinessDetailsApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getCurrent(): Promise<BusinessDetailsDto | null> {
    return this.get<BusinessDetailsDto | null>('/business-details');
  }

  async create(data: CreateBusinessDetailsDto): Promise<BusinessDetailsDto> {
    return this.post<BusinessDetailsDto>('/business-details', data);
  }

  async update(id: string, data: UpdateBusinessDetailsDto): Promise<BusinessDetailsDto> {
    return this.put<BusinessDetailsDto>(`/business-details/${id}`, data);
  }
}

export const businessDetailsApi = new BusinessDetailsApi();

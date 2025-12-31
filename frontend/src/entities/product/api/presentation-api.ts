/**
 * Entity: Presentation
 * Modelo de datos y API para presentaciones de productos
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { PresentationDto, CreatePresentationDto, UpdatePresentationDto } from '@small-billing/shared';

class PresentationApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<PresentationDto[]> {
    return this.get<PresentationDto[]>('/presentations');
  }

  async getByProductId(productId: string): Promise<PresentationDto[]> {
    return this.get<PresentationDto[]>('/presentations', {
      params: { productId },
    });
  }

  async getById(id: number): Promise<PresentationDto> {
    return this.get<PresentationDto>(`/presentations/${id}`);
  }

  async create(data: CreatePresentationDto): Promise<PresentationDto> {
    return this.post<PresentationDto>('/presentations', data);
  }

  async update(id: number, data: UpdatePresentationDto): Promise<PresentationDto> {
    return this.put<PresentationDto>(`/presentations/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.deleteBase<void>(`/presentations/${id}`);
  }
}

export const presentationApi = new PresentationApi();

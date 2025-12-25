/**
 * Entity: Category
 * Modelo de datos y API para categorías
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '@small-billing/shared';

class CategoryApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<CategoryDto[]> {
    return this.get<CategoryDto[]>('/categories');
  }

  async getById(id: number): Promise<CategoryDto> {
    return this.get<CategoryDto>(`/categories/${id}`);
  }

  async create(data: CreateCategoryDto): Promise<CategoryDto> {
    return this.post<CategoryDto>('/categories', data);
  }

  async update(id: number, data: UpdateCategoryDto): Promise<CategoryDto> {
    return this.put<CategoryDto>(`/categories/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return this.deleteBase<void>(`/categories/${id}`);
  }
}

export const categoryApi = new CategoryApi();

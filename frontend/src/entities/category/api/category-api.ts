/**
 * Entity: Category
 * Modelo de datos y API para categorías
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '@small-billing/shared';

class CategoryApi extends BaseApiClient {
  private categoriesCache: CategoryDto[] | null = null;
  private categoriesFetchedAt = 0;
  private inflightGetAll: Promise<CategoryDto[]> | null = null;

  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<CategoryDto[]> {
    const now = Date.now();
    const CACHE_TTL_MS = 60_000;

    if (this.categoriesCache && now - this.categoriesFetchedAt < CACHE_TTL_MS) {
      return this.categoriesCache;
    }

    if (this.inflightGetAll) {
      return this.inflightGetAll;
    }

    this.inflightGetAll = this.get<CategoryDto[]>('/categories')
      .then((data) => {
        this.categoriesCache = data;
        this.categoriesFetchedAt = Date.now();
        return data;
      })
      .finally(() => {
        this.inflightGetAll = null;
      });

    return this.inflightGetAll;
  }

  async getById(id: number): Promise<CategoryDto> {
    return this.get<CategoryDto>(`/categories/${id}`);
  }

  async create(data: CreateCategoryDto): Promise<CategoryDto> {
    const created = await this.post<CategoryDto>('/categories', data);
    this.categoriesCache = null;
    this.categoriesFetchedAt = 0;
    return created;
  }

  async update(id: number, data: UpdateCategoryDto): Promise<CategoryDto> {
    const updated = await this.put<CategoryDto>(`/categories/${id}`, data);
    this.categoriesCache = null;
    this.categoriesFetchedAt = 0;
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.deleteBase<void>(`/categories/${id}`);
    this.categoriesCache = null;
    this.categoriesFetchedAt = 0;
  }
}

export const categoryApi = new CategoryApi();

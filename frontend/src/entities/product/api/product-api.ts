/**
 * Entity: Product
 * Modelo de datos y API para productos
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { ProductDto, CreateProductDto, UpdateProductDto } from '@small-billing/shared';

class ProductApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<ProductDto[]> {
    return this.get<ProductDto[]>('/products');
  }

  async getById(id: string): Promise<ProductDto> {
    return this.get<ProductDto>(`/products/${id}`);
  }

  async create(data: CreateProductDto): Promise<ProductDto> {
    return this.post<ProductDto>('/products', data);
  }

  async update(id: string, data: UpdateProductDto): Promise<ProductDto> {
    return this.put<ProductDto>(`/products/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteBase<void>(`/products/${id}`);
  }
}

export const productApi = new ProductApi();

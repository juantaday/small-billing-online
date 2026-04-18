/**
 * Entity: Product
 * Modelo de datos y API para productos
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductWithRelationsDto,
  FinalizeProductWizardDto,
  QuickAddInventoryDto,
} from '@small-billing/shared';

class ProductApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<ProductWithRelationsDto[]> {
    return this.get<ProductWithRelationsDto[]>('/products');
  }

  async getById(id: string, light = false): Promise<ProductWithRelationsDto> {
    const query = light ? '?light=1' : '';
    return this.get<ProductWithRelationsDto>(`/products/${id}${query}`);
  }

  async create(data: CreateProductDto): Promise<ProductDto> {
    return this.post<ProductDto>('/products', data);
  }

  async update(id: string, data: UpdateProductDto): Promise<ProductDto> {
    return this.put<ProductDto>(`/products/${id}`, data);
  }

  async finalizeWizard(
    id: string,
    data: FinalizeProductWizardDto,
  ): Promise<ProductDto> {
    return this.put<ProductDto>(`/products/${id}/finalize`, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteBase<void>(`/products/${id}`);
  }

  async discardDraft(id: string): Promise<{ success: boolean; hardDeleted: boolean }> {
    return this.deleteBase<{ success: boolean; hardDeleted: boolean }>(`/products/${id}/discard-draft`);
  }

  async quickAddInventory(
    productId: string,
    data: QuickAddInventoryDto,
  ): Promise<{
    productId: string;
    stockBefore: number;
    stockAfter: number;
    addedBaseUnits: number;
    factorToBase: number;
  }> {
    return this.post(`/products/${productId}/stock/quick-add`, data);
  }
}

export const productApi = new ProductApi();

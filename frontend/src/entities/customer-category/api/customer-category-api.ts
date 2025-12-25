/**
 * Entity: Customer Category
 * API para categorías de clientes
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { CustomerCategoryDto, CreateCustomerCategoryDto, UpdateCustomerCategoryDto } from '@small-billing/shared';

class CustomerCategoryApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<CustomerCategoryDto[]> {
    return this.get<CustomerCategoryDto[]>('/customer-categories');
  }

  async getById(id: string): Promise<CustomerCategoryDto> {
    return this.get<CustomerCategoryDto>(`/customer-categories/${id}`);
  }

  async create(data: CreateCustomerCategoryDto): Promise<CustomerCategoryDto> {
    return this.post<CustomerCategoryDto>('/customer-categories', data);
  }

  async update(id: string, data: CreateCustomerCategoryDto): Promise<CustomerCategoryDto> {
    return this.put<CustomerCategoryDto>(`/customer-categories/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteBase<void>(`/customer-categories/${id}`);
  }
}

export const customerCategoryApi = new CustomerCategoryApi();

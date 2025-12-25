/**
 * Entity: Customer
 * Modelo de datos y API para clientes
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { 
  CustomerDto, 
  CustomerWithRelationsDto,
  CreateCustomerDto, 
  UpdateCustomerDto 
} from '@small-billing/shared';

class CustomerApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<CustomerWithRelationsDto[]> {
    return this.get<CustomerWithRelationsDto[]>('/customers');
  }

  async getById(id: string): Promise<CustomerWithRelationsDto> {
    return this.get<CustomerWithRelationsDto>(`/customers/${id}`);
  }

  async create(data: CreateCustomerDto): Promise<CustomerDto> {
    return this.post<CustomerDto>('/customers', data);
  }

  async update(id: string, data: UpdateCustomerDto): Promise<CustomerDto> {
    return this.put<CustomerDto>(`/customers/${id}`, data);
  }

   async updateWithRelations(id: string, data: CustomerWithRelationsDto): Promise<CustomerDto> {
    return this.put<CustomerWithRelationsDto>(`/customersWithrelations/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteBase<void>(`/customers/${id}`);
  }

}

export const customerApi = new CustomerApi();

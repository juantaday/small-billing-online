import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseDto } from '@small-billing/shared';

class WarehouseApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<WarehouseDto[]> {
    return this.get<WarehouseDto[]>('/warehouses');
  }

  async create(data: CreateWarehouseDto): Promise<WarehouseDto> {
    return this.post<WarehouseDto>('/warehouses', data);
  }

  async update(id: number, data: UpdateWarehouseDto): Promise<WarehouseDto> {
    return this.put<WarehouseDto>(`/warehouses/${id}`, data);
  }
}

export const warehouseApi = new WarehouseApi();

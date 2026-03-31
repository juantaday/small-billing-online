import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { CreateSaleDto, SaleWithRelationsDto } from '@small-billing/shared';

class SaleApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async create(data: CreateSaleDto): Promise<SaleWithRelationsDto> {
    return this.post<SaleWithRelationsDto>('/sales', data);
  }
}

export const saleApi = new SaleApi();

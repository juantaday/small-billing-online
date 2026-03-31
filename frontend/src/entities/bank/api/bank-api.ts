import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { BankDto } from '@small-billing/shared';

class BankApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<BankDto[]> {
    return this.get<BankDto[]>('/banks');
  }
}

export const bankApi = new BankApi();

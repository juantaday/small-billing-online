import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  CreateInvoiceSequenceDto,
  InvoiceSequenceDto,
  UpdateInvoiceSequenceDto,
} from '@small-billing/shared';

class InvoiceSequenceApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<InvoiceSequenceDto[]> {
    return this.get<InvoiceSequenceDto[]>('/invoice-sequences');
  }

  async create(data: CreateInvoiceSequenceDto): Promise<InvoiceSequenceDto> {
    return this.post<InvoiceSequenceDto>('/invoice-sequences', data);
  }

  async update(id: string, data: UpdateInvoiceSequenceDto): Promise<InvoiceSequenceDto> {
    return this.put<InvoiceSequenceDto>(`/invoice-sequences/${id}`, data);
  }
}

export const invoiceSequenceApi = new InvoiceSequenceApi();

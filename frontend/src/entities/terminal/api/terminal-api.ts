import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { CreateTerminalDto, TerminalDto, UpdateTerminalDto } from '@small-billing/shared';

class TerminalApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<TerminalDto[]> {
    return this.get<TerminalDto[]>('/terminals');
  }

  async create(data: CreateTerminalDto): Promise<TerminalDto> {
    return this.post<TerminalDto>('/terminals', data);
  }

  async update(id: number, data: UpdateTerminalDto): Promise<TerminalDto> {
    return this.put<TerminalDto>(`/terminals/${id}`, data);
  }
}

export const terminalApi = new TerminalApi();

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  CreateTerminalSettingsDto,
  TerminalSettingsDto,
  UpdateTerminalSettingsDto,
} from '@small-billing/shared';

class TerminalSettingsApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAllByTerminal(terminalId: number): Promise<TerminalSettingsDto[]> {
    return this.get<TerminalSettingsDto[]>(`/api/terminal-settings/terminal/${terminalId}`);
  }

  async getByTerminalAndDocumentType(
    terminalId: number,
    documentTypeId: number,
  ): Promise<TerminalSettingsDto> {
    return this.get<TerminalSettingsDto>(`/api/terminal-settings/${terminalId}/${documentTypeId}`);
  }

  async create(data: CreateTerminalSettingsDto): Promise<TerminalSettingsDto> {
    return this.post<TerminalSettingsDto>('/api/terminal-settings', data);
  }

  async update(
    terminalId: number,
    documentTypeId: number,
    data: UpdateTerminalSettingsDto,
  ): Promise<TerminalSettingsDto> {
    return this.put<TerminalSettingsDto>(`/api/terminal-settings/${terminalId}/${documentTypeId}`, data);
  }
}

export const terminalSettingsApi = new TerminalSettingsApi();

import { Controller, Post, Get, Put, Body, Param, NotFoundException } from '@nestjs/common';
import { TerminalSettingsService } from './terminal-settings.service';
import { CreateTerminalSettingsDto, UpdateTerminalSettingsDto } from '@small-billing/shared';

/**
 * Endpoints para gestión de configuración de terminales
 * (impresoras, límites de items, formatos de documento, etc.)
 */
@Controller('api/terminal-settings')
export class TerminalSettingsController {
  constructor(private readonly terminalSettingsService: TerminalSettingsService) {}

  /**
   * POST /api/terminal-settings
   * Crear nueva configuración para terminal + documento
   */
  @Post()
  async createSettings(@Body() dto: CreateTerminalSettingsDto): Promise<any> {
    return await this.terminalSettingsService.createSettings(dto);
  }

  /**
   * GET /api/terminal-settings/terminal/:terminalId
   * Obtener todas las configuraciones de una terminal
   */
  @Get('terminal/:terminalId')
  async getTerminalSettings(@Param('terminalId') terminalId: string): Promise<any[]> {
    const terminalIdNum = parseInt(terminalId, 10);

    if (isNaN(terminalIdNum)) {
      throw new NotFoundException('terminalId debe ser un número válido');
    }

    return await this.terminalSettingsService.getSettingsByTerminal(terminalIdNum);
  }

  /**
   * GET /api/terminal-settings/:terminalId/:documentTypeId
   * Obtener configuración para terminal + documento específico
   */
  @Get(':terminalId/:documentTypeId')
  async getSettings(
    @Param('terminalId') terminalId: string,
    @Param('documentTypeId') documentTypeId: string,
  ): Promise<any> {
    const terminalIdNum = parseInt(terminalId, 10);
    const documentTypeIdNum = parseInt(documentTypeId, 10);

    if (isNaN(terminalIdNum) || isNaN(documentTypeIdNum)) {
      throw new NotFoundException('terminalId y documentTypeId deben ser números válidos');
    }

    return await this.terminalSettingsService.getSettings(terminalIdNum, documentTypeIdNum);
  }

  /**
   * PUT /api/terminal-settings/:terminalId/:documentTypeId
   * Actualizar configuración
   */
  @Put(':terminalId/:documentTypeId')
  async updateSettings(
    @Param('terminalId') terminalId: string,
    @Param('documentTypeId') documentTypeId: string,
    @Body() dto: UpdateTerminalSettingsDto,
  ): Promise<any> {
    const terminalIdNum = parseInt(terminalId, 10);
    const documentTypeIdNum = parseInt(documentTypeId, 10);

    if (isNaN(terminalIdNum) || isNaN(documentTypeIdNum)) {
      throw new NotFoundException('terminalId y documentTypeId deben ser números válidos');
    }

    return await this.terminalSettingsService.updateSettings(terminalIdNum, documentTypeIdNum, dto);
  }

  /**
   * POST /api/terminal-settings/:terminalId/:documentTypeId/toggle-enabled/:enabled
   * Habilitar/Deshabilitar configuración
   */
  @Post(':terminalId/:documentTypeId/toggle-enabled/:enabled')
  async toggleEnabled(
    @Param('terminalId') terminalId: string,
    @Param('documentTypeId') documentTypeId: string,
    @Param('enabled') enabled: string,
  ): Promise<any> {
    const terminalIdNum = parseInt(terminalId, 10);
    const documentTypeIdNum = parseInt(documentTypeId, 10);
    const isEnabled = enabled === 'true';

    if (isNaN(terminalIdNum) || isNaN(documentTypeIdNum)) {
      throw new NotFoundException('terminalId y documentTypeId deben ser números válidos');
    }

    return await this.terminalSettingsService.toggleEnabled(terminalIdNum, documentTypeIdNum, isEnabled);
  }

  /**
   * POST /api/terminal-settings/:terminalId/:documentTypeId/validate-items
   * Validar que el número de items es permitido
   */
  @Post(':terminalId/:documentTypeId/validate-items')
  async validateItems(
    @Param('terminalId') terminalId: string,
    @Param('documentTypeId') documentTypeId: string,
    @Body() body: { itemCount: number },
  ): Promise<any> {
    const terminalIdNum = parseInt(terminalId, 10);
    const documentTypeIdNum = parseInt(documentTypeId, 10);

    if (isNaN(terminalIdNum) || isNaN(documentTypeIdNum)) {
      throw new NotFoundException('terminalId y documentTypeId deben ser números válidos');
    }

    return await this.terminalSettingsService.validateItemCount(
      terminalIdNum,
      documentTypeIdNum,
      body.itemCount,
    );
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerminalSettingsDto, UpdateTerminalSettingsDto } from '@small-billing/shared';

/**
 * Servicio para gestionar configuración de terminales (TerminalSettings)
 * Configura impresoras, formatos de documento, límites de items, etc.
 */
@Injectable()
export class TerminalSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear configuración para una terminal + tipo de documento
   */
  async createSettings(dto: CreateTerminalSettingsDto): Promise<any> {
    // Verificar que la terminal existe
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: dto.terminalId },
    });

    if (!terminal) {
      throw new NotFoundException(`Terminal con ID ${dto.terminalId} no encontrada`);
    }

    // Verificar que no exista ya una configuración para esta combinación
    const existing = await this.prisma.terminalSettings.findUnique({
      where: {
        terminalId_documentTypeId: {
          terminalId: dto.terminalId,
          documentTypeId: dto.documentTypeId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe configuración para terminal ${dto.terminalId} y documento tipo ${dto.documentTypeId}`,
      );
    }

    return await this.prisma.terminalSettings.create({
      data: {
        terminalId: dto.terminalId,
        documentTypeId: dto.documentTypeId,
        namePrinter: dto.namePrinter || null,
        characterLine: dto.characterLine || null,
        withLogo: dto.withLogo || null,
        maxItems: dto.maxItems || 100,
        linesPerTransaction: dto.linesPerTransaction || null,
        lastSequential: dto.lastSequential || 0,
        enabled: true,
      },
    });
  }

  /**
   * Actualizar configuración de terminal + documento
   */
  async updateSettings(
    terminalId: number,
    documentTypeId: number,
    dto: UpdateTerminalSettingsDto,
  ): Promise<any> {
    const settings = await this.prisma.terminalSettings.findUnique({
      where: {
        terminalId_documentTypeId: {
          terminalId,
          documentTypeId,
        },
      },
    });

    if (!settings) {
      throw new NotFoundException(
        `Configuración no encontrada para terminal ${terminalId} y documento ${documentTypeId}`,
      );
    }

    return await this.prisma.terminalSettings.update({
      where: { id: settings.id },
      data: {
        namePrinter: dto.namePrinter !== undefined ? dto.namePrinter : settings.namePrinter,
        characterLine: dto.characterLine !== undefined ? dto.characterLine : settings.characterLine,
        withLogo: dto.withLogo !== undefined ? dto.withLogo : settings.withLogo,
        maxItems: dto.maxItems !== undefined ? dto.maxItems : settings.maxItems,
        linesPerTransaction:
          dto.linesPerTransaction !== undefined ? dto.linesPerTransaction : settings.linesPerTransaction,
        lastSequential:
          dto.lastSequential !== undefined ? dto.lastSequential : settings.lastSequential,
        enabled: dto.enabled !== undefined ? dto.enabled : settings.enabled,
      },
    });
  }

  /**
   * Obtener configuración para terminal + documento
   */
  async getSettings(terminalId: number, documentTypeId: number): Promise<any> {
    const settings = await this.prisma.terminalSettings.findUnique({
      where: {
        terminalId_documentTypeId: {
          terminalId,
          documentTypeId,
        },
      },
    });

    if (!settings) {
      throw new NotFoundException(
        `Configuración no encontrada para terminal ${terminalId} y documento ${documentTypeId}`,
      );
    }

    return settings;
  }

  /**
   * Obtener todas las configuraciones de una terminal
   */
  async getSettingsByTerminal(terminalId: number): Promise<any[]> {
    return await this.prisma.terminalSettings.findMany({
      where: { terminalId },
      include: {
        documentType: true,
      },
    });
  }

  /**
   * Habilitar/Deshabilitar una configuración
   */
  async toggleEnabled(terminalId: number, documentTypeId: number, enabled: boolean): Promise<any> {
    const settings = await this.prisma.terminalSettings.findUnique({
      where: {
        terminalId_documentTypeId: {
          terminalId,
          documentTypeId,
        },
      },
    });

    if (!settings) {
      throw new NotFoundException(
        `Configuración no encontrada para terminal ${terminalId} y documento ${documentTypeId}`,
      );
    }

    return await this.prisma.terminalSettings.update({
      where: { id: settings.id },
      data: { enabled },
    });
  }

  /**
   * Validar que el número de items es válido para esta configuración
   */
  async validateItemCount(
    terminalId: number,
    documentTypeId: number,
    itemCount: number,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const settings = await this.getSettings(terminalId, documentTypeId);

      if (itemCount > settings.maxItems) {
        return {
          valid: false,
          message: `Máximo ${settings.maxItems} items permitidos. Se enviaron ${itemCount}`,
        };
      }

      return { valid: true };
    } catch {
      // Si no hay configuración, asumir que es válido
      return { valid: true };
    }
  }

  /**
   * Crear configuración por defecto para nueva terminal
   */
  async createDefaultSettings(terminalId: number): Promise<void> {
    // Crear configuración para FACTURA por defecto
    await this.prisma.terminalSettings.create({
      data: {
        terminalId,
        documentTypeId: 1,
        namePrinter: null,
        characterLine: 40, // Ancho estándar de impresora térmica
        withLogo: 'SMALL',
        maxItems: 100,
        linesPerTransaction: null,
        lastSequential: 0,
        enabled: true,
      },
    });
  }
}

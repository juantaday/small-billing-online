import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BindTerminalByPairingDto,
  DeviceDto,
  DeviceEnrollmentRequestDto,
  DeviceEnrollmentResponseDto,
  RegisterDeviceDto,
  RevokeDeviceDto,
  RotateDeviceTokenResponseDto,
} from '@small-billing/shared';
import { createHash, randomBytes } from 'crypto';

/**
 * Servicio para gestionar dispositivos/equipos POS  
 * - Generar tokens únicos de dispositivo
 * - Validar que un dispositivo esté registrado
 * - Asignar dispositivos a terminales
 * - Resolver configuración de impresora por dispositivo
 */
@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly pairingCodeMinutes = 10;

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private async createUniquePairingCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await this.prisma.device.findUnique({ where: { pairingCode: candidate } });
      if (!existing) {
        return candidate;
      }
    }

    throw new BadRequestException('No se pudo generar un código de pairing único, intenta nuevamente');
  }

  private mapDevice(device: any): DeviceDto {
    return {
      id: device.id,
      tokenLast4: device.tokenLast4,
      tokenVersion: device.tokenVersion,
      status: device.status,
      pairingCode: device.pairingCode,
      pairingCodeExpiresAt: device.pairingCodeExpiresAt,
      fingerprintSignal: device.fingerprintSignal,
      riskScore: device.riskScore,
      deviceName: device.deviceName,
      ipAddress: device.ipAddress,
      terminalId: device.terminal?.id,
      active: device.active,
      tokenIssuedAt: device.tokenIssuedAt,
      tokenRotatedAt: device.tokenRotatedAt,
      tokenRevokedAt: device.tokenRevokedAt,
      revokeReason: device.revokeReason,
      lastSeen: device.lastSeen,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  /**
   * Generar token de equipo para provisioning inicial.
   * El valor retornado es el token real que verá el cliente.
   * En base de datos solo se persiste su hash SHA-256.
   */
  generateDeviceToken(): string {
    return randomBytes(32).toString('hex');
  }

  async enrollDevice(
    dto: DeviceEnrollmentRequestDto,
    ipAddress?: string,
  ): Promise<DeviceEnrollmentResponseDto> {
    const rawToken = this.generateDeviceToken();
    const pairingCode = await this.createUniquePairingCode();
    const pairingCodeExpiresAt = new Date(Date.now() + this.pairingCodeMinutes * 60 * 1000);

    const device = await this.prisma.device.create({
      data: {
        deviceToken: this.hashToken(rawToken),
        tokenLast4: rawToken.slice(-4),
        tokenVersion: 1,
        tokenIssuedAt: new Date(),
        pairingCode,
        pairingCodeExpiresAt,
        pairingCodeAttempts: 0,
        fingerprintSignal: dto.fingerprintSignal || undefined,
        riskSignals: (dto.riskSignals as any) || undefined,
        riskScore: 0,
        status: 'PENDING',
        deviceName: dto.deviceName || undefined,
        ipAddress: ipAddress || undefined,
        active: true,
      },
    });

    return {
      id: device.id,
      deviceToken: rawToken,
      tokenLast4: device.tokenLast4,
      pairingCode,
      pairingCodeExpiresAt,
      status: device.status,
    };
  }

  private async resolveDeviceByRawToken(deviceToken: string): Promise<any> {
    const device = await this.prisma.device.findUnique({
      where: { deviceToken: this.hashToken(deviceToken) },
      include: {
        terminal: {
          select: { id: true, code: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }

  /**
   * Registro de actividad/autenticación del equipo ya provisionado.
   */
  async registerDevice(dto: RegisterDeviceDto, ipAddress?: string): Promise<any> {
    const current = await this.resolveDeviceByRawToken(dto.deviceToken);

    if (!current.active || current.status === 'REVOKED' || current.status === 'RETIRED') {
      throw new BadRequestException('El token del equipo está revocado o inactivo');
    }

    const fingerprintMismatch =
      dto.fingerprintSignal &&
      current.fingerprintSignal &&
      dto.fingerprintSignal !== current.fingerprintSignal;

    const nextRiskScore = Math.min(100, Math.max(current.riskScore || 0, fingerprintMismatch ? 70 : 0));

    const device = await this.prisma.device.update({
      where: { id: current.id },
      data: {
        deviceName: dto.deviceName || undefined,
        ipAddress: ipAddress || undefined,
        lastSeen: new Date(),
        active: true,
        fingerprintSignal: dto.fingerprintSignal || current.fingerprintSignal,
        riskSignals: dto.riskSignals || current.riskSignals,
        riskScore: nextRiskScore,
      },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    return {
      ...this.mapDevice(device),
    };
  }

  /**
   * Asignar un dispositivo a una terminal
   */
  async assignTerminalToDevice(deviceToken: string, terminalId: number): Promise<any> {
    const device = await this.resolveDeviceByRawToken(deviceToken);

    if (!device) {
      throw new NotFoundException(`Dispositivo con token ${deviceToken} no encontrado`);
    }

    // Verificar que la terminal existe
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: {
        device: {
          select: { id: true, deviceToken: true },
        },
      },
    });

    if (!terminal) {
      throw new NotFoundException(`Terminal con ID ${terminalId} no encontrada`);
    }

    if (terminal.deviceId !== device.id && terminal.device) {
      throw new BadRequestException(
        `La terminal ${terminal.code} ya está asociada a otro equipo (${terminal.device.deviceToken})`,
      );
    }

    await this.prisma.terminal.update({
      where: { id: terminalId },
      data: { deviceId: device.id },
    });

    const refreshedDevice = await this.prisma.device.findUnique({
      where: { id: device.id },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    if (!refreshedDevice) {
      throw new NotFoundException(`Dispositivo con token ${deviceToken} no encontrado`);
    }

    return {
      ...this.mapDevice(refreshedDevice),
    };
  }

  async bindTerminalByPairingCode(dto: BindTerminalByPairingDto): Promise<DeviceDto> {
    const now = new Date();
    const pairingCode = dto.pairingCode.trim();

    const device = await this.prisma.device.findUnique({
      where: { pairingCode },
      include: {
        terminal: {
          select: { id: true, code: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Código de pairing inválido');
    }

    if (!device.pairingCodeExpiresAt || device.pairingCodeExpiresAt < now) {
      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          pairingCodeAttempts: { increment: 1 },
        },
      });
      throw new BadRequestException('El código de pairing expiró, genera uno nuevo');
    }

    if (!device.active || device.status === 'REVOKED' || device.status === 'RETIRED') {
      throw new BadRequestException('El equipo no está habilitado para vinculación');
    }

    const terminal = await this.prisma.terminal.findUnique({
      where: { id: dto.terminalId },
      select: { id: true },
    });

    if (!terminal) {
      throw new NotFoundException(`Terminal con ID ${dto.terminalId} no encontrada`);
    }

    await this.prisma.terminal.update({
      where: { id: dto.terminalId },
      data: { deviceId: device.id },
    });

    const updated = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        status: 'PAIRED',
        lastSeen: now,
        pairingCode: null,
        pairingCodeExpiresAt: null,
        pairingCodeAttempts: 0,
      },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    return this.mapDevice(updated);
  }

  /**
   * Obtener un dispositivo por token
   */
  async getDeviceByToken(deviceToken: string): Promise<any> {
    const device = await this.resolveDeviceByRawToken(deviceToken);

    if (!device.active) {
      throw new BadRequestException('El dispositivo está inactivo');
    }

    return this.mapDevice(device);
  }

  async listDevices(): Promise<DeviceDto[]> {
    const devices = await this.prisma.device.findMany({
      include: {
        terminal: {
          select: { id: true },
        },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });

    return devices.map((device) => this.mapDevice(device));
  }

  /**
   * Validar que un dispositivo pertenece a la terminal especificada
   */
  async validateDeviceForTerminal(deviceToken: string, terminalId: number): Promise<boolean> {
    try {
      const device = await this.getDeviceByToken(deviceToken);

      // Si el dispositivo no tiene terminal asignada, no es válido.
      // Debe estar explícitamente asociado antes de operar.
      if (!device.terminalId) {
        return false;
      }

      // Si tiene terminal asignada, debe coincidir
      return device.terminalId === terminalId;
    } catch {
      return false;
    }
  }

  /**
   * Actualizar última conexión del dispositivo
   */
  async updateLastSeen(deviceToken: string, ipAddress?: string): Promise<void> {
    try {
      const hashed = this.hashToken(deviceToken);
      await this.prisma.device.update({
        where: { deviceToken: hashed },
        data: {
          lastSeen: new Date(),
          ipAddress: ipAddress || undefined,
        },
      });
    } catch {
      // Si el dispositivo no existe, es OK - será registrado en la próxima solicitud
    }
  }

  /**
   * Obtener todos los dispositivos de una terminal
   */
  async getDevicesByTerminal(terminalId: number): Promise<any[]> {
    const devices = await this.prisma.device.findMany({
      where: {
        terminal: {
          id: terminalId,
        },
        active: true,
      },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    return devices.map((device) => this.mapDevice(device));
  }

  /**
   * Desactivar un dispositivo
   */
  async deactivateDevice(deviceToken: string): Promise<void> {
    const device = await this.resolveDeviceByRawToken(deviceToken);

    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        active: false,
        status: 'RETIRED',
        tokenRevokedAt: new Date(),
        revokeReason: 'Equipo retirado',
      },
    });
  }

  async rotateToken(deviceId: string): Promise<RotateDeviceTokenResponseDto> {
    const current = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!current) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    if (!current.active || current.status === 'REVOKED' || current.status === 'RETIRED') {
      throw new BadRequestException('No se puede rotar token de un equipo revocado/inactivo');
    }

    const rawToken = this.generateDeviceToken();
    const tokenRotatedAt = new Date();

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        deviceToken: this.hashToken(rawToken),
        tokenLast4: rawToken.slice(-4),
        tokenVersion: { increment: 1 },
        tokenRotatedAt,
        tokenIssuedAt: tokenRotatedAt,
      },
    });

    return {
      id: updated.id,
      tokenVersion: updated.tokenVersion,
      tokenRotatedAt,
      deviceToken: rawToken,
      tokenLast4: updated.tokenLast4,
    };
  }

  async revokeDevice(deviceId: string, dto: RevokeDeviceDto): Promise<DeviceDto> {
    const current = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    if (!current) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        active: false,
        status: 'REVOKED',
        tokenRevokedAt: new Date(),
        revokeReason: dto.reason?.trim() || 'Token revocado por seguridad',
        pairingCode: null,
        pairingCodeExpiresAt: null,
      },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    return this.mapDevice(updated);
  }

  async regeneratePairingCode(deviceId: string): Promise<{ pairingCode: string; pairingCodeExpiresAt: Date }> {
    const current = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        terminal: {
          select: { id: true },
        },
      },
    });

    if (!current) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    if (!current.active || current.status === 'REVOKED' || current.status === 'RETIRED') {
      throw new BadRequestException('No se puede generar pairing para un equipo revocado/inactivo');
    }

    const pairingCode = await this.createUniquePairingCode();
    const pairingCodeExpiresAt = new Date(Date.now() + this.pairingCodeMinutes * 60 * 1000);

    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        pairingCode,
        pairingCodeExpiresAt,
        pairingCodeAttempts: 0,
        status: current.terminal ? 'PAIRED' : 'PENDING',
      },
    });

    return { pairingCode, pairingCodeExpiresAt };
  }

  /**
   * Obtener configuración de impresora para una terminal y tipo de documento
   */
  async getPrinterSettings(terminalId: number, documentTypeId: number): Promise<any> {
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
        `No hay configuración de impresora para terminal ${terminalId} y documento tipo ${documentTypeId}`,
      );
    }

    if (!settings.enabled) {
      throw new BadRequestException(
        `La configuración de impresora está deshabilitada para este tipo de documento`,
      );
    }

    return {
      namePrinter: settings.namePrinter,
      characterLine: settings.characterLine,
      withLogo: settings.withLogo,
      maxItems: settings.maxItems,
      linesPerTransaction: settings.linesPerTransaction,
    };
  }

  /**
   * Validar que el número de items no exceda el máximo configurado
   */
  async validateMaxItems(terminalId: number, documentTypeId: number, itemCount: number): Promise<boolean> {
    try {
      const settings = await this.prisma.terminalSettings.findUnique({
        where: {
          terminalId_documentTypeId: {
            terminalId,
            documentTypeId,
          },
        },
      });

      if (!settings) {
        // Si no hay configuración, asumir ilimitado
        return true;
      }

      return itemCount <= settings.maxItems;
    } catch {
      return true;
    }
  }
}

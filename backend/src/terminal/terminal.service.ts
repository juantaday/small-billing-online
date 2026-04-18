import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTerminalDto, TerminalDto, UpdateTerminalDto } from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class TerminalService {
  constructor(private readonly prisma: PrismaService) {}

  private mapTerminalDto(terminal: any): TerminalDto {
    return {
      id: terminal.id,
      code: terminal.code,
      name: terminal.name,
      warehouseId: terminal.warehouseId,
      deviceId: terminal.deviceId,
      deviceToken: terminal.device?.tokenLast4 ? `****${terminal.device.tokenLast4}` : undefined,
      emissionPoint: terminal.emissionPoint,
      active: terminal.active,
      createdAt: terminal.createdAt,
      updatedAt: terminal.updatedAt,
    };
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private async resolveDeviceIdByToken(deviceToken: string, currentTerminalId?: number): Promise<string> {
    const token = deviceToken?.trim();
    if (!token) {
      throw new BadRequestException('deviceToken es requerido para crear o reasignar una terminal');
    }

    const device = await this.prisma.device.findUnique({
      where: { deviceToken: this.hashToken(token) },
      include: {
        terminal: {
          select: { id: true, code: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`No existe un equipo registrado con token ${token}`);
    }

    if (!device.active) {
      throw new BadRequestException('El equipo está inactivo y no puede asociarse a una terminal');
    }

    if (device.terminal && device.terminal.id !== currentTerminalId) {
      throw new BadRequestException(
        `El equipo ya está asociado a la terminal ${device.terminal.code} (ID ${device.terminal.id})`,
      );
    }

    return device.id;
  }

  private async resolveDeviceIdByPairingCode(pairingCode: string, currentTerminalId?: number): Promise<string> {
    const code = pairingCode?.trim();
    if (!code) {
      throw new BadRequestException('pairingCode es requerido para vincular la terminal');
    }

    const device = await this.prisma.device.findUnique({
      where: { pairingCode: code },
      include: {
        terminal: {
          select: { id: true, code: true },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Código de pairing inválido');
    }

    if (!device.active || device.status === 'REVOKED' || device.status === 'RETIRED') {
      throw new BadRequestException('El equipo está inactivo o revocado y no puede asociarse a una terminal');
    }

    if (!device.pairingCodeExpiresAt || device.pairingCodeExpiresAt < new Date()) {
      throw new BadRequestException('El código de pairing expiró, genera uno nuevo');
    }

    if (device.terminal && device.terminal.id !== currentTerminalId) {
      throw new BadRequestException(
        `El equipo ya está asociado a la terminal ${device.terminal.code} (ID ${device.terminal.id})`,
      );
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        status: 'PAIRED',
        pairingCode: null,
        pairingCodeExpiresAt: null,
        pairingCodeAttempts: 0,
      },
    });

    return device.id;
  }

  async findAll(): Promise<TerminalDto[]> {
    const terminals = await this.prisma.terminal.findMany({
      include: {
        warehouse: true,
        device: {
          select: {
            tokenLast4: true,
          },
        },
      },
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    });

    return terminals.map((terminal) => this.mapTerminalDto(terminal));
  }

  async create(data: CreateTerminalDto): Promise<TerminalDto> {
    const hasToken = !!data.deviceToken?.trim();
    const hasPairing = !!data.pairingCode?.trim();

    if (!hasToken && !hasPairing) {
      throw new BadRequestException('Debes enviar deviceToken o pairingCode para asociar la terminal');
    }

    if (hasToken && hasPairing) {
      throw new BadRequestException('Envía solo uno entre deviceToken o pairingCode');
    }

    const deviceId = hasPairing
      ? await this.resolveDeviceIdByPairingCode(data.pairingCode as string)
      : await this.resolveDeviceIdByToken(data.deviceToken as string);

    const created = await this.prisma.terminal.create({
      data: {
        code: data.code.trim(),
        name: data.name?.trim() || null,
        warehouseId: data.warehouseId,
        deviceId,
        emissionPoint: data.emissionPoint.trim(),
        active: data.active ?? true,
      },
      include: {
        device: {
          select: {
            tokenLast4: true,
          },
        },
      },
    });

    return this.mapTerminalDto(created);
  }

  async update(id: number, data: UpdateTerminalDto): Promise<TerminalDto> {
    const existing = await this.prisma.terminal.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            tokenLast4: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Terminal con ID ${id} no encontrada`);
    }

    const hasToken = data.deviceToken !== undefined && !!data.deviceToken?.trim();
    const hasPairing = data.pairingCode !== undefined && !!data.pairingCode?.trim();

    if (hasToken && hasPairing) {
      throw new BadRequestException('Envía solo uno entre deviceToken o pairingCode');
    }

    const deviceId = hasPairing
      ? await this.resolveDeviceIdByPairingCode(data.pairingCode as string, id)
      : hasToken
        ? await this.resolveDeviceIdByToken(data.deviceToken as string, id)
        : undefined;

    const updated = await this.prisma.terminal.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim() : undefined,
        name: data.name !== undefined ? data.name?.trim() || null : undefined,
        warehouseId: data.warehouseId,
        deviceId,
        emissionPoint: data.emissionPoint !== undefined ? data.emissionPoint.trim() : undefined,
        active: data.active,
      },
      include: {
        device: {
          select: {
            tokenLast4: true,
          },
        },
      },
    });

    return this.mapTerminalDto(updated);
  }
}

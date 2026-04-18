import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateInvoiceSequenceDto,
  InvoiceSequenceDto,
  UpdateInvoiceSequenceDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<InvoiceSequenceDto[]> {
    const settings = await this.prisma.terminalSettings.findMany({
      include: {
        terminal: {
          include: {
            warehouse: true,
          },
        },
        documentType: true,
      },
      orderBy: [
        { terminalId: 'asc' },
        { documentTypeId: 'asc' },
      ],
    });

    return settings.map((item) => ({
      id: item.id,
      establishment: item.terminal.warehouse.establishmentCode,
      pointOfSale: item.terminal.emissionPoint,
      documentTypeId: item.documentTypeId,
      lastSequential: item.lastSequential,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async create(data: CreateInvoiceSequenceDto): Promise<InvoiceSequenceDto> {
    const terminal = await this.prisma.terminal.findFirst({
      where: {
        emissionPoint: data.pointOfSale.trim(),
        warehouse: {
          establishmentCode: data.establishment.trim(),
        },
      },
      include: {
        warehouse: true,
      },
    });

    if (!terminal) {
      throw new NotFoundException(
        `No existe terminal para establecimiento ${data.establishment} y punto ${data.pointOfSale}`,
      );
    }

    const setting = await this.prisma.terminalSettings.upsert({
      where: {
        terminalId_documentTypeId: {
          terminalId: terminal.id,
          documentTypeId: data.documentTypeId,
        },
      },
      update: {
        lastSequential: data.lastSequential ?? 0,
      },
      create: {
        terminalId: terminal.id,
        documentTypeId: data.documentTypeId,
        maxItems: 100,
        enabled: true,
        lastSequential: data.lastSequential ?? 0,
      },
    });

    return {
      id: setting.id,
      establishment: terminal.warehouse.establishmentCode,
      pointOfSale: terminal.emissionPoint,
      documentTypeId: setting.documentTypeId,
      lastSequential: setting.lastSequential,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  async update(id: string, data: UpdateInvoiceSequenceDto): Promise<InvoiceSequenceDto> {
    const existing = await this.prisma.terminalSettings.findUnique({
      where: { id },
      include: {
        terminal: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Secuencia con ID ${id} no encontrada`);
    }

    const updated = await this.prisma.terminalSettings.update({
      where: { id },
      data: {
        lastSequential: data.lastSequential,
      },
    });

    return {
      id: updated.id,
      establishment: existing.terminal.warehouse.establishmentCode,
      pointOfSale: existing.terminal.emissionPoint,
      documentTypeId: updated.documentTypeId,
      lastSequential: updated.lastSequential,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

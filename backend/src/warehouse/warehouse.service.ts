import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseDto } from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<WarehouseDto[]> {
    return this.prisma.warehouse.findMany({
      orderBy: [{ establishmentCode: 'asc' }, { id: 'asc' }],
    });
  }

  async create(data: CreateWarehouseDto): Promise<WarehouseDto> {
    return this.prisma.warehouse.create({
      data: {
        name: data.name.trim(),
        establishmentCode: data.establishmentCode.trim(),
        active: data.active ?? true,
      },
    });
  }

  async update(id: number, data: UpdateWarehouseDto): Promise<WarehouseDto> {
    const existing = await this.prisma.warehouse.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Bodega con ID ${id} no encontrada`);
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        establishmentCode:
          data.establishmentCode !== undefined ? data.establishmentCode.trim() : undefined,
        active: data.active,
      },
    });
  }
}

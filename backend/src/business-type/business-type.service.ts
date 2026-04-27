import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BusinessTypeDto,
  CreateBusinessTypeDto,
  UpdateBusinessTypeDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toBusinessTypeDto } from './business-type.mapper';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class BusinessTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findAll(): Promise<BusinessTypeDto[]> {
    const results = await this.prisma.businessType.findMany({
      where:   { active: true },
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    });

    return results.map(toBusinessTypeDto);
  }

  async create(data: CreateBusinessTypeDto): Promise<BusinessTypeDto> {
    try {
      const result = await this.prisma.businessType.create({
        data: {
          code:        data.code?.trim()        || null,
          name:        data.name.trim(),
          group:       data.group,
          description: data.description?.trim() || null,
          active:      data.active              ?? true,
        },
      });

      this.logger.log(
        `BusinessType creado — ID: ${result.id} | Grupo: ${result.group} | Nombre: ${result.name}`,
        BusinessTypeService.name,
      );

      return toBusinessTypeDto(result);
    } catch (error) {
      return this.handlePrismaError(error, { id: null });
    }
  }

  async update(id: number, data: UpdateBusinessTypeDto): Promise<BusinessTypeDto> {
    try {
      const result = await this.prisma.businessType.update({
        where: { id },
        data: {
          ...(data.code        !== undefined && { code:        data.code?.trim()        || null }),
          ...(data.name        !== undefined && { name:        data.name.trim() }),
          ...(data.group       !== undefined && { group:       data.group }),
          ...(data.description !== undefined && { description: data.description?.trim() || null }),
          ...(data.active      !== undefined && { active:      data.active }),
        },
      });

      this.logger.log(
        `BusinessType actualizado — ID: ${id}`,
        BusinessTypeService.name,
      );

      return toBusinessTypeDto(result);
    } catch (error) {
      return this.handlePrismaError(error, { id });
    }
  }

  // ─── Manejo centralizado de errores de Prisma ────────────────────────────
  private handlePrismaError(error: unknown, context: { id: number | null }): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          this.logger.warn(
            `Conflicto de unicidad — campos: ${(error.meta?.target as string[])?.join(', ')}`,
            BusinessTypeService.name,
          );
          throw new ConflictException(
            'Ya existe un tipo de negocio con ese nombre y grupo',
          );

        case 'P2025':
          this.logger.warn(
            `Registro no encontrado — ID: ${context.id}`,
            BusinessTypeService.name,
          );
          throw new NotFoundException(
            `Tipo de negocio con ID ${context.id} no encontrado`,
          );
      }
    }

    this.logger.error(
      'Error inesperado en BusinessTypeService',
      error instanceof Error ? error.stack : String(error),
      BusinessTypeService.name,
    );
    throw error;
  }
}
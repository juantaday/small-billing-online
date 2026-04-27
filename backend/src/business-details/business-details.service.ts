import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BusinessDetailsDto,
  CreateBusinessDetailsDto,
  UpdateBusinessDetailsDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toBusinessDetailsDto } from './business-details.mapper';
import { LoggerService } from 'src/common/logger/logger.service';

const BUSINESS_DETAILS_INCLUDE = {
  legalNature: true,
  taxRegime: true,
  specialDesignation: true,
} satisfies Prisma.BusinessDetailsInclude;

@Injectable()
export class BusinessDetailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findCurrent(): Promise<BusinessDetailsDto | null> {
    const result = await this.prisma.businessDetails.findFirst({
      orderBy: { commercialName: 'asc' },
      include: BUSINESS_DETAILS_INCLUDE,
    });

    if (!result) {
      this.logger.warn(
        'No se encontró ningún detalle de negocio registrado',
        BusinessDetailsService.name,
      );
      return null;
    }

    return toBusinessDetailsDto(result);
  }

  async create(data: CreateBusinessDetailsDto): Promise<BusinessDetailsDto> {
    try {
      const hasSpecialDesignationId =
        typeof data.specialDesignationId === 'number';

      const result = await this.prisma.businessDetails.create({
        data: {
          ruc:            data.ruc.trim(),
          legalName:      data.legalName.trim(),
          commercialName: data.commercialName?.trim(),
          tradeName:      data.tradeName?.trim(),
          phone:          data.phone?.trim(),
          address:        data.address?.trim(),
          legalNature:    { connect: { id: data.legalNatureId } },
          taxRegime:      { connect: { id: data.taxRegimeId } },
          ...(hasSpecialDesignationId && {
            specialDesignation: { connect: { id: data.specialDesignationId } },
          }),
        },
        include: BUSINESS_DETAILS_INCLUDE,
      });

      this.logger.log(
        `BusinessDetails creado — ID: ${result.id} | RUC: ${result.ruc}`,
        BusinessDetailsService.name,
      );

      return toBusinessDetailsDto(result);
    } catch (error) {
      this.logger.error(
        'Error al crear BusinessDetails',
        error instanceof Error ? error.stack : String(error),
        BusinessDetailsService.name,
      );  
      return this.handlePrismaError(error, { id: null });
    }
  }

  async update(id: string, data: UpdateBusinessDetailsDto): Promise<BusinessDetailsDto> {
    try {
      const result = await this.prisma.businessDetails.update({
        where: { id },
        data: {
          ...(data.ruc            !== undefined && { ruc:            data.ruc.trim() }),
          ...(data.legalName      !== undefined && { legalName:      data.legalName.trim() }),
          ...(data.commercialName !== undefined && { commercialName: data.commercialName.trim() }),
          ...(data.tradeName      !== undefined && { tradeName:      data.tradeName.trim() }),
          ...(data.phone          !== undefined && { phone:          data.phone.trim() }),
          ...(data.address        !== undefined && { address:        data.address.trim() }),

          ...(data.legalNatureId !== undefined && {
            legalNature: { connect: { id: data.legalNatureId } },
          }),
          ...(data.taxRegimeId !== undefined && {
            taxRegime: { connect: { id: data.taxRegimeId } },
          }),

          ...(data.specialDesignationId !== undefined && {
            specialDesignation: data.specialDesignationId === null
              ? { disconnect: true }
              : { connect: { id: data.specialDesignationId } },
          }),
        },
        include: BUSINESS_DETAILS_INCLUDE,
      });

      this.logger.log(
        `BusinessDetails actualizado — ID: ${id}`,
        BusinessDetailsService.name,
      );

      return toBusinessDetailsDto(result);
    } catch (error) {
      return this.handlePrismaError(error, { id });
    }
  }

  // ─── Manejo centralizado de errores de Prisma ──────────────────────────────
  private handlePrismaError(error: unknown, context: { id: string | null }): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          this.logger.warn(
            `Conflicto de unicidad — campos: ${(error.meta?.target as string[])?.join(', ')}`,
            BusinessDetailsService.name,
          );
          throw new ConflictException(
            'Ya existe un detalle de negocio con ese RUC o nombre comercial',
          );

        case 'P2025':
          this.logger.warn(
            `Registro no encontrado — ID: ${context.id}`,
            BusinessDetailsService.name,
          );
          throw new NotFoundException(
            `Detalle de negocio con ID ${context.id} no encontrado`,
          );

        case 'P2003':
          this.logger.warn(
            `FK inválida — campo: ${error.meta?.field_name}`,
            BusinessDetailsService.name,
          );
          throw new NotFoundException(
            'Uno de los tipos de negocio referenciados no existe',
          );
      }
    }

    this.logger.error(
      'Error inesperado en BusinessDetailsService',
      error instanceof Error ? error.stack : String(error),
      BusinessDetailsService.name,
    );
    throw error;
  }
}
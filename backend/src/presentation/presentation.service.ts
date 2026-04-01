import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreatePresentationDto,
  PresentationDto,
  UpdatePresentationDto,
  UpdateStockDto,
} from '@small-billing/shared';
import { LoggerService } from '../common/logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';

const presentationWithTypeInclude = {
  presentationType: true,
} as const;

const presentationWithTypeAndStockInclude = {
  presentationType: true,
  product: {
    include: {
      productStock: true,
    },
  },
} as const;

@Injectable()
export class PresentationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  private normalizeText(value?: string | null): string {
    return (value || '').trim().toLowerCase();
  }

  private async isUnidadType(presentationTypeId: string): Promise<boolean> {
    const type = await this.prisma.presentationType.findUnique({
      where: { id: presentationTypeId },
      select: { name: true },
    });

    return this.normalizeText(type?.name) === 'unidad';
  }

  private resolveFactorToBase(
    presentationId: string,
    map: Map<string, { id: string; quantity: number; presentationInferenceId: string | null }>,
    cache: Map<string, number>,
    visited: Set<string> = new Set(),
  ): number {
    const cached = cache.get(presentationId);
    if (cached !== undefined) return cached;

    const node = map.get(presentationId);
    if (!node) return 1;

    if (visited.has(presentationId)) {
      throw new Error('Referencia circular en presentation_inference');
    }

    visited.add(presentationId);

    const isBase = !node.presentationInferenceId || node.presentationInferenceId === node.id;
    const factor = isBase
      ? node.quantity
      : node.quantity * this.resolveFactorToBase(node.presentationInferenceId, map, cache, visited);

    visited.delete(presentationId);
    cache.set(presentationId, factor);
    return factor;
  }

  private toDto(
    presentation: any,
    stock?: { stock: number; minStock: number; maxStock: number | null },
    factorToBase = 1,
  ): PresentationDto {
    return {
      id: presentation.id,
      productId: presentation.productId,
      presentationTypeId: presentation.presentationTypeId,
      presentationInferenceId: presentation.presentationInferenceId,
      baseUnitsQuantity: presentation.baseUnitsQuantity,
      presentationType: presentation.presentationType,
      barcode: presentation.barcode,
      costPrice: presentation.costPrice.toNumber(),
      lastCostPrice: presentation.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: presentation.averageCostPrice?.toNumber() ?? null,
      salePrice: presentation.salePrice.toNumber(),
      quantity: presentation.quantity,
      stock: stock ? Math.floor(stock.stock / Math.max(factorToBase, 1)) : undefined,
      minStock: stock ? Math.floor(stock.minStock / Math.max(factorToBase, 1)) : undefined,
      maxStock: stock?.maxStock ? Math.floor(stock.maxStock / Math.max(factorToBase, 1)) : undefined,
      active: presentation.active,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    };
  }

  private resolveFactorFromStoredBaseUnits(presentation: any): number {
    const value = Number(presentation?.baseUnitsQuantity ?? 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  private async getStockByProductId(productId: string) {
    return this.prisma.productStock.findUnique({
      where: { productId },
      select: {
        stock: true,
        minStock: true,
        maxStock: true,
      },
    });
  }

  async findByProduct(productId: string): Promise<PresentationDto[]> {
    const startedAt = Date.now();
    const [presentations, stock] = await Promise.all([
      this.prisma.presentation.findMany({
        where: { productId, active: true },
        include: presentationWithTypeInclude,
        orderBy: { baseUnitsQuantity: 'asc' },
      }),
      this.getStockByProductId(productId),
    ]);

    const result = presentations.map((presentation) => {
      const factorToBase = this.resolveFactorFromStoredBaseUnits(presentation);
      return this.toDto(presentation, stock || undefined, factorToBase);
    });

    this.logger.info(
      {
        operation: 'findByProduct',
        productId,
        totalPresentations: result.length,
        durationMs: Date.now() - startedAt,
      },
      'PresentationPerformance',
    );

    return result;
  }

  async findOne(id: string): Promise<PresentationDto | null> {
    const presentation = await this.prisma.presentation.findUnique({
      where: { id },
      include: presentationWithTypeInclude,
    });

    if (!presentation) return null;
    const stock = await this.getStockByProductId(presentation.productId);
    const factorToBase = this.resolveFactorFromStoredBaseUnits(presentation);
    return this.toDto(presentation, stock || undefined, factorToBase);
  }

  async findByBarcode(barcode: string): Promise<PresentationDto | null> {
    const presentation = await this.prisma.presentation.findUnique({
      where: { barcode },
      include: presentationWithTypeInclude,
    });

    if (!presentation) return null;
    const stock = await this.getStockByProductId(presentation.productId);
    const factorToBase = this.resolveFactorFromStoredBaseUnits(presentation);
    return this.toDto(presentation, stock || undefined, factorToBase);
  }

  async create(data: CreatePresentationDto): Promise<PresentationDto> {
    this.logger.log(
      `Creando presentación de tipo: ${data.presentationTypeId} - ${data.barcode || 'sin código'}`,
      'PresentationService',
    );
    
    const duplicateType = await this.prisma.presentation.findFirst({
      where: {
        productId: data.productId,
        presentationTypeId: data.presentationTypeId,
      },
      select: { id: true },
    });

    if (duplicateType) {
      throw new BadRequestException('Ya existe una presentación de este tipo para el producto.');
    }

    const isUnidad = await this.isUnidadType(data.presentationTypeId);
    if (!isUnidad && !data.presentationInferenceId) {
      throw new BadRequestException(
        'Debes seleccionar la presentación base (presentationInferenceId) para crear esta presentación.',
      );
    }

    if (data.presentationInferenceId) {
      const inferred = await this.prisma.presentation.findUnique({
        where: { id: data.presentationInferenceId },
      });

      if (!inferred || inferred.productId !== data.productId) {
        throw new Error('La referencia de presentación debe pertenecer al mismo producto');
      }
    }

    const presentation = await this.prisma.presentation.create({
      data: {
        productId: data.productId,
        presentationTypeId: data.presentationTypeId,
        presentationInferenceId: data.presentationInferenceId,
        quantity: data.quantity,
        barcode: data.barcode,
        costPrice: data.costPrice,
        lastCostPrice: data.lastCostPrice,
        averageCostPrice: data.averageCostPrice,
        salePrice: data.salePrice,
        active: data.active,
      },
      include: presentationWithTypeInclude,
    });

    if (!presentation.presentationInferenceId) {
      await this.prisma.presentation.update({
        where: { id: presentation.id },
        data: { presentationInferenceId: presentation.id },
      });
      presentation.presentationInferenceId = presentation.id;
    }

    this.logger.log(`Presentación creada exitosamente: ${presentation.id}`, 'PresentationService');
    this.logger.logDatabaseOperation('CREATE', 'Presentation', {
      presentationTypeId: data.presentationTypeId,
      barcode: data.barcode,
    });

    const productPresentations = await this.prisma.presentation.findMany({
      where: { productId: presentation.productId, active: true },
      select: {
        id: true,
        quantity: true,
        presentationInferenceId: true,
      },
    });
    const map = new Map(
      productPresentations.map((item) => [
        item.id,
        {
          id: item.id,
          quantity: item.quantity,
          presentationInferenceId: item.presentationInferenceId,
        },
      ]),
    );
    const factorToBase = this.resolveFactorToBase(presentation.id, map, new Map());
    const stock = await this.getStockByProductId(presentation.productId);
    return this.toDto(presentation, stock || undefined, factorToBase);
  }

  async update(id: string, data: UpdatePresentationDto): Promise<PresentationDto> {
    this.logger.log(`Actualizando presentación: ${id}`, 'PresentationService');

    const current = await this.prisma.presentation.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        presentationTypeId: true,
        presentationInferenceId: true,
      },
    });

    if (!current) {
      throw new NotFoundException(`Presentación no encontrada: ${id}`);
    }

    const nextTypeId = data.presentationTypeId || current.presentationTypeId;
    const duplicateType = await this.prisma.presentation.findFirst({
      where: {
        productId: current.productId,
        presentationTypeId: nextTypeId,
        id: {
          not: id,
        },
      },
      select: { id: true },
    });

    if (duplicateType) {
      throw new BadRequestException('Ya existe una presentación de este tipo para el producto.');
    }

    const isUnidad = await this.isUnidadType(nextTypeId);
    const nextInferenceId = data.presentationInferenceId ?? current.presentationInferenceId ?? null;
    if (!isUnidad && !nextInferenceId) {
      throw new BadRequestException(
        'Debes seleccionar la presentación base (presentationInferenceId) para actualizar esta presentación.',
      );
    }
    
    if (data.presentationInferenceId) {
      const inferred = await this.prisma.presentation.findUnique({
        where: { id: data.presentationInferenceId },
      });

      if (!current || !inferred || current.productId !== inferred.productId) {
        throw new Error('La referencia de presentación debe pertenecer al mismo producto');
      }
    }

    const presentation = await this.prisma.presentation.update({
      where: { id },
      data: {
        presentationTypeId: data.presentationTypeId,
        presentationInferenceId: data.presentationInferenceId,
        quantity: data.quantity,
        costPrice: data.costPrice,
        lastCostPrice: data.lastCostPrice,
        averageCostPrice: data.averageCostPrice,
        salePrice: data.salePrice,
        active: data.active,
      },
      include: presentationWithTypeInclude,
    });

    this.logger.log(`Presentación actualizada exitosamente: ${id}`, 'PresentationService');
    this.logger.logDatabaseOperation('UPDATE', 'Presentation', { id, ...data });

    const productPresentations = await this.prisma.presentation.findMany({
      where: { productId: presentation.productId, active: true },
      select: {
        id: true,
        quantity: true,
        presentationInferenceId: true,
      },
    });
    const map = new Map(
      productPresentations.map((item) => [
        item.id,
        {
          id: item.id,
          quantity: item.quantity,
          presentationInferenceId: item.presentationInferenceId,
        },
      ]),
    );
    const factorToBase = this.resolveFactorToBase(presentation.id, map, new Map());
    const stock = await this.getStockByProductId(presentation.productId);
    return this.toDto(presentation, stock || undefined, factorToBase);
  }

  async updateStock(data: UpdateStockDto): Promise<PresentationDto> {
    this.logger.log(`Actualizando stock de presentación: ${data.id} - Cantidad: ${data.quantity}`, 'PresentationService');
    
    const presentation = await this.prisma.presentation.findUnique({
      where: { id: data.id },
      include: presentationWithTypeAndStockInclude,
    });

    if (!presentation) {
      this.logger.warn(`Presentación no encontrada: ${data.id}`, 'PresentationService');
      throw new Error('Presentation not found');
    }

    const productPresentations = await this.prisma.presentation.findMany({
      where: { productId: presentation.productId, active: true },
      select: {
        id: true,
        quantity: true,
        presentationInferenceId: true,
      },
    });

    const map = new Map(
      productPresentations.map((item) => [
        item.id,
        {
          id: item.id,
          quantity: item.quantity,
          presentationInferenceId: item.presentationInferenceId,
        },
      ]),
    );

    const factorToBase = this.resolveFactorToBase(presentation.id, map, new Map());
    const movementInBaseUnits = data.quantity * factorToBase;
    const currentStock = presentation.product?.productStock?.stock ?? 0;
    const newStock = currentStock + movementInBaseUnits;

    if (newStock < 0) {
      this.logger.warn(`Stock insuficiente para presentación: ${data.id} - Stock actual: ${currentStock} - Movimiento base: ${movementInBaseUnits}`, 'PresentationService');
      throw new Error('Insufficient stock');
    }

    await this.prisma.productStock.update({
      where: { productId: presentation.productId },
      data: { stock: newStock },
    });

    const updated = await this.prisma.presentation.findUnique({
      where: { id: data.id },
      include: presentationWithTypeInclude,
    });

    if (!updated) {
      throw new NotFoundException(`Presentación no encontrada: ${data.id}`);
    }

    const stock = await this.getStockByProductId(updated.productId);
    return this.toDto(updated, stock || undefined, factorToBase);
  }

  async getLowStock(): Promise<PresentationDto[]> {
    const presentations = await this.prisma.presentation.findMany({
      where: {
        active: true,
        product: {
          productStock: {
            stock: {
              lte: this.prisma.productStock.fields.minStock,
            },
          },
        },
      },
      include: {
        presentationType: true,
        product: {
          include: {
            category: true,
            productStock: true,
          },
        },
      },
    });

    const groupedByProduct = new Map<string, typeof presentations>();
    for (const presentation of presentations) {
      const list = groupedByProduct.get(presentation.productId) || [];
      list.push(presentation);
      groupedByProduct.set(presentation.productId, list);
    }

    const result: PresentationDto[] = [];
    for (const productPresentations of groupedByProduct.values()) {
      const map = new Map(
        productPresentations.map((item) => [
          item.id,
          {
            id: item.id,
            quantity: item.quantity,
            presentationInferenceId: item.presentationInferenceId,
          },
        ]),
      );
      const cache = new Map<string, number>();
      const stock = productPresentations[0]?.product?.productStock;
      for (const presentation of productPresentations) {
        const factorToBase = this.resolveFactorToBase(presentation.id, map, cache);
        result.push(this.toDto(presentation, stock || undefined, factorToBase));
      }
    }

    return result;
  }

  async remove(id: string): Promise<PresentationDto> {
    this.logger.log(`Eliminando presentación: ${id}`, 'PresentationService');

    const current = await this.prisma.presentation.findUnique({
      where: { id },
      include: presentationWithTypeInclude,
    });

    if (!current) {
      throw new NotFoundException(`Presentación no encontrada: ${id}`);
    }

    await this.prisma.product.updateMany({
      where: { defaultPurchasePresentationId: id },
      data: { defaultPurchasePresentationId: null },
    });

    await this.prisma.product.updateMany({
      where: { defaultSalePresentationId: id },
      data: { defaultSalePresentationId: null },
    });

    try {
      const stock = await this.getStockByProductId(current.productId);

      const deleted = await this.prisma.presentation.delete({
        where: { id },
        include: presentationWithTypeInclude,
      });

      this.logger.log(`Presentación eliminada físicamente: ${id}`, 'PresentationService');
      this.logger.logDatabaseOperation('DELETE', 'Presentation', { id, hardDelete: true });

      const productPresentations = await this.prisma.presentation.findMany({
        where: { productId: deleted.productId, active: true },
        select: {
          id: true,
          quantity: true,
          presentationInferenceId: true,
        },
      });

      const map = new Map(
        productPresentations.map((item) => [
          item.id,
          {
            id: item.id,
            quantity: item.quantity,
            presentationInferenceId: item.presentationInferenceId,
          },
        ]),
      );

      const factorToBase = this.resolveFactorToBase(current.id, map, new Map());
      return this.toDto(current, stock || undefined, factorToBase);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new BadRequestException(
          'No se puede eliminar esta presentación porque tiene movimientos o relaciones. Desactívala en su lugar.',
        );
      }

      throw error;
    }
  }
}

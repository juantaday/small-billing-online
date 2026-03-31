import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  CreatePresentationDto,
  PresentationDto,
  UpdatePresentationDto,
  UpdateStockDto,
} from '@small-billing/shared';
import { LoggerService } from '../common/logger/logger.service';

const prisma = new PrismaClient();
const presentationWithTypeInclude = {
  presentationType: true,
  product: {
    include: {
      productStock: true,
    },
  },
} as const;

@Injectable()
export class PresentationService {
  constructor(private readonly logger: LoggerService) {}

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

  async findByProduct(productId: string): Promise<PresentationDto[]> {
    const presentations = await prisma.presentation.findMany({
      where: { productId, active: true },
      include: presentationWithTypeInclude,
    });

    const presentationMap = new Map(
      presentations.map((presentation) => [
        presentation.id,
        {
          id: presentation.id,
          quantity: presentation.quantity,
          presentationInferenceId: presentation.presentationInferenceId,
        },
      ]),
    );
    const factorCache = new Map<string, number>();
    const stock = presentations[0]?.product?.productStock;

    return presentations.map((presentation) => {
      const factorToBase = this.resolveFactorToBase(presentation.id, presentationMap, factorCache);
      return this.toDto(presentation, stock || undefined, factorToBase);
    });
  }

  async findOne(id: string): Promise<PresentationDto | null> {
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: presentationWithTypeInclude,
    });

    if (!presentation) return null;

    const productPresentations = await prisma.presentation.findMany({
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
    return this.toDto(presentation, presentation.product?.productStock || undefined, factorToBase);
  }

  async findByBarcode(barcode: string): Promise<PresentationDto | null> {
    const presentation = await prisma.presentation.findUnique({
      where: { barcode },
      include: presentationWithTypeInclude,
    });

    if (!presentation) return null;

    const productPresentations = await prisma.presentation.findMany({
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
    return this.toDto(presentation, presentation.product?.productStock || undefined, factorToBase);
  }

  async create(data: CreatePresentationDto): Promise<PresentationDto> {
    this.logger.log(
      `Creando presentación de tipo: ${data.presentationTypeId} - ${data.barcode || 'sin código'}`,
      'PresentationService',
    );
    
    if (data.presentationInferenceId) {
      const inferred = await prisma.presentation.findUnique({
        where: { id: data.presentationInferenceId },
      });

      if (!inferred || inferred.productId !== data.productId) {
        throw new Error('La referencia de presentación debe pertenecer al mismo producto');
      }
    }

    const presentation = await prisma.presentation.create({
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
      await prisma.presentation.update({
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

    const productPresentations = await prisma.presentation.findMany({
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
    return this.toDto(presentation, presentation.product?.productStock || undefined, factorToBase);
  }

  async update(id: string, data: UpdatePresentationDto): Promise<PresentationDto> {
    this.logger.log(`Actualizando presentación: ${id}`, 'PresentationService');
    
    if (data.presentationInferenceId) {
      const current = await prisma.presentation.findUnique({ where: { id } });
      const inferred = await prisma.presentation.findUnique({
        where: { id: data.presentationInferenceId },
      });

      if (!current || !inferred || current.productId !== inferred.productId) {
        throw new Error('La referencia de presentación debe pertenecer al mismo producto');
      }
    }

    const presentation = await prisma.presentation.update({
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

    const productPresentations = await prisma.presentation.findMany({
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
    return this.toDto(presentation, presentation.product?.productStock || undefined, factorToBase);
  }

  async updateStock(data: UpdateStockDto): Promise<PresentationDto> {
    this.logger.log(`Actualizando stock de presentación: ${data.id} - Cantidad: ${data.quantity}`, 'PresentationService');
    
    const presentation = await prisma.presentation.findUnique({
      where: { id: data.id },
      include: presentationWithTypeInclude,
    });

    if (!presentation) {
      this.logger.warn(`Presentación no encontrada: ${data.id}`, 'PresentationService');
      throw new Error('Presentation not found');
    }

    const productPresentations = await prisma.presentation.findMany({
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

    await prisma.productStock.update({
      where: { productId: presentation.productId },
      data: { stock: newStock },
    });

    const updated = await prisma.presentation.findUnique({
      where: { id: data.id },
      include: presentationWithTypeInclude,
    });

    return this.toDto(updated, updated?.product?.productStock || undefined, factorToBase);
  }

  async getLowStock(): Promise<PresentationDto[]> {
    const presentations = await prisma.presentation.findMany({
      where: {
        active: true,
        product: {
          productStock: {
            stock: {
              lte: prisma.productStock.fields.minStock,
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

    const current = await prisma.presentation.findUnique({
      where: { id },
      include: presentationWithTypeInclude,
    });

    if (!current) {
      throw new NotFoundException(`Presentación no encontrada: ${id}`);
    }

    await prisma.product.updateMany({
      where: { defaultPurchasePresentationId: id },
      data: { defaultPurchasePresentationId: null },
    });

    await prisma.product.updateMany({
      where: { defaultSalePresentationId: id },
      data: { defaultSalePresentationId: null },
    });

    try {
      const deleted = await prisma.presentation.delete({
        where: { id },
        include: presentationWithTypeInclude,
      });

      this.logger.log(`Presentación eliminada físicamente: ${id}`, 'PresentationService');
      this.logger.logDatabaseOperation('DELETE', 'Presentation', { id, hardDelete: true });

      const productPresentations = await prisma.presentation.findMany({
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
      return this.toDto(current, current.product?.productStock || undefined, factorToBase);
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

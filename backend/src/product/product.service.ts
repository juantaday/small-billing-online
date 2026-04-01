import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import {
  CreateProductDto,
  ProductDto,
  ProductTaxSelectionDto,
  UpdateProductDto,
  ProductWithRelationsDto,
  FinalizeProductWizardDto,
  FinalizeProductWizardPresentationDto,
} from '@small-billing/shared';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private async ensureBasePresentationAndStock(
    tx: Prisma.TransactionClient,
    productId: string,
  ): Promise<void> {
    const unitType = await tx.presentationType.findFirst({
      where: {
        active: true,
        name: { equals: 'Unidad', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!unitType) {
      throw new BadRequestException('No existe un tipo de presentación activo llamado Unidad.');
    }

    const existingBase = await tx.presentation.findFirst({
      where: { productId, presentationTypeId: unitType.id },
      orderBy: { createdAt: 'asc' },
    });

    if (!existingBase) {
      const createdBase = await tx.presentation.create({
        data: {
          productId,
          presentationTypeId: unitType.id,
          quantity: 1,
          barcode: null,
          costPrice: 0,
          lastCostPrice: 0,
          averageCostPrice: 0,
          salePrice: 0,
          active: true,
        },
      });

      await tx.presentation.update({
        where: { id: createdBase.id },
        data: { presentationInferenceId: createdBase.id },
      });
    }

    await tx.productStock.upsert({
      where: { productId },
      update: { stockPresentationTypeId: unitType.id },
      create: {
        productId,
        stockPresentationTypeId: unitType.id,
        stock: 0,
        minStock: 0,
        maxStock: null,
      },
    });
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    return value.toNumber();
  }

  private toPercentFraction(value: Prisma.Decimal | number | null | undefined): number {
    const numericValue = this.toNumber(value);
    return numericValue > 1 ? numericValue / 100 : numericValue;
  }

  private normalizeSelectedTaxes(selectedTaxes?: ProductTaxSelectionDto[]): ProductTaxSelectionDto[] {
    if (!selectedTaxes?.length) return [];

    const byCode = new Map<string, ProductTaxSelectionDto>();
    for (const tax of selectedTaxes) {
      const code = String(tax?.taxValueCode || '').trim();
      if (!code) continue;
      byCode.set(code, { ...tax, taxValueCode: code });
    }

    return Array.from(byCode.values());
  }

  private async resolveExistingTaxSelections(
    tx: Prisma.TransactionClient,
    selectedTaxes: ProductTaxSelectionDto[],
  ): Promise<{
    validTaxes: ProductTaxSelectionDto[];
    invalidCodes: string[];
    taxValueByCode: Map<string, { code: string; percentage: Prisma.Decimal }>;
  }> {
    if (!selectedTaxes.length) {
      return { validTaxes: [], invalidCodes: [], taxValueByCode: new Map() };
    }

    const codes = selectedTaxes.map((tax) => tax.taxValueCode);
    const existingTaxValues = await tx.taxValue.findMany({
      where: { code: { in: codes } },
      select: { code: true, percentage: true },
    });

    const existingCodeSet = new Set(existingTaxValues.map((tv) => tv.code));
    const taxValueByCode = new Map(existingTaxValues.map((tv) => [tv.code, tv]));
    const validTaxes = selectedTaxes.filter((tax) => existingCodeSet.has(tax.taxValueCode));
    const invalidCodes = codes.filter((code) => !existingCodeSet.has(code));

    return { validTaxes, invalidCodes, taxValueByCode };
  }

  private async resolveDefaultTaxes(
    tx: Prisma.TransactionClient,
  ): Promise<ProductTaxSelectionDto[]> {
    const configuredDefaults = await tx.productTaxDefault.findMany({
      where: { active: true, taxGroup: 'IVA' },
      include: { taxValue: true },
    });

    if (configuredDefaults.length > 0) {
      return configuredDefaults.map((item) => ({
        taxValueCode: item.taxValueCode,
        taxValueDescription: item.taxValue.description,
        percentage: this.toNumber(item.taxValue.percentage),
        isDefaultVat: item.taxGroup === 'IVA',
      }));
    }

    const fallbackIva = await tx.taxValue.findUnique({ where: { code: '2' } });

    if (!fallbackIva) return [];

    return [
      {
        taxValueCode: fallbackIva.code,
        taxValueDescription: fallbackIva.description,
        percentage: this.toNumber(fallbackIva.percentage),
        isDefaultVat: true,
      },
    ];
  }

  private mapProductWithRelations(product: any): ProductWithRelationsDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      categoryId: product.categoryId,
      defaultPurchasePresentationId: product.defaultPurchasePresentationId,
      defaultSalePresentationId: product.defaultSalePresentationId,
      featured: product.featured,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category,
      images: product.images || [],
      presentations: product.presentations || [],
      productStock: product.productStock,
      productTaxes: (product.productTaxes || []).map((tax: any) => ({
        taxValueCode: tax.taxValueCode,
        taxValueDescription: tax.taxValue?.description || '',
        percentage: tax.taxValue ? this.toNumber(tax.taxValue.percentage) : 0,
        appliedRate: this.toNumber(tax.appliedRate),
        isDefaultVat: tax.isDefaultVat,
      })),
      salePrice: 0,
      lastCostPrice: 0,
      averageCostPrice: 0,
    };
  }

  /** Include liviano para refrescos de UI (evita relaciones costosas) */
  private get lightInclude() {
    return {
      category: { select: { id: true, name: true } },
      presentations: {
        where: { active: true },
        select: {
          id: true,
          presentationTypeId: true,
          quantity: true,
          barcode: true,
          costPrice: true,
          salePrice: true,
          active: true,
        },
      },
      productStock: {
        select: { id: true, stock: true, minStock: true, maxStock: true },
      },
    };
  }

  /** Include mínimo post-finalize (solo datos necesarios, sin relaciones) */
  private get minimalInclude() {
    return {
      category: { select: { id: true, name: true } },
      presentations: {
        where: { active: true },
        select: {
          id: true,
          presentationTypeId: true,
          quantity: true,
          barcode: true,
          costPrice: true,
          salePrice: true,
          active: true,
        },
      },
    };
  }

  /** Include reutilizable para todas las queries con relaciones */
  private get fullInclude() {
    return {
      category: true,
      images: { orderBy: { displayOrder: 'asc' } as const },
      productTaxes: {
        where: { active: true },
        include: { taxValue: true },
      },
      presentations: {
        where: { active: true },
        include: { presentationType: true },
      },
      productStock: {
        include: { stockPresentationType: true },
      },
    };
  }

  private toCreateInput(data: CreateProductDto): Prisma.ProductUncheckedCreateInput {
    return {
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      defaultPurchasePresentationId: data.defaultPurchasePresentationId,
      defaultSalePresentationId: data.defaultSalePresentationId,
      featured: data.featured ?? false,
      active: data.active ?? true,
    };
  }

  private toUpdateInput(data: UpdateProductDto): Prisma.ProductUncheckedUpdateInput {
    return {
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      defaultPurchasePresentationId: data.defaultPurchasePresentationId,
      defaultSalePresentationId: data.defaultSalePresentationId,
      featured: data.featured,
      active: data.active,
    };
  }

  private buildTaxSyncSignature(
    rows: Array<{ taxValueCode: string; appliedRate: number; isDefaultVat: boolean }>,
  ): string {
    return rows
      .map((row) => ({
        taxValueCode: row.taxValueCode,
        appliedRate: Number(row.appliedRate.toFixed(6)),
        isDefaultVat: Boolean(row.isDefaultVat),
      }))
      .sort((a, b) => a.taxValueCode.localeCompare(b.taxValueCode))
      .map((row) => `${row.taxValueCode}:${row.appliedRate}:${row.isDefaultVat ? '1' : '0'}`)
      .join('|');
  }

  // ─── Queries públicas ────────────────────────────────────────────────────────

  async findAll(): Promise<ProductWithRelationsDto[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: this.fullInclude,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => this.mapProductWithRelations(p));
  }

  async findByCategory(categoryId: string): Promise<ProductWithRelationsDto[]> {
    const products = await this.prisma.product.findMany({
      where: { categoryId, active: true },
      include: this.fullInclude,
    });

    return products.map((p) => this.mapProductWithRelations(p));
  }

  async findOne(id: string, options?: { light?: boolean }): Promise<ProductWithRelationsDto | null> {
    const startedAt = Date.now();
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: options?.light ? this.minimalInclude : this.fullInclude,
    });

    if (!product) return null;

    const productAny = product as any;

    this.logger.info(
      {
        operation: 'findOne',
        productId: id,
        mode: options?.light ? 'light' : 'full',
        durationMs: Date.now() - startedAt,
        presentations: productAny.presentations?.length || 0,
        images: productAny.images?.length || 0,
        taxes: productAny.productTaxes?.length || 0,
      },
      'ProductPerformance',
    );

    return this.mapProductWithRelations(product);
  }

  async findBySlug(slug: string): Promise<ProductWithRelationsDto | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: this.fullInclude,
    });

    if (!product) return null;

    return this.mapProductWithRelations(product);
  }

  async getFeatured(): Promise<ProductWithRelationsDto[]> {
    const products = await this.prisma.product.findMany({
      where: { featured: true, active: true },
      include: {
        category: true,
        images: { where: { isPrimary: true } },
        productTaxes: {
          where: { active: true },
          include: { taxValue: true },
        },
        presentations: {
          where: { active: true },
          take: 1,
          include: { presentationType: true },
        },
        productStock: {
          include: { stockPresentationType: true },
        },
      },
      take: 10,
    });

    return products.map((p) => this.mapProductWithRelations(p));
  }

  // ─── Mutations ───────────────────────────────────────────────────────────────

  async create(data: CreateProductDto): Promise<ProductDto> {
    const startedAt = Date.now();
    try {
      this.logger.log(`Creando producto: ${data.name}`, 'ProductService');

      const selectedTaxes = this.normalizeSelectedTaxes(data.selectedTaxes);

      const product = await this.prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: this.toCreateInput(data),
        });

        await this.ensureBasePresentationAndStock(tx, createdProduct.id);

        const taxesToApply =
          selectedTaxes.length > 0 ? selectedTaxes : await this.resolveDefaultTaxes(tx);

        const { validTaxes, invalidCodes, taxValueByCode } =
          await this.resolveExistingTaxSelections(tx, taxesToApply);

        if (invalidCodes.length > 0) {
          throw new BadRequestException(
            `Códigos de impuesto inválidos o inexistentes: ${invalidCodes.join(', ')}`,
          );
        }

        if (validTaxes.length > 0) {
          await tx.productTax.createMany({
            data: validTaxes.map((tax) => ({
              productId: createdProduct.id,
              taxValueCode: tax.taxValueCode,
              appliedRate: this.toPercentFraction(taxValueByCode.get(tax.taxValueCode)?.percentage),
              isDefaultVat: Boolean(tax.isDefaultVat),
              active: true,
            })),
            skipDuplicates: true,
          });
        }

        return createdProduct;
      });

      this.logger.log(`Producto creado exitosamente: ${product.id}`, 'ProductService');
      this.logger.info(
        {
          operation: 'create',
          productId: product.id,
          durationMs: Date.now() - startedAt,
          taxesRequested: selectedTaxes.length,
        },
        'ProductPerformance',
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        defaultPurchasePresentationId: product.defaultPurchasePresentationId,
        defaultSalePresentationId: product.defaultSalePresentationId,
        featured: product.featured,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        salePrice: 0,
        lastCostPrice: 0,
        averageCostPrice: 0,
      };
    } catch (error) {
      this.logger.logDatabaseOperation('CREATE', 'Product', data, error);
      throw error;
    }
  }

  async update(id: string, data: UpdateProductDto): Promise<ProductDto> {
    const startedAt = Date.now();
    try {
      this.logger.log(`Actualizando producto: ${id}`, 'ProductService');

      const selectedTaxes = this.normalizeSelectedTaxes(data.selectedTaxes);
      const shouldSyncTaxes = data.selectedTaxes !== undefined;

      const product = await this.prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id },
          data: this.toUpdateInput(data),
        });

        if (shouldSyncTaxes) {
          const { validTaxes, invalidCodes, taxValueByCode } =
            await this.resolveExistingTaxSelections(tx, selectedTaxes);

          if (invalidCodes.length > 0) {
            throw new BadRequestException(
              `Códigos de impuesto inválidos o inexistentes: ${invalidCodes.join(', ')}`,
            );
          }

          const nextTaxes = validTaxes.map((tax) => ({
            taxValueCode: tax.taxValueCode,
            appliedRate: this.toPercentFraction(taxValueByCode.get(tax.taxValueCode)?.percentage),
            isDefaultVat: Boolean(tax.isDefaultVat),
          }));

          const currentTaxes = await tx.productTax.findMany({
            where: { productId: id, active: true },
            select: {
              taxValueCode: true,
              appliedRate: true,
              isDefaultVat: true,
            },
          });

          const currentSignature = this.buildTaxSyncSignature(
            currentTaxes.map((tax) => ({
              taxValueCode: tax.taxValueCode,
              appliedRate: this.toNumber(tax.appliedRate),
              isDefaultVat: tax.isDefaultVat,
            })),
          );
          const nextSignature = this.buildTaxSyncSignature(nextTaxes);

          if (currentSignature !== nextSignature) {
            await tx.productTax.deleteMany({ where: { productId: id } });

            if (nextTaxes.length > 0) {
              await tx.productTax.createMany({
                data: nextTaxes.map((tax) => ({
                  productId: id,
                  taxValueCode: tax.taxValueCode,
                  appliedRate: tax.appliedRate,
                  isDefaultVat: tax.isDefaultVat,
                  active: true,
                })),
                skipDuplicates: true,
              });
            }
          }
        }

        return updatedProduct;
      });

      this.logger.log(`Producto actualizado exitosamente: ${id}`, 'ProductService');
      this.logger.info(
        {
          operation: 'update',
          productId: id,
          durationMs: Date.now() - startedAt,
          shouldSyncTaxes,
          taxesRequested: selectedTaxes.length,
        },
        'ProductPerformance',
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        defaultPurchasePresentationId: product.defaultPurchasePresentationId,
        defaultSalePresentationId: product.defaultSalePresentationId,
        featured: product.featured,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        salePrice: 0,
        lastCostPrice: 0,
        averageCostPrice: 0,
      };
    } catch (error) {
      this.logger.logDatabaseOperation('UPDATE', 'Product', { id, ...data }, error);
      throw error;
    }
  }

  async delete(id: string): Promise<ProductDto> {
    try {
      this.logger.log(`Eliminando (desactivando) producto: ${id}`, 'ProductService');

      const product = await this.prisma.product.update({
        where: { id },
        data: { active: false },
      });

      this.logger.log(`Producto eliminado exitosamente: ${id}`, 'ProductService');

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        defaultPurchasePresentationId: product.defaultPurchasePresentationId,
        defaultSalePresentationId: product.defaultSalePresentationId,
        featured: product.featured,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        salePrice: 0,
        lastCostPrice: 0,
        averageCostPrice: 0,
      };
    } catch (error) {
      this.logger.logDatabaseOperation('UPDATE', 'Product', { id }, error);
      throw error;
    }
  }

  async finalizeWizard(id: string, payload: FinalizeProductWizardDto): Promise<ProductDto> {
    const startedAt = Date.now();

    try {
      const selectedTaxes = this.normalizeSelectedTaxes(payload.product?.selectedTaxes);
      const shouldSyncTaxes = payload.product?.selectedTaxes !== undefined;
      const inputPresentations = payload.presentations || [];

      const product = await this.prisma.$transaction(async (tx) => {
        let defaultPurchasePresentationId: string | null = null;
        let defaultSalePresentationId: string | null = null;

        const updatedBaseProduct = await tx.product.update({
          where: { id },
          data: {
            ...this.toUpdateInput(payload.product),
            defaultPurchasePresentationId: null,
            defaultSalePresentationId: null,
          },
        });

        if (shouldSyncTaxes) {
          const { validTaxes, invalidCodes, taxValueByCode } =
            await this.resolveExistingTaxSelections(tx, selectedTaxes);

          if (invalidCodes.length > 0) {
            throw new BadRequestException(
              `Códigos de impuesto inválidos o inexistentes: ${invalidCodes.join(', ')}`,
            );
          }

          const nextTaxes = validTaxes.map((tax) => ({
            taxValueCode: tax.taxValueCode,
            appliedRate: this.toPercentFraction(taxValueByCode.get(tax.taxValueCode)?.percentage),
            isDefaultVat: Boolean(tax.isDefaultVat),
          }));

          const currentTaxes = await tx.productTax.findMany({
            where: { productId: id, active: true },
            select: {
              taxValueCode: true,
              appliedRate: true,
              isDefaultVat: true,
            },
          });

          const currentSignature = this.buildTaxSyncSignature(
            currentTaxes.map((tax) => ({
              taxValueCode: tax.taxValueCode,
              appliedRate: this.toNumber(tax.appliedRate),
              isDefaultVat: tax.isDefaultVat,
            })),
          );
          const nextSignature = this.buildTaxSyncSignature(nextTaxes);

          if (currentSignature !== nextSignature) {
            await tx.productTax.deleteMany({ where: { productId: id } });

            if (nextTaxes.length > 0) {
              await tx.productTax.createMany({
                data: nextTaxes.map((tax) => ({
                  productId: id,
                  taxValueCode: tax.taxValueCode,
                  appliedRate: tax.appliedRate,
                  isDefaultVat: tax.isDefaultVat,
                  active: true,
                })),
                skipDuplicates: true,
              });
            }
          }
        }

        const existingPresentations = await tx.presentation.findMany({
          where: { productId: id, active: true },
          select: {
            id: true,
            presentationTypeId: true,
            presentationInferenceId: true,
            quantity: true,
            barcode: true,
            costPrice: true,
            salePrice: true,
            active: true,
          },
        });

        const existingById = new Map(existingPresentations.map((p) => [p.id, p]));
        const typeIdToId = new Map(existingPresentations.map((p) => [p.presentationTypeId, p.id]));

        const validPresentations = inputPresentations.filter((p) => Boolean(p.presentationTypeId));
        const submittedIds = new Set(
          validPresentations.map((p) => p.id).filter((pid): pid is string => Boolean(pid)),
        );

        for (const presentation of validPresentations) {
          if (!presentation.id || !existingById.has(presentation.id)) {
            continue;
          }

          const current = existingById.get(presentation.id);
          const resolvedInferenceId = presentation.presentationInferenceTypeId
            ? typeIdToId.get(presentation.presentationInferenceTypeId) || null
            : presentation.presentationInferenceId || null;

          const next = {
            presentationTypeId: presentation.presentationTypeId,
            presentationInferenceId: resolvedInferenceId,
            quantity: Number(presentation.quantity || 1),
            barcode: presentation.barcode ?? null,
            costPrice: Number(presentation.costPrice || 0),
            salePrice: Number(presentation.salePrice || 0),
            active: presentation.active ?? true,
          };

          const hasChanges =
            current?.presentationTypeId !== next.presentationTypeId ||
            (current?.presentationInferenceId || null) !== next.presentationInferenceId ||
            Number(current?.quantity || 0) !== Number(next.quantity) ||
            (current?.barcode || null) !== (next.barcode || null) ||
            this.toNumber(current?.costPrice) !== Number(next.costPrice) ||
            this.toNumber(current?.salePrice) !== Number(next.salePrice) ||
            Boolean(current?.active) !== Boolean(next.active);

          if (hasChanges) {
            await tx.presentation.update({
              where: { id: presentation.id },
              data: next,
            });

            if (current?.presentationTypeId && current.presentationTypeId !== next.presentationTypeId) {
              typeIdToId.delete(current.presentationTypeId);
            }

            if (next.active) {
              typeIdToId.set(next.presentationTypeId, presentation.id);
            } else {
              typeIdToId.delete(next.presentationTypeId);
            }
          } else {
            if (next.active) {
              typeIdToId.set(next.presentationTypeId, presentation.id);
            } else {
              typeIdToId.delete(next.presentationTypeId);
            }
          }
        }

        const pendingCreates = validPresentations.filter(
          (p) => (!p.id || !existingById.has(p.id)) && (p.active ?? true),
        );

        while (pendingCreates.length > 0) {
          const pendingBefore = pendingCreates.length;

          for (let i = pendingCreates.length - 1; i >= 0; i -= 1) {
            const presentation = pendingCreates[i];
            const hasInferenceType = Boolean(presentation.presentationInferenceTypeId);
            const resolvedInferenceId = hasInferenceType
              ? typeIdToId.get(presentation.presentationInferenceTypeId as string) || null
              : presentation.presentationInferenceId || null;

            if (hasInferenceType && !resolvedInferenceId) {
              continue;
            }

            const created = await tx.presentation.create({
              data: {
                productId: id,
                presentationTypeId: presentation.presentationTypeId,
                presentationInferenceId: resolvedInferenceId,
                quantity: Number(presentation.quantity || 1),
                barcode: presentation.barcode ?? null,
                costPrice: Number(presentation.costPrice || 0),
                salePrice: Number(presentation.salePrice || 0),
                active: true,
              },
              select: {
                id: true,
                presentationTypeId: true,
                presentationInferenceId: true,
              },
            });

            if (!created.presentationInferenceId) {
              await tx.presentation.update({
                where: { id: created.id },
                data: { presentationInferenceId: created.id },
              });
            }

            typeIdToId.set(created.presentationTypeId, created.id);
            pendingCreates.splice(i, 1);
          }

          if (pendingCreates.length === pendingBefore) {
            throw new BadRequestException(
              'No se pudieron resolver las dependencias de composición de presentaciones.',
            );
          }
        }

        for (const existing of existingPresentations) {
          if (!submittedIds.has(existing.id)) {
            try {
              await tx.presentation.delete({ where: { id: existing.id } });
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2003' || error.code === 'P2014')
              ) {
                await tx.presentation.update({
                  where: { id: existing.id },
                  data: { active: false },
                });
                typeIdToId.delete(existing.presentationTypeId);
              } else {
                throw error;
              }
            }
            typeIdToId.delete(existing.presentationTypeId);
          }
        }

        const activeWizardPresentations = inputPresentations.filter(
          (p) => (p.active ?? true) && Boolean(p.presentationTypeId),
        );

        const selectedPurchaseTypeId =
          payload.defaultPurchasePresentationIndex !== null &&
          payload.defaultPurchasePresentationIndex >= 0
            ? activeWizardPresentations[payload.defaultPurchasePresentationIndex]?.presentationTypeId
            : undefined;

        const selectedSaleTypeId =
          payload.defaultSalePresentationIndex !== null &&
          payload.defaultSalePresentationIndex >= 0
            ? activeWizardPresentations[payload.defaultSalePresentationIndex]?.presentationTypeId
            : undefined;

        defaultPurchasePresentationId = selectedPurchaseTypeId
          ? typeIdToId.get(selectedPurchaseTypeId) || null
          : null;
        defaultSalePresentationId = selectedSaleTypeId
          ? typeIdToId.get(selectedSaleTypeId) || null
          : null;

        const finalizedProduct = await tx.product.update({
          where: { id },
          data: {
            defaultPurchasePresentationId,
            defaultSalePresentationId,
          },
        });

        return finalizedProduct;
      });

      this.logger.info(
        {
          operation: 'finalizeWizard',
          productId: id,
          durationMs: Date.now() - startedAt,
          presentationsSubmitted: payload.presentations?.length || 0,
        },
        'ProductPerformance',
      );

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        defaultPurchasePresentationId: product.defaultPurchasePresentationId,
        defaultSalePresentationId: product.defaultSalePresentationId,
        featured: product.featured,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        salePrice: 0,
        lastCostPrice: 0,
        averageCostPrice: 0,
      };
    } catch (error) {
      this.logger.logDatabaseOperation('FINALIZE', 'ProductWizard', { id, payload }, error);
      throw error;
    }
  }

  async discardDraft(id: string): Promise<{ success: boolean; hardDeleted: boolean }> {
    try {
      await this.prisma.product.delete({ where: { id } });
      this.logger.info({ operation: 'discardDraft', productId: id, hardDeleted: true }, 'ProductService');
      return { success: true, hardDeleted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        await this.prisma.product.update({
          where: { id },
          data: { active: false },
        });
        this.logger.info(
          { operation: 'discardDraft', productId: id, hardDeleted: false },
          'ProductService',
        );
        return { success: true, hardDeleted: false };
      }

      throw error;
    }
  }
}

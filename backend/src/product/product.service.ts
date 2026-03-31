import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';
import {
  CreateProductDto,
  ProductDto,
  ProductTaxSelectionDto,
  UpdateProductDto,
  ProductWithRelationsDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class ProductService {
  constructor(private readonly logger: LoggerService) {}

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
      byCode.set(code, {
        ...tax,
        taxValueCode: code,
      });
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
      where: {
        code: {
          in: codes,
        },
      },
      select: {
        code: true,
        percentage: true,
      },
    });

    const existingCodeSet = new Set(existingTaxValues.map((taxValue) => taxValue.code));
    const taxValueByCode = new Map(existingTaxValues.map((taxValue) => [taxValue.code, taxValue]));
    const validTaxes = selectedTaxes.filter((tax) => existingCodeSet.has(tax.taxValueCode));
    const invalidCodes = codes.filter((code) => !existingCodeSet.has(code));

    return { validTaxes, invalidCodes, taxValueByCode };
  }

  private async resolveDefaultTaxes(
    tx: Prisma.TransactionClient,
  ): Promise<ProductTaxSelectionDto[]> {
    const configuredDefaults = await tx.productTaxDefault.findMany({
      where: {
        active: true,
        taxGroup: 'IVA',
      },
      include: {
        taxValue: true,
      },
    });

    if (configuredDefaults.length > 0) {
      return configuredDefaults.map((item) => ({
        taxValueCode: item.taxValueCode,
        taxValueDescription: item.taxValue.description,
        percentage: this.toNumber(item.taxValue.percentage),
        isDefaultVat: item.taxGroup === 'IVA',
      }));
    }

    const fallbackIva = await tx.taxValue.findUnique({
      where: { code: '2' },
    });

    if (!fallbackIva) {
      return [];
    }

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
      featured: product.featured,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category,
      images: product.images,
      presentations: product.presentations,
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

  private toCreateInput(data: CreateProductDto): Prisma.ProductUncheckedCreateInput {
    return {
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
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
      featured: data.featured,
      active: data.active,
    };
  }

  async findAll(): Promise<ProductWithRelationsDto[]> {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        productTaxes: {
          where: { active: true },
          include: {
            taxValue: true,
          },
        },
        presentations: {
          where: { active: true },
          include: {
            presentationType: true,
          },
        },
        productStock: {
          include: {
            stockPresentationType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.mapProductWithRelations(product));
  }

  async findByCategory(categoryId: string): Promise<ProductWithRelationsDto[]> {
    const products = await prisma.product.findMany({
      where: { categoryId, active: true },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        productTaxes: {
          where: { active: true },
          include: {
            taxValue: true,
          },
        },
        presentations: {
          where: { active: true },
          include: {
            presentationType: true,
          },
        },
        productStock: {
          include: {
            stockPresentationType: true,
          },
        },
      },
    });

    return products.map((product) => this.mapProductWithRelations(product));
  }

  async findOne(id: string): Promise<ProductWithRelationsDto | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        productTaxes: {
          where: { active: true },
          include: {
            taxValue: true,
          },
        },
        presentations: {
          where: { active: true },
          include: {
            presentationType: true,
          },
        },
        productStock: {
          include: {
            stockPresentationType: true,
          },
        },
      },
    });

    if (!product) return null;

    return this.mapProductWithRelations(product);
  }

  async findBySlug(slug: string): Promise<ProductWithRelationsDto | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        productTaxes: {
          where: { active: true },
          include: {
            taxValue: true,
          },
        },
        presentations: {
          where: { active: true },
          include: {
            presentationType: true,
          },
        },
        productStock: {
          include: {
            stockPresentationType: true,
          },
        },
      },
    });

    if (!product) return null;

    return this.mapProductWithRelations(product);
  }

  async create(data: CreateProductDto): Promise<ProductDto> {
    try {
      this.logger.log(`Creando producto: ${data.name}`, 'ProductService');

      const selectedTaxes = this.normalizeSelectedTaxes(data.selectedTaxes);
      const product = await prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: this.toCreateInput(data),
        });

        const taxesToApply =
          selectedTaxes.length > 0 ? selectedTaxes : await this.resolveDefaultTaxes(tx);
        const { validTaxes, invalidCodes, taxValueByCode } = await this.resolveExistingTaxSelections(
          tx,
          taxesToApply,
        );

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
              appliedRate: this.toPercentFraction(
                taxValueByCode.get(tax.taxValueCode)?.percentage,
              ),
              isDefaultVat: Boolean(tax.isDefaultVat),
              active: true,
            })),
            skipDuplicates: true,
          });
        }

        return createdProduct;
      });

      this.logger.log(`Producto creado exitosamente: ${product.id}`, 'ProductService');

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
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
      throw error; // El filtro global lo manejará
    }
  }

  async update(id: string, data: UpdateProductDto): Promise<ProductDto> {
    try {
      this.logger.log(`Actualizando producto: ${id}`, 'ProductService');

      const selectedTaxes = this.normalizeSelectedTaxes(data.selectedTaxes);
      const shouldSyncTaxes = data.selectedTaxes !== undefined;

      const product = await prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
          where: { id },
          data: this.toUpdateInput(data),
        });

        if (shouldSyncTaxes) {
          const { validTaxes, invalidCodes, taxValueByCode } = await this.resolveExistingTaxSelections(
            tx,
            selectedTaxes,
          );

          if (invalidCodes.length > 0) {
            throw new BadRequestException(
              `Códigos de impuesto inválidos o inexistentes: ${invalidCodes.join(', ')}`,
            );
          }

          await tx.productTax.deleteMany({ where: { productId: id } });

          if (validTaxes.length > 0) {
            await tx.productTax.createMany({
              data: validTaxes.map((tax) => ({
                productId: id,
                taxValueCode: tax.taxValueCode,
                appliedRate: this.toPercentFraction(
                  taxValueByCode.get(tax.taxValueCode)?.percentage,
                ),
                isDefaultVat: Boolean(tax.isDefaultVat),
                active: true,
              })),
              skipDuplicates: true,
            });
          }
        }

        return updatedProduct;
      });

      this.logger.log(`Producto actualizado exitosamente: ${id}`, 'ProductService');

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
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
      
      const product = await prisma.product.update({
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

  async getFeatured(): Promise<ProductWithRelationsDto[]> {
    const products = await prisma.product.findMany({
      where: { featured: true, active: true },
      include: {
        category: true,
        images: {
          where: { isPrimary: true },
        },
        productTaxes: {
          where: { active: true },
          include: {
            taxValue: true,
          },
        },
        presentations: {
          where: { active: true },
          take: 1,
          include: {
            presentationType: true,
          },
        },
        productStock: {
          include: {
            stockPresentationType: true,
          },
        },
      },
      take: 10,
    });

    return products.map((product) => this.mapProductWithRelations(product));
  }
}

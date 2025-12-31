import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';
import {
  CreateProductDto,
  ProductDto,
  UpdateProductDto,
  ProductWithRelationsDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class ProductService {
  constructor(private readonly logger: LoggerService) {}

  async findAll(): Promise<ProductWithRelationsDto[]> {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        presentations: {
          where: { active: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => ({
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
      salePrice:0,
      lastCostPrice:0,
      averageCostPrice:0,
    }));
  }

  async findByCategory(categoryId: string): Promise<ProductWithRelationsDto[]> {
    const products = await prisma.product.findMany({
      where: { categoryId, active: true },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        presentations: {
          where: { active: true },
        },
      },
    });

    return products.map((product) => ({
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
      salePrice:0,
      lastCostPrice:0,
      averageCostPrice:0, 
    }));
  }

  async findOne(id: string): Promise<ProductWithRelationsDto | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        presentations: {
          where: { active: true },
        },
      },
    });

    if (!product) return null;

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
      salePrice:0,  
      lastCostPrice:0,
      averageCostPrice:0,
    };
  }

  async findBySlug(slug: string): Promise<ProductWithRelationsDto | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        presentations: {
          where: { active: true },
        },
      },
    });

    if (!product) return null;

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
      salePrice:0,
      lastCostPrice:0,
      averageCostPrice:0, 
    };
  }

  async create(data: CreateProductDto): Promise<ProductDto> {
    try {
      this.logger.log(`Creando producto: ${data.name}`, 'ProductService');
      
      const product = await prisma.product.create({
        data,
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
      
      const product = await prisma.product.update({
        where: { id },
        data,
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
      this.logger.logDatabaseOperation('DELETE', 'Product', { id }, error);
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
        presentations: {
          where: { active: true },
          take: 1,
        },
      },
      take: 10,
    });

    return products.map((product) => ({
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
      salePrice:0,
      lastCostPrice:0,
      averageCostPrice:0, 
    }));
  }
}

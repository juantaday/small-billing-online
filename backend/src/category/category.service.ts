import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CategoryDto,
  UpdateCategoryDto,
  CategoryWithCountDto,
} from '@small-billing/shared';


@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}
  async findAll(): Promise<CategoryWithCountDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      displayOrder: cat.displayOrder,
      active: cat.active,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      productCount: cat._count.products,
    }));
  }

  async findOne(id: string): Promise<CategoryDto | null> {
    return await this.prisma.category.findUnique({
      where: { id },
    });
  }

  async create(data: CreateCategoryDto): Promise<CategoryDto> {
    try {
      this.logger.log(`Creando categoría: ${data.name}`, 'CategoryService');
      
      return await this.prisma.category.create({
        data,
      });
    } catch (error) {
      this.logger.logDatabaseOperation('CREATE', 'Category', data, error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Ya existe una categoría con el nombre "${data.name}"`
          );
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateCategoryDto): Promise<CategoryDto> {
    try {
      this.logger.log(`Actualizando categoría: ${id}`, 'CategoryService');
      
      return await this.prisma.category.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.logDatabaseOperation('UPDATE', 'Category', { id, ...data }, error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Ya existe una categoría con el nombre "${data.name}"`
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<CategoryDto> {
    return await this.prisma.category.update({
      where: { id },
      data: { active: false },
    });
  }
}

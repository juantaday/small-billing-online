import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateCategoryDto,
  CategoryDto,
  UpdateCategoryDto,
  CategoryWithCountDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class CategoryService {
  async findAll(): Promise<CategoryWithCountDto[]> {
    const categories = await prisma.category.findMany({
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
    return await prisma.category.findUnique({
      where: { id },
    });
  }

  async create(data: CreateCategoryDto): Promise<CategoryDto> {
    return await prisma.category.create({
      data,
    });
  }

  async update(id: string, data: UpdateCategoryDto): Promise<CategoryDto> {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<CategoryDto> {
    return await prisma.category.update({
      where: { id },
      data: { active: false },
    });
  }
}

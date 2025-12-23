import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateCustomerCategoryDto,
  CustomerCategoryDto,
  UpdateCustomerCategoryDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class CustomerCategoryService {
  async findAll(): Promise<CustomerCategoryDto[]> {
    const categories = await prisma.customerCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      discountPercentage: cat.discountPercentage.toNumber(),
      pointsMultiplier: cat.pointsMultiplier.toNumber(),
      ticketThreshold: cat.ticketThreshold.toNumber(),
      color: cat.color,
      active: cat.active,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async findOne(id: string): Promise<CustomerCategoryDto | null> {
    const category = await prisma.customerCategory.findUnique({
      where: { id },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      discountPercentage: category.discountPercentage.toNumber(),
      pointsMultiplier: category.pointsMultiplier.toNumber(),
      ticketThreshold: category.ticketThreshold.toNumber(),
      color: category.color,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async create(data: CreateCustomerCategoryDto): Promise<CustomerCategoryDto> {
    const category = await prisma.customerCategory.create({
      data,
    });

    return {
      id: category.id,
      name: category.name,
      discountPercentage: category.discountPercentage.toNumber(),
      pointsMultiplier: category.pointsMultiplier.toNumber(),
      ticketThreshold: category.ticketThreshold.toNumber(),
      color: category.color,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(id: string, data: UpdateCustomerCategoryDto): Promise<CustomerCategoryDto> {
    const category = await prisma.customerCategory.update({
      where: { id },
      data,
    });

    return {
      id: category.id,
      name: category.name,
      discountPercentage: category.discountPercentage.toNumber(),
      pointsMultiplier: category.pointsMultiplier.toNumber(),
      ticketThreshold: category.ticketThreshold.toNumber(),
      color: category.color,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async delete(id: string): Promise<CustomerCategoryDto> {
    const category = await prisma.customerCategory.update({
      where: { id },
      data: { active: false },
    });

    return {
      id: category.id,
      name: category.name,
      discountPercentage: category.discountPercentage.toNumber(),
      pointsMultiplier: category.pointsMultiplier.toNumber(),
      ticketThreshold: category.ticketThreshold.toNumber(),
      color: category.color,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

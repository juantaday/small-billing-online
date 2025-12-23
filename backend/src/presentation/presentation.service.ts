import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreatePresentationDto,
  PresentationDto,
  UpdatePresentationDto,
  UpdateStockDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class PresentationService {
  async findByProduct(productId: string): Promise<PresentationDto[]> {
    const presentations = await prisma.presentation.findMany({
      where: { productId, active: true },
    });

    return presentations.map((pres) => ({
      id: pres.id,
      productId: pres.productId,
      name: pres.name,
      barcode: pres.barcode,
      costPrice: pres.costPrice.toNumber(),
      lastCostPrice: pres.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: pres.averageCostPrice?.toNumber() ?? null,
      salePrice: pres.salePrice.toNumber(),
      quantity: pres.quantity,
      stock: pres.stock,
      minStock: pres.minStock,
      active: pres.active,
      createdAt: pres.createdAt,
      updatedAt: pres.updatedAt,
    }));
  }

  async findOne(id: string): Promise<PresentationDto | null> {
    const presentation = await prisma.presentation.findUnique({
      where: { id },
    });

    if (!presentation) return null;

    return {
      id: presentation.id,
      productId: presentation.productId,
      name: presentation.name,
      barcode: presentation.barcode,
      costPrice: presentation.costPrice.toNumber(),
      lastCostPrice: presentation.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: presentation.averageCostPrice?.toNumber() ?? null,
      salePrice: presentation.salePrice.toNumber(),
      quantity: presentation.quantity,
      stock: presentation.stock,
      minStock: presentation.minStock,
      active: presentation.active,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    };
  }

  async findByBarcode(barcode: string): Promise<PresentationDto | null> {
    const presentation = await prisma.presentation.findUnique({
      where: { barcode },
    });

    if (!presentation) return null;

    return {
      id: presentation.id,
      productId: presentation.productId,
      name: presentation.name,
      barcode: presentation.barcode,
      costPrice: presentation.costPrice.toNumber(),
      lastCostPrice: presentation.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: presentation.averageCostPrice?.toNumber() ?? null,
      salePrice: presentation.salePrice.toNumber(),
      quantity: presentation.quantity,
      stock: presentation.stock,
      minStock: presentation.minStock,
      active: presentation.active,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    };
  }

  async create(data: CreatePresentationDto): Promise<PresentationDto> {
    const presentation = await prisma.presentation.create({
      data,
    });

    return {
      id: presentation.id,
      productId: presentation.productId,
      name: presentation.name,
      barcode: presentation.barcode,
      costPrice: presentation.costPrice.toNumber(),
      lastCostPrice: presentation.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: presentation.averageCostPrice?.toNumber() ?? null,
      salePrice: presentation.salePrice.toNumber(),
      quantity: presentation.quantity,
      stock: presentation.stock,
      minStock: presentation.minStock,
      active: presentation.active,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    };
  }

  async update(id: string, data: UpdatePresentationDto): Promise<PresentationDto> {
    const presentation = await prisma.presentation.update({
      where: { id },
      data,
    });

    return {
      id: presentation.id,
      productId: presentation.productId,
      name: presentation.name,
      barcode: presentation.barcode,
      costPrice: presentation.costPrice.toNumber(),
      lastCostPrice: presentation.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: presentation.averageCostPrice?.toNumber() ?? null,
      salePrice: presentation.salePrice.toNumber(),
      quantity: presentation.quantity,
      stock: presentation.stock,
      minStock: presentation.minStock,
      active: presentation.active,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    };
  }

  async updateStock(data: UpdateStockDto): Promise<PresentationDto> {
    const presentation = await prisma.presentation.findUnique({
      where: { id: data.id },
    });

    if (!presentation) {
      throw new Error('Presentation not found');
    }

    const newStock = presentation.stock + data.quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const updated = await prisma.presentation.update({
      where: { id: data.id },
      data: { stock: newStock },
    });

    return {
      id: updated.id,
      productId: updated.productId,
      name: updated.name,
      barcode: updated.barcode,
      costPrice: updated.costPrice.toNumber(),
      lastCostPrice: updated.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: updated.averageCostPrice?.toNumber() ?? null,
      salePrice: updated.salePrice.toNumber(),
      quantity: updated.quantity,
      stock: updated.stock,
      minStock: updated.minStock,
      active: updated.active,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getLowStock(): Promise<PresentationDto[]> {
    const presentations = await prisma.presentation.findMany({
      where: {
        active: true,
        stock: {
          lte: prisma.presentation.fields.minStock,
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return presentations.map((pres) => ({
      id: pres.id,
      productId: pres.productId,
      name: pres.name,
      barcode: pres.barcode,
      costPrice: pres.costPrice.toNumber(),
      lastCostPrice: pres.lastCostPrice?.toNumber() ?? null,
      averageCostPrice: pres.averageCostPrice?.toNumber() ?? null,
      salePrice: pres.salePrice.toNumber(),
      quantity: pres.quantity,
      stock: pres.stock,
      minStock: pres.minStock,
      active: pres.active,
      createdAt: pres.createdAt,
      updatedAt: pres.updatedAt,
    }));
  }
}

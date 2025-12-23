import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateRewardDto,
  RewardDto,
  UpdateRewardDto,
  RewardWithRelationsDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class RewardService {
  async findAll(): Promise<RewardWithRelationsDto[]> {
    const rewards = await prisma.reward.findMany({
      where: { active: true },
      include: {
        presentation: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { pointsCost: 'asc' },
    });

    return rewards.map((reward) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue?.toNumber() ?? undefined,
      presentationId: reward.presentationId,
      stock: reward.stock,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      active: reward.active,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      imageUrl: reward.imageUrl,
      terms: reward.terms,
      presentation: reward.presentation,
    }));
  }

  async findAvailable(): Promise<RewardWithRelationsDto[]> {
    const now = new Date();
    
    const rewards = await prisma.reward.findMany({
      where: {
        active: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      include: {
        presentation: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { pointsCost: 'asc' },
    });

    return rewards.map((reward) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue?.toNumber() ?? undefined,
      presentationId: reward.presentationId,
      stock: reward.stock,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      active: reward.active,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      imageUrl: reward.imageUrl,
      terms: reward.terms,
      presentation: reward.presentation,
    }));
  }

  async findOne(id: string): Promise<RewardWithRelationsDto | null> {
    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        presentation: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!reward) return null;

    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue?.toNumber() ?? undefined,
      presentationId: reward.presentationId,
      stock: reward.stock,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      active: reward.active,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      imageUrl: reward.imageUrl,
      terms: reward.terms,
      presentation: reward.presentation,
    };
  }

  async create(data: CreateRewardDto): Promise<RewardDto> {
    const reward = await prisma.reward.create({
      data,
    });

    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue?.toNumber() ?? undefined,
      presentationId: reward.presentationId,
      stock: reward.stock,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      active: reward.active,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      imageUrl: reward.imageUrl,
      terms: reward.terms,
    };
  }

  async update(id: string, data: UpdateRewardDto): Promise<RewardDto> {
    const reward = await prisma.reward.update({
      where: { id },
      data,
    });

    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue?.toNumber() ?? undefined,
      presentationId: reward.presentationId,
      stock: reward.stock,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      active: reward.active,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      imageUrl: reward.imageUrl,
      terms: reward.terms,
    };
  }

  async delete(id: string): Promise<RewardDto> {
    const reward = await prisma.reward.update({
      where: { id },
      data: { active: false },
    });

    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      discountValue: reward.discountValue?.toNumber() ?? undefined,
      presentationId: reward.presentationId,
      stock: reward.stock,
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
      active: reward.active,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      imageUrl: reward.imageUrl,
      terms: reward.terms,
    };
  }

  async updateStock(id: string, quantity: number): Promise<RewardDto> {
    const reward = await prisma.reward.findUnique({ where: { id } });

    if (!reward) {
      throw new Error('Reward not found');
    }

    const newStock = reward.stock + quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const updated = await prisma.reward.update({
      where: { id },
      data: { stock: newStock },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      pointsCost: updated.pointsCost,
      rewardType: updated.rewardType,
      discountValue: updated.discountValue?.toNumber() ?? undefined,
      presentationId: updated.presentationId,
      stock: updated.stock,
      validFrom: updated.validFrom,
      validUntil: updated.validUntil,
      active: updated.active,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      imageUrl: updated.imageUrl,
      terms: updated.terms,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreatePaymentMethodDto,
  PaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class PaymentMethodService {
  async findAll(): Promise<PaymentMethodDto[]> {
    return await prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<PaymentMethodDto | null> {
    return await prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<PaymentMethodDto | null> {
    return await prisma.paymentMethod.findUnique({
      where: { code },
    });
  }

  async create(data: CreatePaymentMethodDto): Promise<PaymentMethodDto> {
    return await prisma.paymentMethod.create({
      data,
    });
  }

  async update(id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethodDto> {
    return await prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PaymentMethodDto> {
    return await prisma.paymentMethod.update({
      where: { id },
      data: { active: false },
    });
  }
}

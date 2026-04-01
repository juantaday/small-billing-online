import { Injectable } from '@nestjs/common';
import {
  CreatePaymentMethodDto,
  PaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class PaymentMethodService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PaymentMethodDto[]> {
    return await this.prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<PaymentMethodDto | null> {
    return await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<PaymentMethodDto | null> {
    return await this.prisma.paymentMethod.findUnique({
      where: { code },
    });
  }

  async create(data: CreatePaymentMethodDto): Promise<PaymentMethodDto> {
    return await this.prisma.paymentMethod.create({
      data,
    });
  }

  async update(id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethodDto> {
    return await this.prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PaymentMethodDto> {
    return await this.prisma.paymentMethod.update({
      where: { id },
      data: { active: false },
    });
  }
}

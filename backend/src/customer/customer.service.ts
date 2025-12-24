import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateCustomerDto,
  CustomerDto,
  UpdateCustomerDto,
  CustomerWithRelationsDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class CustomerService {
  async findAll(): Promise<CustomerWithRelationsDto[]> {
    const customers = await prisma.customer.findMany({
      where: { active: true },
      include: {
        people: true,
        customerCategory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((customer) => ({
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      people: customer.people,
      customerCategory: customer.customerCategory,
    }));
  }

  async findOne(id: string): Promise<CustomerWithRelationsDto | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        people: true,
        customerCategory: true,
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) return null;

    return {
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      people: customer.people,
      customerCategory: customer.customerCategory,
    };
  }

  async findByPeople(peopleId: string): Promise<CustomerDto | null> {
    const customer = await prisma.customer.findUnique({
      where: { peopleId },
    });

    if (!customer) return null;

    return {
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async create(data: CreateCustomerDto): Promise<CustomerDto> {
    const customer = await prisma.customer.create({
      data,
    });

    return {
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async update(id: string, data: UpdateCustomerDto): Promise<CustomerDto> {
    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    return {
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async updatePoints(id: string, points: number): Promise<CustomerDto> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    const newPoints = customer.loyaltyPoints + points;

    if (newPoints < 0) {
      throw new Error('Insufficient points');
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: newPoints },
    });

    return {
      id: updatedCustomer.id,
      peopleId: updatedCustomer.peopleId,
      customerCategoryId: updatedCustomer.customerCategoryId,
      loyaltyPoints: updatedCustomer.loyaltyPoints,
      totalPurchases: updatedCustomer.totalPurchases.toNumber(),
      lastPurchaseDate: updatedCustomer.lastPurchaseDate,
      active: updatedCustomer.active,
      createdAt: updatedCustomer.createdAt,
      updatedAt: updatedCustomer.updatedAt,
    };
  }

  async getTopCustomers(limit: number = 10): Promise<CustomerWithRelationsDto[]> {
    const customers = await prisma.customer.findMany({
      where: { active: true },
      include: {
        people: true,
        customerCategory: true,
      },
      orderBy: { totalPurchases: 'desc' },
      take: limit,
    });

    return customers.map((customer) => ({
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      people: customer.people,
      customerCategory: customer.customerCategory,
    }));
  }

  async delete(id: string): Promise<CustomerDto> {
    const customer = await prisma.customer.update({
      where: { id },
      data: { active: false },
    });

    return {
      id: customer.id,
      peopleId: customer.peopleId,
      customerCategoryId: customer.customerCategoryId,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases.toNumber(),
      lastPurchaseDate: customer.lastPurchaseDate,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}

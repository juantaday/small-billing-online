import { Injectable } from '@nestjs/common';
import {
  CreateCustomerDto,
  CustomerDto,
  UpdateCustomerDto,
  CustomerWithRelationsDto,
} from '@small-billing/shared';
import { LoggerService } from '../common/logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findAll(): Promise<CustomerWithRelationsDto[]> {
    const customers = await this.prisma.customer.findMany({
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
      customerCategory: customer.customerCategory ? {
        ...customer.customerCategory,
        discountPercentage: customer.customerCategory.discountPercentage.toNumber(),
        pointsMultiplier: customer.customerCategory.pointsMultiplier.toNumber(),
        ticketThreshold: customer.customerCategory.ticketThreshold.toNumber(),
      } : undefined,
    }));
  }

  async findOne(id: string): Promise<CustomerWithRelationsDto | null> {
    const customer = await this.prisma.customer.findUnique({
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
      customerCategory: customer.customerCategory ? {
        ...customer.customerCategory,
        discountPercentage: customer.customerCategory.discountPercentage.toNumber(),
        pointsMultiplier: customer.customerCategory.pointsMultiplier.toNumber(),
        ticketThreshold: customer.customerCategory.ticketThreshold.toNumber(),
      } : undefined,
    };
  }

  async findByPeople(peopleId: string): Promise<CustomerDto | null> {
    const customer = await this.prisma.customer.findUnique({
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

  async findByUserId(userId: string): Promise<CustomerWithRelationsDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { peopleId: true },
    });

    if (!user?.peopleId) {
      return null;
    }

    const customer = await this.prisma.customer.findUnique({
      where: { peopleId: user.peopleId },
      include: {
        people: true,
        customerCategory: true,
      },
    });

    if (!customer) {
      return null;
    }

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
      customerCategory: customer.customerCategory
        ? {
            ...customer.customerCategory,
            discountPercentage: customer.customerCategory.discountPercentage.toNumber(),
            pointsMultiplier: customer.customerCategory.pointsMultiplier.toNumber(),
            ticketThreshold: customer.customerCategory.ticketThreshold.toNumber(),
          }
        : undefined,
    };
  }

  async search(term: string): Promise<CustomerWithRelationsDto[]> {
    const value = term.trim();
    if (!value) return [];

    const customers = await this.prisma.customer.findMany({
      where: {
        active: true,
        people: {
          OR: [
            { rucCi: { contains: value, mode: 'insensitive' } },
            { firstName: { contains: value, mode: 'insensitive' } },
            { lastName: { contains: value, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        people: true,
        customerCategory: true,
      },
      take: 20,
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
      customerCategory: customer.customerCategory
        ? {
            ...customer.customerCategory,
            discountPercentage: customer.customerCategory.discountPercentage.toNumber(),
            pointsMultiplier: customer.customerCategory.pointsMultiplier.toNumber(),
            ticketThreshold: customer.customerCategory.ticketThreshold.toNumber(),
          }
        : undefined,
    }));
  }

  async create(data: CreateCustomerDto): Promise<CustomerDto> {
    this.logger.log(`Creando cliente: ${data.people.firstName} ${data.people.lastName || ''}`, 'CustomerService');
    
    // 1. Buscar si ya existe un People con el rucCi o mainEmail
    let existingPeople = null;
    
    if (data.people.rucCi) {
      existingPeople = await this.prisma.people.findUnique({
        where: { rucCi: data.people.rucCi },
        include: { 
          customer: {
            include: {
              customerCategory: true
            }
          } 
        },
      });
    }

    // Si no encontró por rucCi y hay email, buscar por email
    if (!existingPeople && data.people.mainEmail) {
      existingPeople = await this.prisma.people.findUnique({
        where: { mainEmail: data.people.mainEmail },
        include: { 
          customer: {
            include: {
              customerCategory: true
            }
          } 
        },
      });
    }

    // 2. Verificar si ya es cliente y devolver información completa
    if (existingPeople?.customer) {
      const fullName = `${existingPeople.firstName} ${existingPeople.lastName || ''}`.trim();
      const errorData = {
        existingCustomer: true,
        customer: {
          id: existingPeople.customer.id,
          peopleId: existingPeople.id,
          customerCategoryId: existingPeople.customer.customerCategoryId,
          loyaltyPoints: existingPeople.customer.loyaltyPoints,
          totalPurchases: existingPeople.customer.totalPurchases.toNumber(),
          lastPurchaseDate: existingPeople.customer.lastPurchaseDate,
          active: existingPeople.customer.active,
          createdAt: existingPeople.customer.createdAt,
          updatedAt: existingPeople.customer.updatedAt,
        },
        people: {
          id: existingPeople.id,
          firstName: existingPeople.firstName,
          lastName: existingPeople.lastName,
          rucCi: existingPeople.rucCi,
          mainEmail: existingPeople.mainEmail,
          phone: existingPeople.phone,
          address: existingPeople.address,
          personType: existingPeople.personType,
          identityType: existingPeople.identityType,
        },
        customerCategory: existingPeople.customer.customerCategory ? {
          id: existingPeople.customer.customerCategory.id,
          name: existingPeople.customer.customerCategory.name,
          discountPercentage: existingPeople.customer.customerCategory.discountPercentage.toNumber(),
          pointsMultiplier: existingPeople.customer.customerCategory.pointsMultiplier.toNumber(),
          ticketThreshold: existingPeople.customer.customerCategory.ticketThreshold.toNumber(),
          color: existingPeople.customer.customerCategory.color,
        } : undefined,
        message: `Cliente ya registrado: ${fullName} - CI/RUC: ${existingPeople.rucCi}${existingPeople.mainEmail ? ` - Email: ${existingPeople.mainEmail}` : ''}`
      };
      
      const error = new Error(errorData.message);
      (error as any).data = errorData;
      throw error;
    }

    let peopleId: string;

    // 3. Si existe People pero NO es cliente, usar ese People
    if (existingPeople) {
      peopleId = existingPeople.id;
      
      // Actualizar los datos de People con la nueva información (opcional)
      await this.prisma.people.update({
        where: { id: peopleId },
        data: {
          firstName: data.people.firstName,
          lastName: data.people.lastName,
          birthDate: data.people.birthDate,
          mainEmail: data.people.mainEmail || existingPeople.mainEmail,
          phone: data.people.phone || existingPeople.phone,
          address: data.people.address || existingPeople.address,
          personType: data.people.personType,
          identityType: data.people.identityType,
        },
      });
    } else {
      // 4. Si NO existe, crear nuevo People
      const newPeople = await this.prisma.people.create({
        data: {
          firstName: data.people.firstName,
          lastName: data.people.lastName,
          rucCi: data.people.rucCi,
          birthDate: data.people.birthDate,
          mainEmail: data.people.mainEmail,
          phone: data.people.phone,
          address: data.people.address,
          personType: data.people.personType,
          identityType: data.people.identityType,
        },
      });
      peopleId = newPeople.id;
    }

    // 5. Crear el Customer con valores iniciales en cero
    const customer = await this.prisma.customer.create({
      data: {
        peopleId,
        customerCategoryId: data.customerCategoryId,
        totalPurchases: 0,
        loyaltyPoints: 0,
        lastPurchaseDate: null,
        preferredPaymentMethod: data.preferredPaymentMethod || null,
        active: true,
      },
    });

    this.logger.log(`Cliente creado exitosamente: ${customer.id}`, 'CustomerService');
    this.logger.logDatabaseOperation('CREATE', 'Customer', { peopleId, customerCategoryId: data.customerCategoryId });

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
    this.logger.log(`Actualizando cliente: ${id}`, 'CustomerService');
    // Primero obtener el customer para acceder al peopleId
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
      include: { people: true },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Si hay datos de people para actualizar, actualizarlos primero
    if (data.people) {
      const peopleUpdateData: any = {};
      
      // Solo incluir campos que estén definidos
      if (data.people.firstName !== undefined) peopleUpdateData.firstName = data.people.firstName;
      if (data.people.lastName !== undefined) peopleUpdateData.lastName = data.people.lastName;
      if (data.people.birthDate !== undefined) peopleUpdateData.birthDate = data.people.birthDate;
      if (data.people.mainEmail !== undefined) peopleUpdateData.mainEmail = data.people.mainEmail;
      if (data.people.phone !== undefined) peopleUpdateData.phone = data.people.phone;
      if (data.people.address !== undefined) peopleUpdateData.address = data.people.address;
      if (data.people.personType !== undefined) peopleUpdateData.personType = data.people.personType;
      if (data.people.identityType !== undefined) peopleUpdateData.identityType = data.people.identityType;
      
      await this.prisma.people.update({
        where: { id: existingCustomer.peopleId },
        data: peopleUpdateData,
      });
    }

    // Luego actualizar el customer (sin incluir people en data)
    const { people: _, ...customerData } = data;
    const customer = await this.prisma.customer.update({
      where: { id },
      data: customerData,
    });

    this.logger.log(`Cliente actualizado exitosamente: ${id}`, 'CustomerService');
    this.logger.logDatabaseOperation('UPDATE', 'Customer', { id, ...customerData });

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

  async getTopCustomers(limit: number): Promise<CustomerWithRelationsDto[]> {
    const customers = await this.prisma.customer.findMany({
      where: { active: true },
      include: {
        people: true,
        customerCategory: true,
      },
      orderBy: [
        { loyaltyPoints: 'desc' },
        { totalPurchases: 'desc' },
      ],
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
      customerCategory: customer.customerCategory ? {
        ...customer.customerCategory,
        discountPercentage: customer.customerCategory.discountPercentage.toNumber(),
        pointsMultiplier: customer.customerCategory.pointsMultiplier.toNumber(),
        ticketThreshold: customer.customerCategory.ticketThreshold.toNumber(),
      } : undefined,
    }));
  }

  async updatePoints(id: string, points: number): Promise<CustomerDto> {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        loyaltyPoints: points,
      },
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

  async delete(id: string): Promise<CustomerDto> {
    // Soft delete: marcar como inactivo en lugar de eliminar
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        active: false,
      },
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
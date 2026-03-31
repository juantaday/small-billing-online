import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BankDto, CreateBankDto, UpdateBankDto } from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class BankService {
  async findAll(): Promise<BankDto[]> {
    return prisma.bank.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateBankDto): Promise<BankDto> {
    try {
      return await prisma.bank.create({
        data: {
          code: data.code.trim(),
          name: data.name.trim(),
          active: data.active ?? true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un banco con ese código o nombre');
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateBankDto): Promise<BankDto> {
    try {
      return await prisma.bank.update({
        where: { id },
        data: {
          code: data.code?.trim(),
          name: data.name?.trim(),
          active: data.active,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un banco con ese código o nombre');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Banco con ID ${id} no encontrado`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<BankDto> {
    try {
      return await prisma.bank.update({
        where: { id },
        data: { active: false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Banco con ID ${id} no encontrado`);
      }
      throw error;
    }
  }
}

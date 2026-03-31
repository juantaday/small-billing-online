import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  CreatePresentationTypeDto,
  PresentationTypeDto,
  UpdatePresentationTypeDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class PresentationTypeService {
  async findAll(): Promise<PresentationTypeDto[]> {
    return prisma.presentationType.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreatePresentationTypeDto): Promise<PresentationTypeDto> {
    try {
      return await prisma.presentationType.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Ya existe un tipo de presentación con el nombre "${data.name}"`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdatePresentationTypeDto,
  ): Promise<PresentationTypeDto> {
    try {
      return await prisma.presentationType.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Ya existe un tipo de presentación con el nombre "${data.name}"`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Tipo de presentación con ID ${id} no encontrado`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<PresentationTypeDto> {
    const presentationsCount = await prisma.presentation.count({
      where: { presentationTypeId: id, active: true },
    });

    if (presentationsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el tipo de presentación porque está en uso',
      );
    }

    try {
      return await prisma.presentationType.update({
        where: { id },
        data: { active: false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Tipo de presentación con ID ${id} no encontrado`,
        );
      }
      throw error;
    }
  }
}

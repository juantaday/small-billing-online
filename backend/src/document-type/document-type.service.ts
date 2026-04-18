import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentTypeDto, DocumentTypeDto, UpdateDocumentTypeDto } from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DocumentTypeDto[]> {
    return this.prisma.documentType.findMany({
      where: { active: true },
      orderBy: [{ idGroupNumeration: 'asc' }, { id: 'asc' }],
    });
  }

  async create(data: CreateDocumentTypeDto): Promise<DocumentTypeDto> {
    try {
      return await this.prisma.documentType.create({
        data: {
          documentName: data.documentName.trim(),
          itemsAutoGenerate: data.itemsAutoGenerate,
          indefinite: data.indefinite,
          documentCategoryId: data.documentCategoryId,
          idGroupNumeration: data.idGroupNumeration,
          codSRI: data.codSRI?.trim() || null,
          active: data.active ?? true,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new ConflictException('Ya existe un tipo de documento con ese nombre');
      }

      throw error;
    }
  }

  async update(id: number, data: UpdateDocumentTypeDto): Promise<DocumentTypeDto> {
    const existing = await this.prisma.documentType.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Tipo de documento con ID ${id} no encontrado`);
    }

    try {
      return await this.prisma.documentType.update({
        where: { id },
        data: {
          documentName: data.documentName !== undefined ? data.documentName.trim() : undefined,
          itemsAutoGenerate:
            data.itemsAutoGenerate !== undefined ? data.itemsAutoGenerate : undefined,
          indefinite: data.indefinite !== undefined ? data.indefinite : undefined,
          documentCategoryId:
            data.documentCategoryId !== undefined ? data.documentCategoryId : undefined,
          idGroupNumeration:
            data.idGroupNumeration !== undefined ? data.idGroupNumeration : undefined,
          codSRI: data.codSRI !== undefined ? data.codSRI?.trim() || null : undefined,
          active: data.active !== undefined ? data.active : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new ConflictException('Ya existe un tipo de documento con ese nombre');
      }

      throw error;
    }
  }
}

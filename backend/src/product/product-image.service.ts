/**
 * Service: ProductImageService
 * Gestiona las operaciones CRUD de imágenes de productos
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateProductImageDto,
  UpdateProductImageDto,
  ReorderImagesDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';


// Tipo auxiliar para crear imagen (sin productId que viene por parámetro)
type CreateImageInput = Omit<CreateProductImageDto, 'productId'>;

@Injectable()
export class ProductImageService {
  constructor(private readonly prisma: PrismaService) {}


  /**
   * Obtener todas las imágenes de un producto
   */
  async findByProductId(productId: string) {
    // Verificar que el producto existe
    await this.validateProductExists(productId);

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Obtener una imagen específica
   */
  async findOne(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException(`Imagen con ID ${imageId} no encontrada`);
    }

    return image;
  }

  /**
   * Crear una nueva imagen para un producto
   */
  async create(productId: string, createDto: CreateImageInput) {
    // Verificar que el producto existe
    await this.validateProductExists(productId);

    // Contar imágenes existentes
    const imageCount = await this.prisma.productImage.count({
      where: { productId },
    });

    // Si es la primera imagen, hacerla primaria automáticamente
    const isPrimary = imageCount === 0 ? true : (createDto.isPrimary || false);

    // Si se marca como primaria, desmarcar las demás
    if (isPrimary) {
      await this.setPrimaryInternal(productId, null);
    }

    // Crear la imagen
    return this.prisma.productImage.create({
      data: {
        productId,
        imageUrl: createDto.imageUrl,
        altText: createDto.altText,
        isPrimary,
        displayOrder: createDto.displayOrder ?? imageCount,
      },
    });
  }

  /**
   * Actualizar una imagen existente
   */
  async update(imageId: string, updateDto: UpdateProductImageDto) {
    const image = await this.findOne(imageId);

    // Si se marca como primaria, desmarcar las demás
    if (updateDto.isPrimary === true) {
      await this.setPrimaryInternal(image.productId, imageId);
    }

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: updateDto,
    });
  }

  /**
   * Eliminar una imagen
   */
  async remove(imageId: string) {
    const image = await this.findOne(imageId);

    // Eliminar la imagen
    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    // Si era primaria, establecer otra como primaria
    if (image.isPrimary) {
      const nextImage = await this.prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { displayOrder: 'asc' },
      });

      if (nextImage) {
        await this.prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true, message: 'Imagen eliminada correctamente' };
  }

  /**
   * Establecer una imagen como primaria
   */
  async setPrimary(productId: string, imageId: string) {
    // Verificar que la imagen existe y pertenece al producto
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(
        `Imagen con ID ${imageId} no encontrada para el producto ${productId}`,
      );
    }

    // Desmarcar todas como primarias
    await this.setPrimaryInternal(productId, imageId);

    // Marcar la seleccionada como primaria
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  /**
   * Reordenar las imágenes de un producto
   */
  async reorder(productId: string, reorderDto: ReorderImagesDto) {
    // Verificar que el producto existe
    await this.validateProductExists(productId);

    // Verificar que todas las imágenes pertenecen al producto
    const imageIds = reorderDto.order.map((item) => item.imageId);
    const images = await this.prisma.productImage.findMany({
      where: {
        id: { in: imageIds },
        productId,
      },
    });

    if (images.length !== imageIds.length) {
      throw new BadRequestException(
        'Una o más imágenes no pertenecen a este producto',
      );
    }

    // Actualizar el orden en una transacción
    await this.prisma.$transaction(
      reorderDto.order.map((item) =>
        this.prisma.productImage.update({
          where: { id: item.imageId },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    return {
      success: true,
      message: 'Orden de imágenes actualizado correctamente',
    };
  }

  /**
   * Método interno para desmarcar todas las imágenes como primarias
   * excepto la especificada
   */
  private async setPrimaryInternal(productId: string, exceptImageId: string | null) {
    await this.prisma.productImage.updateMany({
      where: {
        productId,
        ...(exceptImageId ? { id: { not: exceptImageId } } : {}),
      },
      data: { isPrimary: false },
    });
  }

  /**
   * Validar que un producto existe
   */
  private async validateProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return product;
  }
}

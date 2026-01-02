import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image.service';
import {
  CreateProductDto,
  ProductDto,
  UpdateProductDto,
  ProductWithRelationsDto,
  CreateProductImageDto,
  UpdateProductImageDto,
  ReorderImagesDto,
} from '@small-billing/shared';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImageService: ProductImageService,
  ) {}

  @Get()
  async findAll(@Query('categoryId') categoryId?: string): Promise<ProductWithRelationsDto[]> {
    if (categoryId) {
      return this.productService.findByCategory(categoryId);
    }
    return this.productService.findAll();
  }

  @Get('featured')
  async getFeatured(): Promise<ProductWithRelationsDto[]> {
    return this.productService.getFeatured();
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<ProductWithRelationsDto> {
    return this.productService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductWithRelationsDto> {
    return this.productService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateProductDto): Promise<ProductDto> {
    return this.productService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ProductDto> {
    return this.productService.delete(id);
  }

  // ==================== IMAGE MANAGEMENT ENDPOINTS ====================

  /**
   * Obtener todas las imágenes de un producto
   */
  @Get(':productId/images')
  async getImages(@Param('productId') productId: string) {
    return this.productImageService.findByProductId(productId);
  }

  /**
   * Subir una nueva imagen para un producto
   */
  @Post(':productId/images/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText?: string,
    @Body('displayOrder') displayOrder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Guardar el archivo temporalmente en el servidor (public/uploads)
    const fs = require('fs');
    const path = require('path');
    
    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Guardar el archivo
    fs.writeFileSync(filePath, file.buffer);
    
    // URL accesible desde el frontend
    const imageUrl = `http://localhost:3000/uploads/products/${fileName}`;
    
    // Crear el registro en la base de datos
    return this.productImageService.create(productId, {
      imageUrl,
      altText: altText || file.originalname,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
    });
  }

  /**
   * Crear una imagen con URL (sin upload de archivo)
   */
  @Post(':productId/images')
  async createImage(
    @Param('productId') productId: string,
    @Body() dto: Omit<CreateProductImageDto, 'productId'>,
  ) {
    return this.productImageService.create(productId, dto);
  }

  /**
   * Actualizar una imagen existente
   */
  @Patch(':productId/images/:imageId')
  async updateImage(
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImageService.update(imageId, dto);
  }

  /**
   * Eliminar una imagen
   */
  @Delete(':productId/images/:imageId')
  async deleteImage(@Param('imageId') imageId: string) {
    return this.productImageService.remove(imageId);
  }

  /**
   * Establecer una imagen como primaria
   */
  @Patch(':productId/images/:imageId/primary')
  async setPrimaryImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productImageService.setPrimary(productId, imageId);
  }

  /**
   * Reordenar las imágenes de un producto
   */
  @Patch(':productId/images/reorder')
  async reorderImages(
    @Param('productId') productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.productImageService.reorder(productId, dto);
  }
}

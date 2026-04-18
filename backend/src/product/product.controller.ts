import * as fs from 'fs';
import * as path from 'path';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
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
  FinalizeProductWizardDto,
  QuickAddInventoryDto,
} from '@small-billing/shared';

interface HttpRequestLike {
  protocol: string;
  headers: Record<string, string | string[] | undefined>;
  get(name: string): string | undefined;
}

interface UploadedFileLike {
  originalname: string;
  buffer: Buffer;
}

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImageService: ProductImageService,
  ) {}

  // ─── Productos ───────────────────────────────────────────────────────────────

  @Get()
  async findAll(
    @Query('categoryId') categoryId?: string,
  ): Promise<ProductWithRelationsDto[]> {
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
    const product = await this.productService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Producto con slug "${slug}" no encontrado`);
    }
    return product;
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('light') light?: string,
  ): Promise<ProductWithRelationsDto> {
    const useLightMode = light === '1' || light === 'true';
    const product = await this.productService.findOne(id, { light: useLightMode });
    if (!product) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }
    return product;
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

  @Put(':id/finalize')
  async finalizeWizard(
    @Param('id') id: string,
    @Body() body: FinalizeProductWizardDto,
  ): Promise<ProductDto> {
    return this.productService.finalizeWizard(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ProductDto> {
    return this.productService.delete(id);
  }

  @Delete(':id/discard-draft')
  async discardDraft(@Param('id') id: string): Promise<{ success: boolean; hardDeleted: boolean }> {
    return this.productService.discardDraft(id);
  }

  @Post(':id/stock/quick-add')
  async quickAddInventory(
    @Param('id') id: string,
    @Body() body: QuickAddInventoryDto,
  ): Promise<{
    productId: string;
    stockBefore: number;
    stockAfter: number;
    addedBaseUnits: number;
    factorToBase: number;
  }> {
    return this.productService.quickAddInventory(id, body);
  }

  @Get(':id/inventory-movements')
  async getInventoryMovements(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.productService.getInventoryMovements(id, limit ? Number(limit) : undefined);
  }

  // ─── Imágenes ────────────────────────────────────────────────────────────────

  /** Reordenar imágenes — DEBE ir antes de :productId/images */
  @Patch(':productId/images/reorder')
  async reorderImages(
    @Param('productId') productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.productImageService.reorder(productId, dto);
  }

  /** Subir imagen — DEBE ir antes de :productId/images */
  @Post(':productId/images/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('productId') productId: string,
    @Req() req: HttpRequestLike,
    @UploadedFile() file: UploadedFileLike,
    @Body('altText') altText?: string,
    @Body('displayOrder') displayOrder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    // Respeta X-Forwarded-Proto cuando hay un reverse proxy (nginx, Render, etc.)
    const protocol =
      (req.get('x-forwarded-proto') as string | undefined)?.split(',')[0].trim() ??
      req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/products/${fileName}`;

    return this.productImageService.create(productId, {
      imageUrl,
      altText: altText || file.originalname,
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
    });
  }

  /** Establecer imagen primaria */
  @Patch(':productId/images/:imageId/primary')
  async setPrimaryImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productImageService.setPrimary(productId, imageId);
  }

  /** Eliminar imagen */
  @Delete(':productId/images/:imageId')
  async deleteImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productImageService.remove(imageId);
  }

  /** Actualizar imagen existente */
  @Patch(':productId/images/:imageId')
  async updateImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImageService.update(imageId, dto);
  }

  /** Crear imagen con URL (sin upload) */
  @Post(':productId/images')
  async createImage(
    @Param('productId') productId: string,
    @Body() dto: Omit<CreateProductImageDto, 'productId'>,
  ) {
    return this.productImageService.create(productId, dto);
  }

  /** Listar imágenes de un producto — DEBE ir al final */
  @Get(':productId/images')
  async getImages(@Param('productId') productId: string) {
    return this.productImageService.findByProductId(productId);
  }
}
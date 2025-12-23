import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  ProductDto,
  UpdateProductDto,
  ProductWithRelationsDto,
} from '@small-billing/shared';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
}

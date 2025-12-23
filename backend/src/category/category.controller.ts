import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  CategoryDto,
  UpdateCategoryDto,
  CategoryWithCountDto,
} from '@small-billing/shared';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(): Promise<CategoryWithCountDto[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryDto> {
    return this.categoryService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoryService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<CategoryDto> {
    return this.categoryService.delete(id);
  }
}

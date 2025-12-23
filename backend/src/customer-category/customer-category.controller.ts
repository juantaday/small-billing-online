import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CustomerCategoryService } from './customer-category.service';
import {
  CreateCustomerCategoryDto,
  CustomerCategoryDto,
  UpdateCustomerCategoryDto,
} from '@small-billing/shared';

@Controller('customer-categories')
export class CustomerCategoryController {
  constructor(private readonly customerCategoryService: CustomerCategoryService) {}

  @Get()
  async findAll(): Promise<CustomerCategoryDto[]> {
    return this.customerCategoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerCategoryDto> {
    return this.customerCategoryService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateCustomerCategoryDto): Promise<CustomerCategoryDto> {
    return this.customerCategoryService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCustomerCategoryDto,
  ): Promise<CustomerCategoryDto> {
    return this.customerCategoryService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<CustomerCategoryDto> {
    return this.customerCategoryService.delete(id);
  }
}

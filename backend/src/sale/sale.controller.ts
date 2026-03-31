import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateSaleDto,
  SaleDto,
  SaleWithRelationsDto,
  UpdateSaleDto,
} from '@small-billing/shared';
import { SaleService } from './sale.service';

@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Get()
  async findAll(): Promise<SaleWithRelationsDto[]> {
    return this.saleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SaleWithRelationsDto> {
    return this.saleService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateSaleDto): Promise<SaleWithRelationsDto> {
    return this.saleService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateSaleDto): Promise<SaleDto> {
    return this.saleService.update(id, data);
  }
}

import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseDto } from '@small-billing/shared';
import { WarehouseService } from './warehouse.service';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  async findAll(): Promise<WarehouseDto[]> {
    return this.warehouseService.findAll();
  }

  @Post()
  async create(@Body() data: CreateWarehouseDto): Promise<WarehouseDto> {
    return this.warehouseService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWarehouseDto): Promise<WarehouseDto> {
    return this.warehouseService.update(Number(id), data);
  }
}

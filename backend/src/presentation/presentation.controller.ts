import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import {
  CreatePresentationDto,
  PresentationDto,
  UpdatePresentationDto,
  UpdateStockDto,
} from '@small-billing/shared';

@Controller('presentations')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Get()
  async findByProduct(@Query('productId') productId: string): Promise<PresentationDto[]> {
    return this.presentationService.findByProduct(productId);
  }

  @Get('low-stock')
  async getLowStock(): Promise<PresentationDto[]> {
    return this.presentationService.getLowStock();
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string): Promise<PresentationDto> {
    return this.presentationService.findByBarcode(barcode);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PresentationDto> {
    return this.presentationService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreatePresentationDto): Promise<PresentationDto> {
    return this.presentationService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePresentationDto,
  ): Promise<PresentationDto> {
    return this.presentationService.update(id, data);
  }

  @Put(':id/stock')
  async updateStock(@Body() data: UpdateStockDto): Promise<PresentationDto> {
    return this.presentationService.updateStock(data);
  }
}

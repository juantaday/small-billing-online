import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  BusinessTypeDto,
  CreateBusinessTypeDto,
  UpdateBusinessTypeDto,
} from '@small-billing/shared';
import { BusinessTypeService } from './business-type.service';

@Controller('business-types')
export class BusinessTypeController {
  constructor(private readonly businessTypeService: BusinessTypeService) {}

  @Get()
  async findAll(): Promise<BusinessTypeDto[]> {
    return this.businessTypeService.findAll();
  }

  @Post()
  async create(@Body() data: CreateBusinessTypeDto): Promise<BusinessTypeDto> {
    return this.businessTypeService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateBusinessTypeDto,
  ): Promise<BusinessTypeDto> {
    return this.businessTypeService.update(Number(id), data);
  }
}

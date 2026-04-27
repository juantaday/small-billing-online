import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  BusinessDetailsDto,
  CreateBusinessDetailsDto,
  UpdateBusinessDetailsDto,
} from '@small-billing/shared';
import { BusinessDetailsService } from './business-details.service';

@Controller('business-details')
export class BusinessDetailsController {
  constructor(private readonly businessDetailsService: BusinessDetailsService) {}

  @Get()
  async findCurrent(): Promise<BusinessDetailsDto | null> {
    return this.businessDetailsService.findCurrent();
  }

  @Post()
  async create(@Body() data: CreateBusinessDetailsDto): Promise<BusinessDetailsDto> {
    return this.businessDetailsService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateBusinessDetailsDto,
  ): Promise<BusinessDetailsDto> {
    return this.businessDetailsService.update(id, data);
  }
}

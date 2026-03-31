import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreatePresentationTypeDto,
  PresentationTypeDto,
  UpdatePresentationTypeDto,
} from '@small-billing/shared';
import { PresentationTypeService } from './presentation-type.service';

@Controller('presentation-types')
export class PresentationTypeController {
  constructor(private readonly presentationTypeService: PresentationTypeService) {}

  @Get()
  async findAll(): Promise<PresentationTypeDto[]> {
    return this.presentationTypeService.findAll();
  }

  @Post()
  async create(
    @Body() data: CreatePresentationTypeDto,
  ): Promise<PresentationTypeDto> {
    return this.presentationTypeService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePresentationTypeDto,
  ): Promise<PresentationTypeDto> {
    return this.presentationTypeService.update(id, { ...data, id });
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<PresentationTypeDto> {
    return this.presentationTypeService.delete(id);
  }
}

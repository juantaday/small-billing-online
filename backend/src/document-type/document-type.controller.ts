import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateDocumentTypeDto, DocumentTypeDto, UpdateDocumentTypeDto } from '@small-billing/shared';
import { DocumentTypeService } from './document-type.service';

@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Get()
  async findAll(): Promise<DocumentTypeDto[]> {
    return this.documentTypeService.findAll();
  }

  @Post()
  async create(@Body() data: CreateDocumentTypeDto): Promise<DocumentTypeDto> {
    return this.documentTypeService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateDocumentTypeDto,
  ): Promise<DocumentTypeDto> {
    return this.documentTypeService.update(Number(id), data);
  }
}

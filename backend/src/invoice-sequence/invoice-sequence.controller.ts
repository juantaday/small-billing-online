import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreateInvoiceSequenceDto,
  InvoiceSequenceDto,
  UpdateInvoiceSequenceDto,
} from '@small-billing/shared';
import { InvoiceSequenceService } from './invoice-sequence.service';

@Controller('invoice-sequences')
export class InvoiceSequenceController {
  constructor(private readonly invoiceSequenceService: InvoiceSequenceService) {}

  @Get()
  async findAll(): Promise<InvoiceSequenceDto[]> {
    return this.invoiceSequenceService.findAll();
  }

  @Post()
  async create(@Body() data: CreateInvoiceSequenceDto): Promise<InvoiceSequenceDto> {
    return this.invoiceSequenceService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateInvoiceSequenceDto,
  ): Promise<InvoiceSequenceDto> {
    return this.invoiceSequenceService.update(id, data);
  }
}

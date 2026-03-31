import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BankDto, CreateBankDto, UpdateBankDto } from '@small-billing/shared';
import { BankService } from './bank.service';

@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get()
  async findAll(): Promise<BankDto[]> {
    return this.bankService.findAll();
  }

  @Post()
  async create(@Body() data: CreateBankDto): Promise<BankDto> {
    return this.bankService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateBankDto): Promise<BankDto> {
    return this.bankService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<BankDto> {
    return this.bankService.delete(id);
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import {
  CreatePaymentMethodDto,
  PaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@small-billing/shared';

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  async findAll(): Promise<PaymentMethodDto[]> {
    return this.paymentMethodService.findAll();
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<PaymentMethodDto> {
    return this.paymentMethodService.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentMethodDto> {
    return this.paymentMethodService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreatePaymentMethodDto): Promise<PaymentMethodDto> {
    return this.paymentMethodService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodDto> {
    return this.paymentMethodService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<PaymentMethodDto> {
    return this.paymentMethodService.delete(id);
  }
}

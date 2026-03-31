import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CreateCreditPaymentDto,
  CreditDto,
  CreditWithRelationsDto,
} from '@small-billing/shared';
import { CreditService } from './credit.service';

@Controller('credits')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get()
  async findAllOpenCredits(): Promise<CreditWithRelationsDto[]> {
    return this.creditService.findAllOpenCredits();
  }

  @Get('sale/:saleId')
  async findOneBySaleId(@Param('saleId') saleId: string): Promise<CreditWithRelationsDto> {
    return this.creditService.findOneBySaleId(saleId);
  }

  @Post('payments')
  async registerPayment(@Body() data: CreateCreditPaymentDto): Promise<CreditDto> {
    return this.creditService.registerPayment(data);
  }
}

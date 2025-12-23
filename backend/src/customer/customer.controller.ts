import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CreateCustomerDto,
  CustomerDto,
  UpdateCustomerDto,
  CustomerWithRelationsDto,
} from '@small-billing/shared';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async findAll(): Promise<CustomerWithRelationsDto[]> {
    return this.customerService.findAll();
  }

  @Get('top')
  async getTopCustomers(@Query('limit') limit?: number): Promise<CustomerWithRelationsDto[]> {
    return this.customerService.getTopCustomers(limit ? parseInt(limit.toString()) : 10);
  }

  @Get('people/:peopleId')
  async findByPeople(@Param('peopleId') peopleId: string): Promise<CustomerDto> {
    return this.customerService.findByPeople(peopleId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerWithRelationsDto> {
    return this.customerService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateCustomerDto): Promise<CustomerDto> {
    return this.customerService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCustomerDto,
  ): Promise<CustomerDto> {
    return this.customerService.update(id, data);
  }

  @Put(':id/points')
  async updatePoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ): Promise<CustomerDto> {
    return this.customerService.updatePoints(id, points);
  }
}

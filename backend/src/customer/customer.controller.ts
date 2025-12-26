import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
    try {
      return await this.customerService.create(data);
    } catch (error) {
      // Si el error tiene datos del cliente existente, incluirlos en la respuesta
      if (error.data?.existingCustomer) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'Customer Already Exists',
            data: error.data, // Incluir toda la información del cliente existente
          },
          HttpStatus.CONFLICT,
        );
      }
      
      if (error.message.includes('Unique constraint')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: 'El RUC/CI o email ya están registrados',
            error: 'Duplicate Entry',
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Error al crear el cliente',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<CustomerDto> {
    return this.customerService.delete(id);
  }
}

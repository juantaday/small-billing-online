import { Controller, Get, Post, Body } from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePeopleDto, PeopleDto } from '@small-billing/shared';

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  async findAll(): Promise<PeopleDto[]> {
    return this.peopleService.findAll();
  }

  @Post()
  async create(@Body() data: CreatePeopleDto): Promise<PeopleDto> {
    return this.peopleService.create(data);
  }
}
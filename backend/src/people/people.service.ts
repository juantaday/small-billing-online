import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePeopleDto, PeopleDto } from '@small-billing/shared';
import { LoggerService } from '../common/logger/logger.service';

const prisma = new PrismaClient();

@Injectable()
export class PeopleService {
  constructor(private readonly logger: LoggerService) {}

  async findAll(): Promise<PeopleDto[]> {
    return prisma.people.findMany({
      orderBy: { dateRegistered: 'desc' },
    }) as Promise<PeopleDto[]>;
  }

  async create(data: CreatePeopleDto): Promise<PeopleDto> {
    this.logger.log(`Creando persona: ${data.firstName} ${data.lastName || ''}`, 'PeopleService');
    
    const people = await prisma.people.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        rucCi: data.rucCi,
        birthDate: data.birthDate,
        mainEmail: data.mainEmail,
        phone: data.phone,
        address: data.address,
        personType: data.personType,
        identityType: data.identityType,
      },
    }) as PeopleDto;

    this.logger.log(`Persona creada exitosamente: ${data.rucCi}`, 'PeopleService');
    this.logger.logDatabaseOperation('CREATE', 'People', { rucCi: data.rucCi });
    
    return people;
  }
}
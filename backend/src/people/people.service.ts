import { Injectable } from '@nestjs/common';
import { CreatePeopleDto, PeopleDto } from '@small-billing/shared';
import { LoggerService } from '../common/logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findAll(): Promise<PeopleDto[]> {
    return this.prisma.people.findMany({
      orderBy: { dateRegistered: 'desc' },
    }) as Promise<PeopleDto[]>;
  }

  async create(data: CreatePeopleDto): Promise<PeopleDto> {
    this.logger.log(`Creando persona: ${data.firstName} ${data.lastName || ''}`, 'PeopleService');
    
    const people = await this.prisma.people.create({
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
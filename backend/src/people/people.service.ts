import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePeopleDto, PeopleDto } from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class PeopleService {
  async findAll(): Promise<PeopleDto[]> {
    return prisma.people.findMany({
      orderBy: { dateRegistered: 'desc' },
    }) as Promise<PeopleDto[]>;
  }

  async create(data: CreatePeopleDto): Promise<PeopleDto> {
    return prisma.people.create({
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
    }) as Promise<PeopleDto>;
  }
}
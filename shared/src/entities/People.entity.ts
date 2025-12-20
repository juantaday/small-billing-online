import { PersonType } from '../enums/PersonType.enum';
import { IdentityType } from '../enums/IdentityType.enum';

// DTO para crear persona (lo que envía el frontend)
export interface CreatePeopleDto {
  firstName: string;
  lastName?: string;
  rucCi: string;
  birthDate?: Date;
  mainEmail?: string;
  phone?: string;
  address?: string;
  personType: PersonType;
  identityType: IdentityType;
}

// DTO de respuesta (lo que devuelve la API)
export interface PeopleDto extends CreatePeopleDto {
  id: string;
  dateRegistered: Date;
}

// DTO para actualizar (opcional, para después)
export interface UpdatePeopleDto extends Partial<CreatePeopleDto> {
  id: string;
}
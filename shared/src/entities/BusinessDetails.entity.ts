import { BusinessTypeDto } from './BusinessType.entity';

export interface BusinessDetailsDto {
  id: string;
  ruc: string;
  legalName: string;
  commercialName?: string | null;
  tradeName?: string | null;
  phone?: string | null;
  address?: string | null;
  legalNatureId: number;
  taxRegimeId: number;
  specialDesignationId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  legalNature?: BusinessTypeDto;
  taxRegime?: BusinessTypeDto;
  specialDesignation?: BusinessTypeDto | null;
}

export interface CreateBusinessDetailsDto {
  ruc: string;
  legalName: string;
  commercialName?: string | null;
  tradeName?: string | null;
  phone?: string | null;
  address?: string | null;
  legalNatureId: number;
  taxRegimeId: number;
  specialDesignationId?: number | null;
}

export interface UpdateBusinessDetailsDto extends Partial<CreateBusinessDetailsDto> {
  id: string;
}

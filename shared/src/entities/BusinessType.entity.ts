import { BusinessTypeGroup } from '../enums/BusinessTypeGroup.enum';

export interface BusinessTypeDto {
  id: number;
  code?: string | null;
  name: string;
  group: BusinessTypeGroup;
  description?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessTypeDto {
  code?: string | null;
  name: string;
  group: BusinessTypeGroup;
  description?: string | null;
  active?: boolean;
}

export interface UpdateBusinessTypeDto extends Partial<CreateBusinessTypeDto> {
  id: number;
}

import { RewardType } from '../enums/RewardType.enum';

// DTO para crear reward
export interface CreateRewardDto {
  name: string;
  description?: string;
  rewardType: RewardType;
  pointsCost: number;
  presentationId?: string; // Solo para tipo PRODUCT
  stock?: number;
  discountValue?: number; // Solo para tipo DISCOUNT
  validFrom?: Date;
  validUntil?: Date;
  imageUrl?: string;
  active?: boolean;
  terms?: string;
}

// DTO de respuesta
export interface RewardDto extends CreateRewardDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdateRewardDto extends Partial<CreateRewardDto> {
  id: string;
}

// DTO con presentación
export interface RewardWithRelationsDto extends RewardDto {
  presentation?: any; // PresentationDto
}

import { LoyaltyTransactionType } from '../enums/LoyaltyTransactionType.enum';

// DTO para crear transacción de lealtad
export interface CreateLoyaltyTransactionDto {
  customerId: string;
  points: number; // Positivo o negativo
  type: LoyaltyTransactionType;
  description: string;
  orderId?: string;
  rewardId?: string;
}

// DTO de respuesta
export interface LoyaltyTransactionDto extends CreateLoyaltyTransactionDto {
  id: string;
  createdAt: Date;
}

// DTO con relaciones
export interface LoyaltyTransactionWithRelationsDto extends LoyaltyTransactionDto {
  customer?: any; // CustomerDto
  reward?: any; // RewardDto
}

// DTO para listar transacciones de un cliente
export interface CustomerLoyaltyHistoryDto {
  customerId: string;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: LoyaltyTransactionDto[];
}

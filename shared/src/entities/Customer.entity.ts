// DTO para crear cliente
export interface CreateCustomerDto {
  peopleId: string;
  customerCategoryId: string;
  preferredPaymentMethod?: string;
  active?: boolean;
}

// DTO de respuesta
export interface CustomerDto extends CreateCustomerDto {
  id: string;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdateCustomerDto extends Partial<Omit<CreateCustomerDto, 'peopleId'>> {
  id: string;
}

// DTO completo con relaciones pobladas
export interface CustomerWithRelationsDto extends CustomerDto {
  people?: any; // PeopleDto
  customerCategory?: any; // CustomerCategoryDto
}

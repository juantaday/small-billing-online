// DTO para crear categoría de cliente
export interface CreateCustomerCategoryDto {
  name: string;
  discountPercentage: number;
  pointsMultiplier: number;
  ticketThreshold: number;
  color?: string;
  active?: boolean;
}

// DTO de respuesta
export interface CustomerCategoryDto extends CreateCustomerCategoryDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdateCustomerCategoryDto extends Partial<CreateCustomerCategoryDto> {
  id: string;
}

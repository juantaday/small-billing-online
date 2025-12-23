// DTO para crear categoría de producto
export interface CreateCategoryDto {
  name: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  active?: boolean;
}

// DTO de respuesta
export interface CategoryDto extends CreateCategoryDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string;
}

// DTO con conteo de productos
export interface CategoryWithCountDto extends CategoryDto {
  productCount: number;
}

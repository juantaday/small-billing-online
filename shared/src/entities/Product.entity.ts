// DTO para crear producto
export interface CreateProductDto {
  categoryId: string;
  name: string; // Nombre corto para tickets
  slug: string;
  shortDescription?: string; // Descripción breve para menú
  longDescription?: string; // Descripción completa con detalles
  active?: boolean;
  featured?: boolean;
}

// DTO de respuesta
export interface ProductDto extends CreateProductDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}

// DTO completo con relaciones
export interface ProductWithRelationsDto extends ProductDto {
  category?: any; // CategoryDto
  images?: any[]; // ProductImageDto[]
  presentations?: any[]; // PresentationDto[]
}

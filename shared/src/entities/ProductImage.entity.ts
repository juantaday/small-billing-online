// DTO para crear imagen de producto
export interface CreateProductImageDto {
  productId: string;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

// DTO de respuesta
export interface ProductImageDto extends CreateProductImageDto {
  id: string;
  createdAt: Date;
}

// DTO para actualizar
export interface UpdateProductImageDto extends Partial<Omit<CreateProductImageDto, 'productId'>> {
  id: string;
}

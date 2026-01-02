// DTO para crear imagen de producto
export interface CreateProductImageDto {
  productId: string;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

// DTO de respuesta
export interface ProductImageDto {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: Date;
}

// DTO para actualizar
export interface UpdateProductImageDto extends Partial<Omit<CreateProductImageDto, 'productId'>> {
  id: string;
}

// DTO para reordenar imágenes
export interface ImageOrderDto {
  imageId: string;
  displayOrder: number;
}

export interface ReorderImagesDto {
  order: ImageOrderDto[];
}

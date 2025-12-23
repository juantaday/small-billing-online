// DTO para crear presentación
export interface CreatePresentationDto {
  productId: string;
  name: string;
  quantity: number;
  barcode: string;
  costPrice: number;
  lastCostPrice?: number;
  averageCostPrice?: number;
  salePrice: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  active?: boolean;
}

// DTO de respuesta
export interface PresentationDto extends CreatePresentationDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdatePresentationDto extends Partial<Omit<CreatePresentationDto, 'productId' | 'barcode'>> {
  id: string;
}

// DTO con producto
export interface PresentationWithProductDto extends PresentationDto {
  product?: any; // ProductDto
}

// DTO para actualizar stock
export interface UpdateStockDto {
  id: string;
  quantity: number; // Cantidad a sumar o restar
  reason?: string;
}

import { PresentationTypeDto } from './PresentationType.entity';

// DTO para crear presentación
export interface CreatePresentationDto {
  productId: string;
  presentationTypeId: string;
  presentationInferenceId?: string;
  quantity: number;
  barcode: string | null ;
  costPrice: number;
  lastCostPrice?: number;
  averageCostPrice?: number;
  salePrice: number;
  // Compatibilidad frontend: en backend el stock real está en ProductStock
  stock?: number;
  minStock?: number;
  maxStock?: number;
  active?: boolean;
}

// DTO de respuesta
export interface PresentationDto extends CreatePresentationDto {
  id: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  presentationType?: PresentationTypeDto;
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

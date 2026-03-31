import { PresentationTypeDto } from './PresentationType.entity';

export interface ProductStockDto {
  id: string;
  productId: string;
  stockPresentationTypeId: string;
  stock: number;
  minStock: number;
  maxStock?: number | null;
  createdAt: Date;
  updatedAt: Date;
  stockPresentationType?: PresentationTypeDto;
}

export interface CreateProductStockDto {
  productId: string;
  stockPresentationTypeId: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateProductStockDto {
  id: string;
  stockPresentationTypeId?: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
}

import { ProductTaxSelectionDto } from './ProductTax.entity';

// DTO para crear producto
export interface CreateProductDto {
  categoryId: string;
  name: string; // Nombre corto para tickets
  slug: string;
  shortDescription?: string; // Descripción breve para menú
  longDescription?: string; // Descripción completa con detalles
  defaultPurchasePresentationId?: string | null;
  defaultSalePresentationId?: string | null;
  selectedTaxes?: ProductTaxSelectionDto[];
  active?: boolean;
  featured?: boolean;
}

// DTO de respuesta
export interface ProductDto extends CreateProductDto {
  id: string;
  salePrice: number;
  lastCostPrice: number;
  averageCostPrice: number;
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
  productStock?: any; // ProductStockDto
  productTaxes?: ProductTaxSelectionDto[];
}

// DTO para presentación en contexto de wizard/finalize
export interface FinalizeProductWizardPresentationDto {
  id?: string; // undefined si es nueva, string si es edición
  presentationTypeId: string;
  presentationInferenceId?: string | null;
  presentationInferenceTypeId?: string | null;
  quantity: number;
  barcode?: string | null;
  costPrice: number;
  salePrice: number;
  active?: boolean;
}

// DTO para finalizar wizard de producto (operación atómica)
export interface FinalizeProductWizardDto {
  // Datos del producto
  product: UpdateProductDto;
  // Array de presentaciones (crear, actualizar, eliminar)
  presentations: FinalizeProductWizardPresentationDto[];
  // Índices en el array para definir presentaciones por defecto
  defaultPurchasePresentationIndex: number | null;
  defaultSalePresentationIndex: number | null;
}

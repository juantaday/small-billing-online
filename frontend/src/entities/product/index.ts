/**
 * Entity: Product
 * Re-exporta tipos del shared package y API
 */

export { productApi } from './api/product-api';

// Re-export types from shared package
export type { ProductDto, CreateProductDto, UpdateProductDto } from '@small-billing/shared';

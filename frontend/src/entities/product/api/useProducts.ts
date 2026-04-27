/**
 * Hook: useProducts
 * Gestión de productos con API
 */

import { useEffect, useState } from 'react';
import { productApi } from './product-api';
import {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductWithRelationsDto,
  FinalizeProductWizardDto,
  QuickAddInventoryDto,
} from '@small-billing/shared';

export function useProducts(params?: {
  page?: number;
  limit?: number;
  categoryId?: string;
}) {
  const [products, setProducts] = useState<ProductWithRelationsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (overrides?: {
    page?: number;
    limit?: number;
    categoryId?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.getAll({
        page: overrides?.page ?? params?.page,
        limit: overrides?.limit ?? params?.limit,
        categoryId: overrides?.categoryId ?? params?.categoryId,
      });

      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recarga un único producto por ID y actualiza el estado local.
   * Usar esto en lugar de fetchProducts() después de editar/crear
   * para evitar traer todos los productos de nuevo.
   */
  const refreshProduct = async (id: string): Promise<void> => {
    try {
      const updated = await productApi.getById(id, true);
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === id);
        if (exists) {
          return prev.map((p) => (p.id === id ? updated : p));
        }
        // Si es producto nuevo, lo agrega al inicio de la lista
        return [updated, ...prev];
      });
    } catch (err) {
      console.error('Error al refrescar producto:', err);
      // Fallback: si falla getById, recargamos todo
      await fetchProducts();
    }
  };

  const createProduct = async (
    data: CreateProductDto,
    shouldRefresh = true,
  ): Promise<ProductDto> => {
    try {
      const product = await productApi.create(data);
      if (shouldRefresh) {
        await refreshProduct(product.id);
      }
      return product;
    } catch (err) {
      console.error('Error al crear producto:', err);
      throw err;
    }
  };

  const updateProduct = async (
    id: string,
    data: UpdateProductDto,
    shouldRefresh = true,
  ): Promise<ProductDto> => {
    try {
      const product = await productApi.update(id, data);
      if (shouldRefresh) {
        await refreshProduct(id);
      }
      return product;
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      throw err;
    }
  };

  const finalizeWizard = async (
    id: string,
    payload: FinalizeProductWizardDto,
  ): Promise<ProductDto> => {
    try {
      const product = await productApi.finalizeWizard(id, payload);

      setProducts((prev) => {
        const exists = prev.some((p) => p.id === id);
        const activePresentations = (payload.presentations || []).filter((p) => p.active ?? true);

        if (exists) {
          return prev.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              ...payload.product,
              id,
              name: payload.product.name ?? p.name,
              slug: payload.product.slug ?? p.slug,
              shortDescription: payload.product.shortDescription ?? p.shortDescription,
              categoryId: payload.product.categoryId ?? p.categoryId,
              featured: payload.product.featured ?? p.featured,
              active: payload.product.active ?? p.active,
              defaultPurchasePresentationId: product.defaultPurchasePresentationId,
              defaultSalePresentationId: product.defaultSalePresentationId,
              presentations: activePresentations.map((item) => ({
                id: item.id || `tmp-${item.presentationTypeId}`,
                productId: id,
                presentationTypeId: item.presentationTypeId,
                quantity: item.quantity,
                barcode: item.barcode ?? null,
                costPrice: item.costPrice,
                salePrice: item.salePrice,
                active: item.active ?? true,
                createdAt: p.createdAt,
                updatedAt: new Date(),
              })),
              updatedAt: new Date(),
            };
          });
        }

        return prev;
      });

      return product;
    } catch (err) {
      console.error('Error al finalizar wizard de producto:', err);
      throw err;
    }
  };

  const discardDraft = async (id: string): Promise<void> => {
    try {
      await productApi.discardDraft(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error al descartar borrador de producto:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await productApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      throw err;
    }
  };

  const quickAddInventory = async (
    productId: string,
    payload: QuickAddInventoryDto,
  ): Promise<{
    productId: string;
    stockBefore: number;
    stockAfter: number;
    addedBaseUnits: number;
    factorToBase: number;
  }> => {
    try {
      const result = await productApi.quickAddInventory(productId, payload);
      await fetchProducts();
      return result;
    } catch (err) {
      console.error('Error al ingresar inventario rápido:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [params?.page, params?.limit, params?.categoryId]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    refreshProduct,
    createProduct,
    updateProduct,
    finalizeWizard,
    discardDraft,
    deleteProduct,
    quickAddInventory,
  };
}
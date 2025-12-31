/**
 * Hook: useProducts
 * Gestión de productos con API
 */

import { useState, useEffect } from 'react';
import { productApi } from './product-api';
import { ProductDto, CreateProductDto, UpdateProductDto, ProductWithRelationsDto } from '@small-billing/shared';

export function useProducts() {
  const [products, setProducts] = useState<ProductWithRelationsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (categoryId?: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Agregar filtro por categoryId cuando el API lo soporte
      const data = await productApi.getAll();
      
      // Filtrar por categoría en el frontend si es necesario
      const filteredData = categoryId 
        ? data.filter(p => p.categoryId === categoryId)
        : data;
      
      setProducts(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductDto): Promise<ProductDto> => {
    try {
      const product = await productApi.create(data);
      await fetchProducts(); // Recargar lista
      return product;
    } catch (err) {
      console.error('Error al crear producto:', err);
      throw err;
    }
  };

  const updateProduct = async (id: string, data: UpdateProductDto): Promise<ProductDto> => {
    try {
      const product = await productApi.update(Number(id), data);
      await fetchProducts(); // Recargar lista
      return product;
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await productApi.delete(Number(id));
      await fetchProducts(); // Recargar lista
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

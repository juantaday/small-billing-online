/**
 * Hook: useProductImages
 * Gestiona las operaciones CRUD de imágenes de productos
 */

import { useState, useCallback } from 'react';
import { apiClient } from '@/shared/api';
import type {
  ProductImageDto,
  CreateProductImageDto,
  UpdateProductImageDto,
  ReorderImagesDto,
} from '@small-billing/shared';

// Alias para compatibilidad
export type ProductImage = ProductImageDto;

export function useProductImages() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todas las imágenes de un producto
  const fetchImages = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ProductImage[]>(
        `/products/${id}/images`
      );
      setImages(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err: any) {
      setError(err.message || 'Error al cargar las imágenes');
      console.error('Error fetching product images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear una nueva imagen
  const createImage = useCallback(
    async (id: string, data: Omit<CreateProductImageDto, 'productId'>) => {
      setLoading(true);
      setError(null);
      try {
        const newImage = await apiClient.post<ProductImage>(
          `/products/${id}/images`,
          data
        );
        setImages((prev) => [...prev, newImage].sort((a, b) => a.displayOrder - b.displayOrder));
        return newImage;
      } catch (err: any) {
        setError(err.message || 'Error al crear la imagen');
        console.error('Error creating product image:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar una imagen existente
  const updateImage = useCallback(
    async (id: string, imageId: string, data: UpdateProductImageDto) => {
      setLoading(true);
      setError(null);
      try {
        const updatedImage = await apiClient.patch<ProductImage>(
          `/products/${id}/images/${imageId}`,
          data
        );
        setImages((prev) =>
          prev.map((img) => (img.id === imageId ? updatedImage : img))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
        return updatedImage;
      } catch (err: any) {
        setError(err.message || 'Error al actualizar la imagen');
        console.error('Error updating product image:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar una imagen
  const deleteImage = useCallback(
    async (id: string, imageId: string) => {
      setLoading(true);
      setError(null);
      try {

        console.log(`Deleting image with ID: ${imageId} from product: ${id}`);
        await apiClient.deleteBase(`/products/${id}/images/${imageId}`);
        console.log(`Image with ID: ${imageId} deleted successfully`);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } catch (err: any) {
        setError(err.message || 'Error al eliminar la imagen');
        console.error('Error deleting product image:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Establecer una imagen como primaria
  const setPrimaryImage = useCallback(
    async (id: string, imageId: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.patch(`/products/${id}/images/${imageId}/primary`);
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
          }))
        );
      } catch (err: any) {
        setError(err.message || 'Error al establecer imagen primaria');
        console.error('Error setting primary image:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reordenar imágenes (envía el nuevo orden al backend)
  const reorderImages = useCallback(
    async (id: string, reorderDto: ReorderImagesDto) => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.patch(`/products/${id}/images/reorder`, reorderDto);
        setImages((prev) => {
          const reordered = [...prev];
          reorderDto.order.forEach(({ imageId, displayOrder }) => {
            const img = reordered.find((i) => i.id === imageId);
            if (img) img.displayOrder = displayOrder;
          });
          return reordered.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        });
      } catch (err: any) {
        setError(err.message || 'Error al reordenar las imágenes');
        console.error('Error reordering images:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    images,
    loading,
    error,
    fetchImages,
    createImage,
    updateImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
  };
}

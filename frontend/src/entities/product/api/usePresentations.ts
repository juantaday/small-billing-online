/**
 * Hook: usePresentations
 * Gestión de presentaciones con API
 */

import { useState } from 'react';
import { presentationApi } from './presentation-api';
import { PresentationDto, CreatePresentationDto, UpdatePresentationDto } from '@small-billing/shared';

export function usePresentations() {
  const [presentations, setPresentations] = useState<PresentationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresentationsByProduct = async (productId: string): Promise<PresentationDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await presentationApi.getByProductId(productId);
      setPresentations(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar presentaciones:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPresentation = async (data: CreatePresentationDto): Promise<PresentationDto> => {
    try {
      const presentation = await presentationApi.create(data);
      // Opcionalmente recargar presentaciones si es necesario
      return presentation;
    } catch (err) {
      console.error('Error al crear presentación:', err);
      throw err;
    }
  };

  const updatePresentation = async (
    id: string,
    data: UpdatePresentationDto
  ): Promise<PresentationDto> => {
    try {
      const presentation = await presentationApi.update(id, data);
      return presentation;
    } catch (err) {
      console.error('Error al actualizar presentación:', err);
      throw err;
    }
  };

  const deletePresentation = async (id: string): Promise<void> => {
    try {
      await presentationApi.delete(id);
    } catch (err) {
      console.error('Error al eliminar presentación:', err);
      throw err;
    }
  };

  return {
    presentations,
    loading,
    error,
    fetchPresentationsByProduct,
    createPresentation,
    updatePresentation,
    deletePresentation,
  };
}

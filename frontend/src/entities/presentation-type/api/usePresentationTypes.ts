import { useEffect, useState } from 'react';
import {
  CreatePresentationTypeDto,
  PresentationTypeDto,
  UpdatePresentationTypeDto,
} from '@small-billing/shared';
import { presentationTypeApi } from './presentation-type-api';

export function usePresentationTypes() {
  const [presentationTypes, setPresentationTypes] = useState<PresentationTypeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresentationTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await presentationTypeApi.getAll();
      setPresentationTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentationTypes();
  }, []);

  const createPresentationType = async (
    data: CreatePresentationTypeDto,
  ): Promise<PresentationTypeDto> => {
    return presentationTypeApi.create(data);
  };

  const updatePresentationType = async (
    id: string,
    data: UpdatePresentationTypeDto,
  ): Promise<PresentationTypeDto> => {
    return presentationTypeApi.update(id, data);
  };

  const deletePresentationType = async (id: string): Promise<PresentationTypeDto> => {
    return presentationTypeApi.delete(id);
  };

  return {
    presentationTypes,
    loading,
    error,
    fetchPresentationTypes,
    createPresentationType,
    updatePresentationType,
    deletePresentationType,
  };
}

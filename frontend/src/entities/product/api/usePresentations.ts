/**
 * Hook: usePresentations
 * Gestión de presentaciones con API
 */

import { useState } from 'react';

interface Presentation {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  barcode: string;
  costPrice: number;
  lastCostPrice?: number;
  averageCostPrice?: number;
  salePrice: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePresentationRequest {
  productId: string;
  name: string;
  quantity: number;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  active?: boolean;
}

export function usePresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresentationsByProduct = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/presentations?productId=${productId}`);
      if (!response.ok) throw new Error('Error al cargar presentaciones');
      
      const data = await response.json();
      setPresentations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createPresentation = async (data: CreatePresentationRequest): Promise<Presentation> => {
    const response = await fetch('http://localhost:3000/presentations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al crear presentación');
    }

    return response.json();
  };

  const updatePresentation = async (
    id: string,
    data: Partial<CreatePresentationRequest>
  ): Promise<Presentation> => {
    const response = await fetch(`http://localhost:3000/presentations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar presentación');
    }

    return response.json();
  };

  const deletePresentation = async (id: string): Promise<void> => {
    const response = await fetch(`http://localhost:3000/presentations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar presentación');
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

/**
 * Hook: useProducts
 * Gestión de productos con API
 */

import { useState, useEffect } from 'react';

// TODO: Importar desde shared cuando esté disponible
interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  categoryId: string;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: any;
  images?: any[];
  presentations?: any[];
}

interface CreateProductRequest {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription?: string;
  active?: boolean;
  featured?: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (categoryId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = categoryId 
        ? `http://localhost:3000/products?categoryId=${categoryId}`
        : 'http://localhost:3000/products';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar productos');
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductRequest): Promise<Product> => {
    const response = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al crear producto');
    }

    return response.json();
  };

  const updateProduct = async (id: string, data: Partial<CreateProductRequest>): Promise<Product> => {
    const response = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar producto');
    }

    return response.json();
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const response = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar producto');
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

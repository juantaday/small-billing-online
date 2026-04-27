/**
 * Feature: Customer Management
 * Hook para gestión de clientes
 */

import { useState, useEffect } from 'react';
import { customerApi } from '@/entities/customer';
import { CustomerWithRelationsDto } from '@small-billing/shared';

export function useCustomers(page?: number, limit?: number) {
  const [customers, setCustomers] = useState<CustomerWithRelationsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customerApi.getAll({ page, limit });
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      console.error('Error loading customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, limit]);

  const deleteCustomer = async (id: string) => {
    try {
      await customerApi.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
      return false;
    }
  };

  const refreshCustomers = () => {
    loadCustomers();
  };

  return {
    customers,
    isLoading,
    error,
    deleteCustomer,
    refreshCustomers,
  };
}

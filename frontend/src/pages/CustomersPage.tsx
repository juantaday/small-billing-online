/**
 * Page: Customers
 * Página de gestión de clientes que compone el feature
 */

import { useEffect, useRef, useState } from 'react';
import { useCustomers, CustomerList, CustomerForm } from '@/features/customer-management';
import { customerApi } from '@/entities/customer';
import { CustomerWithRelationsDto } from '@small-billing/shared';

export function CustomersPage() {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const { customers, isLoading, error, deleteCustomer, refreshCustomers } = useCustomers(page, pageSize);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithRelationsDto | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerWithRelationsDto[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);

  const handleAddCustomer = () => {
    setEditingCustomer(undefined);
    setShowForm(true);
  };

  const handleEditCustomer = (customer: CustomerWithRelationsDto) =>{
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCustomer(undefined);
    refreshCustomers();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCustomer(undefined);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 700);

    return () => {
      clearTimeout(handle);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      searchAbortRef.current?.abort();
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const requestId = ++searchRequestIdRef.current;

    const runSearch = async () => {
      try {
        const data = await customerApi.search(debouncedQuery, { signal: controller.signal });
        if (requestId === searchRequestIdRef.current) {
          setSearchResults(data);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Error searching customers:', err);
          if (requestId === searchRequestIdRef.current) {
            setSearchResults([]);
          }
        }
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    };

    runSearch();
  }, [debouncedQuery]);

  const isSearchActive = debouncedQuery.length >= 3;
  const visibleCustomers = isSearchActive ? (searchResults || []) : customers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Clientes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tu base de clientes
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 badge-danger border rounded-lg">
          <p className="text-danger-600 dark:text-danger-400">{error}</p>
        </div>
      )}

      {/* Customer List */}
      <CustomerList
        customers={visibleCustomers}
        isLoading={isLoading || isSearching}
        onDelete={deleteCustomer}
        onEdit={handleEditCustomer}
        onAdd={handleAddCustomer}
        disableAdd={isSearching}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNextPage={() => setPage((prev) => prev + 1)}
        onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
        page={!isSearchActive ? page : undefined}
        canGoNext={!isSearchActive && customers.length === pageSize}
      />

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}

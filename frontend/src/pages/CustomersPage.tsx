/**
 * Page: Customers
 * Página de gestión de clientes que compone el feature
 */

import { useState } from 'react';
import { useCustomers, CustomerList, CustomerForm } from '@/features/customer-management';
import { CustomerWithRelationsDto } from '@small-billing/shared';

export function CustomersPage() {
  const { customers, isLoading, error, deleteCustomer, refreshCustomers } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithRelationsDto | undefined>();

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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Customer List */}
      <CustomerList
        customers={customers}
        isLoading={isLoading}
        onDelete={deleteCustomer}
        onEdit={handleEditCustomer}
        onAdd={handleAddCustomer}
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

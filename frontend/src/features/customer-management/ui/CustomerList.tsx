/**
 * Feature: Customer Management - Customer List
 * Lista de clientes con búsqueda y filtrado
 */

import { useState } from 'react';
import { Search, Trash2, Edit, UserPlus } from 'lucide-react';
import { Card, Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { CustomerWithRelationsDto } from '@small-billing/shared';

interface CustomerListProps {
  customers: CustomerWithRelationsDto[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (customer: CustomerWithRelationsDto) => void;
  onAdd?: () => void;
}

export function CustomerList({ 
  customers, 
  isLoading, 
  onDelete, 
  onEdit, 
  onAdd 
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) => {
    const people = customer.people;
    if (!people) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      people.firstName?.toLowerCase().includes(searchLower) ||
      people.lastName?.toLowerCase().includes(searchLower) ||
      people.mainEmail?.toLowerCase().includes(searchLower) ||
      people.phone?.includes(searchQuery) ||
      people.rucCi?.includes(searchQuery)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar clientes por nombre, RUC, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Customers Table */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  RUC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery 
                        ? 'No se encontraron clientes con ese criterio' 
                        : 'No hay clientes registrados'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const people = customer.people;
                  const firstName = people?.firstName || '';
                  const lastName = people?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim() || 'Sin nombre';
                  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : '?';
                  
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <span className="text-red-600 font-semibold">
                              {initials}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {fullName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {people?.rucCi || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {people?.mainEmail || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {people?.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                          {customer.customerCategoryId ? `Cat. ${customer.customerCategoryId}` : 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(customer)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar a ${fullName}?`)) {
                                onDelete(customer.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats */}
      {filteredCustomers.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredCustomers.length} de {customers.length} clientes
        </div>
      )}
    </div>
  );
}

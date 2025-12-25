/**
 * Feature: Customer Management - Customer Form
 * Formulario para crear/editar clientes
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { customerApi } from '@/entities/customer';
import { Button, Input } from '@/shared/ui';
import { 
  CustomerWithRelationsDto, 
  CreatePeopleDto,
  UpdateCustomerDto, 
  PersonType,
  IdentityType
} from '@small-billing/shared';

interface CustomerFormProps {
  customer?: CustomerWithRelationsDto;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CreatePeopleDto>({
    firstName: '',
    lastName: '',
    rucCi: '',
    mainEmail: '',
    phone: '',
    address: '',
    personType : PersonType.NATURAL,
    identityType:  IdentityType.RUC,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.people?.firstName || '',
        lastName: customer.people?.lastName || '',
        rucCi: customer.people?.rucCi || '',
        mainEmail: customer.people?.mainEmail || '',
        phone: customer.people?.phone || '',
        address: customer.people?.address || '',
        personType: customer.people?.personType || PersonType.NATURAL,
        identityType: customer.people?.identityType || IdentityType.RUC,
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (customer) {
        // Para actualizar, enviamos UpdateCustomerDto
        const updateData: CustomerWithRelationsDto = {
            id: customer.id,
            peopleId: customer.peopleId,
            customerCategoryId: customer.customerCategoryId,
            preferredPaymentMethod: customer.preferredPaymentMethod,
            active: customer.active,    
            totalPurchases: customer.totalPurchases,
            people: {
              ...customer.people,
              ...formData,
            },  
            };

        await customerApi.updateWithRelations(customer.id, updateData);
      } else {
        // Para crear, enviamos CreateCustomerDto
        //await customerApi.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Juan"
              required
              disabled={isSubmitting}
            />

            <Input
              label="Apellido *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Pérez"
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="RUC / CI"
            value={formData.rucCi}
            onChange={(e) => setFormData({ ...formData, rucCi: e.target.value })}
            placeholder="1234567890001"
            disabled={isSubmitting}
          />

          <Input
            label="Email"
            type="email"
            value={formData.mainEmail}
            onChange={(e) => setFormData({ ...formData, mainEmail: e.target.value })}
            placeholder="juan.perez@email.com"
            disabled={isSubmitting}
          />

          <Input
            label="Teléfono"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 890"
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, Ciudad, País"
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : customer ? 'Actualizar' : 'Crear Cliente'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

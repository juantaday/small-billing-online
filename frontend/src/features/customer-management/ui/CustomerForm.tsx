/**
 * Feature: Customer Management - Customer Form
 * Formulario para crear/editar clientes
 */

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { customerApi } from '@/entities/customer';
import { customerCategoryApi } from '@/entities/customer-category';
import { Button, Input } from '@/shared/ui';
import { 
  CustomerWithRelationsDto,
  CreateCustomerDto,
  CreatePeopleDto,
  UpdateCustomerDto, 
  CustomerCategoryDto,
  CreateCustomerCategoryDto,
  PersonType,
  IdentityType
} from '@small-billing/shared';

interface CustomerFormProps {
  customer?: CustomerWithRelationsDto;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [peopleData, setPeopleData] = useState<CreatePeopleDto>({
    firstName: '',
    lastName: '',
    rucCi: '',
    mainEmail: '',
    phone: '',
    address: '',
    personType: PersonType.NATURAL,
    identityType: IdentityType.CEDULA,
  });

  const [customerCategoryId, setCustomerCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<CustomerCategoryDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para manejar cuando encuentra un cliente existente
  const [existingCustomerData, setExistingCustomerData] = useState<CustomerWithRelationsDto | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!customer);
  
  // Estado para el modal de nueva categoría
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState<CreateCustomerCategoryDto>({
    name: '',
    discountPercentage: 0,
    pointsMultiplier: 1,
    ticketThreshold: 0,
    color: '#3B82F6',
  });
  const [categoryError, setCategoryError] = useState('');

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (customer) {
      setPeopleData({
        firstName: customer.people?.firstName || '',
        lastName: customer.people?.lastName || '',
        rucCi: customer.people?.rucCi || '',
        mainEmail: customer.people?.mainEmail || '',
        phone: customer.people?.phone || '',
        address: customer.people?.address || '',
        personType: customer.people?.personType || PersonType.NATURAL,
        identityType: customer.people?.identityType || IdentityType.CEDULA,
      });
      setCustomerCategoryId(customer.customerCategoryId);
    }
  }, [customer]);

  const loadCategories = async () => {
    try {
      const data = await customerCategoryApi.getAll();
      setCategories(data);
      
      // Si no hay categoría seleccionada y hay categorías disponibles, seleccionar la primera
      if (!customerCategoryId && data.length > 0) {
        setCustomerCategoryId(data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (!peopleData.firstName || !peopleData.rucCi) {
      setError('El nombre y RUC/CI son obligatorios');
      return;
    }

    if (!customerCategoryId) {
      setError('Debe seleccionar una categoría de cliente');
      return;
    }

    setIsSubmitting(true);

    try {
      if (customer || existingCustomerData) {
        // Actualizar cliente existente (incluye datos de people y categoría)
        const customerId = customer?.id || existingCustomerData?.id;
        const updateData: UpdateCustomerDto = {
          id: customerId!,
          customerCategoryId,
          people: peopleData, // Incluir todos los datos de people para actualización
        };
        await customerApi.update(customerId!, updateData);
      } else {
        // Crear nuevo cliente con validación automática de duplicados
        const createData: CreateCustomerDto = {
          people: peopleData,
          customerCategoryId,
        };
        await customerApi.create(createData);
      }
      onSuccess();
    } catch (err: any) {
      // Manejo de errores específicos
      if (err.response?.status === 409 && err.response?.data?.data?.existingCustomer) {
        // Cliente ya existe - cargar datos automáticamente para editar
        const existingData = err.response.data.data;
        
        setExistingCustomerData({
          ...existingData.customer,
          people: existingData.people,
          customerCategory: existingData.customerCategory,
        });
        
        // Rellenar formulario con datos existentes
        setPeopleData(existingData.people);
        setCustomerCategoryId(existingData.customer.customerCategoryId);
        setIsEditMode(true);
        
        setError(`✏️ ${existingData.message}. Ahora puedes actualizar la categoría u otros datos.`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err instanceof Error ? err.message : 'Error al guardar cliente');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    setCategoryError('');
    
    if (!newCategoryData.name || !newCategoryData.ticketThreshold) {
      setCategoryError('El nombre y umbral de ticket son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear la categoría en la base de datos
      const newCategory = await customerCategoryApi.create(newCategoryData);
      
      // Agregar al array local sin recargar
      setCategories(prev => [...prev, newCategory]);
      
      // Seleccionar automáticamente la nueva categoría
      setCustomerCategoryId(newCategory.id);
      
      // Cerrar modal y resetear form
      setShowCategoryModal(false);
      setNewCategoryData({
        name: '',
        discountPercentage: 0,
        pointsMultiplier: 1,
        ticketThreshold: 0,
        color: '#3B82F6',
      });
    } catch (err: any) {
      setCategoryError(err.response?.data?.message || 'Error al crear categoría');
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
            {customer || existingCustomerData ? 'Editar Cliente' : 'Nuevo Cliente'}
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
              value={peopleData.firstName}
              onChange={(e) => setPeopleData({ ...peopleData, firstName: e.target.value })}
              placeholder="Juan"
              required
              disabled={isSubmitting}
            />

            <Input
              label="Apellido"
              value={peopleData.lastName || ''}
              onChange={(e) => setPeopleData({ ...peopleData, lastName: e.target.value })}
              placeholder="Pérez"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Identidad *
              </label>
              <select
                value={peopleData.identityType}
                onChange={(e) => setPeopleData({ ...peopleData, identityType: e.target.value as IdentityType })}
                disabled={isSubmitting || !!customer || !!existingCustomerData}
                required
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <option value={IdentityType.CEDULA}>Cédula</option>
                <option value={IdentityType.RUC}>RUC</option>
                <option value={IdentityType.PASAPORTE}>Pasaporte</option>
              </select>
            </div>

            <Input
              label="RUC / CI *"
              value={peopleData.rucCi}
              onChange={(e) => setPeopleData({ ...peopleData, rucCi: e.target.value })}
              placeholder="1234567890001"
              required
              disabled={isSubmitting || !!customer || !!existingCustomerData}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={peopleData.mainEmail || ''}
            onChange={(e) => setPeopleData({ ...peopleData, mainEmail: e.target.value })}
            placeholder="juan.perez@email.com"
            disabled={isSubmitting}
          />

          <Input
            label="Teléfono"
            type="tel"
            value={peopleData.phone || ''}
            onChange={(e) => setPeopleData({ ...peopleData, phone: e.target.value })}
            placeholder="+593 99 123 4567"
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección
            </label>
            <textarea
              value={peopleData.address || ''}
              onChange={(e) => setPeopleData({ ...peopleData, address: e.target.value })}
              placeholder="Calle, Ciudad, País"
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Categoría de Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría de Cliente *
            </label>
            <div className="flex gap-2">
              <select
                value={customerCategoryId}
                onChange={(e) => setCustomerCategoryId(e.target.value)}
                disabled={isSubmitting}
                required
                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <option value="">Seleccione una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.discountPercentage}% descuento)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                disabled={isSubmitting}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Agregar nueva categoría"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Información adicional para modo edición */}
          {(customer || existingCustomerData) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Información del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                <div>
                  <span className="font-medium">Total Compras:</span> ${(customer?.totalPurchases || existingCustomerData?.totalPurchases || 0).toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Puntos:</span> {customer?.loyaltyPoints || existingCustomerData?.loyaltyPoints || 0}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Última Compra:</span>{' '}
                  {(customer?.lastPurchaseDate || existingCustomerData?.lastPurchaseDate)
                    ? new Date(customer?.lastPurchaseDate || existingCustomerData?.lastPurchaseDate!).toLocaleDateString() 
                    : 'Sin compras'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`p-3 rounded-lg border ${
              error.includes('✏️') 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                error.includes('✏️')
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-600 dark:text-red-400'
              }`}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                customer || existingCustomerData ? 'Actualizar Cliente' : 'Crear Cliente'
              )}
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

      {/* Modal para agregar nueva categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Nueva Categoría de Cliente
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryError('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <Input
                label="Nombre *"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                placeholder="VIP, Regular, Premium..."
                disabled={isSubmitting}
              />

              <Input
                label="Descuento (%)"
                type="number"
                value={newCategoryData.discountPercentage.toString()}
                onChange={(e) => setNewCategoryData({ 
                  ...newCategoryData, 
                  discountPercentage: parseFloat(e.target.value) || 0 
                })}
                placeholder="10"
                min="0"
                max="100"
                step="0.1"
                disabled={isSubmitting}
              />

              <Input
                label="Multiplicador de Puntos"
                type="number"
                value={newCategoryData.pointsMultiplier.toString()}
                onChange={(e) => setNewCategoryData({ 
                  ...newCategoryData, 
                  pointsMultiplier: parseFloat(e.target.value) || 1 
                })}
                placeholder="1.5"
                min="0"
                step="0.1"
                disabled={isSubmitting}
              />

              <Input
                label="Umbral de Ticket *"
                type="number"
                value={newCategoryData.ticketThreshold.toString()}
                onChange={(e) => setNewCategoryData({ 
                  ...newCategoryData, 
                  ticketThreshold: parseFloat(e.target.value) || 0 
                })}
                placeholder="100"
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={newCategoryData.color || '#3B82F6'}
                  onChange={(e) => setNewCategoryData({ ...newCategoryData, color: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full h-10 border rounded-lg cursor-pointer disabled:opacity-50"
                />
              </div>

              {categoryError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{categoryError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  fullWidth
                  onClick={handleCreateCategory}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Categoría'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryError('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

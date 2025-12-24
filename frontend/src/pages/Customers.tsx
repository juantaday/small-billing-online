import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  TrendingUp, 
  Award,
  Phone,
  Mail,
  MapPin,
  X,
  Save,
  UserPlus
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import clsx from 'clsx';

// Interfaces
interface People {
  id: string;
  firstName: string;
  lastName?: string;
  rucCi: string;
  birthDate?: string;
  mainEmail?: string;
  phone?: string;
  address?: string;
  personType: 'NATURAL' | 'JURIDICA';
  identityType: 'CEDULA' | 'RUC' | 'PASAPORTE';
}

interface CustomerCategory {
  id: string;
  name: string;
  discountPercentage: number;
  pointsMultiplier: number;
  color?: string;
}

interface Customer {
  id: string;
  peopleId: string;
  customerCategoryId: string;
  loyaltyPoints: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  active: boolean;
  createdAt: string;
  people?: People;
  customerCategory?: CustomerCategory;
}

interface FormData {
  // People data
  firstName: string;
  lastName: string;
  rucCi: string;
  birthDate: string;
  mainEmail: string;
  phone: string;
  address: string;
  personType: 'NATURAL' | 'JURIDICA';
  identityType: 'CEDULA' | 'RUC' | 'PASAPORTE';
  // Customer data
  customerCategoryId: string;
  preferredPaymentMethod: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeleteingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    rucCi: '',
    birthDate: '',
    mainEmail: '',
    phone: '',
    address: '',
    personType: 'NATURAL',
    identityType: 'CEDULA',
    customerCategoryId: '',
    preferredPaymentMethod: 'EFECTIVO'
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    discountPercentage: 0,
    pointsMultiplier: 1,
    ticketThreshold: 10,
    color: '#6B7280'
  });

  // Cargar clientes y categorías
  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:3000/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/customer-categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.people?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.people?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.people?.rucCi?.includes(searchTerm) ||
      customer.people?.mainEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || customer.customerCategoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalCustomers = customers.length;
  const totalPurchasesSum = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalPointsSum = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        firstName: customer.people?.firstName || '',
        lastName: customer.people?.lastName || '',
        rucCi: customer.people?.rucCi || '',
        birthDate: customer.people?.birthDate?.split('T')[0] || '',
        mainEmail: customer.people?.mainEmail || '',
        phone: customer.people?.phone || '',
        address: customer.people?.address || '',
        personType: customer.people?.personType || 'NATURAL',
        identityType: customer.people?.identityType || 'CEDULA',
        customerCategoryId: customer.customerCategoryId,
        preferredPaymentMethod: 'EFECTIVO'
      });
    } else {
      setEditingCustomer(null);
      // Buscar "Usuario Final" como categoría por defecto
      const defaultCategory = categories.find(cat => cat.name === 'Usuario Final') || categories[0];
      setFormData({
        firstName: '',
        lastName: '',
        rucCi: '',
        birthDate: '',
        mainEmail: '',
        phone: '',
        address: '',
        personType: 'NATURAL',
        identityType: 'CEDULA',
        customerCategoryId: defaultCategory?.id || '',
        preferredPaymentMethod: 'EFECTIVO'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCustomer) {
        // Actualizar cliente existente
        await fetch(`http://localhost:3000/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerCategoryId: formData.customerCategoryId,
            preferredPaymentMethod: formData.preferredPaymentMethod
          })
        });
      } else {
        // Crear persona primero
        const peopleResponse = await fetch('http://localhost:3000/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            rucCi: formData.rucCi,
            birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
            mainEmail: formData.mainEmail,
            phone: formData.phone,
            address: formData.address,
            personType: formData.personType,
            identityType: formData.identityType
          })
        });

        const people = await peopleResponse.json();

        // Crear cliente
        await fetch('http://localhost:3000/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peopleId: people.id,
            customerCategoryId: formData.customerCategoryId,
            preferredPaymentMethod: formData.preferredPaymentMethod
          })
        });
      }

      await fetchCustomers();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    
    setLoading(true);
    try {
      await fetch(`http://localhost:3000/customers/${deletingCustomer.id}`, {
        method: 'DELETE'
      });
      
      await fetchCustomers();
      setIsDeleteModalOpen(false);
      setDeleteingCustomer(null);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (customer: Customer) => {
    setDeleteingCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/customer-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData)
      });

      const newCategory = await response.json();
      
      // Recargar categorías
      await fetchCategories();
      
      // Seleccionar automáticamente la nueva categoría
      setFormData({...formData, customerCategoryId: newCategory.id});
      
      // Cerrar modal y resetear formulario
      setIsCategoryModalOpen(false);
      setCategoryFormData({
        name: '',
        discountPercentage: 0,
        pointsMultiplier: 1,
        ticketThreshold: 10,
        color: '#6B7280'
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      alert('Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Gestión de Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra tu base de clientes y programa de lealtad
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <UserPlus size={20} />
            Nuevo Cliente
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Clientes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ventas Totales</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${totalPurchasesSum.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Puntos Totales</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalPointsSum}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Award className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* Customers Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Compras
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {customer.people?.firstName?.[0]}{customer.people?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {customer.people?.firstName} {customer.people?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {customer.people?.rucCi}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.people?.mainEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail size={14} />
                            {customer.people.mainEmail}
                          </div>
                        )}
                        {customer.people?.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone size={14} />
                            {customer.people.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: customer.customerCategory?.color ? `${customer.customerCategory.color}20` : '#e5e7eb',
                          color: customer.customerCategory?.color || '#6b7280'
                        }}
                      >
                        {customer.customerCategory?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${customer.totalPurchases.toFixed(2)}
                      </p>
                      {customer.lastPurchaseDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Última: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Award size={16} className="text-yellow-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {customer.loyaltyPoints}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(customer)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Personal */}
                {!editingCustomer && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Información Personal
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Apellido
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Identidad *
                          </label>
                          <select
                            required
                            value={formData.identityType}
                            onChange={(e) => setFormData({...formData, identityType: e.target.value as any})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="CEDULA">Cédula</option>
                            <option value="RUC">RUC</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de Identificación *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.rucCi}
                            onChange={(e) => setFormData({...formData, rucCi: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Persona *
                          </label>
                          <select
                            required
                            value={formData.personType}
                            onChange={(e) => setFormData({...formData, personType: e.target.value as any})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="NATURAL">Natural</option>
                            <option value="JURIDICA">Jurídica</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fecha de Nacimiento
                          </label>
                          <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.mainEmail}
                            onChange={(e) => setFormData({...formData, mainEmail: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Dirección
                          </label>
                          <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Información de Cliente
                      </h3>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría de Cliente *
                    </label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={formData.customerCategoryId}
                        onChange={(e) => setFormData({...formData, customerCategoryId: e.target.value})}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.discountPercentage}% desc, {cat.pointsMultiplier}x pts)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap font-medium shadow-sm"
                        title="Agregar nueva categoría"
                      >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nueva</span>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Método de Pago Preferido
                    </label>
                    <select
                      value={formData.preferredPaymentMethod}
                      onChange={(e) => setFormData({...formData, preferredPaymentMethod: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Guardando...' : 'Guardar Cliente'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Eliminar Cliente
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar a{' '}
                <span className="font-semibold">
                  {deletingCustomer.people?.firstName} {deletingCustomer.people?.lastName}
                </span>
                ?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteingCustomer(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nueva Categoría
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    placeholder="Ej: Usuario Final"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Desc. %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={categoryFormData.discountPercentage}
                      onChange={(e) => setCategoryFormData({...categoryFormData, discountPercentage: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mult. Pts
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={categoryFormData.pointsMultiplier}
                      onChange={(e) => setCategoryFormData({...categoryFormData, pointsMultiplier: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Umbral $
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={categoryFormData.ticketThreshold}
                      onChange={(e) => setCategoryFormData({...categoryFormData, ticketThreshold: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Customers;

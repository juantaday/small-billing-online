import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Tag,
  TrendingUp,
  Award,
  X,
  Save,
  Percent
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import clsx from 'clsx';

interface CustomerCategory {
  id: string;
  name: string;
  discountPercentage: number;
  pointsMultiplier: number;
  ticketThreshold: number;
  color?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  discountPercentage: number;
  pointsMultiplier: number;
  ticketThreshold: number;
  color: string;
}

const PRESET_COLORS = [
  '#6B7280', // Gris
  '#EF4444', // Rojo
  '#F59E0B', // Naranja
  '#FBBF24', // Amarillo
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#8B5CF6', // Púrpura
  '#EC4899', // Rosa
];

const CustomerCategoriesPage = () => {
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomerCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CustomerCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    discountPercentage: 0,
    pointsMultiplier: 1,
    ticketThreshold: 10,
    color: '#6B7280'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/customer-categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (category?: CustomerCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        discountPercentage: category.discountPercentage,
        pointsMultiplier: category.pointsMultiplier,
        ticketThreshold: category.ticketThreshold,
        color: category.color || '#6B7280'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        discountPercentage: 0,
        pointsMultiplier: 1,
        ticketThreshold: 10,
        color: '#6B7280'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingCategory
        ? `http://localhost:3000/customer-categories/${editingCategory.id}`
        : 'http://localhost:3000/customer-categories';

      const method = editingCategory ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    setLoading(true);
    try {
      await fetch(`http://localhost:3000/customer-categories/${deletingCategory.id}`, {
        method: 'DELETE'
      });
      
      await fetchCategories();
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      alert('Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (category: CustomerCategory) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Categorías de Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Define los tipos de clientes y sus beneficios
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Categorías</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Tag className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Descuento Máximo</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.max(...categories.map(c => c.discountPercentage), 0)}%
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Percent className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mult. Puntos Max</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.max(...categories.map(c => c.pointsMultiplier), 0)}x
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Award className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card 
              key={category.id} 
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Tag size={24} style={{ color: category.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Descuento</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {category.discountPercentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mult. Puntos</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {category.pointsMultiplier}x
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Umbral Ticket</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${category.ticketThreshold}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => openDeleteModal(category)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Tag size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Usuario Final, Cliente VIP, Empresas..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descuento (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Multiplicador de Puntos *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.pointsMultiplier}
                      onChange={(e) => setFormData({...formData, pointsMultiplier: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Umbral Ticket ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.ticketThreshold}
                      onChange={(e) => setFormData({...formData, ticketThreshold: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Color de Identificación
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, color})}
                        className={clsx(
                          "w-10 h-10 rounded-lg border-2 transition-all",
                          formData.color === color 
                            ? "border-gray-900 dark:border-white scale-110" 
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Nota:</strong> El umbral de ticket determina cada cuántos dólares de compra 
                    el cliente gana 1 punto de lealtad. Por ejemplo, $10 significa 1 punto por cada $10 de compra.
                  </p>
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
                    {loading ? 'Guardando...' : 'Guardar Categoría'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Eliminar Categoría
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar la categoría{' '}
                <span className="font-semibold">{deletingCategory.name}</span>?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingCategory(null);
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
    </div>
  );
};

export default CustomerCategoriesPage;

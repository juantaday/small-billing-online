import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { ApiError } from '@/shared/api';
import { useCategories } from '@/entities/category/api/useCategories';
import { categoryApi } from '@/entities/category/api/category-api';
import { CreateCategoryDto } from '@small-billing/shared';
import { ProductFormData } from '../types';

interface Step1Props {
  data: ProductFormData;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
  onNameChange: (name: string) => void;
}

export function Step1BasicInfo({ data, onUpdate, onNameChange }: Step1Props) {
  const { categories, fetchCategories } = useCategories();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    icon: '',
    color: '#ef4444',
    displayOrder: 0,
  });

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      setCategoryError('El nombre de la categoría es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setCategoryError('');

    try {
      const categoryDto: CreateCategoryDto = {
        name: newCategoryData.name.trim(),
        icon: newCategoryData.icon || undefined,
        color: newCategoryData.color,
        displayOrder: newCategoryData.displayOrder,
      };

      const createdCategory = await categoryApi.create(categoryDto);
      await fetchCategories();
      onUpdate('categoryId', createdCategory.id.toString());
      
      setShowCategoryModal(false);
      setNewCategoryData({
        name: '',
        icon: '',
        color: '#ef4444',
        displayOrder: 0,
      });
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setCategoryError(error.message || 'Ya existe una categoría con ese nombre');
        } else {
          setCategoryError(error.message || 'Error al crear la categoría');
        }
      } else if (error.message) {
        setCategoryError(error.message);
      } else {
        setCategoryError('Error al crear la categoría. Por favor intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Información Básica del Producto
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ingresa los datos principales del producto
          </p>
        </div>

        {/* Nombre del producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Producto <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej: Hamburguesa Original"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Descripción corta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción Corta
          </label>
          <input
            type="text"
            value={data.shortDescription}
            onChange={(e) => onUpdate('shortDescription', e.target.value.slice(0, 20))}
            placeholder="Ej: Hamburguesa clásica"
            maxLength={20}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(data.shortDescription?.length || 0)}/20 caracteres
          </p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Slug (URL amigable)
          </label>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => onUpdate('slug', e.target.value)}
            placeholder="hamburguesa-original"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se genera automáticamente desde el nombre
          </p>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categoría <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={data.categoryId}
              onChange={(e) => onUpdate('categoryId', e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1"
              title="Agregar nueva categoría"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Producto destacado */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="featured"
            checked={data.featured}
            onChange={(e) => onUpdate('featured', e.target.checked)}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Marcar como producto destacado
          </label>
        </div>
      </div>

      {/* Modal para agregar nueva categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Nueva Categoría de Producto
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

            <div className="p-6 space-y-4">
              <Input
                label="Nombre de la Categoría *"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                placeholder="Ej: Bebidas, Alimentos, Postres..."
                disabled={isSubmitting}
              />

              <Input
                label="Icono (opcional)"
                value={newCategoryData.icon}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, icon: e.target.value })}
                placeholder="🍔"
                disabled={isSubmitting}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={newCategoryData.color}
                  onChange={(e) => setNewCategoryData({ ...newCategoryData, color: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full h-10 border rounded-lg cursor-pointer disabled:opacity-50"
                />
              </div>

              <Input
                label="Orden de visualización"
                type="number"
                value={newCategoryData.displayOrder.toString()}
                onChange={(e) => setNewCategoryData({ 
                  ...newCategoryData, 
                  displayOrder: parseInt(e.target.value) || 0 
                })}
                placeholder="0"
                min="0"
                disabled={isSubmitting}
              />

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
    </>
  );
}

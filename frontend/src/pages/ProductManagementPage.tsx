/**
 * Page: Product Management
 * Gestión completa de productos con wizard
 */

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Button, Card, SpinnerLoading } from '@/shared/ui';
import { ProductWizard, ProductFormData } from '@/features/product-management';
import { useProducts } from '@/entities/product/api/useProducts';
import { usePresentations } from '@/entities/product/api/usePresentations';
import { useCategories } from '@/entities/category/api/useCategories';
import clsx from 'clsx';

export function ProductManagementPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { createPresentation } = usePresentations();
  const { categories } = useCategories();

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'all' || product.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Abrir wizard para crear
  const handleCreate = () => {
    setSelectedProduct(null);
    setIsWizardOpen(true);
  };

  // Abrir wizard para editar
  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsWizardOpen(true);
  };

  // Eliminar producto
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProduct(id);
        alert('Producto eliminado correctamente');
      } catch (error) {
        alert('Error al eliminar producto');
      }
    }
  };

  // Guardar producto desde wizard
  const handleSaveProduct = async (data: ProductFormData): Promise<{ id: string }> => {
    try {
      // 1. Crear o actualizar producto
      const productData = {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        featured: data.featured,
        active: true,
      };

      let productId: string;

      if (selectedProduct) {
        // Actualizar
        const updatedProduct = await updateProduct(selectedProduct.id, productData);
        productId = updatedProduct.id;
      } else {
        // Crear
        const newProduct = await createProduct(productData);
        productId = newProduct.id;
      }

      // 2. Crear presentaciones
      for (const presentation of data.presentations) {
        await createPresentation({
          productId,
          name: presentation.name,
          quantity: presentation.quantity,
          barcode: presentation.barcode,
          costPrice: presentation.costPrice,
          salePrice: presentation.salePrice,
          stock: presentation.stock,
          minStock: presentation.minStock,
          maxStock: presentation.maxStock,
          active: true,
        });
      }

      // TODO: Guardar configuraciones de impuestos y presentaciones por defecto
      // Esto requeriría agregar campos al schema

      alert('Producto guardado correctamente');
      window.location.reload(); // Recargar para ver los cambios
      
      return { id: productId };
    } catch (error) {
      console.error('Error al guardar:', error);
      throw error;
    }
  };

  // Calcular precio de venta principal (de la primera presentación activa)
  const getMainPrice = (product: any): number => {
    const mainPresentation = product.presentations?.find((p: any) => p.active);
    return mainPresentation?.salePrice || 0;
  };

  // Obtener stock total
  const getTotalStock = (product: any): number => {
    return product.presentations?.reduce((total: number, p: any) => total + (p.stock || 0), 0) || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Productos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra el catálogo completo de productos
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Buscador */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all',
                selectedCategoryFilter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryFilter(category.id)}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all',
                  selectedCategoryFilter === category.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <SpinnerLoading size="lg" />
        </div>
      )}

      {/* Tabla de productos */}
      {!loading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Presentaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredProducts.map((product) => {
                  const mainPrice = getMainPrice(product);
                  const totalStock = getTotalStock(product);
                  const hasLowStock = product.presentations?.some(
                    (p: any) => p.stock <= (p.minStock || 0)
                  );

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                              {product.featured && (
                                <span className="ml-2 text-yellow-500">⭐</span>
                              )}
                            </div>
                            {product.shortDescription && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {product.shortDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {product.category?.icon} {product.category?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Package className="w-4 h-4 mr-1 text-gray-400" />
                          {product.presentations?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                          <DollarSign className="w-4 h-4" />
                          {mainPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={clsx(
                              'text-sm font-medium',
                              hasLowStock
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-900 dark:text-white'
                            )}
                          >
                            {totalStock}
                          </span>
                          {hasLowStock && (
                            <AlertTriangle className="w-4 h-4 ml-1 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                            product.active
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                          )}
                        >
                          {product.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Sin resultados */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No se encontraron productos
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Intenta ajustar los filtros o crea un nuevo producto
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {products.length}
                </p>
              </div>
              <Package className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Productos Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {products.filter((p) => p.active).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Destacados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {products.filter((p) => p.featured).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Wizard */}
      <ProductWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleSaveProduct}
        initialData={selectedProduct}
        mode={selectedProduct ? 'edit' : 'create'}
      />
    </div>
  );
}

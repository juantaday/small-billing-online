/**
 * Page: Product Management
 * Gestión completa de productos con wizard
 */

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, DollarSign, AlertTriangle, Image } from 'lucide-react';
import { Button, Card, ConfirmDialog, SpinnerLoading } from '@/shared/ui';
import { useToastContext } from '@/app/providers/toast';
import { useProducts } from '@/entities/product/api/useProducts';
import { usePresentations } from '@/entities/product/api/usePresentations';
import { useCategories } from '@/entities/category/api/useCategories';
import clsx from 'clsx';
import { ProductFormData } from '@/features/product-management/ui/types';
import { ProductWizard } from '@/features/product-management/ui/ProductWizard';
import { ProductImageManager } from '@/features/product-management/ui/ProductImageManager';


export function ProductManagementPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado para el modal de imágenes
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [selectedProductForImages, setSelectedProductForImages] = useState<{ id: string; name: string } | null>(null);

  const toast = useToastContext();
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

  // Abrir gestor de imágenes
  const handleManageImages = (product: any) => {
    setSelectedProductForImages({ id: product.id, name: product.name });
    setIsImageManagerOpen(true);
  };

  // Abrir modal de confirmación para eliminar
  const handleDeleteClick = (product: any) => {
    setProductToDelete({ id: product.id, name: product.name });
    setIsDeleteDialogOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      
      // Cerrar modal y limpiar estado
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      
      // Mostrar notificación de éxito
      toast.success(
        'Producto eliminado',
        `${productToDelete.name} ha sido desactivado correctamente`
      );
    } catch (error: any) {
      // Log detallado para desarrolladores
      console.error('❌ Error al eliminar producto:', {
        productId: productToDelete.id,
        productName: productToDelete.name,
        error: error,
        response: error?.response?.data,
        timestamp: new Date().toISOString()
      });
      
      // Re-lanzar para que ConfirmDialog lo muestre inline en el modal
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  // Guardar producto desde wizard
  const handleSaveProduct = async (data: ProductFormData): Promise<{ id: string }> => {
    try {
      // 1. Crear o actualizar producto (solo info básica en paso 1)
      const productData = {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        featured: data.featured,
        active: true,
      };

      let productId: string;

      if (data.productId) {
        // Ya existe el producto, solo retornar el ID
        productId = data.productId;
      } else if (selectedProduct) {
        // Actualizar
        const updatedProduct = await updateProduct(selectedProduct.id, {
          id: selectedProduct.id,
          ...productData,
        });
        productId = updatedProduct.id;
      } else {
        // Crear nuevo producto
        const newProduct = await createProduct(productData);
        productId = newProduct.id;
      }

      // 2. Crear presentaciones (solo si hay presentaciones en el form)
      if (data.presentations && data.presentations.length > 0) {
        for (const presentation of data.presentations) {
          console.log('Creating presentation for product:', productId, presentation);
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
      }

      // TODO: Guardar configuraciones de impuestos y presentaciones por defecto
      // Esto requeriría agregar campos al schema
      
      return { id: productId };
    } catch (error) {
      console.error('Error al guardar:', error);
      throw error;
    }
  };

  // Calcular precio de venta principal (de la primera presentación activa)
  const getMainPrice = (product: any): number => {
    const mainPresentation = product.presentations?.find((p: any) => p.active);
    return Number(mainPresentation?.salePrice) || 0;
  };

  // Obtener stock total
  const getTotalStock = (product: any): number => {
    return product.presentations?.reduce((total: number, p: any) => total + Number(p.stock || 0), 0) || 0;
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
                  ? 'bg-primary-600 text-white'
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
                    ? 'bg-primary-600 text-white'
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
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-900 dark:text-white'
                            )}
                          >
                            {totalStock}
                          </span>
                          {hasLowStock && (
                            <AlertTriangle className="w-4 h-4 ml-1 text-danger-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                            product.active
                              ? 'badge-success'
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
                            className="text-info-600 hover:text-info-900 dark:text-info-400 dark:hover:text-info-300 p-1"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleManageImages(product)}
                            className="text-accent-600 hover:text-accent-900 dark:text-accent-400 dark:hover:text-accent-300 p-1"
                            title="Gestionar Imágenes"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300 p-1"
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
              <Package className="w-10 h-10 text-danger-500" />
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
              <div className="w-10 h-10 badge-success rounded-full flex items-center justify-center">
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
              <div className="w-10 h-10 badge-warning rounded-full flex items-center justify-center">
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

      {/* Gestor de Imágenes */}
      {selectedProductForImages && (
        <ProductImageManager
          isOpen={isImageManagerOpen}
          onClose={() => {
            setIsImageManagerOpen(false);
            setSelectedProductForImages(null);
          }}
          productId={selectedProductForImages.id}
          productName={selectedProductForImages.name}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

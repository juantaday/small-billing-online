/**
 * Page: Product Management
 * Gestión completa de productos con wizard
 */

import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, DollarSign, AlertTriangle, Image } from 'lucide-react';
import { Button, Card, ConfirmDialog, SpinnerLoading, Modal } from '@/shared/ui';
import { useToastContext } from '@/app/providers/toast';
import { useProducts } from '@/entities/product/api/useProducts';
import { productApi } from '@/entities/product/api/product-api';
import { useCategories } from '@/entities/category/api/useCategories';
import { useAuth } from '@/features/auth';
import clsx from 'clsx';
import { ProductFormData } from '@/features/product-management/ui/types';
import { ProductWizard } from '@/features/product-management/ui/ProductWizard';
import { ProductImageManager } from '@/features/product-management/ui/ProductImageManager';


export function ProductManagementPage() {
  const pageSize = 10;
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para el modal de imágenes
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [selectedProductForImages, setSelectedProductForImages] = useState<{ id: string; name: string } | null>(null);

  // Estado para ingreso rápido de inventario
  const [isQuickInventoryOpen, setIsQuickInventoryOpen] = useState(false);
  const [selectedProductForInventory, setSelectedProductForInventory] = useState<any>(null);
  const [selectedPresentationForInventory, setSelectedPresentationForInventory] = useState('');
  const [quickInventoryQuantity, setQuickInventoryQuantity] = useState('');
  const [quickInventoryNote, setQuickInventoryNote] = useState('');
  const [isSavingQuickInventory, setIsSavingQuickInventory] = useState(false);

  const toast = useToastContext();
  const { user } = useAuth();
  const {
    products,
    loading,
    createProduct,
    deleteProduct,
    finalizeWizard,
    discardDraft,
    quickAddInventory,
  } = useProducts({
    page,
    limit: pageSize,
    categoryId: selectedCategoryFilter === 'all' ? undefined : selectedCategoryFilter,
  });
  const { categories } = useCategories();

  const resolveFactorToBase = (presentationId: string, presentations: any[]): number => {
    const map = new Map(
      (presentations || []).map((p: any) => [
        p.id,
        {
          id: p.id,
          quantity: Number(p.quantity || 1),
          presentationInferenceId: p.presentationInferenceId || null,
        },
      ])
    );
    const cache = new Map<string, number>();

    const resolve = (id: string, visited = new Set<string>()): number => {
      const cached = cache.get(id);
      if (cached !== undefined) return cached;

      const node = map.get(id);
      if (!node) return 1;
      if (visited.has(id)) return 1;

      visited.add(id);
      const isBase = !node.presentationInferenceId || node.presentationInferenceId === node.id;
      const factor = isBase
        ? node.quantity
        : node.quantity * resolve(node.presentationInferenceId, visited);
      visited.delete(id);
      cache.set(id, factor);
      return factor;
    };

    return resolve(presentationId);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 600);

    return () => clearTimeout(handle);
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
        const data = await productApi.search(
          debouncedQuery,
          {
            limit: pageSize,
          },
          { signal: controller.signal }
        );

        if (requestId === searchRequestIdRef.current) {
          setSearchResults(data);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Error searching products:', error);
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

  useEffect(() => {
    setPage(1);
  }, [selectedCategoryFilter]);

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

  // Abrir modal de ingreso rápido de inventario
  const handleQuickInventory = (product: any) => {
    const activePresentations = (product.presentations || []).filter((p: any) => p.active);
    const defaultPresentationId =
      product.defaultPurchasePresentationId || activePresentations[0]?.id || '';

    setSelectedProductForInventory(product);
    setSelectedPresentationForInventory(defaultPresentationId);
    setQuickInventoryQuantity('');
    setQuickInventoryNote('');
    setIsQuickInventoryOpen(true);
  };

  const handleQuickInventorySubmit = async () => {
    if (!selectedProductForInventory?.id) return;

    const parsedQuantity = Number(quickInventoryQuantity);
    if (!selectedPresentationForInventory) {
      toast.error('Presentación requerida', 'Selecciona una presentación para ingresar inventario.');
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Cantidad inválida', 'La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    setIsSavingQuickInventory(true);
    try {
      const result = await quickAddInventory(selectedProductForInventory.id, {
        presentationId: selectedPresentationForInventory,
        quantity: parsedQuantity,
        userId: user?.id,
        source: 'QUICK_ADD',
        note: quickInventoryNote.trim() || undefined,
      });

      toast.success(
        'Inventario actualizado',
        `Se agregaron ${result.addedBaseUnits} unidades base al stock de ${selectedProductForInventory.name}.`
      );

      setIsQuickInventoryOpen(false);
      setSelectedProductForInventory(null);
      setSelectedPresentationForInventory('');
      setQuickInventoryQuantity('');
      setQuickInventoryNote('');
    } catch (error: any) {
      toast.error(
        'Error al actualizar inventario',
        error?.response?.message || error?.message || 'No se pudo registrar el ingreso rápido.'
      );
    } finally {
      setIsSavingQuickInventory(false);
    }
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
      const isInitialCreate = !selectedProduct && !data.productId;

      // 1. Crear o actualizar producto
      const productData = {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        featured: data.featured,
        selectedTaxes: data.selectedTaxes,
        active: true,
      };

      let productId: string;

      if (selectedProduct) {
        productId = selectedProduct.id;
      } else if (data.productId) {
        productId = data.productId;
      } else {
        const newProduct = await createProduct(productData, false);
        productId = newProduct.id;
      }

      // El primer guardado del wizard (paso 1) solo crea el producto.
      // No se deben sincronizar presentaciones aqui para no eliminar la base "Unidad" auto-creada.
      if (isInitialCreate) {
        return { id: productId };
      }

      await finalizeWizard(productId, {
        product: {
          id: productId,
          ...productData,
        },
        presentations: data.presentations || [],
        defaultPurchasePresentationIndex: data.defaultPurchasePresentationIndex,
        defaultSalePresentationIndex: data.defaultSalePresentationIndex,
      });

      return { id: productId };
    } catch (error) {
      console.error('Error al guardar:', error);
      throw error;
    }
  };

  const handleDiscardDraft = async (productId: string): Promise<void> => {
    await discardDraft(productId);
    toast.success('Borrador descartado', 'Se mantuvo la última versión confirmada en la base de datos.');
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

  const selectedPresentation = selectedProductForInventory?.presentations?.find(
    (p: any) => p.id === selectedPresentationForInventory
  );
  const previewFactorToBase = selectedPresentationForInventory
    ? resolveFactorToBase(
        selectedPresentationForInventory,
        selectedProductForInventory?.presentations || []
      )
    : 1;
  const previewQuantity = Number(quickInventoryQuantity || 0);
  const previewBaseUnits = Number.isFinite(previewQuantity)
    ? Math.max(0, Math.floor(previewQuantity)) * previewFactorToBase
    : 0;

  const isSearchActive = debouncedQuery.length >= 3;
  const visibleProducts = isSearchActive ? searchResults || [] : products;

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
          <div className="relative">
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
                {visibleProducts.map((product) => {
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
                            onClick={() => handleQuickInventory(product)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                            title="Ingreso Rápido de Inventario"
                          >
                            <Plus className="w-4 h-4" />
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
              {visibleProducts.length === 0 && (
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

            {isSearching && (
              <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center">
                <SpinnerLoading size="md" message="Buscando..." />
              </div>
            )}
          </div>
        </Card>
      )}

      {!loading && !isSearchActive && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Mostrando {products.length} productos</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span>Pagina {page}</span>
            <Button
              variant="ghost"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={products.length < pageSize}
            >
              Siguiente
            </Button>
          </div>
        </div>
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
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
        onCancelDraft={handleDiscardDraft}
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

      {/* Modal de ingreso rápido de inventario */}
      <Modal
        isOpen={isQuickInventoryOpen}
        onClose={() => {
          if (isSavingQuickInventory) return;
          setIsQuickInventoryOpen(false);
          setSelectedProductForInventory(null);
        }}
        title={`Ingreso Rápido: ${selectedProductForInventory?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Presentación
            </label>
            <select
              value={selectedPresentationForInventory}
              onChange={(e) => setSelectedPresentationForInventory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {(selectedProductForInventory?.presentations || [])
                .filter((p: any) => p.active)
                .map((presentation: any) => (
                  <option key={presentation.id} value={presentation.id}>
                    {presentation.presentationType?.name || 'Presentación'} (x{presentation.quantity})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cantidad a ingresar
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={quickInventoryQuantity}
              onChange={(e) => setQuickInventoryQuantity(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={quickInventoryNote}
              onChange={(e) => setQuickInventoryNote(e.target.value)}
              placeholder="Ej: ingreso por reposición"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Conversión automática: {Math.max(0, Math.floor(previewQuantity || 0))} x{' '}
              {previewFactorToBase} = <span className="font-semibold">{previewBaseUnits}</span> unidades base
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedPresentation
                ? `La presentación "${selectedPresentation.presentationType?.name || 'Seleccionada'}" se convierte automáticamente a unidades de stock.`
                : 'Selecciona una presentación para ver la conversión.'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (isSavingQuickInventory) return;
                setIsQuickInventoryOpen(false);
                setSelectedProductForInventory(null);
              }}
              disabled={isSavingQuickInventory}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleQuickInventorySubmit}
              disabled={
                isSavingQuickInventory ||
                !selectedPresentationForInventory ||
                !Number.isInteger(Number(quickInventoryQuantity)) ||
                Number(quickInventoryQuantity) <= 0
              }
            >
              {isSavingQuickInventory ? 'Guardando...' : 'Agregar Inventario'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

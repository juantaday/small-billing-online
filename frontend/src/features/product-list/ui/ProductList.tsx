import { useState } from 'react';
import { Card, SpinnerLoading } from '@/shared/ui';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useProducts } from '@/entities/product/api/useProducts';
import { useCategories } from '@/entities/category/api/useCategories';
import { useCart } from '@/features/cart/model/use-cart';
import { resolveImageUrl } from '@/shared/lib';
import clsx from 'clsx';

export function ProductList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPresentationByProduct, setSelectedPresentationByProduct] = useState<Record<string, string>>({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false); // ← nuevo

  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { items, addItem, updateQuantity, removeItem } = useCart();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Label de la categoría activa
  const activeCategoryLabel = selectedCategory === 'all'
    ? '🍽️ Todos'
    : (() => {
      const cat = categories.find(c => c.id === selectedCategory);
      return cat ? `${cat.icon} ${cat.name}` : '🍽️ Todos';
    })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerLoading size="lg" message="Cargando productos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Categorías - Mobile: colapsable / Desktop: fila horizontal */}
      <div>
        {/* Botón trigger solo en mobile */}
        <button
          onClick={() => setIsCategoryOpen(prev => !prev)}
          className="sm:hidden w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
        >
          <span>{activeCategoryLabel}</span>
          <svg
            className={clsx('w-5 h-5 transition-transform duration-200', isCategoryOpen && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Lista de categorías - colapsable en mobile, siempre visible en desktop */}
        <div className={clsx(
          'sm:flex sm:flex-row sm:gap-2 sm:overflow-x-auto sm:pb-2 sm:scrollbar-hide',
          // Mobile: colapsa/expande
          isCategoryOpen ? 'flex flex-col gap-2 mt-2' : 'hidden sm:flex'
        )}>
          <button
            onClick={() => { setSelectedCategory('all'); setIsCategoryOpen(false); }}
            className={clsx(
              'flex items-center space-x-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all',
              selectedCategory === 'all'
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <span className="text-xl">🍽️</span>
            <span>Todos</span>
          </button>

          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => { setSelectedCategory(category.id); setIsCategoryOpen(false); }}
              className={clsx(
                'flex items-center space-x-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all',
                selectedCategory === category.id
                  ? 'bg-red-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <span className="text-xl">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(product => {
            const mainImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
            const activePresentations = (product.presentations || []).filter((p) => p.active);
            const selectedPresentationId = selectedPresentationByProduct[product.id];
            const selectedPresentation = activePresentations.find((p) => p.id === selectedPresentationId) || activePresentations[0];
            const displayImageUrl = resolveImageUrl(mainImage?.imageUrl);

            const productCartItems = items.filter(
              (item) => String(item.productId) === String(product.id)
            );
            const totalUnitsInCart = productCartItems.reduce((sum, item) => sum + item.quantity, 0);

            const cartItemId = selectedPresentation ? `${product.id}:${selectedPresentation.id}` : '';
            const selectedCartItem = items.find(item => item.id === cartItemId);
            const selectedQuantity = selectedCartItem?.quantity ?? 0;

            return (
              <Card key={product.id} hoverable className="group flex flex-col h-full w-full">
                {/* Imagen */}
                <div className="relative h-40 sm:h-56 w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-800">
                  {displayImageUrl ? (
                    <img
                      src={displayImageUrl}
                      alt={mainImage?.altText || product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      Sin imagen
                    </div>
                  )}
                  {totalUnitsInCart > 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                      {totalUnitsInCart}
                    </div>
                  )}
                  {!product.active && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold">
                        No Disponible
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {product.shortDescription || 'Sin descripción'}
                  </p>

                  {/* Selector de presentación */}
                  {activePresentations.length > 1 && (
                    <div className="mb-3">
                      <select
                        value={selectedPresentation?.id || ''}
                        onChange={(e) =>
                          setSelectedPresentationByProduct(prev => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {activePresentations.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.presentationType?.name || 'Presentación'} - ${Number(p.salePrice || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Precio + controles rápidos */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      ${Number(selectedPresentation?.salePrice || 0).toFixed(2)}
                    </span>

                    {selectedQuantity > 0 ? (
                      <div className="flex items-center border-2 border-red-600 dark:border-red-500 rounded-xl overflow-hidden">
                        <button
                          onClick={() =>
                            selectedQuantity === 1
                              ? removeItem(cartItemId)
                              : updateQuantity(cartItemId, selectedQuantity - 1)
                          }
                          className="px-3 py-2 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-2 text-base font-bold text-gray-900 dark:text-white border-x-2 border-red-600 dark:border-red-500">
                          {selectedQuantity}
                        </span>
                        <button
                          onClick={() => selectedPresentation && addItem({ product, presentation: selectedPresentation, imageUrl: displayImageUrl })}
                          className="px-3 py-2 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={!product.active || !selectedPresentation}
                        onClick={() => selectedPresentation && addItem({ product, presentation: selectedPresentation, imageUrl: displayImageUrl })}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl transition-colors disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </button>
                    )}
                  </div>

                  {/* RESUMEN DE PEDIDOS */}
                  {productCartItems.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                        En tu pedido
                      </p>
                      <div className="space-y-2">
                        {productCartItems.map(cartItem => (
                          <div
                            key={cartItem.id}
                            className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {/* Izquierda: nombre y precio unitario */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                                  {cartItem.presentationName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  ${Number(cartItem.unitPrice || 0).toFixed(2)}
                                </p>
                              </div>

                              {/* Centro: subtotal */}
                              <div className="shrink-0 text-center">
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                  ${(cartItem.quantity * Number(cartItem.unitPrice || 0)).toFixed(2)}
                                </p>
                              </div>

                              {/* Derecha: botones */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    cartItem.quantity === 1
                                      ? removeItem(cartItem.id)
                                      : updateQuantity(cartItem.id, cartItem.quantity - 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-100 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <span className="text-sm font-bold text-gray-900 dark:text-white w-5 text-center">
                                  {cartItem.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const pres = activePresentations.find(p => p.id === cartItem.presentationId);
                                    if (pres) addItem({ product, presentation: pres, imageUrl: displayImageUrl });
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeItem(cartItem.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No se encontraron productos
          </p>
        </div>
      )}
    </div>
  );
}

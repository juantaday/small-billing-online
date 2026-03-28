/**
 * Feature: Product List
 * Lista y filtrado de productos
 */

import { useState } from 'react';
import { Card, SpinnerLoading } from '@/shared/ui';
import { Search, Plus } from 'lucide-react';
import { useProducts } from '@/entities/product/api/useProducts';
import { useCategories } from '@/entities/category/api/useCategories';
import { ProductWithRelationsDto, PresentationDto } from '@small-billing/shared';
import { resolveImageUrl } from '@/shared/lib';
import clsx from 'clsx';

interface ProductListProps {
  onAddToCart?: (
    product: ProductWithRelationsDto,
    presentation: PresentationDto,
    imageUrl?: string
  ) => void;
}

export function ProductList({ onAddToCart }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { products, loading } = useProducts();
  const { categories } = useCategories();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Mostrar loading
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

      {/* Categorías */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
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
            onClick={() => setSelectedCategory(category.id)}
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

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const mainImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
          const mainPresentation = (product.presentations?.find((p: any) => p.active) || product.presentations?.[0]) as PresentationDto | undefined;
          const displayImageUrl = resolveImageUrl(mainImage?.imageUrl);
          
          return (
            <Card key={product.id} hoverable className="overflow-hidden group">
              {/* Imagen */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={displayImageUrl}
                  alt={mainImage?.altText || product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {!product.active && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold">
                      No Disponible
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {product.shortDescription || 'Sin descripción'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    ${Number(mainPresentation?.salePrice || 0).toFixed(2)}
                  </span>
                  <button
                    disabled={!product.active || !mainPresentation}
                    onClick={() => mainPresentation && onAddToCart?.(product, mainPresentation, displayImageUrl)}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mensaje si no hay resultados */}
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

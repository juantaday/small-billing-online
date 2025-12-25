import { Grid, List } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { Card } from '@/shared/ui';

interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
  icon: string;
  color: string;
}

const categories: Category[] = [
  {
    id: 1,
    name: 'Hamburguesas',
    description: 'Deliciosas hamburguesas de res, pollo y vegetarianas',
    productCount: 12,
    icon: '🍔',
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 2,
    name: 'Pollo Frito',
    description: 'Pollo crujiente y alitas con diferentes salsas',
    productCount: 8,
    icon: '🍗',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 3,
    name: 'Acompañamientos',
    description: 'Papas fritas, aros de cebolla y más',
    productCount: 15,
    icon: '🍟',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 4,
    name: 'Bebidas',
    description: 'Refrescos, jugos naturales y batidos',
    productCount: 10,
    icon: '🥤',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 5,
    name: 'Postres',
    description: 'Helados, pasteles y dulces',
    productCount: 7,
    icon: '🍰',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 6,
    name: 'Combos',
    description: 'Combos especiales con descuento',
    productCount: 6,
    icon: '🎁',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 7,
    name: 'Ensaladas',
    description: 'Opciones frescas y saludables',
    productCount: 5,
    icon: '🥗',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 8,
    name: 'Desayunos',
    description: 'Opciones para comenzar el día',
    productCount: 9,
    icon: '🥞',
    color: 'from-orange-500 to-red-500'
  }
];


export const CategoriesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Categorías de Productos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las categorías de tu menú
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vista Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(category => (
            <Card key={category.id} hoverable className="overflow-hidden">
              <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                <span className="text-6xl">{category.icon}</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {category.productCount} productos
                  </span>
                  <button className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium">
                    Ver productos →
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {categories.map(category => (
            <Card key={category.id} hoverable className="overflow-hidden">
              <div className="flex items-center">
                <div className={`w-24 h-24 bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-5xl">{category.icon}</span>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {category.productCount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        productos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


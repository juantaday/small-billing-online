/**
 * Feature: Product List
 * Lista y filtrado de productos
 */

import { useState } from 'react';
import { Card } from '@/shared/ui';
import { Search, Plus } from 'lucide-react';
import clsx from 'clsx';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'burgers', name: 'Hamburguesas', icon: '🍔' },
  { id: 'chicken', name: 'Pollo', icon: '🍗' },
  { id: 'sides', name: 'Acompañamientos', icon: '🍟' },
  { id: 'drinks', name: 'Bebidas', icon: '🥤' },
  { id: 'desserts', name: 'Postres', icon: '🍰' },
];

const products: Product[] = [
  {
    id: 1,
    name: 'Original Burger',
    price: 8.99,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    description: 'Hamburguesa clásica con carne 100% de res',
    available: true
  },
  {
    id: 2,
    name: 'Zinger Burger',
    price: 9.99,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    description: 'Hamburguesa picante con pollo crujiente',
    available: true
  },
  {
    id: 3,
    name: 'Pollo Crujiente',
    price: 12.99,
    category: 'chicken',
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop',
    description: '3 piezas de pollo frito crujiente',
    available: true
  },
  {
    id: 4,
    name: 'Alitas Picantes',
    price: 10.99,
    category: 'chicken',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=300&fit=crop',
    description: '8 alitas con salsa BBQ o picante',
    available: true
  },
  {
    id: 5,
    name: 'Papas Fritas',
    price: 3.99,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    description: 'Papas doradas y crujientes',
    available: true
  },
  {
    id: 6,
    name: 'Aros de Cebolla',
    price: 4.99,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
    description: 'Aros de cebolla empanizados',
    available: true
  },
  {
    id: 7,
    name: 'Coca-Cola',
    price: 2.99,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',
    description: 'Refresco 500ml',
    available: true
  },
  {
    id: 8,
    name: 'Batido de Chocolate',
    price: 4.99,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
    description: 'Batido cremoso de chocolate',
    available: true
  },
  {
    id: 9,
    name: 'Helado Sundae',
    price: 3.99,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
    description: 'Helado con topping a elección',
    available: true
  },
  {
    id: 10,
    name: 'Pie de Manzana',
    price: 2.99,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400&h=300&fit=crop',
    description: 'Delicioso pie de manzana caliente',
    available: false
  },
];

interface ProductListProps {
  onAddToCart?: (product: Product) => void;
}

export function ProductList({ onAddToCart }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        {filteredProducts.map(product => (
          <Card key={product.id} hoverable className="overflow-hidden group">
            {/* Imagen */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {!product.available && (
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
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${product.price.toFixed(2)}
                </span>
                <button
                  disabled={!product.available}
                  onClick={() => onAddToCart?.(product)}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
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

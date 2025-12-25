/**
 * Page: Products
 * Página de productos que compone el feature ProductList
 */

import { ProductList } from '@/features/product-list';

export const ProductsPage = () => {
  const handleAddToCart = (product: any) => {
    // TODO: Implementar lógica de carrito
    console.log('Agregar al carrito:', product);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Nuestro Menú
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Descubre nuestras deliciosas opciones
        </p>
      </div>

      {/* Product List Feature */}
      <ProductList onAddToCart={handleAddToCart} />
    </div>
  );
};

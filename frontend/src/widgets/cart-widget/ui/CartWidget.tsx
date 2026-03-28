/**
 * Widget: Cart Widget
 * Botón flotante que navega a la página de pedido
 */

import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/features/cart';
import { ROUTES } from '@/shared/config';

export function CartWidget() {
  const navigate = useNavigate();
  const { itemCount } = useCart();

  return (
    <button
      onClick={() => navigate(ROUTES.ORDERS)}
      className="fixed bottom-6 right-6 z-40 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
      aria-label="Ver pedido"
      title="Ver pedido"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}

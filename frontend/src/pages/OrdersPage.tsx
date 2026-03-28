/**
 * Page: Orders
 * Lista de pedido actual desde el carrito local
 */

import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/cart';
import { Button, Card } from '@/shared/ui';
import { formatCurrency, resolveImageUrl } from '@/shared/lib';

export function OrdersPage() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Mi Pedido
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {itemCount} {itemCount === 1 ? 'unidad' : 'unidades'} en carrito
          </p>
        </div>

        {items.length > 0 && (
          <Button variant="ghost" onClick={clearCart}>
            Vaciar carrito
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <ShoppingCart className="w-14 h-14 mx-auto text-gray-400 mb-3" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Tu pedido está vacío</p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Agrega productos desde el menú para empezar.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item: (typeof items)[number]) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.productName}
                    className="w-full sm:w-24 h-24 object-cover rounded-lg bg-gray-100 dark:bg-gray-800"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.productName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Presentación: {item.presentationName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Precio unitario: {formatCurrency(item.unitPrice)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg"
                        aria-label="Restar cantidad"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg"
                        aria-label="Sumar cantidad"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      aria-label="Eliminar del pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    Subtotal: {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between text-xl font-bold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-red-600 dark:text-red-400">{formatCurrency(total)}</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

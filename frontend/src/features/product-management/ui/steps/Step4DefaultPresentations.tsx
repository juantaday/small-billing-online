import clsx from 'clsx';
import { ShoppingCart, Store } from 'lucide-react';
import { ProductFormData, PresentationFormData } from '../types';

interface Step4Props {
  presentations: PresentationFormData[];
  defaultPurchaseIndex: number | null;
  defaultSaleIndex: number | null;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
}

export function Step4DefaultPresentations({
  presentations,
  defaultPurchaseIndex,
  defaultSaleIndex,
  onUpdate,
}: Step4Props) {
  const activePresentations = presentations
    .map((presentation, index) => ({ presentation, index }))
    .filter(({ presentation }) => presentation.active ?? true);

  const getPresentationLabel = (presentation: PresentationFormData) =>
    presentation.presentationTypeName || 'Tipo no seleccionado';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Presentaciones por Defecto
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona las presentaciones predeterminadas para compra y venta
        </p>
      </div>

      {/* Presentación de compra */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-red-700 dark:text-red-300" />
          </div>
          <label className="block text-base font-medium text-gray-900 dark:text-white">
            ¿En qué presentación se compra normalmente?
          </label>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esto ayudará al sistema a sugerir la presentación correcta al registrar compras
        </p>
        <div className="space-y-2">
          {activePresentations.map(({ presentation, index }) => (
            <label
              key={`purchase-${index}`}
              className={clsx(
                'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                defaultPurchaseIndex === index
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <input
                type="radio"
                name="defaultPurchase"
                checked={defaultPurchaseIndex === index}
                onChange={() => onUpdate('defaultPurchasePresentationIndex', index)}
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {getPresentationLabel(presentation)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {presentation.quantity} {presentation.quantity === 1 ? 'unidad' : 'unidades'} - Costo: ${Number(presentation.costPrice || 0).toFixed(2)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Presentación de venta */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
            <Store className="w-4 h-4 text-success-700 dark:text-success-300" />
          </div>
          <label className="block text-base font-medium text-gray-900 dark:text-white">
            ¿En qué presentación se vende normalmente?
          </label>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esta será la presentación que aparecerá por defecto en el menú y sistema de ventas
        </p>
        <div className="space-y-2">
          {activePresentations.map(({ presentation, index }) => (
            <label
              key={`sale-${index}`}
              className={clsx(
                'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                defaultSaleIndex === index
                  ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <input
                type="radio"
                name="defaultSale"
                checked={defaultSaleIndex === index}
                onChange={() => onUpdate('defaultSalePresentationIndex', index)}
                className="w-4 h-4 text-success-600 border-gray-300 focus:ring-success-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {getPresentationLabel(presentation)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {presentation.quantity} {presentation.quantity === 1 ? 'unidad' : 'unidades'} - Precio: ${Number(presentation.salePrice || 0).toFixed(2)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Nota informativa */}
      <div className="badge-info p-4 rounded-lg border">
        <p className="text-sm text-info-800 dark:text-info-400">
          <strong>Nota:</strong> Estas configuraciones son opcionales y pueden cambiarse después. 
          El sistema siempre permitirá seleccionar cualquier presentación disponible.
        </p>
      </div>
    </div>
  );
}

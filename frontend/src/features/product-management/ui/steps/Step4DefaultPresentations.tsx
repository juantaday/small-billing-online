import clsx from 'clsx';
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
        <label className="block text-base font-medium text-gray-900 dark:text-white mb-3">
          ¿En qué presentación se compra normalmente?
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esto ayudará al sistema a sugerir la presentación correcta al registrar compras
        </p>
        <div className="space-y-2">
          {presentations.map((presentation, index) => (
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
                  {presentation.name}
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
        <label className="block text-base font-medium text-gray-900 dark:text-white mb-3">
          ¿En qué presentación se vende normalmente?
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esta será la presentación que aparecerá por defecto en el menú y sistema de ventas
        </p>
        <div className="space-y-2">
          {presentations.map((presentation, index) => (
            <label
              key={`sale-${index}`}
              className={clsx(
                'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                defaultSaleIndex === index
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <input
                type="radio"
                name="defaultSale"
                checked={defaultSaleIndex === index}
                onChange={() => onUpdate('defaultSalePresentationIndex', index)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {presentation.name}
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
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <strong>Nota:</strong> Estas configuraciones son opcionales y pueden cambiarse después. 
          El sistema siempre permitirá seleccionar cualquier presentación disponible.
        </p>
      </div>
    </div>
  );
}

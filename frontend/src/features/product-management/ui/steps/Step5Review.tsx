import { useEffect } from 'react';
import { ProductFormData } from '../types';

interface Step5Props {
  data: ProductFormData;
}

export function Step5Review({ data }: Step5Props) {
  useEffect(() => {
    console.log('📋 [Step5Review] Mounted with', data.presentations.length, 'presentations');
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Revisa los Datos del Producto
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Verifica que toda la información sea correcta antes de guardar
        </p>
      </div>

      {/* Información básica */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          📋 Información Básica
        </h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Nombre:</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{data.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Descripción:</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{data.shortDescription || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Slug:</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{data.slug}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Destacado:</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {data.featured ? '⭐ Sí' : 'No'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Impuestos */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          💰 Impuestos (SRI)
        </h4>
        {data.selectedTaxes.length > 0 ? (
          <dl className="space-y-2">
            {data.selectedTaxes.map((tax, index) => (
              <div key={index} className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">{tax.taxValueDescription}:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {tax.percentage}%
                  {tax.isDefaultVat && (
                    <span className="ml-2 text-xs badge-info px-2 py-0.5 rounded">
                      IVA Principal
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sin impuestos configurados</p>
        )}
      </div>

      {/* Presentaciones */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          📦 Presentaciones ({data.presentations.length})
        </h4>
        <div className="space-y-4">
          {data.presentations.map((presentation, index) => (
            <div
              key={`review-${index}`}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {presentation.name}
                </h5>
                <div className="flex gap-2">
                  {data.defaultPurchaseIndex === index && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                      Compra
                    </span>
                  )}
                  {data.defaultSaleIndex === index && (
                    <span className="px-2 py-1 badge-success text-xs font-medium rounded">
                      Venta
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cantidad:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {presentation.quantity} {presentation.quantity === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Código:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {presentation.barcode || 'Sin código'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    ${Number(presentation.costPrice || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Venta:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-semibold">
                    ${Number(presentation.salePrice || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {presentation.stock}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Stock mín:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {presentation.minStock}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerta final */}
      <div className="badge-success p-4 rounded-lg border">
        <p className="text-sm text-success-800 dark:text-success-400">
          ✅ Todo listo! Haz clic en "Guardar Producto" para completar el registro.
        </p>
      </div>
    </div>
  );
}

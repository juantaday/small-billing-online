import clsx from 'clsx';
import { ProductFormData, ProductTaxSelection } from '../types';

interface Step2Props {
  data: ProductFormData;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
}

export function Step2Taxes({ data, onUpdate }: Step2Props) {
  const availableTaxes = [
    { code: '0', description: 'IVA 0%', percentage: 0, type: 'IVA' },
    { code: '4', description: 'IVA 15%', percentage: 15, type: 'IVA' },
    { code: '6', description: 'No objeto de IVA', percentage: 0, type: 'IVA' },
    { code: '7', description: 'Exento de IVA', percentage: 0, type: 'IVA' },
    { code: '3072', description: 'ICE 10%', percentage: 10, type: 'ICE' },
    { code: '3073', description: 'ICE 75% (Bebidas alcohólicas)', percentage: 75, type: 'ICE' },
    { code: '5001', description: 'IRBPNR $0.02 por botella', percentage: 0.02, type: 'IRBPNR' },
  ];

  const toggleTax = (taxCode: string) => {
    const tax = availableTaxes.find(t => t.code === taxCode);
    if (!tax) return;

    const currentTaxes = data.selectedTaxes;
    const existingIndex = currentTaxes.findIndex(t => t.taxValueCode === taxCode);

    if (existingIndex >= 0) {
      const updated = currentTaxes.filter((_, i) => i !== existingIndex);
      onUpdate('selectedTaxes', updated);
    } else {
      const isFirstIVA = tax.type === 'IVA' && !currentTaxes.some(t => t.taxValueDescription.includes('IVA'));
      const newTax: ProductTaxSelection = {
        taxValueCode: taxCode,
        taxValueDescription: tax.description,
        percentage: tax.percentage,
        isDefaultVat: isFirstIVA,
      };
      onUpdate('selectedTaxes', [...currentTaxes, newTax]);
    }
  };

  const isTaxSelected = (taxCode: string) => {
    return data.selectedTaxes.some(t => t.taxValueCode === taxCode);
  };

  const groupedTaxes = {
    IVA: availableTaxes.filter(t => t.type === 'IVA'),
    ICE: availableTaxes.filter(t => t.type === 'ICE'),
    IRBPNR: availableTaxes.filter(t => t.type === 'IRBPNR'),
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Configuración de Impuestos (SRI Ecuador)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona los impuestos que aplican a este producto según el SRI
        </p>
      </div>

      {/* IVA */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">💰</span>
          IVA - Impuesto al Valor Agregado
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selecciona UNA opción de IVA (obligatorio para facturación electrónica)
        </p>
        <div className="space-y-2">
          {groupedTaxes.IVA.map((tax) => (
            <label
              key={tax.code}
              className={clsx(
                'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                isTaxSelected(tax.code)
                  ? 'border-info-500 bg-info-50 dark:bg-info-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <input
                type="radio"
                name="iva"
                checked={isTaxSelected(tax.code)}
                onChange={() => {
                  const withoutIVA = data.selectedTaxes.filter(t => !t.taxValueDescription.includes('IVA'));
                  onUpdate('selectedTaxes', withoutIVA);
                  toggleTax(tax.code);
                }}
                className="w-4 h-4 text-info-600 border-gray-300 focus:ring-info-500"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {tax.description}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Código SRI: {tax.code} • {tax.percentage}%
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ICE */}
      {groupedTaxes.ICE.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">🍺</span>
            ICE - Impuesto a los Consumos Especiales
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Aplica a bebidas alcohólicas, cigarrillos, etc. (opcional)
          </p>
          <div className="space-y-2">
            {groupedTaxes.ICE.map((tax) => (
              <label
                key={tax.code}
                className={clsx(
                  'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                  isTaxSelected(tax.code)
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <input
                  type="checkbox"
                  checked={isTaxSelected(tax.code)}
                  onChange={() => toggleTax(tax.code)}
                  className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tax.description}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Código SRI: {tax.code} • {tax.percentage}%
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* IRBPNR */}
      {groupedTaxes.IRBPNR.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">♻️</span>
            IRBPNR - Impuesto Redimible Botellas Plásticas
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Aplica a bebidas en botellas plásticas (opcional)
          </p>
          <div className="space-y-2">
            {groupedTaxes.IRBPNR.map((tax) => (
              <label
                key={tax.code}
                className={clsx(
                  'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                  isTaxSelected(tax.code)
                    ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <input
                  type="checkbox"
                  checked={isTaxSelected(tax.code)}
                  onChange={() => toggleTax(tax.code)}
                  className="w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tax.description}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Código SRI: {tax.code}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      {data.selectedTaxes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            📊 Impuestos seleccionados ({data.selectedTaxes.length})
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            {data.selectedTaxes.map((tax, index) => (
              <li key={index} className="flex justify-between">
                <span>{tax.taxValueDescription}</span>
                <span className="font-semibold">{tax.percentage}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advertencia */}
      {!data.selectedTaxes.some(t => t.taxValueDescription.includes('IVA')) && (
        <div className="badge-warning p-4 rounded-lg border">
          <p className="text-sm text-warning-800 dark:text-warning-400">
            ⚠️ <strong>Importante:</strong> Debes seleccionar una opción de IVA para cumplir con 
            los requisitos del SRI para facturación electrónica.
          </p>
        </div>
      )}
    </div>
  );
}

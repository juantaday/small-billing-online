import { PresentationFormData } from '../types';

interface Step3Props {
  presentations: PresentationFormData[];
  onUpdate: (presentations: PresentationFormData[]) => void;
}

export function Step3Presentations({ presentations, onUpdate }: Step3Props) {
  const addPresentation = () => {
    onUpdate([
      ...presentations,
      {
        name: '',
        quantity: 1,
        barcode: null,
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        minStock: 0,
        maxStock: 100,
      },
    ]);
  };

  const removePresentation = (index: number) => {
    if (presentations.length > 1) {
      onUpdate(presentations.filter((_, i) => i !== index));
    }
  };

  const updatePresentation = (index: number, field: keyof PresentationFormData, value: any) => {
    const updated = [...presentations];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Presentaciones del Producto
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define las diferentes formas en que se vende este producto
        </p>
      </div>

      <div className="space-y-4">
        {presentations.map((presentation, index) => (
          <div
            key={`presentation-${index}`}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Presentación #{index + 1}
              </h4>
              {presentations.length > 1 && (
                <button
                  onClick={() => removePresentation(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={presentation.name}
                  onChange={(e) => updatePresentation(index, 'name', e.target.value)}
                  placeholder="Ej: Unidad, x6, Docena"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad de unidades
                </label>
                <input
                  type="number"
                  value={presentation.quantity}
                  onChange={(e) => updatePresentation(index, 'quantity', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Barras (opcional)
                </label>
                <input
                  type="text"
                  value={presentation.barcode || ''}
                  onChange={(e) => updatePresentation(index, 'barcode', e.target.value || null)}
                  placeholder="Ej: 7501234567890 (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío si el producto no tiene código de barras
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio de Costo ($)
                </label>
                <input
                  type="number"
                  value={presentation.costPrice}
                  onChange={(e) => updatePresentation(index, 'costPrice', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio de Venta ($)
                </label>
                <input
                  type="number"
                  value={presentation.salePrice}
                  onChange={(e) => updatePresentation(index, 'salePrice', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  value={presentation.stock}
                  onChange={(e) => updatePresentation(index, 'stock', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={presentation.minStock}
                  onChange={(e) => updatePresentation(index, 'minStock', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addPresentation}
        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
      >
        + Agregar otra presentación
      </button>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
          💡 Sugerencias
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
          <li>Para comida rápida: Unidad, Combo x2, Familiar x4</li>
          <li>Para bebidas: Individual, Six Pack, Caja x12</li>
          <li>Para postres: Unidad, Media docena, Docena</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Feature: Product Management
 * Wizard para crear/editar productos con múltiples pasos
 */

import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Stepper, Step, Button } from '@/shared/ui';
import { useCategories } from '@/entities/category/api/useCategories';
import clsx from 'clsx';

// Tipos para el wizard
export interface ProductFormData {
  // ID del producto (para modo edición o después de crear)
  productId?: string;

  // Paso 1: Información básica
  name: string;
  shortDescription: string;
  slug: string;
  categoryId: string;
  featured: boolean;

  // Paso 2: Impuestos (SRI Ecuador)
  selectedTaxes: ProductTaxSelection[];

  // Paso 3: Presentaciones
  presentations: PresentationFormData[];

  // Paso 4: Presentaciones por defecto
  defaultPurchasePresentationIndex: number | null;
  defaultSalePresentationIndex: number | null;
  defaultPurchaseIndex: number | null;  
  defaultSaleIndex: number | null;  
}

export interface ProductTaxSelection {
  taxValueCode: string; // Código del valor de impuesto del SRI
  taxValueDescription: string;
  percentage: number;
  customPercent?: number; // Override del porcentaje
  isDefaultVat: boolean; // Si es el IVA por defecto
}

export interface PresentationFormData {
  name: string;
  quantity: number;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
}

interface ProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<{ id: string }>;
  initialData?: Partial<ProductFormData>;
  mode?: 'create' | 'edit';
}

const STEPS: Step[] = [
  { id: 1, label: 'Información', description: 'Datos básicos' },
  { id: 2, label: 'Impuestos', description: 'IVA, ICE, etc.' },
  { id: 3, label: 'Presentaciones', description: 'Cantidades y precios' },
  { id: 4, label: 'Por Defecto', description: 'Compra y venta' },
  { id: 5, label: 'Confirmar', description: 'Revisar datos' },
];

export function ProductWizard({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
}: ProductWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<ProductFormData>({
    productId: initialData?.productId,
    name: initialData?.name || '',
    shortDescription: initialData?.shortDescription || '',
    slug: initialData?.slug || '',
    categoryId: initialData?.categoryId || '',
    defaultPurchaseIndex: initialData?.defaultPurchaseIndex || null,    
    defaultSaleIndex: initialData?.defaultSaleIndex || null,    
    featured: initialData?.featured || false,
    selectedTaxes: initialData?.selectedTaxes || [],
    presentations: initialData?.presentations || [
      {
        name: 'Unidad',
        quantity: 1,
        barcode: '',
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        minStock: 0,
        maxStock: 100,
      },
    ],
    defaultPurchasePresentationIndex: initialData?.defaultPurchasePresentationIndex || null,
    defaultSalePresentationIndex: initialData?.defaultSalePresentationIndex || null,
  });

  // Actualizar campo del formulario
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Navegar entre pasos
  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  };

  const goNext = async () => {
    if (!validateCurrentStep()) return;

    // Guardado progresivo: crear producto después del paso 1
    if (currentStep === 1 && !formData.productId) {
      try {
        setIsSubmitting(true);
        const createdProduct = await onSave(formData);
        // Actualizar formData con el ID del producto creado
        setFormData(prev => ({ ...prev, productId: createdProduct.id }));
        setIsSubmitting(false);
        goToStep(currentStep + 1);
      } catch (error) {
        setIsSubmitting(false);
        console.error('Error al crear producto:', error);
        alert('Error al guardar el producto. Por favor intenta de nuevo.');
      }
    } else {
      goToStep(currentStep + 1);
    }
  };

  const goBack = () => goToStep(currentStep - 1);

  // Validar paso actual
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.name && !!formData.categoryId;
      case 2:
        // Al menos debe tener un IVA seleccionado
        return formData.selectedTaxes.some(t => t.taxValueDescription.includes('IVA'));
      case 3:
        return formData.presentations.length > 0 && formData.presentations.every(p => p.name && p.barcode);
      case 4:
        return true; // Opcional
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Guardar producto (solo confirmación final)
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Si ya tenemos productId, solo cerramos (ya se guardó progresivamente)
      if (formData.productId) {
        onClose();
      } else {
        // Fallback: guardar todo de una vez
        await onSave(formData);
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al completar el proceso');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generar slug automáticamente
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Actualizar nombre y generar slug
  const handleNameChange = (name: string) => {
    updateField('name', name);
    if (!initialData?.slug) {
      updateField('slug', generateSlug(name));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-y-0 right-0 w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Completa los pasos para {mode === 'create' ? 'agregar' : 'actualizar'} el producto
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && (
            <Step1BasicInfo
              data={formData}
              onUpdate={updateField}
              onNameChange={handleNameChange}
            />
          )}
          {currentStep === 2 && (
            <Step2Taxes
              data={formData}
              onUpdate={updateField}
            />
          )}
          {currentStep === 3 && (
            <Step3Presentations
              presentations={formData.presentations}
              onUpdate={(presentations) => updateField('presentations', presentations)}
            />
          )}
          {currentStep === 4 && (
            <Step4DefaultPresentations
              presentations={formData.presentations}
              defaultPurchaseIndex={formData.defaultPurchasePresentationIndex}
              defaultSaleIndex={formData.defaultSalePresentationIndex}
              onUpdate={updateField}
            />
          )}
          {currentStep === 5 && (
            <Step5Review data={formData} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button
            variant="secondary"
            onClick={currentStep === 1 ? onClose : goBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancelar' : 'Atrás'}
          </Button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Paso {currentStep} de {STEPS.length}
          </div>

          {currentStep < STEPS.length ? (
            <Button
              onClick={goNext}
              disabled={!validateCurrentStep() || isSubmitting}
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTES DE CADA PASO ============

interface Step1Props {
  data: ProductFormData;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
  onNameChange: (name: string) => void;
}

function Step1BasicInfo({ data, onUpdate, onNameChange }: Step1Props) {
  const { categories } = useCategories();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Información Básica del Producto
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ingresa los datos principales del producto
        </p>
      </div>

      {/* Nombre del producto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Producto <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Hamburguesa Original"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Descripción corta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descripción Corta
        </label>
        <input
          type="text"
          value={data.shortDescription}
          onChange={(e) => onUpdate('shortDescription', e.target.value)}
          placeholder="Ej: Carne 100% de res, lechuga, tomate"
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.shortDescription.length}/100 caracteres
        </p>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Slug (URL amigable)
        </label>
        <input
          type="text"
          value={data.slug}
          onChange={(e) => onUpdate('slug', e.target.value)}
          placeholder="hamburguesa-original"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Se genera automáticamente desde el nombre
        </p>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Categoría <span className="text-red-600">*</span>
        </label>
        <select
          value={data.categoryId}
          onChange={(e) => onUpdate('categoryId', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Producto destacado */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="featured"
          checked={data.featured}
          onChange={(e) => onUpdate('featured', e.target.checked)}
          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Marcar como producto destacado
        </label>
      </div>
    </div>
  );
}

interface Step2Props {
  data: ProductFormData;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
}

function Step2Taxes({ data, onUpdate }: Step2Props) {
  // TODO: Cargar desde API los impuestos disponibles del SRI
  const availableTaxes = [
    { code: '0', description: 'IVA 0%', percentage: 0, type: 'IVA' },
    { code: '2', description: 'IVA 15%', percentage: 15, type: 'IVA' },
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
      // Remover
      const updated = currentTaxes.filter((_, i) => i !== existingIndex);
      onUpdate('selectedTaxes', updated);
    } else {
      // Agregar
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
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <input
                type="radio"
                name="iva"
                checked={isTaxSelected(tax.code)}
                onChange={() => {
                  // Primero remover cualquier IVA existente
                  const withoutIVA = data.selectedTaxes.filter(t => !t.taxValueDescription.includes('IVA'));
                  onUpdate('selectedTaxes', withoutIVA);
                  // Luego agregar el nuevo
                  toggleTax(tax.code);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <input
                  type="checkbox"
                  checked={isTaxSelected(tax.code)}
                  onChange={() => toggleTax(tax.code)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <input
                  type="checkbox"
                  checked={isTaxSelected(tax.code)}
                  onChange={() => toggleTax(tax.code)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
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

      {/* Resumen de impuestos seleccionados */}
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
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Ejemplo: Precio base $10.00
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Impuestos totales: $
              {data.selectedTaxes
                .reduce((total, tax) => total + (10 * tax.percentage) / 100, 0)
                .toFixed(2)}
            </p>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Precio final: $
              {(
                10 +
                data.selectedTaxes.reduce(
                  (total, tax) => total + (10 * tax.percentage) / 100,
                  0
                )
              ).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Advertencia si no hay IVA seleccionado */}
      {!data.selectedTaxes.some(t => t.taxValueDescription.includes('IVA')) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            ⚠️ <strong>Importante:</strong> Debes seleccionar una opción de IVA para cumplir con 
            los requisitos del SRI para facturación electrónica.
          </p>
        </div>
      )}
    </div>
  );
}

interface Step3Props {
  presentations: PresentationFormData[];
  onUpdate: (presentations: PresentationFormData[]) => void;
}

function Step3Presentations({ presentations, onUpdate }: Step3Props) {
  const addPresentation = () => {
    onUpdate([
      ...presentations,
      {
        name: '',
        quantity: 1,
        barcode: '',
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

      {/* Lista de presentaciones */}
      <div className="space-y-4">
        {presentations.map((presentation, index) => (
          <div
            key={index}
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
              {/* Nombre */}
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

              {/* Cantidad */}
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

              {/* Código de barras */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Barras <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={presentation.barcode}
                  onChange={(e) => updatePresentation(index, 'barcode', e.target.value)}
                  placeholder="Ej: 7501234567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Precio de costo */}
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

              {/* Precio de venta */}
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

              {/* Stock inicial */}
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

              {/* Stock mínimo */}
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

      {/* Botón agregar presentación */}
      <button
        onClick={addPresentation}
        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
      >
        + Agregar otra presentación
      </button>

      {/* Sugerencias */}
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

interface Step4Props {
  presentations: PresentationFormData[];
  defaultPurchaseIndex: number | null;
  defaultSaleIndex: number | null;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
}

function Step4DefaultPresentations({
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
              key={index}
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
                  {presentation.quantity} {presentation.quantity === 1 ? 'unidad' : 'unidades'} - Costo: ${presentation.costPrice.toFixed(2)}
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
              key={index}
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
                  {presentation.quantity} {presentation.quantity === 1 ? 'unidad' : 'unidades'} - Precio: ${presentation.salePrice.toFixed(2)}
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

interface Step5Props {
  data: ProductFormData;
}

function Step5Review({ data }: Step5Props) {
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
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
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
              key={index}
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
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded">
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
                    {presentation.barcode}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    ${presentation.costPrice.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Venta:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-semibold">
                    ${presentation.salePrice.toFixed(2)}
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
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm text-green-800 dark:text-green-400">
          ✅ Todo listo! Haz clic en "Guardar Producto" para completar el registro.
        </p>
      </div>
    </div>
  );
}

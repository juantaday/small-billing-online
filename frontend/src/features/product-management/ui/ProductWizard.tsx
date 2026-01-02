/**
 * Feature: Product Management
 * Wizard para crear/editar productos con múltiples pasos
 */

import { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Stepper, Step, Button } from '@/shared/ui';
import { ProductFormData } from './types';
import {
  Step1BasicInfo,
  Step2Taxes,
  Step3Presentations,
  Step4DefaultPresentations,
  Step5Review,
} from './steps';

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
        barcode: null,
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

  useEffect(() => {
    console.log('🔍 [ProductWizard] Step changed to:', currentStep);
    if (currentStep === 5) {
      console.log('📦 [Step 5] Presentations:', formData.presentations.length);
    }
  }, [currentStep]);

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      console.log(`🎯 [ProductWizard] Navigating to step ${step}`);
      setCurrentStep(step);
    }
  };

  const goNext = async () => {
    if (!validateCurrentStep()) return;

    if (currentStep === 1 && !formData.productId) {
      try {
        setIsSubmitting(true);
        const createdProduct = await onSave(formData);
        setFormData(prev => ({ ...prev, productId: createdProduct.id }));
        goToStep(currentStep + 1);
      } catch (error) {
        console.error('Error al crear producto:', error);
        alert('Error al guardar el producto. Por favor intenta de nuevo.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      goToStep(currentStep + 1);
    }
  };

  const goBack = () => goToStep(currentStep - 1);

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.name && !!formData.categoryId;
      case 2:
        return formData.selectedTaxes.some(t => t.taxValueDescription.includes('IVA'));
      case 3:
        return formData.presentations.length > 0 && formData.presentations.every(p => p.name);
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(formData);

      window.location.reload();
      onClose();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al completar el proceso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    updateField('name', name);
    if (!initialData?.slug) {
      updateField('slug', generateSlug(name));
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={formData}
            onUpdate={updateField}
            onNameChange={handleNameChange}
          />
        );
      case 2:
        return <Step2Taxes data={formData} onUpdate={updateField} />;
      case 3:
        return (
          <Step3Presentations
            presentations={formData.presentations}
            onUpdate={(presentations) => updateField('presentations', presentations)}
          />
        );
      case 4:
        return (
          <Step4DefaultPresentations
            presentations={formData.presentations}
            defaultPurchaseIndex={formData.defaultPurchasePresentationIndex}
            defaultSaleIndex={formData.defaultSalePresentationIndex}
            onUpdate={updateField}
          />
        );
      case 5:
        return <Step5Review data={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

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
          {renderStep()}
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

          <div className="relative">
            {/* Botón Siguiente (pasos 1-4) */}
            {currentStep < STEPS.length && (
              <Button
                onClick={goNext}
                disabled={!validateCurrentStep() || isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Siguiente'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            )}

            {/* Botón Guardar (paso 5) */}
            {currentStep === STEPS.length && (
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
    </div>
  );
}

// Re-exportar tipos para mantener compatibilidad
export type { ProductFormData, ProductTaxSelection, PresentationFormData } from './types';

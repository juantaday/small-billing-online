/**
 * Feature: Product Management
 * Wizard para crear/editar productos con múltiples pasos
 */

import { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Stepper, Step, Button } from '@/shared/ui';
import { useToastContext } from '@/app/providers/toast';
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
  const toast = useToastContext();

  const buildFormData = (data?: Partial<ProductFormData>): ProductFormData => ({
    productId: data?.productId,
    name: data?.name || '',
    shortDescription: data?.shortDescription || '',
    slug: data?.slug || '',
    categoryId: data?.categoryId || '',
    defaultPurchaseIndex: data?.defaultPurchaseIndex || null,
    defaultSaleIndex: data?.defaultSaleIndex || null,
    featured: data?.featured || false,
    selectedTaxes:
      data?.selectedTaxes ||
      ((data as any)?.productTaxes as ProductFormData['selectedTaxes'] | undefined) ||
      [],
    presentations:
      (data?.presentations as any[] | undefined)?.map((presentation) => ({
        ...presentation,
        id: presentation.id,
        active: presentation.active ?? true,
        presentationTypeId: presentation.presentationTypeId || '',
        presentationTypeName:
          presentation.presentationTypeName || presentation.presentationType?.name,
      })) || [
        {
          id: undefined,
          presentationTypeId: '',
          quantity: 1,
          barcode: null,
          costPrice: 0,
          salePrice: 0,
          active: true,
        },
      ],
    defaultPurchasePresentationIndex: data?.defaultPurchasePresentationIndex || null,
    defaultSalePresentationIndex: data?.defaultSalePresentationIndex || null,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>(() => buildFormData(initialData));

  useEffect(() => {
    if (!isOpen) return;

    const normalizedInitialData = {
      ...initialData,
      // El producto de la tabla viene con `id`, pero el wizard usa `productId`.
      productId: initialData?.productId || (initialData as any)?.id,
    };

    setCurrentStep(1);
    setFormData(buildFormData(normalizedInitialData));
  }, [isOpen, initialData, mode]);

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
        toast.error('No se pudo guardar el producto', 'Por favor intenta de nuevo.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      goToStep(currentStep + 1);
    }
  };

  const goBack = () => goToStep(currentStep - 1);

  const validateCurrentStep = (): boolean => {
    const activePresentations = formData.presentations.filter((p) => p.active ?? true);

    switch (currentStep) {
      case 1:
        return !!formData.name && !!formData.categoryId;
      case 2:
        return formData.selectedTaxes.some(t => t.taxValueDescription.includes('IVA'));
      case 3:
        return (
          activePresentations.length > 0 &&
          activePresentations.every((p) => !!p.presentationTypeId)
        );
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
      toast.success(
        mode === 'create' ? 'Producto creado' : 'Producto actualizado',
        'Los cambios se guardaron correctamente.',
      );
      onClose();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      toast.error('Error al guardar producto', 'Revisa los datos e intenta nuevamente.');
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
              <span className="ml-3 inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-sm font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-200">
                {formData.name?.trim() || 'Sin nombre'}
              </span>
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
                className="bg-success-600 hover:bg-success-700"
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

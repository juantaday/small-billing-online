/**
 * Component: ProductImageManager
 * Modal para gestionar imágenes de un producto
 * - Subir nuevas imágenes
 * - Reordenar imágenes (drag & drop)
 * - Establecer imagen primaria
 * - Eliminar imágenes
 */

import { useState, useEffect } from 'react';
import {
  Star,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { Button, Modal, ConfirmDialog, SpinnerLoading } from '@/shared/ui';
import { ImageUpload } from '@/shared/ui/ImageUpload';
import { useProductImages, ProductImage } from '@/entities/product/api/useProductImages';
import { useToastContext } from '@/app/providers/toast';
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

// Componente de imagen sortable
interface SortableImageItemProps {
  image: ProductImage;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
}

function SortableImageItem({ image, onSetPrimary, onDelete }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2',
        isDragging
          ? 'border-primary-500 shadow-lg z-50'
          : 'border-gray-200 dark:border-gray-700',
        'transition-all duration-200'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Image Preview */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <img
          src={image.imageUrl}
          alt={image.altText || 'Imagen del producto'}
          className="w-full h-full object-cover rounded-lg"
        />
        {image.isPrimary && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-1">
            <Star className="w-4 h-4 fill-current" />
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {image.altText || 'Sin descripción'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Orden: {image.displayOrder}
          {image.isPrimary && ' • Imagen principal'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!image.isPrimary && (
          <Button
            onClick={() => onSetPrimary(image.id)}
            variant="secondary"
            size="sm"
            className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
          >
            <Star className="w-4 h-4 mr-1" />
            Primaria
          </Button>
        )}
        <Button
          onClick={() => onDelete(image.id)}
          variant="secondary"
          size="sm"
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProductImageManager({
  isOpen,
  onClose,
  productId,
  productName,
}: ProductImageManagerProps) {
  const toast = useToastContext();
  const {
    images,
    loading,
    fetchImages,
    createImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
  } = useProductImages();

  const [localImages, setLocalImages] = useState<ProductImage[]>([]);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Configuración de drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar imágenes cuando se abre el modal
  useEffect(() => {
    if (isOpen && productId) {
      fetchImages(productId);
    }
  }, [isOpen, productId, fetchImages]);

  // Sincronizar imágenes locales con las del hook
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Función para subir imagen
  const handleUploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', file.name);
      formData.append('displayOrder', images.length.toString());

      // Subir el archivo al backend
      const response = await fetch(`http://localhost:3001/products/${productId}/images/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // No incluir Content-Type, el navegador lo establece automáticamente con el boundary
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`, // Descomentar si usas auth
        },
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const newImage = await response.json();
      
      // Actualizar la lista local
      setLocalImages((prev) => [...prev, newImage].sort((a, b) => a.displayOrder - b.displayOrder));
      
      toast.success('Imagen subida correctamente');
      return newImage.imageUrl;
    } catch (err) {
      toast.error('Error al subir la imagen');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Manejar el final del drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localImages.findIndex((img) => img.id === active.id);
    const newIndex = localImages.findIndex((img) => img.id === over.id);

    const newOrder = arrayMove(localImages, oldIndex, newIndex);
    setLocalImages(newOrder);

    // Actualizar el orden en el backend
    try {
      await reorderImages(productId, {
        order: newOrder.map((img, index) => ({
          imageId: img.id,
          displayOrder: index,
        })),
      });
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error('Error al actualizar el orden');
      // Revertir el orden local en caso de error
      setLocalImages(images);
    }
  };

  // Establecer imagen primaria
  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimaryImage(productId, imageId);
      toast.success('Imagen principal actualizada');
    } catch (error) {
      toast.error('Error al establecer imagen principal');
    }
  };

  // Eliminar imagen
  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    try {
      await deleteImage(productId, imageToDelete.id);
      toast.success('Imagen eliminada');
      setImageToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar la imagen');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Gestionar Imágenes: ${productName}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Subir Nueva Imagen
            </h3>
            <ImageUpload
              onImageSelect={() => {}}
              onUpload={handleUploadImage}
              maxSizeMB={5}
              acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
            />
          </div>

          {/* Images List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Imágenes del Producto
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {localImages.length} {localImages.length === 1 ? 'imagen' : 'imágenes'}
              </span>
            </div>

            {loading && <SpinnerLoading />}

            {!loading && localImages.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No hay imágenes para este producto
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Sube la primera imagen arriba
                </p>
              </div>
            )}

            {!loading && localImages.length > 0 && (
              <>
                {/* Info sobre drag & drop */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Arrastra las imágenes para cambiar su orden. La primera imagen se mostrará en la lista de productos.
                    </p>
                  </div>
                </div>

                {/* Sortable List */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localImages.map((img) => img.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {localImages.map((image) => (
                        <SortableImageItem
                          key={image.id}
                          image={image}
                          onSetPrimary={handleSetPrimary}
                          onDelete={(imageId) => {
                            const img = localImages.find((i) => i.id === imageId);
                            if (img) setImageToDelete(img);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={onClose} 
              variant="secondary"
              disabled={isUploading}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Imagen"
        message={
          imageToDelete?.isPrimary
            ? 'Esta es la imagen principal del producto. ¿Estás seguro de eliminarla?'
            : '¿Estás seguro de eliminar esta imagen?'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

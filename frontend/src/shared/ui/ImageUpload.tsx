/**
 * Component: ImageUpload
 * Componente para subir imágenes con preview
 */

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui';
import clsx from 'clsx';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onUpload: (file: File) => Promise<string>; // Retorna la URL de la imagen subida
  maxSizeMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  onUpload,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato no permitido. Use: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validar tamaño
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`El archivo es muy grande. Máximo ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    
    // Guardar el archivo seleccionado
    setSelectedFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('No hay archivo seleccionado');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);

      console.log('** Imagen subida con éxito');   
      
      // Limpiar después de subir exitosamente
      console.log('a limpiando estado despues de upload'); 
      setPreview(null);
      setSelectedFile(null);
      setError(null);
      if (fileInputRef.current) {
        console.log('b limpiando estado despues de upload');
        fileInputRef.current.value = '';
      }
      setUploading(false);
    } catch (err: any) {
      // Solo actualizar estado si el componente sigue montado
      if (isMountedRef.current) {
        setError(err.message || 'Error al subir la imagen');
        console.error('Error uploading image:', err);
        setUploading(false);
      }
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6',
          'transition-colors duration-200',
          preview
            ? 'border-gray-300 dark:border-gray-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400',
          'bg-gray-50 dark:bg-gray-800'
        )}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-contain rounded-lg"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Seleccionar imagen
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WEBP hasta {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {preview && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            variant="primary"
            className="flex-1"
            key={uploading ? 'uploading' : 'ready'}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Subir Imagen
              </span>
            )}
          </Button>
          <Button onClick={handleClear} variant="outline" disabled={uploading}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

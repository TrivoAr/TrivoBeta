'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

/**
 * Interfaces para ImageUploader
 */
export interface ImageFile {
  file: File;
  url: string;
  id: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

export interface ImageUploaderProps {
  name: string;
  label?: string;
  required?: boolean;
  className?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // En MB
  accept?: string;
  validation?: {
    required?: string | boolean;
    validate?: (files: ImageFile[] | ImageFile) => boolean | string;
  };
  onChange?: (files: ImageFile[] | ImageFile | null) => void;
  onUpload?: (file: File) => Promise<string>; // Retorna URL de la imagen subida
  showPreview?: boolean;
  previewSize?: 'small' | 'medium' | 'large';
  allowCrop?: boolean;
  uploadOnSelect?: boolean;
  placeholder?: string;
}

/**
 * Hook para manejo de imágenes
 */
export const useImageHandler = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createImageFile = useCallback((file: File): ImageFile => {
    const url = URL.createObjectURL(file);
    return {
      file,
      url,
      id: generateId(),
      uploading: false,
      uploaded: false
    };
  }, []);

  const addImages = useCallback((files: File[], maxFiles?: number) => {
    const newImages = files.map(createImageFile);

    setImages(current => {
      const combined = [...current, ...newImages];
      return maxFiles ? combined.slice(0, maxFiles) : combined;
    });

    return newImages;
  }, [createImageFile]);

  const removeImage = useCallback((id: string) => {
    setImages(current => {
      const updated = current.filter(img => img.id !== id);
      // Limpiar URL del objeto para evitar memory leaks
      const removed = current.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  }, []);

  const updateImage = useCallback((id: string, updates: Partial<ImageFile>) => {
    setImages(current =>
      current.map(img => img.id === id ? { ...img, ...updates } : img)
    );
  }, []);

  const clearImages = useCallback(() => {
    // Limpiar todas las URLs
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  }, [images]);

  return {
    images,
    setImages,
    addImages,
    removeImage,
    updateImage,
    clearImages,
    uploading,
    setUploading
  };
};

/**
 * Utilities para validación de imágenes
 */
export const ImageValidation = {
  validateSize: (file: File, maxSizeMB: number): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  validateType: (file: File, acceptedTypes: string[]): boolean => {
    return acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
  },

  validateDimensions: async (file: File, maxWidth?: number, maxHeight?: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const withinWidth = !maxWidth || img.width <= maxWidth;
        const withinHeight = !maxHeight || img.height <= maxHeight;
        URL.revokeObjectURL(img.src);
        resolve(withinWidth && withinHeight);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  },

  getErrorMessage: (file: File, maxSize?: number, acceptedTypes?: string[]): string | null => {
    if (maxSize && !ImageValidation.validateSize(file, maxSize)) {
      return `El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`;
    }

    if (acceptedTypes && !ImageValidation.validateType(file, acceptedTypes)) {
      return `El archivo ${file.name} no es un tipo de imagen válido`;
    }

    return null;
  }
};

/**
 * Componente de preview de imagen
 */
interface ImagePreviewProps {
  image: ImageFile;
  size: 'small' | 'medium' | 'large';
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  showRemoveButton?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  size,
  onRemove,
  onRetry,
  showRemoveButton = true
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  return (
    <div className={`relative ${sizeClasses[size]} group`}>
      <img
        src={image.url}
        alt="Preview"
        className="w-full h-full object-cover rounded-lg border border-gray-200"
      />

      {/* Overlay con estado */}
      {(image.uploading || image.error) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          {image.uploading && (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          )}
          {image.error && (
            <div className="text-white text-center">
              <svg className="h-5 w-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs">Error</div>
            </div>
          )}
        </div>
      )}

      {/* Botones de acción */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showRemoveButton && (
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Eliminar imagen"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Indicador de estado */}
      {image.uploaded && !image.error && (
        <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Componente ImageUploader principal
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  name,
  label,
  validation,
  className,
  multiple = false,
  maxFiles = multiple ? 5 : 1,
  maxSize = 5, // 5MB por defecto
  accept = 'image/*',
  onChange,
  onUpload,
  showPreview = true,
  previewSize = 'medium',
  uploadOnSelect = false,
  placeholder = "Seleccionar imágenes..."
}) => {
  const { control, formState: { errors }, setValue, watch } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    images,
    addImages,
    removeImage,
    updateImage,
    clearImages,
    uploading,
    setUploading
  } = useImageHandler();

  const currentValue = watch(name);
  const error = errors[name];

  // Procesar archivos seleccionados
  const processFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    const acceptedTypes = accept.split(',').map(type => type.trim());
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validar archivos
    for (const file of files) {
      const errorMessage = ImageValidation.getErrorMessage(file, maxSize, acceptedTypes);
      if (errorMessage) {
        errors.push(errorMessage);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      console.warn('Errores de validación:', errors);
      // Aquí podrías mostrar los errores al usuario
    }

    if (validFiles.length === 0) return;

    // Limitar cantidad de archivos
    const filesToProcess = multiple
      ? validFiles.slice(0, maxFiles - images.length)
      : validFiles.slice(0, 1);

    if (!multiple) {
      clearImages();
    }

    const newImages = addImages(filesToProcess, maxFiles);

    // Subir archivos si está configurado
    if (uploadOnSelect && onUpload) {
      setUploading(true);

      for (const imageFile of newImages) {
        updateImage(imageFile.id, { uploading: true });

        try {
          const uploadedUrl = await onUpload(imageFile.file);
          updateImage(imageFile.id, {
            uploading: false,
            uploaded: true,
            url: uploadedUrl
          });
        } catch (error) {
          updateImage(imageFile.id, {
            uploading: false,
            error: 'Error al subir la imagen'
          });
        }
      }

      setUploading(false);
    }

    // Actualizar valor del formulario
    const formValue = multiple ? newImages : newImages[0] || null;
    setValue(name, formValue);
    onChange?.(formValue);

  }, [accept, maxSize, maxFiles, images.length, multiple, clearImages, addImages, uploadOnSelect, onUpload, setUploading, updateImage, setValue, name, onChange]);

  // Manejar selección de archivos
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Manejar drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  }, [processFiles]);

  // Abrir selector de archivos
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Eliminar imagen
  const handleRemoveImage = useCallback((id: string) => {
    removeImage(id);

    // Actualizar valor del formulario
    const remainingImages = images.filter(img => img.id !== id);
    const formValue = multiple ? remainingImages : remainingImages[0] || null;
    setValue(name, formValue);
    onChange?.(formValue);
  }, [removeImage, images, multiple, setValue, name, onChange]);

  return (
    <div className={`image-uploader ${className || ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {validation?.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        rules={validation}
        render={() => (
          <div>
            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Zona de drop */}
            <div
              onClick={openFileSelector}
              onDrag={handleDrag}
              onDragStart={handleDrag}
              onDragEnd={handleDrag}
              onDragOver={handleDrag}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${error ? 'border-red-500' : ''}
              `}
            >
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">{placeholder}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {multiple ? `Máximo ${maxFiles} archivos` : 'Un archivo'} -
                    Máximo {maxSize}MB cada uno
                  </p>
                </div>
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-600">Subiendo...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview de imágenes */}
            {showPreview && images.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-3">
                  {images.map((image) => (
                    <ImagePreview
                      key={image.id}
                      image={image}
                      size={previewSize}
                      onRemove={handleRemoveImage}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {(typeof error === 'string' ? error : (error as any)?.message) || 'Imagen requerida'}
        </p>
      )}
    </div>
  );
};
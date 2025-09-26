"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Interfaces para FormSubmission
 */
export interface FormSubmissionOptions {
  onSuccess?: (data: any, response?: Response) => void;
  onError?: (error: Error, response?: Response) => void;
  redirectOnSuccess?: string;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  resetOnSuccess?: boolean;
  validateBeforeSubmit?: (data: any) => boolean | string;
  transformData?: (data: any) => any;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface UseFormSubmissionReturn {
  submitting: boolean;
  error: string | null;
  success: boolean;
  submitForm: (
    url: string,
    data: any,
    options?: FormSubmissionOptions
  ) => Promise<any>;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

/**
 * Hook para manejo de envío de formularios
 */
export const useFormSubmission = (): UseFormSubmissionReturn => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Enviar formulario
  const submitForm = useCallback(
    async (
      url: string,
      data: any,
      options: FormSubmissionOptions = {}
    ): Promise<any> => {
      const {
        onSuccess,
        onError,
        redirectOnSuccess,
        showSuccessMessage = true,
        showErrorMessage = true,
        resetOnSuccess = false,
        validateBeforeSubmit,
        transformData,
        headers = {},
        method = "POST",
      } = options;

      try {
        // Limpiar estados previos
        setError(null);
        setSuccess(false);

        // Validación previa si está configurada
        if (validateBeforeSubmit) {
          const validationResult = validateBeforeSubmit(data);
          if (validationResult !== true) {
            const errorMessage =
              typeof validationResult === "string"
                ? validationResult
                : "Datos de formulario inválidos";
            throw new Error(errorMessage);
          }
        }

        setSubmitting(true);

        // Transformar datos si está configurado
        const finalData = transformData ? transformData(data) : data;

        // Preparar headers
        const finalHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...headers,
        };

        // Configurar opciones de fetch
        const fetchOptions: RequestInit = {
          method,
          headers: finalHeaders,
        };

        // Agregar body si no es GET
        if (method !== "GET") {
          fetchOptions.body = JSON.stringify(finalData);
        }

        // Realizar petición
        const response = await fetch(url, fetchOptions);

        // Verificar respuesta
        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Si no se puede parsear JSON, usar mensaje por defecto
          }

          throw new Error(errorMessage);
        }

        // Parsear respuesta
        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }

        // Marcar como exitoso
        if (showSuccessMessage) {
          setSuccess(true);
        }

        // Callback de éxito
        if (onSuccess) {
          onSuccess(responseData, response);
        }

        // Redireccionar si está configurado
        if (redirectOnSuccess) {
          router.push(redirectOnSuccess);
        }

        setSubmitting(false);
        return responseData;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error desconocido al enviar formulario";

        if (showErrorMessage) {
          setError(errorMessage);
        }

        // Callback de error
        if (onError) {
          onError(err as Error);
        }

        setSubmitting(false);
        throw err;
      }
    },
    [router]
  );

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpiar éxito
  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  // Reset completo
  const reset = useCallback(() => {
    setSubmitting(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    submitting,
    error,
    success,
    submitForm,
    clearError,
    clearSuccess,
    reset,
  };
};

/**
 * Hook específico para formularios de eventos sociales
 */
export const useSocialEventSubmission = () => {
  const baseSubmission = useFormSubmission();

  const createSocialEvent = useCallback(
    async (eventData: any) => {
      // Validación específica para eventos sociales
      const validateEventData = (data: any): boolean | string => {
        if (!data.nombreSalida?.trim())
          return "El nombre del evento es requerido";
        if (!data.fecha) return "La fecha es requerida";
        if (!data.hora) return "La hora es requerida";
        if (!data.ubicacion?.coordinates) return "La ubicación es requerida";
        if (data.precio && isNaN(parseFloat(data.precio)))
          return "El precio debe ser un número válido";
        if (
          data.limitePersonas &&
          (!Number.isInteger(data.limitePersonas) || data.limitePersonas < 1)
        ) {
          return "El límite de personas debe ser un número entero mayor a 0";
        }
        return true;
      };

      // Transformar datos para la API
      const transformEventData = (data: any) => {
        const transformed = { ...data };

        // Combinar fecha y hora
        if (data.fecha && data.hora) {
          transformed.fechaHora = `${data.fecha}T${data.hora}`;
        }

        // Convertir precio a número
        if (data.precio) {
          transformed.precio = parseFloat(data.precio);
        }

        // Convertir límite a número
        if (data.limitePersonas) {
          transformed.limitePersonas = parseInt(data.limitePersonas);
        }

        // Limpiar campos temporales
        delete transformed.fecha;
        delete transformed.hora;

        return transformed;
      };

      return baseSubmission.submitForm("/api/social", eventData, {
        validateBeforeSubmit: validateEventData,
        transformData: transformEventData,
        redirectOnSuccess: "/dashboard",
        onSuccess: (data) => {
          console.log("Evento creado exitosamente:", data);
        },
        onError: (error) => {
          console.error("Error creando evento:", error);
        },
      });
    },
    [baseSubmission]
  );

  const updateSocialEvent = useCallback(
    async (eventId: string, eventData: any) => {
      return baseSubmission.submitForm(`/api/social/${eventId}`, eventData, {
        method: "PUT",
        onSuccess: (data) => {
          console.log("Evento actualizado exitosamente:", data);
        },
      });
    },
    [baseSubmission]
  );

  const deleteSocialEvent = useCallback(
    async (eventId: string) => {
      return baseSubmission.submitForm(
        `/api/social/${eventId}`,
        {},
        {
          method: "DELETE",
          onSuccess: () => {
            console.log("Evento eliminado exitosamente");
          },
        }
      );
    },
    [baseSubmission]
  );

  return {
    ...baseSubmission,
    createSocialEvent,
    updateSocialEvent,
    deleteSocialEvent,
  };
};

/**
 * Hook para manejo de archivos e imágenes
 */
export const useFileSubmission = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      url: string,
      options: {
        onProgress?: (progress: number) => void;
        maxSize?: number; // En MB
        acceptedTypes?: string[];
        headers?: Record<string, string>;
      } = {}
    ): Promise<string> => {
      const { onProgress, maxSize = 10, acceptedTypes, headers = {} } = options;

      try {
        setError(null);
        setUploadProgress(0);

        // Validaciones
        if (maxSize && file.size > maxSize * 1024 * 1024) {
          throw new Error(`El archivo excede el tamaño máximo de ${maxSize}MB`);
        }

        if (
          acceptedTypes &&
          !acceptedTypes.some((type) =>
            type.includes("*")
              ? file.type.startsWith(type.split("/")[0])
              : file.type === type
          )
        ) {
          throw new Error("Tipo de archivo no permitido");
        }

        setUploading(true);

        // Crear FormData
        const formData = new FormData();
        formData.append("file", file);

        // Configurar XMLHttpRequest para trackear progreso
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Escuchar progreso
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(progress);
              onProgress?.(progress);
            }
          });

          // Manejar respuesta
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                setUploading(false);
                resolve(response.url || response.data?.url || "");
              } catch {
                setUploading(false);
                reject(new Error("Respuesta inválida del servidor"));
              }
            } else {
              setUploading(false);
              reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
          });

          // Manejar errores
          xhr.addEventListener("error", () => {
            setUploading(false);
            reject(new Error("Error de red al subir archivo"));
          });

          // Configurar y enviar
          xhr.open("POST", url);

          // Agregar headers personalizados
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });

          xhr.send(formData);
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al subir archivo";
        setError(errorMessage);
        setUploading(false);
        throw err;
      }
    },
    []
  );

  const uploadMultipleFiles = useCallback(
    async (
      files: File[],
      url: string,
      options: Parameters<typeof uploadFile>[2] = {}
    ): Promise<string[]> => {
      const uploadPromises = files.map((file) =>
        uploadFile(file, url, options)
      );
      return Promise.all(uploadPromises);
    },
    [uploadFile]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    uploading,
    uploadProgress,
    error,
    uploadFile,
    uploadMultipleFiles,
    clearError,
    reset,
  };
};

/**
 * Hook para validaciones en tiempo real
 */
export const useRealTimeValidation = (
  validationRules: Record<string, (value: any) => boolean | string>
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback(
    (fieldName: string, value: any): boolean => {
      const rule = validationRules[fieldName];
      if (!rule) return true;

      const result = rule(value);

      setErrors((current) => {
        const newErrors = { ...current };

        if (result === true) {
          delete newErrors[fieldName];
        } else {
          newErrors[fieldName] =
            typeof result === "string" ? result : "Campo inválido";
        }

        return newErrors;
      });

      return result === true;
    },
    [validationRules]
  );

  const validateAll = useCallback(
    (data: Record<string, any>): boolean => {
      const newErrors: Record<string, string> = {};
      let allValid = true;

      Object.keys(validationRules).forEach((fieldName) => {
        const rule = validationRules[fieldName];
        const value = data[fieldName];
        const result = rule(value);

        if (result !== true) {
          newErrors[fieldName] =
            typeof result === "string" ? result : "Campo inválido";
          allValid = false;
        }
      });

      setErrors(newErrors);
      setIsValid(allValid);
      return allValid;
    },
    [validationRules]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((current) => {
      const newErrors = { ...current };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValid,
    validateField,
    validateAll,
    clearErrors,
    clearFieldError,
  };
};

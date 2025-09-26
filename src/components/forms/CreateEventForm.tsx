"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { BaseFormField } from "./BaseFormField";
import { LocationPicker } from "./LocationPicker";
import { DateTimePicker } from "./DateTimePicker";
import { ImageUploader } from "./ImageUploader";
import { useSocialEventSubmission } from "@/hooks/useFormSubmission";

/**
 * Interfaces para el formulario de crear evento
 */
export interface CreateEventFormData {
  nombreSalida: string;
  fechaHora: string;
  ubicacion: {
    coordinates: [number, number];
    address?: string;
    city?: string;
    country?: string;
    formatted?: string;
  };
  precio: number;
  deporte: string;
  duracion: string;
  descripcion: string;
  localidad: string;
  provincia: string;
  whatsappLink?: string;
  dificultad: string;
  telefonoOrganizador: string;
  cupo: number;
  detalles?: string;
  cbu?: string;
  alias?: string;
  sponsors: string[];
  profesorId?: string;
  imagen?: File[];
}

export interface CreateEventFormProps {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  initialData?: Partial<CreateEventFormData>;
  sponsors?: Array<{ _id: string; nombre: string; imagen: string }>;
  profesores?: Array<{ _id: string; firstname: string; lastname: string }>;
  userTelefono?: string;
}

/**
 * Opciones para deportes
 */
const deporteOptions = [
  { value: "", label: "Seleccionar deporte" },
  { value: "running", label: "Running" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "natacion", label: "Natación" },
  { value: "futbol", label: "Fútbol" },
  { value: "tenis", label: "Tenis" },
  { value: "basquet", label: "Básquet" },
  { value: "voley", label: "Vóley" },
  { value: "crossfit", label: "CrossFit" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "escalada", label: "Escalada" },
  { value: "senderismo", label: "Senderismo" },
  { value: "otro", label: "Otro" },
];

/**
 * Opciones para dificultad
 */
const dificultadOptions = [
  { value: "", label: "Seleccionar dificultad" },
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
  { value: "experto", label: "Experto" },
];

/**
 * Componente simplificado del formulario
 */
export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSuccess,
  onError,
  initialData,
  sponsors = [],
  userTelefono = "",
}) => {
  const methods = useForm<CreateEventFormData>({
    defaultValues: {
      nombreSalida: "",
      fechaHora: "",
      precio: 0,
      deporte: "",
      duracion: "",
      descripcion: "",
      localidad: "",
      provincia: "",
      dificultad: "",
      telefonoOrganizador: userTelefono,
      cupo: 10,
      sponsors: [],
      ...initialData,
    },
  });

  const { handleSubmit } = methods;
  const { createSocialEvent, submitting, error } = useSocialEventSubmission();

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      await createSocialEvent(data);
      onSuccess?.(data);
    } catch (err) {
      onError?.(err as Error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Información Básica
          </h3>

          <BaseFormField
            name="nombreSalida"
            label="Nombre del evento"
            type="text"
            placeholder="Ej: Salida de running por el parque"
            validation={{ required: "El nombre del evento es requerido" }}
          />

          <BaseFormField
            name="deporte"
            label="Deporte"
            type="select"
            options={deporteOptions}
            validation={{ required: "El deporte es requerido" }}
          />

          <BaseFormField
            name="descripcion"
            label="Descripción"
            type="textarea"
            rows={4}
            placeholder="Describe tu evento..."
            validation={{ required: "La descripción es requerida" }}
          />
        </div>

        {/* Fecha y ubicación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Fecha y Ubicación
          </h3>

          <DateTimePicker
            name="fechaHora"
            label="Fecha y hora"
            type="datetime-local"
            validation={{ required: "La fecha y hora son requeridas" }}
          />

          <LocationPicker
            name="ubicacion"
            label="Ubicación del evento"
            validation={{ required: "La ubicación es requerida" }}
            enableGPS
          />
        </div>

        {/* Precio y participantes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Precio y Participantes
          </h3>

          <BaseFormField
            name="precio"
            label="Precio"
            type="number"
            min={0}
            placeholder="0.00"
            validation={{ required: "El precio es requerido" }}
          />

          <BaseFormField
            name="cupo"
            label="Cupo máximo"
            type="number"
            min={1}
            placeholder="10"
            validation={{ required: "El cupo es requerido" }}
          />
        </div>

        {/* Mostrar errores */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Botón enviar */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 bg-[#C95100] text-white rounded-md font-medium hover:bg-[#A03D00] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Creando evento..." : "Crear Evento"}
        </button>
      </form>
    </FormProvider>
  );
};

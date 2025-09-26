"use client";

import React, { useState, useCallback } from "react";
import { useFormContext, Controller } from "react-hook-form";

/**
 * Interfaces para DateTimePicker
 */
export interface DateTimePickerProps {
  name: string;
  label?: string;
  required?: boolean;
  className?: string;
  type?: "date" | "time" | "datetime-local";
  min?: string;
  max?: string;
  step?: number;
  validation?: {
    required?: string | boolean;
    validate?: (value: string) => boolean | string;
    min?: { value: string; message: string };
    max?: { value: string; message: string };
  };
  onChange?: (value: string) => void;
  placeholder?: string;
  showCurrentTimeButton?: boolean;
  showTodayButton?: boolean;
  timeInterval?: number; // En minutos
}

/**
 * Utilities para fechas
 */
export const DateTimeUtils = {
  /**
   * Formatear fecha para input datetime-local
   */
  formatForInput: (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  /**
   * Formatear solo fecha
   */
  formatDateOnly: (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  },

  /**
   * Formatear solo hora
   */
  formatTimeOnly: (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  },

  /**
   * Obtener fecha/hora actual según el tipo
   */
  getCurrentValue: (type: "date" | "time" | "datetime-local"): string => {
    const now = new Date();

    switch (type) {
      case "date":
        return DateTimeUtils.formatDateOnly(now);
      case "time":
        return DateTimeUtils.formatTimeOnly(now);
      case "datetime-local":
        return DateTimeUtils.formatForInput(now);
      default:
        return "";
    }
  },

  /**
   * Validar si una fecha es válida
   */
  isValidDate: (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  /**
   * Formatear fecha para mostrar al usuario
   */
  formatDisplayDate: (
    dateString: string,
    type: "date" | "time" | "datetime-local"
  ): string => {
    if (!dateString || !DateTimeUtils.isValidDate(dateString)) return "";

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {};

    switch (type) {
      case "date":
        options.year = "numeric";
        options.month = "long";
        options.day = "numeric";
        break;
      case "time":
        options.hour = "2-digit";
        options.minute = "2-digit";
        break;
      case "datetime-local":
        options.year = "numeric";
        options.month = "short";
        options.day = "numeric";
        options.hour = "2-digit";
        options.minute = "2-digit";
        break;
    }

    return date.toLocaleString("es-AR", options);
  },

  /**
   * Redondear a intervalos de tiempo
   */
  roundToInterval: (dateString: string, intervalMinutes: number): string => {
    if (!dateString || !DateTimeUtils.isValidDate(dateString))
      return dateString;

    const date = new Date(dateString);
    const minutes = date.getMinutes();
    const roundedMinutes =
      Math.round(minutes / intervalMinutes) * intervalMinutes;

    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return DateTimeUtils.formatForInput(date);
  },
};

/**
 * Hook para gestión de DateTime
 */
export const useDateTime = (
  type: "date" | "time" | "datetime-local" = "datetime-local"
) => {
  const [value, setValue] = useState<string>("");

  const setCurrentDateTime = useCallback(() => {
    const current = DateTimeUtils.getCurrentValue(type);
    setValue(current);
    return current;
  }, [type]);

  const setCustomDateTime = useCallback((dateTime: string) => {
    if (DateTimeUtils.isValidDate(dateTime)) {
      setValue(dateTime);
      return true;
    }
    return false;
  }, []);

  const clearDateTime = useCallback(() => {
    setValue("");
  }, []);

  const formatDisplay = useCallback(
    (dateString?: string) => {
      return DateTimeUtils.formatDisplayDate(dateString || value, type);
    },
    [value, type]
  );

  return {
    value,
    setValue,
    setCurrentDateTime,
    setCustomDateTime,
    clearDateTime,
    formatDisplay,
    isValid: DateTimeUtils.isValidDate(value),
  };
};

/**
 * Componente DateTimePicker principal
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  name,
  label,
  type = "datetime-local",
  validation,
  className,
  placeholder,
  showCurrentTimeButton = true,
  showTodayButton = true,
  timeInterval,
  onChange,
  ...inputProps
}) => {
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();
  const currentValue = watch(name);
  const error = errors[name];

  // Establecer valor actual
  const setCurrentValue = useCallback(() => {
    let newValue = DateTimeUtils.getCurrentValue(type);

    // Aplicar intervalo si está configurado
    if (timeInterval && type !== "date") {
      newValue = DateTimeUtils.roundToInterval(newValue, timeInterval);
    }

    setValue(name, newValue);
    onChange?.(newValue);
  }, [type, timeInterval, setValue, name, onChange]);

  // Limpiar valor
  const clearValue = useCallback(() => {
    setValue(name, "");
    onChange?.("");
  }, [setValue, name, onChange]);

  return (
    <div className={`datetime-picker ${className || ""}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        rules={validation}
        render={({ field }) => (
          <div className="relative">
            {/* Input principal */}
            <input
              {...field}
              {...inputProps}
              type={type}
              id={name}
              step={timeInterval ? timeInterval * 60 : undefined}
              placeholder={placeholder}
              onChange={(e) => {
                let value = e.target.value;

                // Aplicar intervalo si está configurado
                if (timeInterval && value && type !== "date") {
                  value = DateTimeUtils.roundToInterval(value, timeInterval);
                }

                field.onChange(value);
                onChange?.(value);
              }}
              className={`w-full px-3 py-2 pr-20 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />

            {/* Botones de acción */}
            <div className="absolute right-2 top-2 flex space-x-1">
              {((type === "datetime-local" || type === "time") &&
                showCurrentTimeButton) ||
                (type === "date" && showTodayButton && (
                  <button
                    type="button"
                    onClick={setCurrentValue}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title={
                      type === "date" ? "Usar fecha actual" : "Usar hora actual"
                    }
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                ))}

              {field.value && (
                <button
                  type="button"
                  onClick={clearValue}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Limpiar"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Valor formateado para mostrar */}
      {currentValue && (
        <div className="mt-1 text-xs text-gray-500">
          {DateTimeUtils.formatDisplayDate(currentValue, type)}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {(typeof error === "string" ? error : (error as any)?.message) ||
            "Fecha/hora requerida"}
        </p>
      )}
    </div>
  );
};

/**
 * Componente específico para rango de fechas
 */
export interface DateRangePickerProps {
  startName: string;
  endName: string;
  label?: string;
  required?: boolean;
  className?: string;
  type?: "date" | "datetime-local";
  validation?: {
    required?: string | boolean;
    validate?: (startValue: string, endValue: string) => boolean | string;
  };
  onChange?: (startValue: string, endValue: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startName,
  endName,
  label,
  type = "date",
  validation,
  className,
  onChange,
}) => {
  const {
    watch,
    formState: { errors },
    trigger,
  } = useFormContext();
  const startValue = watch(startName);
  const endValue = watch(endName);
  const startError = errors[startName];
  const endError = errors[endName];

  // Validación personalizada para rango
  const validateRange = useCallback(
    (start: string, end: string) => {
      if (!start || !end) return true;

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (startDate > endDate) {
        return "La fecha de inicio no puede ser posterior a la fecha de fin";
      }

      if (validation?.validate) {
        return validation.validate(start, end);
      }

      return true;
    },
    [validation]
  );

  const handleChange = useCallback(
    (field: "start" | "end", value: string) => {
      // Trigger validation on both fields
      setTimeout(() => {
        trigger([startName, endName]);
        onChange?.(
          field === "start" ? value : startValue,
          field === "end" ? value : endValue
        );
      }, 0);
    },
    [trigger, startName, endName, onChange, startValue, endValue]
  );

  return (
    <div className={`date-range-picker ${className || ""}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateTimePicker
          name={startName}
          label="Fecha de inicio"
          type={type}
          validation={{
            ...validation,
            validate: (value) => validateRange(value, endValue),
          }}
          onChange={(value) => handleChange("start", value)}
        />

        <DateTimePicker
          name={endName}
          label="Fecha de fin"
          type={type}
          validation={{
            ...validation,
            validate: (value) => validateRange(startValue, value),
          }}
          onChange={(value) => handleChange("end", value)}
        />
      </div>

      {(startError || endError) &&
        ((typeof startError === "string"
          ? startError
          : (startError as any)?.message) ||
          (typeof endError === "string"
            ? endError
            : (endError as any)?.message)) && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {(typeof startError === "string"
              ? startError
              : (startError as any)?.message) ||
              (typeof endError === "string"
                ? endError
                : (endError as any)?.message)}
          </p>
        )}
    </div>
  );
};

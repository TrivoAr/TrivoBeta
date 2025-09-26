"use client";

import React, { forwardRef } from "react";
import { useFormContext, Controller } from "react-hook-form";

/**
 * Tipos para campos de formulario
 */
export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file"
  | "date"
  | "time"
  | "datetime-local";

export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface BaseFormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: FormFieldType;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options?: FormFieldOption[];
  multiple?: boolean;
  accept?: string; // Para file inputs
  min?: string | number;
  max?: string | number;
  step?: string | number;
  rows?: number; // Para textarea
  validation?: {
    required?: string | boolean;
    pattern?: {
      value: RegExp;
      message: string;
    };
    minLength?: {
      value: number;
      message: string;
    };
    maxLength?: {
      value: number;
      message: string;
    };
    min?: {
      value: number;
      message: string;
    };
    max?: {
      value: number;
      message: string;
    };
    validate?: (value: any) => boolean | string;
  };
  onChange?: (value: any) => void;
  renderCustomInput?: (field: any, error: any) => React.ReactElement;
}

/**
 * Input base reutilizable
 */
const BaseInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  any
>(({ type, className, rows, options, multiple, ...props }, ref) => {
  const baseClasses =
    "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";

  const finalClassName = `${baseClasses} ${props.error ? errorClasses : ""} ${className || ""}`;

  switch (type) {
    case "textarea":
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={finalClassName}
          rows={rows || 3}
          {...props}
        />
      );

    case "select":
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          className={finalClassName}
          multiple={multiple}
          {...props}
        >
          {options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          {...props}
        />
      );

    case "radio":
      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type="radio"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          {...props}
        />
      );

    default:
      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type={type}
          className={finalClassName}
          {...props}
        />
      );
  }
});

BaseInput.displayName = "BaseInput";

/**
 * Campo de formulario reutilizable con integración React Hook Form
 */
export const BaseFormField: React.FC<BaseFormFieldProps> = ({
  name,
  label,
  type = "text",
  validation,
  renderCustomInput,
  className,
  ...inputProps
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className={`form-field ${className || ""}`}>
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
        render={({ field, fieldState }) => {
          if (renderCustomInput) {
            return renderCustomInput(field, fieldState.error);
          }

          return (
            <BaseInput
              {...field}
              {...inputProps}
              type={type}
              id={name}
              error={fieldState.error}
              aria-invalid={fieldState.error ? "true" : "false"}
              aria-describedby={fieldState.error ? `${name}-error` : undefined}
            />
          );
        }}
      />

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {(typeof error === "string" ? error : (error as any)?.message) ||
            "Campo requerido"}
        </p>
      )}
    </div>
  );
};

/**
 * Grupo de campos de radio
 */
export interface RadioGroupProps {
  name: string;
  label?: string;
  options: FormFieldOption[];
  required?: boolean;
  className?: string;
  validation?: BaseFormFieldProps["validation"];
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  validation,
  className,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className={`form-field ${className || ""}`}>
      {label && (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {validation?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </legend>

          <Controller
            name={name}
            control={control}
            rules={validation}
            render={({ field }) => (
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      {...field}
                      type="radio"
                      id={`${name}-${option.value}`}
                      value={option.value}
                      checked={field.value === option.value}
                      disabled={option.disabled}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor={`${name}-${option.value}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          />
        </fieldset>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {(typeof error === "string" ? error : (error as any)?.message) ||
            "Selección requerida"}
        </p>
      )}
    </div>
  );
};

/**
 * Campo de archivo con preview
 */
export interface FileFieldProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  className?: string;
  validation?: BaseFormFieldProps["validation"];
  onFileChange?: (files: File[]) => void;
  showPreview?: boolean;
  maxSize?: number; // En MB
}

export const FileField: React.FC<FileFieldProps> = ({
  name,
  label,
  accept,
  multiple,
  validation,
  className,
  onFileChange,
  showPreview = false,
  maxSize,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  const validateFile = (files: File[]) => {
    if (maxSize) {
      const oversizedFiles = files.filter(
        (file) => file.size > maxSize * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        return `Archivo(s) muy grande(s). Máximo ${maxSize}MB`;
      }
    }
    return true;
  };

  return (
    <div className={`form-field ${className || ""}`}>
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
        rules={{
          ...validation,
          validate: (value) => {
            const files = Array.from(value || []);
            if (validation?.validate) {
              const customResult = validation.validate(value);
              if (customResult !== true) return customResult;
            }
            return validateFile(
              files.filter((f): f is File => f instanceof File)
            );
          },
        }}
        render={({ field: { onChange, value, ...field } }) => (
          <div>
            <input
              {...field}
              type="file"
              id={name}
              accept={accept}
              multiple={multiple}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onChange(multiple ? files : files[0] || null);
                onFileChange?.(files);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {showPreview && value && (
              <div className="mt-2">
                {multiple ? (
                  <div className="space-y-1">
                    {value.map((file: File, index: number) => (
                      <div key={index} className="text-xs text-gray-600">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">
                    {value.name} ({(value.size / 1024 / 1024).toFixed(2)}MB)
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {(typeof error === "string" ? error : (error as any)?.message) ||
            "Archivo requerido"}
        </p>
      )}
    </div>
  );
};

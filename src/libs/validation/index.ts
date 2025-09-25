/**
 * Unified validation system for the application
 * Provides a consistent way to validate forms and data across components
 */

export interface ValidationRule<T = any> {
  /**
   * Validation function
   */
  validate: (value: T, data?: Record<string, any>) => boolean;
  /**
   * Error message to show when validation fails
   */
  message: string;
  /**
   * Whether this is a required field validation
   */
  required?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  firstError?: string;
}

export interface FieldValidation {
  rules: ValidationRule[];
  value: any;
  touched?: boolean;
}

export interface FormValidation {
  [fieldName: string]: FieldValidation;
}

/**
 * Built-in validation rules
 */
export const ValidationRules = {
  /**
   * Required field validation
   */
  required: (message = 'Este campo es requerido'): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
    required: true
  }),

  /**
   * Minimum length validation
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true; // Skip if empty (use required rule for required fields)
      return value.length >= min;
    },
    message: message || `Debe tener al menos ${min} caracteres`
  }),

  /**
   * Maximum length validation
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return value.length <= max;
    },
    message: message || `Debe tener máximo ${max} caracteres`
  }),

  /**
   * Email validation
   */
  email: (message = 'Debe ser un email válido'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  /**
   * Phone number validation (Argentina format)
   */
  phone: (message = 'Debe ser un número de teléfono válido'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      // Argentina phone formats: +54 11 1234-5678, 011 1234-5678, 11 1234-5678
      const phoneRegex = /^(\+54\s?)?(\d{2,4})\s?\d{4}-?\d{4}$/;
      return phoneRegex.test(value.replace(/\s/g, ''));
    },
    message
  }),

  /**
   * URL validation
   */
  url: (message = 'Debe ser una URL válida'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  /**
   * Number validation
   */
  number: (message = 'Debe ser un número válido'): ValidationRule => ({
    validate: (value: string | number) => {
      if (value === '' || value === null || value === undefined) return true;
      return !isNaN(Number(value));
    },
    message
  }),

  /**
   * Minimum value validation
   */
  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: string | number) => {
      if (value === '' || value === null || value === undefined) return true;
      return Number(value) >= min;
    },
    message: message || `Debe ser mayor o igual a ${min}`
  }),

  /**
   * Maximum value validation
   */
  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: string | number) => {
      if (value === '' || value === null || value === undefined) return true;
      return Number(value) <= max;
    },
    message: message || `Debe ser menor o igual a ${max}`
  }),

  /**
   * Pattern validation
   */
  pattern: (regex: RegExp, message = 'Formato inválido'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return regex.test(value);
    },
    message
  }),

  /**
   * Custom validation
   */
  custom: (validationFn: (value: any, data?: Record<string, any>) => boolean, message: string): ValidationRule => ({
    validate: validationFn,
    message
  }),

  /**
   * Match field validation (useful for password confirmation)
   */
  matchField: (fieldName: string, message?: string): ValidationRule => ({
    validate: (value: any, data?: Record<string, any>) => {
      if (!data) return true;
      return value === data[fieldName];
    },
    message: message || `Debe coincidir con ${fieldName}`
  }),

  /**
   * Date validation
   */
  date: (message = 'Debe ser una fecha válida'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message
  }),

  /**
   * Future date validation
   */
  futureDate: (message = 'Debe ser una fecha futura'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      return date > now;
    },
    message
  }),

  /**
   * File size validation
   */
  fileSize: (maxSizeInMB: number, message?: string): ValidationRule => ({
    validate: (file: File) => {
      if (!file) return true;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      return file.size <= maxSizeInBytes;
    },
    message: message || `El archivo debe ser menor a ${maxSizeInMB}MB`
  }),

  /**
   * File type validation
   */
  fileType: (allowedTypes: string[], message?: string): ValidationRule => ({
    validate: (file: File) => {
      if (!file) return true;
      return allowedTypes.includes(file.type);
    },
    message: message || `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
  })
};

/**
 * Validate a single field
 */
export function validateField(value: any, rules: ValidationRule[], data?: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value, data)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0]
  };
}

/**
 * Validate an entire form
 */
export function validateForm(formData: Record<string, any>, validation: FormValidation): {
  isValid: boolean;
  errors: Record<string, ValidationResult>;
  firstError?: string;
} {
  const errors: Record<string, ValidationResult> = {};
  let isValid = true;
  let firstError: string | undefined;

  for (const [fieldName, fieldValidation] of Object.entries(validation)) {
    const fieldValue = formData[fieldName];
    const result = validateField(fieldValue, fieldValidation.rules, formData);

    errors[fieldName] = result;

    if (!result.isValid) {
      isValid = false;
      if (!firstError) {
        firstError = result.firstError;
      }
    }
  }

  return {
    isValid,
    errors,
    firstError
  };
}

/**
 * Common validation schemas for the application
 */
export const ValidationSchemas = {
  /**
   * User registration validation
   */
  userRegistration: {
    firstname: {
      rules: [
        ValidationRules.required(),
        ValidationRules.minLength(2),
        ValidationRules.maxLength(50)
      ],
      value: ''
    },
    lastname: {
      rules: [
        ValidationRules.required(),
        ValidationRules.minLength(2),
        ValidationRules.maxLength(50)
      ],
      value: ''
    },
    email: {
      rules: [
        ValidationRules.required(),
        ValidationRules.email()
      ],
      value: ''
    },
    password: {
      rules: [
        ValidationRules.required(),
        ValidationRules.minLength(8),
        ValidationRules.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Debe contener al menos una minúscula, una mayúscula y un número'
        )
      ],
      value: ''
    },
    confirmPassword: {
      rules: [
        ValidationRules.required(),
        ValidationRules.matchField('password', 'Las contraseñas no coinciden')
      ],
      value: ''
    }
  },

  /**
   * Event creation validation
   */
  eventCreation: {
    nombre: {
      rules: [
        ValidationRules.required('El nombre del evento es requerido'),
        ValidationRules.minLength(3),
        ValidationRules.maxLength(100)
      ],
      value: ''
    },
    descripcion: {
      rules: [
        ValidationRules.maxLength(500)
      ],
      value: ''
    },
    fecha: {
      rules: [
        ValidationRules.required('La fecha es requerida'),
        ValidationRules.date(),
        ValidationRules.futureDate()
      ],
      value: ''
    },
    hora: {
      rules: [
        ValidationRules.required('La hora es requerida'),
        ValidationRules.pattern(
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          'Formato de hora inválido (HH:MM)'
        )
      ],
      value: ''
    },
    ubicacion: {
      rules: [
        ValidationRules.required('La ubicación es requerida'),
        ValidationRules.minLength(5)
      ],
      value: ''
    },
    cupo: {
      rules: [
        ValidationRules.required('El cupo es requerido'),
        ValidationRules.number(),
        ValidationRules.min(1),
        ValidationRules.max(1000)
      ],
      value: ''
    },
    precio: {
      rules: [
        ValidationRules.number(),
        ValidationRules.min(0)
      ],
      value: ''
    }
  },

  /**
   * Academy creation validation
   */
  academyCreation: {
    nombre_academia: {
      rules: [
        ValidationRules.required('El nombre de la academia es requerido'),
        ValidationRules.minLength(3),
        ValidationRules.maxLength(100)
      ],
      value: ''
    },
    tipo_disciplina: {
      rules: [
        ValidationRules.required('El tipo de disciplina es requerido')
      ],
      value: ''
    },
    pais: {
      rules: [
        ValidationRules.required('El país es requerido')
      ],
      value: ''
    },
    provincia: {
      rules: [
        ValidationRules.required('La provincia es requerida')
      ],
      value: ''
    },
    localidad: {
      rules: [
        ValidationRules.required('La localidad es requerida')
      ],
      value: ''
    },
    descripcion: {
      rules: [
        ValidationRules.maxLength(500)
      ],
      value: ''
    },
    telefono: {
      rules: [
        ValidationRules.phone()
      ],
      value: ''
    }
  },

  /**
   * Profile update validation
   */
  profileUpdate: {
    firstname: {
      rules: [
        ValidationRules.required(),
        ValidationRules.minLength(2),
        ValidationRules.maxLength(50)
      ],
      value: ''
    },
    lastname: {
      rules: [
        ValidationRules.required(),
        ValidationRules.minLength(2),
        ValidationRules.maxLength(50)
      ],
      value: ''
    },
    bio: {
      rules: [
        ValidationRules.maxLength(300)
      ],
      value: ''
    },
    telnumber: {
      rules: [
        ValidationRules.phone()
      ],
      value: ''
    },
    instagram: {
      rules: [
        ValidationRules.pattern(
          /^@?[\w.-]+$/,
          'Usuario de Instagram inválido'
        )
      ],
      value: ''
    }
  }
};

/**
 * Create validation schema from field definitions
 */
export function createValidationSchema(
  fields: Record<string, ValidationRule[]>
): FormValidation {
  const schema: FormValidation = {};

  for (const [fieldName, rules] of Object.entries(fields)) {
    schema[fieldName] = {
      rules,
      value: ''
    };
  }

  return schema;
}

/**
 * Utility to get validation rules for common field types
 */
export const FieldValidations = {
  name: () => [
    ValidationRules.required(),
    ValidationRules.minLength(2),
    ValidationRules.maxLength(50)
  ],

  email: () => [
    ValidationRules.required(),
    ValidationRules.email()
  ],

  password: () => [
    ValidationRules.required(),
    ValidationRules.minLength(8)
  ],

  phone: () => [
    ValidationRules.phone()
  ],

  url: () => [
    ValidationRules.url()
  ],

  eventDate: () => [
    ValidationRules.required(),
    ValidationRules.date(),
    ValidationRules.futureDate()
  ],

  eventTime: () => [
    ValidationRules.required(),
    ValidationRules.pattern(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Formato de hora inválido (HH:MM)'
    )
  ],

  positiveNumber: (max?: number) => [
    ValidationRules.number(),
    ValidationRules.min(0),
    ...(max ? [ValidationRules.max(max)] : [])
  ],

  imageFile: () => [
    ValidationRules.fileType(
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      'Solo se permiten imágenes (JPG, PNG, WebP)'
    ),
    ValidationRules.fileSize(5, 'La imagen debe ser menor a 5MB')
  ]
};
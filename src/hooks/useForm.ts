'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FormValidation,
  validateForm,
  validateField,
  ValidationResult
} from '@/libs/validation';

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Record<string, ValidationResult>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  isDirty: boolean;
}

export interface UseFormOptions<T = Record<string, any>> {
  /**
   * Initial form values
   */
  initialValues: T;
  /**
   * Validation schema
   */
  validation?: FormValidation;
  /**
   * Whether to validate on change
   * @default true
   */
  validateOnChange?: boolean;
  /**
   * Whether to validate on blur
   * @default true
   */
  validateOnBlur?: boolean;
  /**
   * Whether to validate on mount
   * @default false
   */
  validateOnMount?: boolean;
  /**
   * Submit handler
   */
  onSubmit?: (values: T, helpers: FormHelpers<T>) => Promise<void> | void;
  /**
   * Callback when form validation state changes
   */
  onValidationChange?: (isValid: boolean, errors: Record<string, ValidationResult>) => void;
  /**
   * Whether to reset form after successful submit
   * @default false
   */
  resetOnSubmit?: boolean;
}

export interface FormHelpers<T = Record<string, any>> {
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setTouched: (touched: Record<string, boolean>) => void;
  resetForm: () => void;
  resetField: (field: keyof T) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  setSubmitting: (isSubmitting: boolean) => void;
}

export interface FieldProps {
  name: string;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
}

/**
 * Custom hook for form management with validation
 * Provides comprehensive form state management, validation, and utilities
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { name: '', email: '' },
 *   validation: ValidationSchemas.userRegistration,
 *   onSubmit: async (values) => {
 *     await submitUser(values);
 *   }
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <input {...form.getFieldProps('name')} />
 *     <input {...form.getFieldProps('email')} />
 *     <button type="submit" disabled={!form.isValid || form.isSubmitting}>
 *       Submit
 *     </button>
 *   </form>
 * );
 * ```
 */
export function useForm<T extends Record<string, any> = Record<string, any>>(
  options: UseFormOptions<T>
) {
  const {
    initialValues,
    validation,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    onSubmit,
    onValidationChange,
    resetOnSubmit = false
  } = options;

  const [state, setState] = useState<FormState<T>>(() => ({
    values: { ...initialValues },
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false,
    isSubmitted: false,
    isDirty: false
  }));

  // Track initial values to detect dirty state
  const initialValuesRef = useRef(initialValues);
  const validationRef = useRef(validation);

  // Update refs when props change
  useEffect(() => {
    initialValuesRef.current = initialValues;
    validationRef.current = validation;
  }, [initialValues, validation]);

  /**
   * Check if form is dirty (values changed from initial)
   */
  const checkIsDirty = useCallback((values: T): boolean => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, []);

  /**
   * Validate entire form
   */
  const validateFormValues = useCallback(async (values: T): Promise<{
    isValid: boolean;
    errors: Record<string, ValidationResult>;
  }> => {
    if (!validationRef.current) {
      return { isValid: true, errors: {} };
    }

    const result = validateForm(values, validationRef.current);

    return {
      isValid: result.isValid,
      errors: result.errors
    };
  }, []);

  /**
   * Validate single field
   */
  const validateSingleField = useCallback(async (
    fieldName: keyof T,
    value: any,
    allValues: T
  ): Promise<ValidationResult> => {
    if (!validationRef.current || !validationRef.current[fieldName as string]) {
      return { isValid: true, errors: [] };
    }

    const fieldValidation = validationRef.current[fieldName as string];
    return validateField(value, fieldValidation.rules, allValues);
  }, []);

  /**
   * Set field value with optional validation
   */
  const setFieldValue = useCallback(async (field: keyof T, value: any) => {
    const newValues = { ...state.values, [field]: value };
    const isDirty = checkIsDirty(newValues);

    setState(prev => ({
      ...prev,
      values: newValues,
      isDirty
    }));

    // Validate on change if enabled
    if (validateOnChange && validationRef.current) {
      const fieldResult = await validateSingleField(field, value, newValues);
      const formResult = await validateFormValues(newValues);

      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: fieldResult
        },
        isValid: formResult.isValid
      }));

      onValidationChange?.(formResult.isValid, formResult.errors);
    }
  }, [state.values, checkIsDirty, validateOnChange, validateSingleField, validateFormValues, onValidationChange]);

  /**
   * Set field error manually
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: {
          isValid: false,
          errors: [error],
          firstError: error
        }
      },
      isValid: false
    }));
  }, []);

  /**
   * Set field touched state
   */
  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: touched
      }
    }));
  }, []);

  /**
   * Handle field blur with validation
   */
  const handleFieldBlur = useCallback(async (field: keyof T) => {
    setFieldTouched(field, true);

    if (validateOnBlur && validationRef.current) {
      const value = state.values[field];
      const fieldResult = await validateSingleField(field, value, state.values);

      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: fieldResult
        }
      }));
    }
  }, [state.values, validateOnBlur, setFieldTouched, validateSingleField]);

  /**
   * Set multiple values at once
   */
  const setValues = useCallback((values: Partial<T>) => {
    const newValues = { ...state.values, ...values };
    const isDirty = checkIsDirty(newValues);

    setState(prev => ({
      ...prev,
      values: newValues,
      isDirty
    }));
  }, [state.values, checkIsDirty]);

  /**
   * Set multiple errors at once
   */
  const setErrors = useCallback((errors: Record<string, string>) => {
    const errorResults: Record<string, ValidationResult> = {};

    for (const [field, message] of Object.entries(errors)) {
      errorResults[field] = {
        isValid: false,
        errors: [message],
        firstError: message
      };
    }

    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errorResults },
      isValid: false
    }));
  }, []);

  /**
   * Set multiple touched states at once
   */
  const setTouched = useCallback((touched: Record<string, boolean>) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, ...touched }
    }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setState({
      values: { ...initialValuesRef.current },
      errors: {},
      touched: {},
      isValid: false,
      isSubmitting: false,
      isSubmitted: false,
      isDirty: false
    });
  }, []);

  /**
   * Reset single field to initial value
   */
  const resetField = useCallback((field: keyof T) => {
    const initialValue = initialValuesRef.current[field];

    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: initialValue
      },
      errors: {
        ...prev.errors,
        [field]: { isValid: true, errors: [] }
      },
      touched: {
        ...prev.touched,
        [field]: false
      },
      isDirty: checkIsDirty({
        ...prev.values,
        [field]: initialValue
      })
    }));
  }, [checkIsDirty]);

  /**
   * Validate single field programmatically
   */
  const validateFieldProgrammatically = useCallback(async (field: keyof T): Promise<boolean> => {
    const value = state.values[field];
    const result = await validateSingleField(field, value, state.values);

    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: result
      }
    }));

    return result.isValid;
  }, [state.values, validateSingleField]);

  /**
   * Validate entire form programmatically
   */
  const validateFormProgrammatically = useCallback(async (): Promise<boolean> => {
    const result = await validateFormValues(state.values);

    setState(prev => ({
      ...prev,
      errors: result.errors,
      isValid: result.isValid
    }));

    onValidationChange?.(result.isValid, result.errors);

    return result.isValid;
  }, [state.values, validateFormValues, onValidationChange]);

  /**
   * Set submitting state
   */
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(state.values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setState(prev => ({
      ...prev,
      touched: allTouched,
      isSubmitted: true
    }));

    // Validate form
    const isValid = await validateFormProgrammatically();

    if (!isValid || !onSubmit) {
      return;
    }

    // Create form helpers
    const helpers: FormHelpers<T> = {
      setFieldValue,
      setFieldError,
      setFieldTouched,
      setValues,
      setErrors,
      setTouched,
      resetForm,
      resetField,
      validateField: validateFieldProgrammatically,
      validateForm: validateFormProgrammatically,
      setSubmitting
    };

    try {
      setSubmitting(true);
      await onSubmit(state.values, helpers);

      if (resetOnSubmit) {
        resetForm();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    state.values,
    validateFormProgrammatically,
    onSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    setTouched,
    resetForm,
    resetField,
    validateFieldProgrammatically,
    setSubmitting,
    resetOnSubmit
  ]);

  /**
   * Get field props for easy integration with inputs
   */
  const getFieldProps = useCallback((name: keyof T): FieldProps => {
    const field = name as string;
    const error = state.errors[field];
    const touched = state.touched[field];

    return {
      name: field,
      value: state.values[field] ?? '',
      onChange: (value: any) => setFieldValue(field, value),
      onBlur: () => handleFieldBlur(field),
      error: touched && error && !error.isValid ? error.firstError : undefined,
      touched: touched || false,
      disabled: state.isSubmitting
    };
  }, [state.values, state.errors, state.touched, state.isSubmitting, setFieldValue, handleFieldBlur]);

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback((field: keyof T): boolean => {
    const error = state.errors[field as string];
    const touched = state.touched[field as string];
    return !!(touched && error && !error.isValid);
  }, [state.errors, state.touched]);

  /**
   * Get field error message
   */
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const error = state.errors[field as string];
    const touched = state.touched[field as string];
    return touched && error && !error.isValid ? error.firstError : undefined;
  }, [state.errors, state.touched]);

  // Initial validation
  useEffect(() => {
    if (validateOnMount && validationRef.current) {
      validateFormProgrammatically();
    }
  }, [validateOnMount, validateFormProgrammatically]);

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    isSubmitted: state.isSubmitted,
    isDirty: state.isDirty,

    // Actions
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    setTouched,
    resetForm,
    resetField,
    validateField: validateFieldProgrammatically,
    validateForm: validateFormProgrammatically,
    setSubmitting,
    handleSubmit,

    // Utilities
    getFieldProps,
    hasFieldError,
    getFieldError
  };
}
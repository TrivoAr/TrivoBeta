'use client';

import React, { forwardRef, ReactNode, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BaseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Helper text shown below input
   */
  helperText?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Input size
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Input variant
   * @default "default"
   */
  variant?: "default" | "filled" | "outline";
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Icon to show on the left
   */
  leftIcon?: ReactNode;
  /**
   * Icon to show on the right
   */
  rightIcon?: ReactNode;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Whether to show character count
   */
  showCharacterCount?: boolean;
  /**
   * Container className
   */
  containerClassName?: string;
  /**
   * Label className
   */
  labelClassName?: string;
  /**
   * Whether label should be floating
   */
  floatingLabel?: boolean;
}

/**
 * BaseInput - A flexible, reusable input component
 *
 * Features:
 * - Multiple variants and sizes
 * - Label and helper text support
 * - Error state management
 * - Left/right icons
 * - Loading states
 * - Character count
 * - Floating labels
 * - Full accessibility
 *
 * @example
 * ```tsx
 * <BaseInput
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 *   error={emailError}
 *   leftIcon={<MailIcon />}
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      label,
      helperText,
      error,
      size = "default",
      variant = "default",
      required = false,
      leftIcon,
      rightIcon,
      loading = false,
      showCharacterCount = false,
      containerClassName,
      labelClassName,
      floatingLabel = false,
      className,
      maxLength,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasValue = value !== undefined && value !== null && value !== '';

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      default: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base"
    };

    // Variant classes
    const variantClasses = {
      default: "border border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500",
      filled: "border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500",
      outline: "border-2 border-gray-300 bg-transparent focus:border-blue-500"
    };

    // Error state classes
    const errorClasses = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "";

    // Floating label classes
    const floatingLabelClasses = floatingLabel
      ? "relative pt-6 pb-2"
      : "";

    const inputClasses = cn(
      // Base styles
      "w-full rounded-lg transition-colors duration-200",
      "focus:outline-none focus:ring-1",
      "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
      "placeholder:text-gray-400",
      // Size styles
      sizeClasses[size],
      // Variant styles
      variantClasses[variant],
      // Error styles
      errorClasses,
      // Floating label styles
      floatingLabelClasses,
      // Icon padding
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    const iconSizeClasses = {
      sm: "w-4 h-4",
      default: "w-5 h-5",
      lg: "w-6 h-6"
    };

    const iconPositionClasses = {
      sm: "top-2",
      default: "top-2.5",
      lg: "top-3.5"
    };

    const characterCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn("w-full", containerClassName)}>
        {/* Standard Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-gray-700 mb-1",
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className={cn(
              "absolute left-3 pointer-events-none text-gray-400",
              iconSizeClasses[size],
              floatingLabel ? "top-6" : iconPositionClasses[size]
            )}>
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            value={value}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` :
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Floating Label */}
          {label && floatingLabel && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-3 text-gray-400 transition-all duration-200 pointer-events-none",
                "transform origin-left",
                hasValue || props.placeholder
                  ? "top-1 text-xs scale-75"
                  : "top-4 text-sm scale-100",
                labelClassName
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {/* Right Icon / Loading / Character Count */}
          <div className={cn(
            "absolute right-3 flex items-center space-x-2",
            floatingLabel ? "top-6" : iconPositionClasses[size]
          )}>
            {loading && (
              <div className={cn(
                "border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin",
                iconSizeClasses[size]
              )} />
            )}

            {rightIcon && !loading && (
              <div className={cn("text-gray-400", iconSizeClasses[size])}>
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Helper Text / Error / Character Count */}
        <div className="mt-1 flex justify-between items-start">
          <div className="flex-1">
            {error ? (
              <p id={`${inputId}-error`} className="text-sm text-red-600">
                {error}
              </p>
            ) : helperText ? (
              <p id={`${inputId}-helper`} className="text-sm text-gray-500">
                {helperText}
              </p>
            ) : null}
          </div>

          {showCharacterCount && maxLength && (
            <p className={cn(
              "text-xs ml-2 flex-shrink-0",
              characterCount > maxLength * 0.9
                ? "text-red-500"
                : characterCount > maxLength * 0.7
                  ? "text-yellow-600"
                  : "text-gray-400"
            )}>
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

BaseInput.displayName = "BaseInput";

/**
 * Search Input - Specialized input for search functionality
 */
export interface SearchInputProps extends Omit<BaseInputProps, 'leftIcon' | 'type'> {
  /**
   * Search handler
   */
  onSearch?: (value: string) => void;
  /**
   * Clear handler
   */
  onClear?: () => void;
  /**
   * Whether to show clear button
   * @default true
   */
  showClearButton?: boolean;
  /**
   * Search delay in milliseconds
   * @default 300
   */
  searchDelay?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      onClear,
      showClearButton = true,
      searchDelay = 300,
      value,
      onChange,
      placeholder = "Search...",
      ...props
    },
    ref
  ) => {
    const [searchValue, setSearchValue] = React.useState(typeof value === 'string' ? value : '');
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Debounced search
    React.useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (onSearch && searchValue !== value) {
          onSearch(searchValue);
        }
      }, searchDelay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [searchValue, onSearch, searchDelay, value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);
      onChange?.(e);
    };

    const handleClear = () => {
      setSearchValue('');
      onClear?.();
      if (onChange) {
        const event = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const searchIcon = (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    );

    const clearIcon = showClearButton && searchValue ? (
      <button
        type="button"
        onClick={handleClear}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    ) : null;

    return (
      <BaseInput
        ref={ref}
        type="search"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={searchIcon}
        rightIcon={clearIcon}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";

/**
 * Textarea component with similar API to BaseInput
 */
export interface BaseTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "filled" | "outline";
  required?: boolean;
  showCharacterCount?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  autoResize?: boolean;
}

export const BaseTextarea = forwardRef<HTMLTextAreaElement, BaseTextareaProps>(
  (
    {
      label,
      helperText,
      error,
      size = "default",
      variant = "default",
      required = false,
      showCharacterCount = false,
      containerClassName,
      labelClassName,
      autoResize = false,
      className,
      maxLength,
      value,
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize]);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      default: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base"
    };

    const variantClasses = {
      default: "border border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500",
      filled: "border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500",
      outline: "border-2 border-gray-300 bg-transparent focus:border-blue-500"
    };

    const errorClasses = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "";

    const textareaClasses = cn(
      "w-full rounded-lg transition-colors duration-200 resize-none",
      "focus:outline-none focus:ring-1",
      "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
      "placeholder:text-gray-400",
      sizeClasses[size],
      variantClasses[variant],
      errorClasses,
      autoResize && "overflow-hidden",
      className
    );

    const characterCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "block text-sm font-medium text-gray-700 mb-1",
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={textareaRef}
          id={textareaId}
          className={textareaClasses}
          value={value}
          maxLength={maxLength}
          rows={autoResize ? 1 : rows}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` :
            helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />

        <div className="mt-1 flex justify-between items-start">
          <div className="flex-1">
            {error ? (
              <p id={`${textareaId}-error`} className="text-sm text-red-600">
                {error}
              </p>
            ) : helperText ? (
              <p id={`${textareaId}-helper`} className="text-sm text-gray-500">
                {helperText}
              </p>
            ) : null}
          </div>

          {showCharacterCount && maxLength && (
            <p className={cn(
              "text-xs ml-2 flex-shrink-0",
              characterCount > maxLength * 0.9
                ? "text-red-500"
                : characterCount > maxLength * 0.7
                  ? "text-yellow-600"
                  : "text-gray-400"
            )}>
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

BaseTextarea.displayName = "BaseTextarea";
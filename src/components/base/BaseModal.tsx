'use client';

import React, { useEffect, useRef, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface BaseModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should be closed
   */
  onClose: () => void;
  /**
   * Modal content
   */
  children: ReactNode;
  /**
   * Modal title
   */
  title?: string;
  /**
   * Modal description
   */
  description?: string;
  /**
   * Modal size
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "xl" | "full";
  /**
   * Whether to close on backdrop click
   * @default true
   */
  closeOnBackdrop?: boolean;
  /**
   * Whether to close on escape key
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Whether to show close button
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Whether to prevent body scroll when open
   * @default true
   */
  preventBodyScroll?: boolean;
  /**
   * Whether to focus trap within modal
   * @default true
   */
  focusTrap?: boolean;
  /**
   * Initial focus element selector
   */
  initialFocus?: string;
  /**
   * Additional CSS classes for modal container
   */
  className?: string;
  /**
   * Additional CSS classes for backdrop
   */
  backdropClassName?: string;
  /**
   * Custom header content (overrides title/description)
   */
  header?: ReactNode;
  /**
   * Footer content
   */
  footer?: ReactNode;
  /**
   * Animation variant
   * @default "scale"
   */
  animation?: "scale" | "slide" | "fade";
  /**
   * z-index value
   * @default 50
   */
  zIndex?: number;
}

/**
 * BaseModal - A flexible, accessible modal component
 *
 * Features:
 * - Portal rendering
 * - Keyboard navigation (Escape, Tab trap)
 * - Focus management
 * - Multiple size options
 * - Customizable animations
 * - Backdrop click handling
 * - Body scroll prevention
 * - Accessible by default
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   description="Are you sure you want to delete this item?"
 *   size="sm"
 *   footer={
 *     <div className="flex gap-2 justify-end">
 *       <button onClick={() => setIsOpen(false)}>Cancel</button>
 *       <button onClick={handleDelete}>Delete</button>
 *     </div>
 *   }
 * >
 *   <p>This action cannot be undone.</p>
 * </BaseModal>
 * ```
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "default",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventBodyScroll = true,
  focusTrap = true,
  initialFocus,
  className,
  backdropClassName,
  header,
  footer,
  animation = "scale",
  zIndex = 50
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]"
  };

  // Animation classes
  const animationClasses = {
    scale: {
      enter: "animate-in zoom-in-95 duration-200",
      exit: "animate-out zoom-out-95 duration-150"
    },
    slide: {
      enter: "animate-in slide-in-from-bottom-4 duration-200",
      exit: "animate-out slide-out-to-bottom-4 duration-150"
    },
    fade: {
      enter: "animate-in fade-in duration-200",
      exit: "animate-out fade-out duration-150"
    }
  };

  // Focus trap functionality
  const getTabbableElements = useCallback((element: HTMLElement): HTMLElement[] => {
    const tabbableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(element.querySelectorAll(tabbableSelectors));
  }, []);

  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (!focusTrap || !modalRef.current) return;

    const tabbableElements = getTabbableElements(modalRef.current);
    const firstElement = tabbableElements[0];
    const lastElement = tabbableElements[tabbableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, [focusTrap, getTabbableElements]);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
    if (e.key === 'Tab') {
      handleTabKey(e);
    }
  }, [closeOnEscape, onClose, handleTabKey]);

  // Backdrop click handler
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === backdropRef.current) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Set initial focus
      const focusElement = initialFocus
        ? modalRef.current?.querySelector(initialFocus)
        : modalRef.current?.querySelector('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])');

      if (focusElement) {
        (focusElement as HTMLElement).focus();
      } else {
        modalRef.current?.focus();
      }
    } else {
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen, initialFocus]);

  // Body scroll prevention
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={backdropRef}
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center p-4",
        `z-${zIndex}`,
        "animate-in fade-in duration-200",
        backdropClassName
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-auto",
          sizeClasses[size],
          animationClasses[animation].enter,
          className
        )}
        tabIndex={-1}
        role="document"
      >
        {/* Header */}
        {(header || title || description || showCloseButton) && (
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              {header ? (
                header
              ) : (
                <>
                  {title && (
                    <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" className="mt-1 text-sm text-gray-600">
                      {description}
                    </p>
                  )}
                </>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
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
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render in portal
  return createPortal(modalContent, document.body);
};

/**
 * Confirmation Modal
 * Pre-configured modal for confirmation dialogs
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false
}) => {
  const confirmButtonClasses = variant === "danger"
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors disabled:opacity-50",
              confirmButtonClasses
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <p className="text-gray-600">{message}</p>
    </BaseModal>
  );
};

/**
 * Hook for managing modal state
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
}
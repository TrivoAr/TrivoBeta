"use client";

import React, { useEffect, useRef, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Animation variants for different modal types
const modalVariants: Record<string, Variants> = {
  // Escala suave desde el centro
  scale: {
    initial: {
      scale: 0.8,
      opacity: 0,
      y: 20,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4,
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
      },
    },
  },

  // Desliza desde abajo
  slideUp: {
    initial: {
      y: "100%",
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      },
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      },
    },
  },

  // Desliza desde la derecha
  slideLeft: {
    initial: {
      x: "100%",
      opacity: 0,
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      },
    },
  },

  // Fade simple
  fade: {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const,
      },
    },
  },

  // Bounce divertido
  bounce: {
    initial: {
      scale: 0,
      rotate: -180,
      opacity: 0,
    },
    animate: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        duration: 0.6,
      },
    },
    exit: {
      scale: 0,
      rotate: 180,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      },
    },
  },
};

// Backdrop animations
const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export interface AnimatedModalProps {
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
   * Animation variant for the modal
   * @default "scale"
   */
  animationVariant?: keyof typeof modalVariants;
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
   * z-index value
   * @default 50
   */
  zIndex?: number;
  /**
   * Whether to use night theme
   * @default false
   */
  isNight?: boolean;
}

/**
 * AnimatedModal - Modal component with Framer Motion animations
 *
 * Provides smooth, spring-based animations for modal appearance/disappearance.
 * Includes all accessibility features like focus management, keyboard navigation, etc.
 *
 * Available animation variants:
 * - scale: Smooth scale animation from center (default)
 * - slideUp: Slides up from bottom
 * - slideLeft: Slides in from right
 * - fade: Simple fade in/out
 * - bounce: Playful bounce with rotation
 *
 * @example
 * ```tsx
 * <AnimatedModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Animated Modal"
 *   animationVariant="slideUp"
 * >
 *   <p>This modal slides up smoothly!</p>
 * </AnimatedModal>
 * ```
 */
export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "default",
  animationVariant = "scale",
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
  zIndex = 50,
  isNight = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const variants = modalVariants[animationVariant];

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  // Focus trap functionality
  const getTabbableElements = useCallback(
    (element: HTMLElement): HTMLElement[] => {
      const tabbableSelectors = [
        "button:not([disabled])",
        "input:not([disabled])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");

      return Array.from(element.querySelectorAll(tabbableSelectors));
    },
    []
  );

  const handleTabKey = useCallback(
    (e: KeyboardEvent) => {
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
    },
    [focusTrap, getTabbableElements]
  );

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
      if (e.key === "Tab") {
        handleTabKey(e);
      }
    },
    [closeOnEscape, onClose, handleTabKey]
  );

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === backdropRef.current) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose]
  );

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Set initial focus
      const focusElement = initialFocus
        ? modalRef.current?.querySelector(initialFocus)
        : modalRef.current?.querySelector(
            'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
          );

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
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={backdropRef}
          className={cn(
            "fixed inset-0 bg-black/50 flex items-center justify-center p-4",
            backdropClassName
          )}
          style={{ zIndex }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            ref={modalRef}
            className={cn(
              "rounded-xl shadow-xl w-full max-h-[90vh] overflow-auto bg-white dark:bg-gray-900",
              sizeClasses[size],
              className
            )}
            tabIndex={-1}
            role="document"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Header */}
            {(header || title || description || showCloseButton) && (
              <div className={cn(
                "flex items-start justify-between p-6 border-b",
                isNight ? "border-gray-600" : "border-border"
              )}>
                <div className="flex-1">
                  {header ? (
                    header
                  ) : (
                    <>
                      {title && (
                        <h2
                          id="modal-title"
                          className={cn(
                            "text-lg font-semibold",
                            isNight ? "theme-text-primary" : "text-foreground"
                          )}
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p
                          id="modal-description"
                          className={cn(
                            "mt-1 text-sm",
                            isNight ? "theme-text-secondary" : "text-muted-foreground"
                          )}
                        >
                          {description}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      "ml-4 p-2 transition-colors rounded-lg",
                      isNight
                        ? "theme-text-secondary hover:theme-text-primary hover:bg-gray-700"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
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
            <div className="p-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className={cn(
                "px-6 py-4 border-t rounded-b-xl",
                isNight
                  ? "border-gray-600 bg-gray-700"
                  : "border-border bg-muted"
              )}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render in portal (only on client-side)
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};

/**
 * Quick animated modal variants as separate components
 */
export const ScaleModal = (
  props: Omit<AnimatedModalProps, "animationVariant">
) => <AnimatedModal animationVariant="scale" {...props} />;

export const SlideUpModal = (
  props: Omit<AnimatedModalProps, "animationVariant">
) => <AnimatedModal animationVariant="slideUp" {...props} />;

export const SlideLeftModal = (
  props: Omit<AnimatedModalProps, "animationVariant">
) => <AnimatedModal animationVariant="slideLeft" {...props} />;

export const FadeModal = (
  props: Omit<AnimatedModalProps, "animationVariant">
) => <AnimatedModal animationVariant="fade" {...props} />;

export const BounceModal = (
  props: Omit<AnimatedModalProps, "animationVariant">
) => <AnimatedModal animationVariant="bounce" {...props} />;

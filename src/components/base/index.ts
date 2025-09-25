// Base component exports
export { BaseCard, CardGrid, CardSkeleton } from './BaseCard';
export type { BaseCardProps, CardGridProps } from './BaseCard';

export { BaseModal, ConfirmModal, useModal } from './BaseModal';
export type { BaseModalProps, ConfirmModalProps } from './BaseModal';

export { BaseButton, LinkButton, IconButton, ButtonGroup } from './BaseButton';
export type { BaseButtonProps, LinkButtonProps, IconButtonProps, ButtonGroupProps } from './BaseButton';

export { BaseInput, SearchInput, BaseTextarea } from './BaseInput';
export type { BaseInputProps, SearchInputProps, BaseTextareaProps } from './BaseInput';

// Common patterns and utilities
export const CommonVariants = {
  button: {
    primary: "primary" as const,
    secondary: "secondary" as const,
    danger: "danger" as const,
    success: "success" as const,
    warning: "warning" as const,
    ghost: "ghost" as const,
    outline: "outline" as const
  },
  size: {
    xs: "xs" as const,
    sm: "sm" as const,
    default: "default" as const,
    lg: "lg" as const,
    xl: "xl" as const
  },
  card: {
    default: "default" as const,
    bordered: "bordered" as const,
    elevated: "elevated" as const,
    flat: "flat" as const
  }
} as const;

// Common component composition patterns
export const ComponentPatterns = {
  /**
   * Form Field Pattern - Standardized form field layout
   */
  FormField: {
    // Input: BaseInput,
    // Textarea: BaseTextarea,
    // Button: BaseButton
  },

  /**
   * Card List Pattern - For displaying lists of cards
   */
  CardList: {
    // Container: CardGrid,
    // Item: BaseCard,
    // Skeleton: CardSkeleton
  },

  /**
   * Modal Pattern - Common modal configurations
   */
  Modal: {
    // Base: BaseModal,
    // Confirm: ConfirmModal
  }
} as const;
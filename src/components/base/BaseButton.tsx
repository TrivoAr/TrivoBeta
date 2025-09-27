"use client";

import React, { forwardRef, ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BaseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  /**
   * Button content
   */
  children: ReactNode;
  /**
   * Button variant
   * @default "default"
   */
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "ghost"
    | "outline";
  /**
   * Button size
   * @default "default"
   */
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  /**
   * Whether the button is in loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Loading text (shown when loading is true)
   */
  loadingText?: string;
  /**
   * Icon to show before text
   */
  leftIcon?: ReactNode;
  /**
   * Icon to show after text
   */
  rightIcon?: ReactNode;
  /**
   * Whether the button should take full width
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Custom loading spinner
   */
  loadingSpinner?: ReactNode;
  /**
   * Whether to show loading spinner on left or right
   * @default "left"
   */
  loadingPosition?: "left" | "right";
}

/**
 * BaseButton - A flexible, reusable button component
 *
 * Features:
 * - Multiple variants and sizes
 * - Loading states with customizable spinners
 * - Left/right icons
 * - Full width option
 * - Proper accessibility
 * - TypeScript support
 *
 * @example
 * ```tsx
 * <BaseButton
 *   variant="primary"
 *   size="lg"
 *   loading={isSubmitting}
 *   loadingText="Saving..."
 *   leftIcon={<SaveIcon />}
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </BaseButton>
 * ```
 */
export const BaseButton = forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    {
      children,
      variant = "default",
      size = "default",
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      loadingSpinner,
      loadingPosition = "left",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        "bg-background text-foreground border border-border hover:bg-muted focus:ring-ring",
      primary:
        "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 focus:ring-ring",
      secondary:
        "bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/80 focus:ring-ring",
      danger:
        "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 focus:ring-ring",
      success:
        "bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:ring-ring dark:bg-green-600 dark:hover:bg-green-700",
      warning:
        "bg-yellow-600 text-white border border-yellow-600 hover:bg-yellow-700 focus:ring-ring dark:bg-yellow-600 dark:hover:bg-yellow-700",
      ghost:
        "bg-transparent text-foreground border-none hover:bg-muted focus:ring-ring",
      outline:
        "bg-transparent text-primary border border-primary hover:bg-primary/5 focus:ring-ring",
    };

    const sizes = {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      default: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg",
    };

    const iconSizes = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      default: "w-4 h-4",
      lg: "w-5 h-5",
      xl: "w-6 h-6",
    };

    const defaultSpinner = (
      <div
        className={cn(
          "border-2 border-current border-t-transparent rounded-full animate-spin",
          iconSizes[size]
        )}
      />
    );

    const spinner = loadingSpinner || defaultSpinner;

    const buttonClasses = cn(
      // Base styles
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      // Variant styles
      variants[variant],
      // Size styles
      sizes[size],
      // Full width
      fullWidth && "w-full",
      // Loading state
      loading && "cursor-wait",
      className
    );

    const content = (
      <>
        {/* Left content */}
        {loading && loadingPosition === "left" ? (
          <span className="mr-2">{spinner}</span>
        ) : (
          leftIcon && (
            <span className={cn("mr-2", iconSizes[size])}>{leftIcon}</span>
          )
        )}

        {/* Button text */}
        <span>{loading && loadingText ? loadingText : children}</span>

        {/* Right content */}
        {loading && loadingPosition === "right" ? (
          <span className="ml-2">{spinner}</span>
        ) : (
          rightIcon && (
            <span className={cn("ml-2", iconSizes[size])}>{rightIcon}</span>
          )
        )}
      </>
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

BaseButton.displayName = "BaseButton";

/**
 * Link Button - Button that renders as a Next.js Link
 */
export interface LinkButtonProps
  extends Omit<BaseButtonProps, "onClick" | "type"> {
  /**
   * Next.js href
   */
  href: string;
  /**
   * Whether to replace the current URL
   */
  replace?: boolean;
  /**
   * Whether to scroll to top on navigation
   */
  scroll?: boolean;
  /**
   * Link target
   */
  target?: string;
  /**
   * External link (opens in new tab)
   */
  external?: boolean;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      href,
      external = false,
      replace = false,
      scroll = true,
      target,
      children,
      className,
      ...buttonProps
    },
    ref
  ) => {
    const linkTarget = external ? "_blank" : target;
    const linkRel = external ? "noopener noreferrer" : undefined;

    if (external || href.startsWith("http")) {
      const {
        variant = "default",
        size = "default",
        fullWidth = false,
        loading = false,
        disabled,
        ...restProps
      } = buttonProps;

      const variants = {
        default:
          "bg-background text-foreground border border-border hover:bg-muted focus:ring-ring",
        primary:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 focus:ring-ring",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/80 focus:ring-ring",
        danger:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 focus:ring-ring",
        success:
          "bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:ring-ring dark:bg-green-600 dark:hover:bg-green-700",
        warning:
          "bg-yellow-600 text-white border border-yellow-600 hover:bg-yellow-700 focus:ring-ring dark:bg-yellow-600 dark:hover:bg-yellow-700",
        ghost:
          "bg-transparent text-foreground border-none hover:bg-muted focus:ring-ring",
        outline:
          "bg-transparent text-primary border border-primary hover:bg-primary/5 focus:ring-ring",
      };

      const sizes = {
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg",
      };

      return (
        <a
          ref={ref}
          href={href}
          target={linkTarget}
          rel={linkRel}
          className={cn(
            "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
            variants[variant],
            sizes[size],
            fullWidth && "w-full",
            loading && "cursor-wait",
            className
          )}
          aria-disabled={disabled || loading}
        >
          {children}
        </a>
      );
    }

    const {
      variant = "default",
      size = "default",
      fullWidth = false,
      loading = false,
      disabled,
      ...restProps
    } = buttonProps;

    const variants = {
      default:
        "bg-background text-foreground border border-border hover:bg-muted focus:ring-ring",
      primary:
        "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 focus:ring-ring",
      secondary:
        "bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/80 focus:ring-ring",
      danger:
        "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 focus:ring-ring",
      success:
        "bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:ring-ring dark:bg-green-600 dark:hover:bg-green-700",
      warning:
        "bg-yellow-600 text-white border border-yellow-600 hover:bg-yellow-700 focus:ring-ring dark:bg-yellow-600 dark:hover:bg-yellow-700",
      ghost:
        "bg-transparent text-foreground border-none hover:bg-muted focus:ring-ring",
      outline:
        "bg-transparent text-primary border border-primary hover:bg-primary/5 focus:ring-ring",
    };

    const sizes = {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      default: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg",
    };

    return (
      <Link
        href={href}
        replace={replace}
        scroll={scroll}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          loading && "cursor-wait",
          className
        )}
        aria-disabled={disabled || loading}
      >
        {children}
      </Link>
    );
  }
);

LinkButton.displayName = "LinkButton";

/**
 * Icon Button - Button optimized for icons only
 */
export interface IconButtonProps
  extends Omit<BaseButtonProps, "children" | "leftIcon" | "rightIcon"> {
  /**
   * Icon content
   */
  icon: ReactNode;
  /**
   * Accessible label
   */
  "aria-label": string;
  /**
   * Whether the button should be round
   * @default false
   */
  round?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, round = false, size = "default", className, ...props }, ref) => {
    const iconSizes = {
      xs: "w-4 h-4",
      sm: "w-5 h-5",
      default: "w-6 h-6",
      lg: "w-7 h-7",
      xl: "w-8 h-8",
    };

    const buttonSizes = {
      xs: "p-1",
      sm: "p-1.5",
      default: "p-2",
      lg: "p-2.5",
      xl: "p-3",
    };

    return (
      <BaseButton
        ref={ref}
        className={cn(buttonSizes[size], round && "rounded-full", className)}
        {...props}
      >
        <span className={iconSizes[size]}>{icon}</span>
      </BaseButton>
    );
  }
);

IconButton.displayName = "IconButton";

/**
 * Button Group - Container for grouping related buttons
 */
export interface ButtonGroupProps {
  children: ReactNode;
  /**
   * Orientation of the button group
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Whether buttons should be attached
   * @default true
   */
  attached?: boolean;
  /**
   * Size for all buttons in the group
   */
  size?: BaseButtonProps["size"];
  /**
   * Variant for all buttons in the group
   */
  variant?: BaseButtonProps["variant"];
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = "horizontal",
  attached = true,
  size,
  variant,
  className,
}) => {
  const groupClasses = cn(
    "inline-flex",
    orientation === "vertical" ? "flex-col" : "flex-row",
    attached &&
      orientation === "horizontal" &&
      "[&>*:not(:first-child)]:ml-0 [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:rounded-l-none",
    attached &&
      orientation === "vertical" &&
      "[&>*:not(:first-child)]:mt-0 [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>*:not(:first-child)]:rounded-t-none",
    className
  );

  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === BaseButton) {
      return React.cloneElement(child as React.ReactElement<BaseButtonProps>, {
        size: size || child.props.size,
        variant: variant || child.props.variant,
      });
    }
    return child;
  });

  return (
    <div className={groupClasses} role="group">
      {enhancedChildren}
    </div>
  );
};

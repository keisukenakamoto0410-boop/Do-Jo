import React from "react";

export type CardVariant = "default" | "elevated" | "bordered";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export default function Card({
  variant = "default",
  className = "",
  children,
  header,
  footer,
  padding = "md",
  hover = false,
}: CardProps) {
  // Base styles
  const baseStyles = "bg-white rounded-lg overflow-hidden";

  // Variant styles
  const variantStyles: Record<CardVariant, string> = {
    default: "shadow-sm",
    elevated: "shadow-lg",
    bordered: "border border-gray-200",
  };

  // Padding styles for content area
  const paddingStyles: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Hover effect
  const hoverStyles = hover
    ? "transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
    : "";

  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`;

  return (
    <div className={combinedStyles}>
      {header && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * CardHeader Component
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3">
        {icon && <div className="text-2xl">{icon}</div>}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * CardFooter Component
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return <div className={`flex items-center justify-between ${className}`}>{children}</div>;
}

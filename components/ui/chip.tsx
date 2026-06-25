import React from "react";
import { X } from "lucide-react";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onRemove,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const variantStyles = {
    default: "bg-slate-100 text-slate-900",
    primary: "bg-blue-100 text-blue-900",
    success: "bg-green-100 text-green-900",
    warning: "bg-amber-100 text-amber-900",
    error: "bg-red-100 text-red-900",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} font-medium ${className}`}>
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-75 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Defaults to true to preserve existing full-width auth-form buttons. */
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[#1b976f] text-[#0B0B0B] hover:opacity-90",
  secondary:
    "border-2 border-[#2F2F2F] bg-transparent text-[#ffffff] hover:bg-[#232323]",
  ghost: "bg-transparent text-[#8B8F9B] hover:text-[#ffffff]",
  danger:
    "border border-[#3A2A2A] bg-[#1F1516] text-[#F2A0A0] hover:opacity-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "py-1.5 px-3 text-[0.8125rem] gap-1.5",
  md: "py-2.5 px-4 text-sm gap-2",
  lg: "py-3 px-6 text-base gap-2",
};

export function Button({
  isLoading = false,
  loadingText = "Loading",
  variant = "primary",
  size = "md",
  fullWidth = true,
  disabled,
  children,
  className = "",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`flex items-center justify-center rounded-md font-medium transition-opacity disabled:opacity-60 disabled:cursor-not-allowed ${
        fullWidth ? "w-full" : ""
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...buttonProps}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

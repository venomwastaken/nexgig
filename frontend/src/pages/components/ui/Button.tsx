import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export default function Button({
  isLoading = false,
  loadingText = "Loading",
  disabled,
  children,
  className = "",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center gap-2 rounded-md bg-[#1b976f] py-2.5 font-medium text-[#0B0B0B] transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
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
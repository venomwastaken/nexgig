import { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "error" | "success";
  className?: string;
}

/**
 * Matches the inline error box previously hand-written in both
 * SignupPage and LoginPage (`role="alert"` + red-tinted box).
 * Use variant="success" for confirmation messages (e.g. "Profile saved").
 */
export default function Alert({
  children,
  variant = "error",
  className = "",
}: AlertProps) {
  return (
    <div role="alert" className={`alert alert-${variant} ${className}`}>
      {children}
    </div>
  );
}

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "accent";
  className?: string;
}

/**
 * Small pill label. Useful anywhere NexGig shows a short tag —
 * a skill on a profile, a gig's category, or a status like "Active".
 */
export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>{children}</span>
  );
}

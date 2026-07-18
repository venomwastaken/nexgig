import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

/**
 * Page shell for auth screens.
 * - Outer div: the page background. Left neutral for now — swap the bg-*
 *   class here once the final page background is decided.
 * - Inner div: the actual brand card (#1b1b1b) that holds the logo + form.
 */
export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full bg-[#0B0B0B] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-[#1b1b1b] px-8 py-10 shadow-xl">
        {children}
      </div>
    </div>
  );
}
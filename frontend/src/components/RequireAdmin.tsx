import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";

/* Wraps a route so only admins can render it. Sits inside <RequireAuth>, so by the
 * time this runs we already know the user is signed in — this only adds the role
 * check on top, via GET /users/me.
 *
 * NOTE: `UserAccountWithProfile` (backend/app/schemas.py) doesn't currently expose
 * `is_admin` at all — only the DB model has it. Until the backend adds it to that
 * response (see backend/ADMIN_USERS_API_TODO.md), `isAdmin` below is always false and
 * this will redirect every admin away from /admin. That's a required backend change,
 * not a bug in this component.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const api = useApi();
  const [status, setStatus] = useState<"loading" | "admin" | "not-admin">("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ is_admin?: boolean }>("/users/me")
      .then((res) => {
        if (cancelled) return;
        setStatus(res.data.is_admin ? "admin" : "not-admin");
      })
      .catch(() => {
        if (!cancelled) setStatus("not-admin");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (status === "not-admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

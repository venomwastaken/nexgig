import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

/* This component
 * wraps a group of routes and:
 *  - renders nothing while Clerk is still figuring out the current session
 *    (isLoaded === false) so we don't flash the wrong screen
 *  - redirects to /login if there's no signed-in user, remembering where
 *    they were headed so we can send them back after they sign in
 *  - renders the protected page once we know the user is signed in
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();

    if (!isLoaded) {
        return null;
    }

    if (!isSignedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

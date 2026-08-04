import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useProfileStatus } from "@/hooks/useProfileStatus";

const ONBOARDING_PATH = "/onboarding/profile";

/**
 * Shared shell for every route rendered inside it.
 * <Outlet /> is where react-router injects whichever child route matched —
 * this is the react-router equivalent of Next.js's layout.tsx + {children}.
 *
 * Also gates the whole app on onboarding completion: a signed-in user
 * without a profile is bounced to the onboarding wizard from any page, and
 * a signed-in user who already has one is bounced away from the wizard.
 */
export default function Layout() {
    const { hasProfile, isLoading } = useProfileStatus();
    const location = useLocation();

    if (!isLoading && hasProfile === false && location.pathname !== ONBOARDING_PATH) {
        return <Navigate to={ONBOARDING_PATH} state={{ from: location }} replace />;
    }

    if (!isLoading && hasProfile === true && location.pathname === ONBOARDING_PATH) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#0B0B0B]">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/react";
import { useApi } from "@/hooks/useApi";

type ProfileStatus = {
    isLoading: boolean;
    hasProfile: boolean | null;
    markProfileComplete: () => void;
};

const ProfileStatusContext = createContext<ProfileStatus | null>(null);

/**
 * Tracks whether the signed-in user has finished onboarding (has a
 * UserProfile row) so Layout can gate routes on it. Lives above Layout so
 * OnboardingWizard can flip `hasProfile` the instant it finishes, instead of
 * Layout re-fetching /users/me and racing the redirect against a stale value.
 */
export function ProfileStatusProvider({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth();
    const api = useApi();
    const [isLoading, setIsLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setHasProfile(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        api
            .get("/users/me")
            .then((res) => {
                if (!cancelled) setHasProfile(Boolean(res.data?.profile));
            })
            .catch(() => {
                if (!cancelled) setHasProfile(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn]);

    const markProfileComplete = useCallback(() => setHasProfile(true), []);

    return (
        <ProfileStatusContext.Provider value={{ isLoading, hasProfile, markProfileComplete }}>
            {children}
        </ProfileStatusContext.Provider>
    );
}

export function useProfileStatus() {
    const ctx = useContext(ProfileStatusContext);
    if (!ctx) throw new Error("useProfileStatus must be used within a ProfileStatusProvider");
    return ctx;
}

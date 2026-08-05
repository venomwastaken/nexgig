import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import {
    getExtendedProfile,
    mapApiUserProfileToBaseProfile,
    type ApiUserProfile,
    type BaseProfile,
    type ExtendedProfile,
} from "@/lib/profile";

interface ApiMeResponse {
    user_id: string;
    email: string;
    profile: ApiUserProfile | null;
}

interface UseFreelancerProfileResult {
    userId: string | null;
    base: BaseProfile | null;
    /** `null` means the user has never saved a freelancer profile yet. */
    extended: ExtendedProfile | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Loads the two halves of a "freelancer profile": the real base identity
 * (name/username/avatar/bio/university, from `/users/me`) and the mock
 * extended data (skills/portfolio/contact/etc., from localStorage — see
 * frontend/src/lib/profile.ts). Shared by the `/profile` view page and the
 * `/profile/edit` form so both stay in sync on the same fetch logic.
 */
export function useFreelancerProfile(): UseFreelancerProfileResult {
    const api = useApi();
    const [userId, setUserId] = useState<string | null>(null);
    const [base, setBase] = useState<BaseProfile | null>(null);
    const [extended, setExtended] = useState<ExtendedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const meRes = await api.get<ApiMeResponse>("/users/me");
                if (cancelled) return;
                setUserId(meRes.data.user_id);
                setBase(meRes.data.profile ? mapApiUserProfileToBaseProfile(meRes.data.profile) : null);

                const ext = await getExtendedProfile(meRes.data.user_id);
                if (cancelled) return;
                setExtended(ext);
            } catch {
                if (!cancelled) setError("Failed to load your profile. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadToken]);

    const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

    return { userId, base, extended, loading, error, refetch };
}

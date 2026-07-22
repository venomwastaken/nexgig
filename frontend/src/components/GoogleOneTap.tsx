import { useClerk } from "@clerk/react";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

// Add google to Window to avoid type errors
declare global {
    interface Window {
        google: any;
    }
}

type GoogleOneTapContextValue = {
    startGoogleOneTap: () => void;
};

const GoogleOneTapContext = createContext<GoogleOneTapContextValue | null>(
    null,
);

export function useGoogleOneTap() {
    const context = useContext(GoogleOneTapContext);

    if (!context) {
        throw new Error(
            "useGoogleOneTap must be used within CustomGoogleOneTap",
        );
    }

    return context;
}

export function CustomGoogleOneTap({ children }: { children: ReactNode }) {
    const clerk = useClerk();
    const navigate = useNavigate();

    const call = useCallback(
        async (token: any) => {
            try {
                const res = await clerk.authenticateWithGoogleOneTap({
                    token,
                });

                await clerk.handleGoogleOneTapCallback(res, {
                    signInFallbackRedirectUrl: "/login",
                    signUpFallbackRedirectUrl: "/",
                });
            } catch (error) {
                navigate("/login");
            }
        },
        [clerk, navigate],
    );

    useEffect(() => {
        let script = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]',
        ) as HTMLScriptElement | null;

        if (!script) {
            script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        return () => {
            if (script && document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const startGoogleOneTap = useCallback(() => {
        const { google } = window;

        if (!google?.accounts?.id) {
            console.warn("Google One Tap is not available yet.");
            return;
        }

        google.accounts.id.initialize({
            client_id: "xxx-xxx-xxx",
            callback: async (response: any) => {
                await call(response.credential);
            },
        });

        google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
                console.warn(
                    "Google One Tap not displayed.",
                    notification.getNotDisplayedReason(),
                );
            } else if (notification.isSkippedMoment()) {
                console.warn(
                    "Google One Tap skipped.",
                    notification.getSkippedReason(),
                );
            } else if (notification.isDismissedMoment()) {
                console.warn(
                    "Google One Tap dismissed.",
                    notification.getDismissedReason(),
                );
            }
        });
    }, [call]);

    return (
        <GoogleOneTapContext.Provider value={{ startGoogleOneTap }}>
            {children}
        </GoogleOneTapContext.Provider>
    );
}

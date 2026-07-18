import { useState, FormEvent, ChangeEvent } from "react";
import { ArrowRight } from "lucide-react";
import TextField from "./ui/TextField";
import PasswordField from "./ui/PasswordField";
import Button from "./ui/Button";
import AuthCard from "./ui/AuthCard";

interface LoginFormState {
    email: string;
    password: string;
    keepSignedIn: boolean;
}

interface LoginPageProps {
    onSubmit?: (
        email: string,
        password: string,
        keepSignedIn: boolean,
    ) => Promise<void> | void;
    onNavigateToSignUp?: () => void;
}

const initialState: LoginFormState = {
    email: "",
    password: "",
    keepSignedIn: false,
};

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage({
    onSubmit,
    onNavigateToSignUp,
}: LoginPageProps) {
    const [form, setForm] = useState<LoginFormState>(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!form.email || !form.password) {
            setError("Enter your email and password to continue.");
            return;
        }
        if (!isValidEmail(form.email)) {
            setError("That email doesn't look right.");
            return;
        }

        try {
            setIsSubmitting(true);
            if (onSubmit) {
                await onSubmit(form.email, form.password, form.keepSignedIn);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Couldn't sign you in. Try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthCard>
            <div
                className="mb-10 text-2xl tracking-tight"
                style={{
                    fontFamily: "'Syne', ui-sans-serif, system-ui",
                    fontWeight: 700,
                }}
            >
                <span className="text-[#ffffff]">Nex</span>
                <span className="text-[#1b976f]">Gig</span>
            </div>

            <h1
                className="text-3xl font-semibold tracking-tight text-[#ffffff]"
                style={{
                    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui",
                }}
            >
                Sign in to keep building.
            </h1>
            <p className="mt-2 text-sm text-[#8B8F9B]">
                New gigs are posted every day. Don't miss yours.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
                {error && (
                    <div
                        role="alert"
                        className="rounded-md border border-[#3A2A2A] bg-[#1F1516] px-3 py-2 text-sm text-[#F2A0A0]"
                    >
                        {error}
                    </div>
                )}

                <TextField
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@knust.edu.gh"
                />

                <PasswordField
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                />

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-[#8B8F9B] cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="keepSignedIn"
                            checked={form.keepSignedIn}
                            onChange={handleChange}
                            className="h-4 w-4 rounded-sm border-[#2A2E38] bg-transparent accent-[#1b976f]"
                        />
                        Keep me signed in
                    </label>
                    <a
                        href="#"
                        className="text-[#8B8F9B] hover:text-[#1b976f] transition-colors"
                    >
                        Forgot password?
                    </a>
                </div>

                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Signing in"
                >
                    Sign in
                    <ArrowRight size={16} />
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#8B8F9B]">
                New here?{" "}
                <button
                    type="button"
                    onClick={onNavigateToSignUp}
                    className="text-[#1b976f] hover:underline underline-offset-4"
                >
                    Create an account
                </button>
            </p>
        </AuthCard>
    );
}

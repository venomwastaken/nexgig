"use client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import Button from "@/pages/ui/Button";
import PayoutAccountSection from "@/pages/components/account/PayoutAccountSection";

// ---------- Types (mirrors backend/app/schemas.py) ----------

type AccountStatus = "pending_verification" | "active" | "suspended" | "deactivated";

interface ProfileData {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
    bio?: string | null;
    created_at: string;
    updated_at: string;
}

interface WalletData {
    wallet_id: string;
    user_id: string;
    available_tokens: number | string;
    tokens_escrowed: number | string;
    total_services_provided: number;
    total_services_received: number;
}

interface AccountData {
    user_id: string;
    email: string;
    account_status: AccountStatus;
    created_at: string;
    profile: ProfileData | null;
    wallet: WalletData | null;
}

// ---------- Edit-profile form ----------
// Note: the backend's UserProfileUpdate schema doesn't accept dob, so it's
// intentionally left out of this form (unlike the onboarding ProfileForm).

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username is required"),
    bio: z.string().max(255, "Bio must be less than 255 characters").optional(),
    avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function statusLabel(status: AccountStatus) {
    switch (status) {
        case "active":
            return "Verified";
        case "pending_verification":
            return "Pending verification";
        case "suspended":
            return "Suspended";
        case "deactivated":
            return "Deactivated";
    }
}

function statusBadgeClass(status: AccountStatus) {
    switch (status) {
        case "active":
            return "badge badge-accent";
        case "pending_verification":
            return "badge badge-neutral";
        case "suspended":
        case "deactivated":
            return "badge alert-error";
    }
}

function formatTokens(value: number | string) {
    const n = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function AccountPage() {
    const api = useApi();
    const [account, setAccount] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            username: "",
            bio: "",
            avatarUrl: "",
        },
    });

    useEffect(() => {
        let cancelled = false;

        async function loadAccount() {
            try {
                const res = await api.get<AccountData>("/users/me");
                if (cancelled) return;
                setAccount(res.data);
                if (res.data.profile) {
                    form.reset({
                        firstName: res.data.profile.first_name,
                        lastName: res.data.profile.last_name,
                        username: res.data.profile.username,
                        bio: res.data.profile.bio ?? "",
                        avatarUrl: res.data.profile.avatar_url ?? "",
                    });
                }
            } catch (error) {
                if (cancelled) return;
                const message =
                    axios.isAxiosError(error) && error.response?.data?.detail
                        ? String(error.response.data.detail)
                        : "Failed to load your account. Please try again.";
                setLoadError(message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadAccount();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onSubmit(values: ProfileFormValues) {
        try {
            const payload = {
                first_name: values.firstName,
                last_name: values.lastName,
                username: values.username,
                bio: values.bio,
                avatar_url: values.avatarUrl,
            };
            const response = await api.patch<ProfileData>("/users/me/profile", payload);
            setAccount((prev) => (prev ? { ...prev, profile: response.data } : prev));
            toast.success("Profile updated successfully!");
        } catch (error) {
            const message =
                axios.isAxiosError(error) && error.response?.data?.detail
                    ? String(error.response.data.detail)
                    : "Failed to update your profile. Please try again.";
            toast.error(message);
        }
    }

    async function handleVerify() {
        setVerifying(true);
        try {
            const response = await api.post<{ account_status: AccountStatus }>(
                "/users/me/verify",
            );
            setAccount((prev) =>
                prev ? { ...prev, account_status: response.data.account_status } : prev,
            );
            toast.success("Your account is now verified!");
        } catch (error) {
            const message =
                axios.isAxiosError(error) && error.response?.data?.detail
                    ? String(error.response.data.detail)
                    : "Failed to verify your account. Please try again.";
            toast.error(message);
        } finally {
            setVerifying(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
        );
    }

    if (loadError || !account) {
        return (
            <div className="mx-auto my-10 max-w-3xl px-4">
                <div className="alert alert-error">
                    {loadError ?? "Something went wrong loading your account."}
                </div>
            </div>
        );
    }

    const canRequestVerification =
        account.account_status === "pending_verification" &&
        !!account.profile?.first_name &&
        !!account.profile?.last_name &&
        !!account.profile?.username;

    return (
        <div className="mx-auto my-10 flex max-w-3xl flex-col gap-8 px-4">
            {/* Account overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>{account.email}</CardDescription>
                        </div>
                        <span className={statusBadgeClass(account.account_status)}>
                            {statusLabel(account.account_status)}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Member since{" "}
                        {new Date(account.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>

                    {account.wallet && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-md bg-(--nex-surface-2) p-3">
                                <p className="text-label">Available</p>
                                <p className="text-lg font-semibold text-(--nex-text)">
                                    {formatTokens(account.wallet.available_tokens)}
                                </p>
                            </div>
                            <div className="rounded-md bg-(--nex-surface-2) p-3">
                                <p className="text-label">Escrowed</p>
                                <p className="text-lg font-semibold text-(--nex-text)">
                                    {formatTokens(account.wallet.tokens_escrowed)}
                                </p>
                            </div>
                            <div className="rounded-md bg-(--nex-surface-2) p-3">
                                <p className="text-label">Gigs provided</p>
                                <p className="text-lg font-semibold text-(--nex-text)">
                                    {account.wallet.total_services_provided}
                                </p>
                            </div>
                            <div className="rounded-md bg-(--nex-surface-2) p-3">
                                <p className="text-label">Gigs received</p>
                                <p className="text-lg font-semibold text-(--nex-text)">
                                    {account.wallet.total_services_received}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Verification */}
                    {account.account_status === "pending_verification" && (
                        <div className="alert flex items-center justify-between gap-4 border border-(--nex-border) bg-(--nex-surface-2)">
                            <div className="flex items-start gap-2">
                                <ShieldAlert
                                    size={18}
                                    className="mt-0.5 shrink-0 text-(--nex-text-muted)"
                                />
                                <p className="text-sm text-(--nex-text-muted)">
                                    {canRequestVerification
                                        ? "Your profile looks complete. Request verification to unlock full access."
                                        : "Fill out your name and username below before requesting verification."}
                                </p>
                            </div>
                            <Button
                                type="button"
                                className="w-auto shrink-0"
                                disabled={!canRequestVerification || verifying}
                                isLoading={verifying}
                                loadingText="Verifying"
                                onClick={handleVerify}
                            >
                                Request verification
                            </Button>
                        </div>
                    )}

                    {account.account_status === "active" && (
                        <div className="alert alert-success flex items-center gap-2">
                            <ShieldCheck size={18} />
                            <p className="text-sm">Your account is verified.</p>
                        </div>
                    )}

                    {(account.account_status === "suspended" ||
                        account.account_status === "deactivated") && (
                        <div className="alert alert-error">
                            Your account is {account.account_status}. Contact support to
                            resolve this.
                        </div>
                    )}
                </CardContent>
            </Card>

            <PayoutAccountSection />

            {/* Profile edit */}
            {account.profile ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            Update the details other students see on your gigs and
                            applications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                            id="account-profile-form"
                        >
                            <FieldGroup>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-6">
                                        <Controller
                                            name="firstName"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="firstName">
                                                        First Name
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id="firstName"
                                                        aria-invalid={fieldState.invalid}
                                                    />
                                                    {fieldState.error && (
                                                        <FieldError>
                                                            {fieldState.error.message}
                                                        </FieldError>
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        <Controller
                                            name="lastName"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="lastName">
                                                        Last Name
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id="lastName"
                                                        aria-invalid={fieldState.invalid}
                                                    />
                                                    {fieldState.error && (
                                                        <FieldError>
                                                            {fieldState.error.message}
                                                        </FieldError>
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>
                            </FieldGroup>

                            <FieldGroup>
                                <Controller
                                    name="username"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="username">
                                                Username
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="username"
                                                aria-invalid={fieldState.invalid}
                                            />
                                            {fieldState.error && (
                                                <FieldError>
                                                    {fieldState.error.message}
                                                </FieldError>
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="bio"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="bio">Bio</FieldLabel>
                                            <Textarea
                                                {...field}
                                                id="bio"
                                                aria-invalid={fieldState.invalid}
                                                className="min-h-30"
                                            />
                                            {fieldState.error && (
                                                <FieldError>
                                                    {fieldState.error.message}
                                                </FieldError>
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="avatarUrl"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="avatarUrl">
                                                Avatar URL
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="avatarUrl"
                                                aria-invalid={fieldState.invalid}
                                                placeholder="https://example.com/avatar.png"
                                            />
                                            <FieldDescription>
                                                Provide a link to your profile picture.
                                            </FieldDescription>
                                            {fieldState.error && (
                                                <FieldError>
                                                    {fieldState.error.message}
                                                </FieldError>
                                            )}
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            form="account-profile-form"
                            className="w-full sm:w-auto"
                            disabled={form.formState.isSubmitting}
                            isLoading={form.formState.isSubmitting}
                            loadingText="Saving"
                        >
                            Save changes
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Finish setting up your profile</CardTitle>
                        <CardDescription>
                            You haven&apos;t created a profile yet, so there&apos;s nothing
                            to edit here.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link to="/onboarding/profile">
                            <Button type="button" className="w-auto">
                                Create your profile
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

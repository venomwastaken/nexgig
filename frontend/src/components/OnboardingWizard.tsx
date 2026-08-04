"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronLeft,
    ImagePlus,
    Loader2,
    Pencil,
    XCircle,
} from "lucide-react";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Button from "@/pages/ui/Button";
import { useApi } from "@/hooks/useApi";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { cn } from "@/lib/utils";

// Matches the underline field treatment used across GigForm/ProfileForm so
// onboarding feels visually consistent with the rest of the app.
const labelClass =
    "font-mono text-[11px] font-normal uppercase tracking-widest text-[#8B8F9B] group-focus-within/field:text-[#1b976f]";
const fieldBorderClass = "border-[#2A2E38] bg-transparent";
const inputClass = `border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-[#1b976f] text-[#ffffff] placeholder:text-[#4A4E58] ${fieldBorderClass}`;

const BIO_MAX_LENGTH = 300;

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    dob: z.string().optional().default(""),
    avatarUrl: z.string().optional().default(""),
    bio: z
        .string()
        .max(BIO_MAX_LENGTH, `Keep your bio under ${BIO_MAX_LENGTH} characters`)
        .optional()
        .default(""),
    university: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

type StepId = "welcome" | "personal" | "details" | "review";

type Step = {
    id: StepId;
    label: string;
    fields: Path<FormValues>[];
};

const STEPS: Step[] = [
    { id: "welcome", label: "Welcome", fields: [] },
    { id: "personal", label: "Personal Info", fields: ["firstName", "lastName", "username"] },
    { id: "details", label: "Profile Details", fields: ["bio"] },
    { id: "review", label: "Review", fields: [] },
];

const DRAFT_KEY = "nexgig-onboarding-draft";

type Draft = { step: number; values: FormValues };

function loadDraft(): Draft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        return raw ? (JSON.parse(raw) as Draft) : null;
    } catch {
        return null;
    }
}

function saveDraft(step: number, values: FormValues) {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, values }));
    } catch {
        // Best-effort persistence — a full/unavailable localStorage shouldn't
        // block onboarding, it just means a refresh won't restore progress.
    }
}

function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // ignore
    }
}

function Stepper({
    currentStep,
    maxStepReached,
    onStepClick,
}: {
    currentStep: number;
    maxStepReached: number;
    onStepClick: (index: number) => void;
}) {
    return (
        <ol className="flex w-full items-center">
            {STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isReachable = index <= maxStepReached;

                return (
                    <li
                        key={step.id}
                        className={cn("flex items-center", index !== STEPS.length - 1 && "flex-1")}
                    >
                        <button
                            type="button"
                            onClick={() => isReachable && onStepClick(index)}
                            disabled={!isReachable}
                            aria-current={isCurrent ? "step" : undefined}
                            className={cn(
                                "group flex shrink-0 flex-col items-center gap-1.5",
                                isReachable ? "cursor-pointer" : "cursor-not-allowed",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                                    isCompleted && "border-[#1b976f] bg-[#1b976f] text-[#0B0B0B]",
                                    isCurrent && !isCompleted && "border-[#1b976f] text-[#1b976f]",
                                    !isCompleted && !isCurrent && "border-[#2A2E38] text-[#8B8F9B]",
                                    isReachable &&
                                        !isCurrent &&
                                        !isCompleted &&
                                        "group-hover:border-[#1b976f]/70 group-hover:text-[#ffffff]",
                                )}
                            >
                                {isCompleted ? <Check size={14} /> : index + 1}
                            </span>
                            <span
                                className={cn(
                                    "hidden font-mono text-[10px] uppercase tracking-widest sm:block",
                                    isCurrent ? "text-[#ffffff]" : "text-[#8B8F9B]",
                                )}
                            >
                                {step.label}
                            </span>
                        </button>
                        {index !== STEPS.length - 1 && (
                            <span
                                className={cn(
                                    "mx-2 h-px flex-1 transition-colors",
                                    isCompleted ? "bg-[#1b976f]" : "bg-[#2A2E38]",
                                )}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="w-40 shrink-0 text-sm text-[#8B8F9B]">{label}</span>
            <span className="whitespace-pre-wrap wrap-break-word text-sm text-[#ffffff]">
                {value || "—"}
            </span>
        </div>
    );
}

export default function OnboardingWizard() {
    const draft = useState<Draft | null>(() => loadDraft())[0];

    const form = useForm<FormValues, unknown, FormValues>({
        resolver: zodResolver(formSchema) as any,
        mode: "onChange",
        defaultValues: draft?.values ?? {
            firstName: "",
            lastName: "",
            username: "",
            dob: "",
            avatarUrl: "",
            bio: "",
            university: "",
        },
    });

    const api = useApi();
    const navigate = useNavigate();
    const { hasProfile, markProfileComplete } = useProfileStatus();

    const [currentStep, setCurrentStep] = useState(draft?.step ?? 0);
    const [maxStepReached, setMaxStepReached] = useState(draft?.step ?? 0);
    const [uploading, setUploading] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
        "idle",
    );

    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;
    const username = form.watch("username");
    const values = form.watch();

    // Already onboarded — nothing to do here, Layout will also catch this,
    // but guarding here covers a direct visit before Layout's redirect fires.
    useEffect(() => {
        if (hasProfile === true) {
            navigate("/", { replace: true });
        }
    }, [hasProfile, navigate]);

    // Persist form state + step on every change so a refresh mid-flow
    // restores progress instead of starting over.
    useEffect(() => {
        saveDraft(currentStep, values as FormValues);
    }, [currentStep, values]);

    // Live username-availability check, debounced.
    useEffect(() => {
        if (!username || username.length < 3) {
            setUsernameStatus("idle");
            return;
        }
        setUsernameStatus("checking");
        const handle = setTimeout(async () => {
            try {
                const { data } = await api.get("/users/username-available", {
                    params: { username },
                });
                setUsernameStatus(data.available ? "available" : "taken");
            } catch {
                setUsernameStatus("idle");
            }
        }, 400);
        return () => clearTimeout(handle);
    }, [username]);

    async function goNext() {
        const fields = STEPS[currentStep].fields;
        if (fields.length > 0) {
            const valid = await form.trigger(fields);
            if (!valid) return;
        }
        if (STEPS[currentStep].id === "personal" && usernameStatus !== "available") {
            if (usernameStatus === "taken") {
                form.setError("username", { message: "That username is already taken." });
            }
            return;
        }
        const next = Math.min(currentStep + 1, STEPS.length - 1);
        setCurrentStep(next);
        setMaxStepReached((m) => Math.max(m, next));
    }

    function goBack() {
        setCurrentStep((s) => Math.max(s - 1, 0));
    }

    function goToStep(index: number) {
        if (index <= maxStepReached) setCurrentStep(index);
    }

    async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are supported.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error("Images must be under 8MB.");
            return;
        }

        setUploading(true);
        try {
            const { data } = await api.post("/users/avatar-presign", {
                filename: file.name,
                content_type: file.type,
            });
            await fetch(data.upload_url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            form.setValue("avatarUrl", data.object_url, { shouldValidate: true, shouldDirty: true });
        } catch (error) {
            console.error("Avatar upload error", error);
            toast.error("Couldn't upload that image. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    async function onSubmit(data: FormValues) {
        try {
            await api.post("/users/me/profile", {
                first_name: data.firstName,
                last_name: data.lastName,
                username: data.username,
                dob: data.dob ? new Date(data.dob).toISOString() : undefined,
                avatar_url: data.avatarUrl || undefined,
                bio: data.bio || undefined,
                university: data.university || undefined,
            });

            clearDraft();
            markProfileComplete();
            toast.success("Profile set up! Welcome to NexGig.");
            navigate("/");
        } catch (error) {
            console.error("Onboarding submission error", error);

            const message =
                axios.isAxiosError(error) && error.response?.data?.detail
                    ? String(error.response.data.detail)
                    : "Failed to complete onboarding. Please try again.";

            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setUsernameStatus("taken");
                form.setError("username", { message: "That username is already taken." });
                goToStep(1);
            }

            toast.error(message);
        }
    }

    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
    }

    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const initials =
        `${values.firstName?.[0] ?? ""}${values.lastName?.[0] ?? ""}`.toUpperCase() || "?";
    const dobDisplay = values.dob
        ? new Date(values.dob).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "";

    return (
        <div className="card-surface w-full max-w-2xl mx-auto my-10 px-6 py-10 sm:px-8">
            <h1
                className="text-3xl font-semibold tracking-tight text-[#ffffff]"
                style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui" }}
            >
                Set up your profile
            </h1>
            <p className="mt-2 text-sm text-[#8B8F9B]">
                A few quick steps before you start using NexGig.
            </p>

            <div className="mt-8">
                <Stepper
                    currentStep={currentStep}
                    maxStepReached={maxStepReached}
                    onStepClick={goToStep}
                />
            </div>

            <form onSubmit={handleFormSubmit} className="mt-8" id="onboarding-form">
                {/* Step 1: Welcome */}
                <div className={cn("space-y-6", currentStep !== 0 && "hidden")}>
                    <div className="rounded-lg border border-[#2A2E38] p-6">
                        <h2 className="text-xl font-semibold text-[#ffffff]">Welcome to NexGig</h2>
                        <p className="mt-3 text-sm leading-relaxed text-[#8B8F9B]">
                            NexGig connects students who need help with gigs and students who can
                            provide it. Finishing your profile helps others know who they're working
                            with, and unlocks posting and taking gigs.
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[#8B8F9B]">
                            It only takes about two minutes. You'll add your name and username,
                            personalize your profile with a photo and bio, then review everything
                            before you're done.
                        </p>
                    </div>
                </div>

                {/* Step 2: Personal Information */}
                <div className={cn("space-y-6", currentStep !== 1 && "hidden")}>
                    <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Controller
                                name="firstName"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="firstName" className={labelClass}>
                                            First Name
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="firstName"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Ellis"
                                            className={inputClass}
                                        />
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="lastName"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="lastName" className={labelClass}>
                                            Last Name
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="lastName"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Greene"
                                            className={inputClass}
                                        />
                                        {fieldState.error && (
                                            <FieldError>{fieldState.error.message}</FieldError>
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        <Controller
                            name="username"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="username" className={labelClass}>
                                        Username
                                    </FieldLabel>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            id="username"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="ellis123"
                                            className={cn(inputClass, "pr-7")}
                                        />
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2">
                                            {usernameStatus === "checking" && (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin text-[#8B8F9B]"
                                                />
                                            )}
                                            {usernameStatus === "available" && (
                                                <CheckCircle2 size={16} className="text-[#1b976f]" />
                                            )}
                                            {usernameStatus === "taken" && (
                                                <XCircle size={16} className="text-[#E06666]" />
                                            )}
                                        </span>
                                    </div>
                                    {fieldState.error ? (
                                        <FieldError>{fieldState.error.message}</FieldError>
                                    ) : usernameStatus === "taken" ? (
                                        <FieldError>That username is already taken.</FieldError>
                                    ) : (
                                        <FieldDescription>
                                            This is how other students will find you.
                                        </FieldDescription>
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="dob"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="dob" className={labelClass}>
                                        Date of Birth{" "}
                                        <span className="normal-case text-[#4A4E58]">(optional)</span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        type="date"
                                        id="dob"
                                        aria-invalid={fieldState.invalid}
                                        className={inputClass}
                                    />
                                    {fieldState.error && (
                                        <FieldError>{fieldState.error.message}</FieldError>
                                    )}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </div>

                {/* Step 3: Profile Details */}
                <div className={cn("space-y-6", currentStep !== 2 && "hidden")}>
                    <FieldGroup>
                        <Controller
                            name="avatarUrl"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel className={labelClass}>Profile Picture</FieldLabel>
                                    <div className="flex items-center gap-4">
                                        <Avatar size="lg" className="size-20">
                                            {field.value ? (
                                                <AvatarImage src={field.value} alt="Avatar preview" />
                                            ) : null}
                                            <AvatarFallback>{initials}</AvatarFallback>
                                        </Avatar>
                                        <label
                                            htmlFor="avatar-upload"
                                            className={cn(
                                                "flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[#2A2E38] px-4 py-2.5 text-sm text-[#8B8F9B] transition-colors hover:border-[#1b976f] hover:text-[#ffffff]",
                                                uploading && "pointer-events-none opacity-60",
                                            )}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <ImagePlus size={16} />
                                                    {field.value ? "Change photo" : "Upload photo"}
                                                </>
                                            )}
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </div>
                                    <FieldDescription>PNG, JPG, WEBP or GIF up to 8MB.</FieldDescription>
                                </Field>
                            )}
                        />

                        <Controller
                            name="bio"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="bio" className={labelClass}>
                                        Bio <span className="normal-case text-[#4A4E58]">(optional)</span>
                                    </FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="bio"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="I am ..."
                                        maxLength={BIO_MAX_LENGTH}
                                        className={`min-h-30 ${inputClass}`}
                                    />
                                    <FieldDescription>
                                        {field.value?.length ?? 0}/{BIO_MAX_LENGTH}
                                    </FieldDescription>
                                    {fieldState.error && (
                                        <FieldError>{fieldState.error.message}</FieldError>
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="university"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="university" className={labelClass}>
                                        University{" "}
                                        <span className="normal-case text-[#4A4E58]">(optional)</span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="university"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="University of Ghana"
                                        className={inputClass}
                                    />
                                    {fieldState.error && (
                                        <FieldError>{fieldState.error.message}</FieldError>
                                    )}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </div>

                {/* Step 4: Review & Finish */}
                <div className={cn("space-y-6", currentStep !== 3 && "hidden")}>
                    <div className="rounded-lg border border-[#2A2E38] p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-mono text-[11px] font-normal uppercase tracking-widest text-[#8B8F9B]">
                                Your Profile
                            </h2>
                            <button
                                type="button"
                                onClick={() => goToStep(1)}
                                className="flex items-center gap-1 text-xs font-medium text-[#1b976f] transition-opacity hover:opacity-80"
                            >
                                <Pencil size={12} />
                                Edit
                            </button>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <Avatar size="lg" className="size-16">
                                {values.avatarUrl ? (
                                    <AvatarImage src={values.avatarUrl} alt="Avatar preview" />
                                ) : null}
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-base font-medium text-[#ffffff]">
                                    {fullName || "—"}
                                </p>
                                <p className="text-sm text-[#8B8F9B]">@{values.username || "—"}</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <ReviewRow label="Date of birth" value={dobDisplay} />
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#2A2E38] p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-mono text-[11px] font-normal uppercase tracking-widest text-[#8B8F9B]">
                                Profile Details
                            </h2>
                            <button
                                type="button"
                                onClick={() => goToStep(2)}
                                className="flex items-center gap-1 text-xs font-medium text-[#1b976f] transition-opacity hover:opacity-80"
                            >
                                <Pencil size={12} />
                                Edit
                            </button>
                        </div>
                        <div className="mt-3 space-y-2">
                            <ReviewRow label="Bio" value={values.bio} />
                            <ReviewRow label="University" value={values.university} />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-10 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={isFirstStep}
                        className="flex items-center gap-1.5 rounded-md border border-[#2A2E38] px-5 py-2.5 text-sm font-medium text-[#8B8F9B] transition-colors hover:border-[#3a3f4b] hover:text-[#ffffff] disabled:invisible"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    {isLastStep ? (
                        <Button
                            key="complete"
                            type="button"
                            onClick={() => void form.handleSubmit(onSubmit)()}
                            isLoading={form.formState.isSubmitting}
                            loadingText="Finishing up"
                            className="w-auto! px-8"
                        >
                            Complete Setup
                            <ArrowRight size={16} />
                        </Button>
                    ) : (
                        <Button key="next" type="button" onClick={goNext} className="w-auto! px-8">
                            {isFirstStep ? "Get Started" : "Next"}
                            <ArrowRight size={16} />
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}

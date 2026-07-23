import { useState } from "react";
import { ArrowRight } from "lucide-react";
import TextField from "./ui/TextField";
import PasswordField from "./ui/PasswordField";
import Button from "./ui/Button";
import AuthCard from "./ui/AuthCard";

import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldSeparator } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { useSignUp } from "@clerk/react";
import { CustomGoogleOneTap, useGoogleOneTap } from "@/components/GoogleOneTap";


const formSchema = z
    .object({
        email: z.string().email("Enter a valid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z
            .string()
            .min(8, "Confirm password must be at least 8 characters"),
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
        if (password !== confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Passwords do not match",
            });
        }
    });

function SignUpPageContent() {
    const [agreementChecked, setAgreementChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signUp } = useSignUp();
    const { startGoogleOneTap } = useGoogleOneTap();

    const signUpForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setError(null);

        if (!agreementChecked) {
            setError("Accept the terms to continue.");
            return;
        }

        try {
            const { error } = await signUp.password({
                emailAddress: data.email,
                password: data.password,
            });

            if (error) {
                throw new Error(error.message);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Couldn't create your account. Try again.",
            );
        }
    }

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
                Create your account.
            </h1>
            <p className="mt-2 text-sm text-[#8B8F9B]">
                Post gigs, take gigs, get paid. Free for students.
            </p>

            <form
                onSubmit={signUpForm.handleSubmit(onSubmit)}
                className="mt-8 space-y-6"
                noValidate
            >
                {error && (
                    <div
                        role="alert"
                        className="rounded-md border border-[#3A2A2A] bg-[#1F1516] px-3 py-2 text-sm text-[#F2A0A0]"
                    >
                        {error}
                    </div>
                )}

                <Field>
                    <Button
                        type="button"
                        className="border-2 border-[#2F2F2F] bg-transparent text-white"
                        onClick={startGoogleOneTap}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-6 h-6"
                        >
                            <path
                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        Continue with Google
                    </Button>
                </Field>
                <FieldSeparator className="my-4">
                    Or continue with
                </FieldSeparator>
                <Controller
                    name="email"
                    control={signUpForm.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <TextField
                                {...field}
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                type="email"
                                placeholder="john@gmail.com"
                                autoComplete="email"
                                label="Email"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="password"
                    control={signUpForm.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <PasswordField
                                {...field}
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                label="Password"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <Controller
                    name="confirmPassword"
                    control={signUpForm.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <PasswordField
                                {...field}
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                label="Confirm Password"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                <label className="mt-8 flex items-start gap-2 text-sm text-[#8B8F9B] cursor-pointer select-none">
                    <Checkbox
                        checked={agreementChecked}
                        onCheckedChange={setAgreementChecked}
                    />
                    <span>
                        I agree to NexGig's{" "}
                        <a
                            href="#"
                            className="text-[#1b976f] hover:underline underline-offset-4"
                        >
                            terms
                        </a>{" "}
                        and{" "}
                        <a
                            href="#"
                            className="text-[#1b976f] hover:underline underline-offset-4"
                        >
                            privacy policy
                        </a>
                        .
                    </span>
                </label>

                <Button
                    type="submit"
                    isLoading={signUpForm.formState.isSubmitting}
                    disabled={
                        signUpForm.formState.isSubmitting || !agreementChecked
                    }
                    loadingText="Creating account"
                >
                    Create account
                    <ArrowRight size={16} />
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#8B8F9B]">
                Already have an account?{" "}
                <button
                    type="button"
                    // onClick={onNavigateToLogin}
                    className="text-[#1b976f] hover:underline underline-offset-4"
                >
                    Sign in
                </button>
            </p>
        </AuthCard>
    );
}

export default function SignUpPage() {
    return (
        <CustomGoogleOneTap>
            <SignUpPageContent />
        </CustomGoogleOneTap>
    );
}

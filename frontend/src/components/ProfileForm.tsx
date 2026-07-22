"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import axios from "axios";
import { myId } from "@/lib/auth";

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    dob: z.coerce.date({ error: "Date of birth is required" }),
    username: z.string().min(1, "Username is required"),
    bio: z.string().max(255, "Bio must be less than 255 characters").optional(),
    avatar: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfileForm() {
    const [files, setFiles] = useState<File[] | null>(null);

    type FormOutputValues = z.infer<typeof formSchema>;
    type FormInputValues = z.input<typeof formSchema>;

    const form = useForm<FormInputValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            username: "",
            bio: "",
            avatar: "",
            // Provide a fallback value (either a string "YYYY-MM-DD" or null/empty string)
            // since a native date input works with string representations.
            dob: "",
        },
    });

    const api = useApi();

    async function onSubmit(values: FormInputValues) {
        try {
            const me = await api.get("/users/me");
            const meData = me.data as { user_id?: string | number };
            console.log("meData", meData)

            if (!meData.user_id) {
                throw new Error("No id found");
            }

            const data = {
                first_name: values.firstName,
                last_name: values.lastName,
                username: values.username,
                dob: values.dob,
                avatar_url: values.avatar,
                bio: values.bio,
                user_id: meData.user_id,
            };
            const response = await api.post("/users/me/profile", data);

            toast.success("Profile updated successfully!", {
                description: (
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
                        <code className="text-white">
                            {JSON.stringify(response.data, null, 2)}
                        </code>
                    </pre>
                ),
            });
        } catch (error) {
            console.error("Form submission error", error);

            const message =
                axios.isAxiosError(error) && error.response?.data?.detail
                    ? String(error.response.data.detail)
                    : "Failed to submit the form. Please try again.";

            toast.error(message);
        }
    }

    return (
        <Card className="w-full max-w-3xl mx-auto my-10">
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Tell us about yourself.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                    id="profile-form"
                >
                    <FieldGroup>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-6">
                                <Controller
                                    name="firstName"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="firstName">
                                                First Name
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="firstName"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Ellis"
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
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="lastName">
                                                Last Name
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="lastName"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Greene"
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

                        <div className="col-span-12">
                            <Controller
                                name="dob"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="dob">
                                            Date of birth
                                        </FieldLabel>
                                        <Input
                                            type="date"
                                            id="dob"
                                            aria-invalid={fieldState.invalid}
                                            value={
                                                field.value instanceof Date &&
                                                !isNaN(field.value.getTime())
                                                    ? field.value
                                                          .toISOString()
                                                          .substring(0, 10)
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value
                                                        ? new Date(
                                                              e.target.value,
                                                          )
                                                        : null,
                                                )
                                            }
                                            onBlur={field.onBlur}
                                            ref={field.ref}
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
                                        placeholder="ellis123"
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
                                        placeholder="I am ..."
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
                            name="avatar"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="avatar">
                                        Avatar URL
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="avatar"
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
                    form="profile-form"
                    className="w-full sm:w-auto"
                    disabled={form.formState.isSubmitting}
                >
                    Submit
                </Button>
            </CardFooter>
        </Card>
    );
}

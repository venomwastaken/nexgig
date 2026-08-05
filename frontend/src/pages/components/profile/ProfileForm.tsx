import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Save, X as CancelIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import {
    createOrUpdateBaseProfile,
    saveExtendedProfile,
    validateContact,
    YEAR_OF_STUDY_OPTIONS,
    type BaseProfileInput,
    type ContactInfo,
    type ExtendedProfile,
    type PortfolioItem,
} from "@/lib/profile";
import SkillsSection from "./SkillsSection";
import PortfolioSection from "./PortfolioSection";
import ContactSection from "./ContactSection";

const urlField = z.string().trim().url("Enter a valid URL").optional().or(z.literal(""));

const profileFormSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    username: z.string().trim().min(1, "Username is required"),
    avatarUrl: urlField,
    professionalTitle: z.string().trim().max(80, "Keep it under 80 characters").optional(),
    bio: z.string().trim().max(500, "Bio must be 500 characters or fewer").optional(),
    university: z.string().trim().optional(),
    department: z.string().trim().optional(),
    yearOfStudy: z.string().optional(),
    location: z.string().trim().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
    userId: string;
    initialBase: BaseProfileInput;
    initialExtended: ExtendedProfile;
    onCancel: () => void;
    onSaved: () => void;
}

const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export default function ProfileForm({
    userId,
    initialBase,
    initialExtended,
    onCancel,
    onSaved,
}: ProfileFormProps) {
    const api = useApi();
    const [skills, setSkills] = useState<string[]>(initialExtended.skills);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialExtended.portfolio);
    const [contact, setContact] = useState<ContactInfo>(initialExtended.contact);
    const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({});

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: initialBase.firstName,
            lastName: initialBase.lastName,
            username: initialBase.username,
            avatarUrl: initialBase.avatarUrl ?? "",
            professionalTitle: initialExtended.professionalTitle,
            bio: initialBase.bio ?? "",
            university: initialBase.university ?? "",
            department: initialExtended.department,
            yearOfStudy: initialExtended.yearOfStudy,
            location: initialExtended.location,
        },
    });

    async function onSubmit(values: ProfileFormValues) {
        const nextContactErrors = validateContact(contact);
        if (Object.keys(nextContactErrors).length > 0) {
            setContactErrors(nextContactErrors);
            toast.error("Fix the highlighted contact fields before saving.");
            return;
        }
        setContactErrors({});

        try {
            await createOrUpdateBaseProfile(api, {
                firstName: values.firstName,
                lastName: values.lastName,
                username: values.username,
                avatarUrl: values.avatarUrl,
                bio: values.bio,
                university: values.university,
            });

            await saveExtendedProfile(userId, {
                professionalTitle: values.professionalTitle ?? "",
                department: values.department ?? "",
                yearOfStudy: values.yearOfStudy ?? "",
                location: values.location ?? "",
                skills,
                portfolio,
                contact,
            });

            toast.success("Profile saved successfully.");
            onSaved();
        } catch (error) {
            const message =
                axios.isAxiosError(error) && error.response?.data?.detail
                    ? String(error.response.data.detail)
                    : "Failed to save your profile. Please try again.";
            toast.error(message);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
            <Card>
                <CardHeader>
                    <CardTitle>Personal information</CardTitle>
                    <CardDescription>How you introduce yourself to the NexGiG community.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="firstName"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>First name</FieldLabel>
                                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="lastName"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="username"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="professionalTitle"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Professional title</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Frontend Developer"
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>

                    <Controller
                        name="avatarUrl"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Avatar URL</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="https://…"
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="bio"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Short bio</FieldLabel>
                                <Textarea
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Tell people what you do and what you're looking for."
                                    className="min-h-24"
                                />
                                {fieldState.invalid ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        {(field.value ?? "").length}/500 characters
                                    </p>
                                )}
                            </Field>
                        )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="university"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>University</FieldLabel>
                                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="department"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="yearOfStudy"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Year of study</FieldLabel>
                                    <select
                                        {...field}
                                        id={field.name}
                                        className={selectClassName}
                                    >
                                        <option value="">Select…</option>
                                        {YEAR_OF_STUDY_OPTIONS.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            )}
                        />
                        <Controller
                            name="location"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Location</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Campus, city"
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>Add the skills you want to offer gigs for.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SkillsSection skills={skills} editable onChange={setSkills} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                    <CardDescription>Showcase projects that demonstrate your skills.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PortfolioSection items={portfolio} editable onChange={setPortfolio} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact information</CardTitle>
                    <CardDescription>How people can reach you outside of NexGiG messages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactSection
                        contact={contact}
                        editable
                        onChange={(next) => {
                            setContact(next);
                            setContactErrors({});
                        }}
                        errors={contactErrors}
                    />
                </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <CancelIcon size={14} />
                    Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    Save profile
                </Button>
            </div>
        </form>
    );
}

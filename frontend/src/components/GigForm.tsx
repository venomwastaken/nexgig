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

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";

// Updated Schema to handle inputs arriving from standard web forms
const formSchema = z.object({
    title: z.string().min(2, "Title is required"),
    description: z.string().min(20, "Provide a description"),
    // Using preprocess explicitly tells TypeScript what to expect, avoiding the 'unknown' error
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
    tags: z.string().min(1, "Add at least one tag"),
});

type FormValues = z.infer<typeof formSchema>;

export default function GigForm() {
    const form = useForm<FormValues, unknown, FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: { title: "", description: "", price: 0, tags: "" },
    });

    const api = useApi();

    async function onSubmit(data: FormValues) {
        try {
            const finalPayload = {
                ...data,
                tags: data.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            };

            console.log("Transformed payload for API:", finalPayload);
            const res  = await api.post("/gigs", finalPayload);
            
            toast.success("Gig updated successfully!");
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
                <CardTitle>Create A Gig</CardTitle>
                <CardDescription>What is this gig about.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                    id="profile-form"
                >
                    <FieldGroup>
                        <Controller
                            name="title"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="title">
                                        Title
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="title"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Face Painting For Adults"
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
                            name="description"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="description">
                                        Description
                                    </FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="description"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="I will professionally paint your face. A cat? A dog? Transformers? Hit me up"
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
                            name="price"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="price">
                                        Price
                                    </FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <InputGroupText>₵</InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            id="price"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>GHS</InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    {fieldState.error && (
                                        <FieldError>
                                            {fieldState.error.message}
                                        </FieldError>
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="tags"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="tags">Tags</FieldLabel>
                                    <Input
                                        {...field}
                                        id="tags"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="design, entertainment, party"
                                    />
                                    <FieldDescription>
                                        Separate tags with commas.
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

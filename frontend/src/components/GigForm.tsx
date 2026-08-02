"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Button from "@/pages/ui/Button";
import { useApi } from "@/hooks/useApi";
import axios from "axios";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "./ui/combobox";
import { KeyboardEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/gigs";

// Matches the underline field treatment from TextField/PasswordField on the
// login and signup pages, applied here to shadcn's Input/Textarea.
const labelClass =
    "font-mono text-[11px] font-normal uppercase tracking-widest text-[#8B8F9B] group-focus-within/field:text-[#1b976f]";
const fieldBorderClass = "border-[#2A2E38] bg-transparent";
const inputClass = `border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-[#1b976f] text-[#ffffff] placeholder:text-[#4A4E58] ${fieldBorderClass}`;

// Updated Schema to handle inputs arriving from standard web forms
const formSchema = z.object({
    title: z.string().min(2, "Title is required"),
    category: z.string().min(2, "Title is required"),
    description: z
        .string()
        .min(20, "Provide a description longer than 20 characters"),
    // Using preprocess explicitly tells TypeScript what to expect, avoiding the 'unknown' error
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
});

type FormValues = z.infer<typeof formSchema>;

export default function GigForm() {
    const form = useForm<FormValues, unknown, FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            category: "",
            price: 0,
            tags: [],
        },
    });

    const api = useApi();

    async function onSubmit(data: FormValues) {
        try {
            const finalPayload = {
                ...data,
                tags: data.tags.map((t) => t.trim()).filter(Boolean),
            };

            console.log("Transformed payload for API:", finalPayload);
            const res = await api.post("/gigs", finalPayload);

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
        <div className="card-surface w-full max-w-2xl mx-auto my-10 px-8 py-10">
            <h1
                className="text-3xl font-semibold tracking-tight text-[#ffffff]"
                style={{
                    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui",
                }}
            >
                Create a gig
            </h1>
            <p className="mt-2 text-sm text-[#8B8F9B]">
                Tell buyers what you're offering.
            </p>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-8 space-y-6"
                id="gig-form"
            >
                <FieldGroup>
                    <Controller
                        name="title"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel
                                    htmlFor="title"
                                    className={labelClass}
                                >
                                    Title
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id="title"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Face Painting For Adults"
                                    className={inputClass}
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
                        name="category"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel
                                    htmlFor="category"
                                    className={labelClass}
                                >
                                    Category
                                </FieldLabel>
                                <Combobox
                                    items={CATEGORIES}
                                    value={CATEGORIES.find(
                                        (category) =>
                                            category.value === field.value,
                                    )}
                                    onValueChange={(category) =>
                                        field.onChange(category?.value ?? "")
                                    }
                                >
                                    <ComboboxInput
                                        placeholder="Select a category"
                                        className={fieldBorderClass}
                                    />
                                    <ComboboxContent>
                                        <ComboboxEmpty>
                                            No items found.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(category) => (
                                                <ComboboxItem
                                                    key={category.value}
                                                    value={category}
                                                >
                                                    {category.label}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
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
                                <FieldLabel
                                    htmlFor="description"
                                    className={labelClass}
                                >
                                    Description
                                </FieldLabel>
                                <Textarea
                                    {...field}
                                    id="description"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="I will professionally paint your face. A cat? A dog? Transformers? Hit me up"
                                    className={`min-h-30 ${inputClass}`}
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
                                <FieldLabel
                                    htmlFor="price"
                                    className={labelClass}
                                >
                                    Price
                                </FieldLabel>
                                <InputGroup className={fieldBorderClass}>
                                    <InputGroupAddon>
                                        <InputGroupText>₵</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        id="price"
                                        aria-invalid={fieldState.invalid}
                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        render={({ field, fieldState }) => {
                            const tags = field.value ?? [];

                            const [inputValue, setInputValue] = useState("");

                            // Handle adding a tag on Comma or Enter
                            const handleKeyDown = (
                                e: KeyboardEvent<HTMLInputElement>,
                            ) => {
                                if (e.key === "," || e.key === "Enter") {
                                    e.preventDefault();
                                    const newTag = inputValue
                                        .trim()
                                        .replace(/,$/, ""); // remove trailing comma

                                    if (newTag && !tags.includes(newTag)) {
                                        field.onChange([...tags, newTag]);
                                    }
                                    setInputValue("");
                                }
                            };

                            const removeTag = (tagToRemove: string) => {
                                field.onChange(
                                    tags.filter((tag) => tag !== tagToRemove),
                                );
                            };

                            return (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel
                                        htmlFor="tags-input"
                                        className={labelClass}
                                    >
                                        Tags
                                    </FieldLabel>

                                    {/* Visual container mimicking the underline input treatment */}
                                    <div
                                        className={cn(
                                            inputClass,
                                            "flex min-h-10.5 flex-wrap items-center gap-2 p-2 focus-within:border-[#1b976f]",
                                        )}
                                    >
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="flex items-center gap-1 rounded-full border border-[#2A2E38] bg-[#232323] py-1 pr-1 pl-2.5 text-sm text-[#ffffff]"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeTag(tag)
                                                    }
                                                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#8B8F9B] transition-colors hover:bg-[#2f2f2f] hover:text-[#ffffff]"
                                                    aria-label={`Remove ${tag}`}
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}

                                        <input
                                            id="tags-input"
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) =>
                                                setInputValue(e.target.value)
                                            }
                                            onKeyDown={handleKeyDown}
                                            aria-invalid={fieldState.invalid}
                                            placeholder={
                                                tags.length === 0
                                                    ? "design, entertainment, party"
                                                    : ""
                                            }
                                            className="min-w-30 flex-1 border-none bg-transparent p-0 text-sm text-[#ffffff] placeholder:text-[#4A4E58] outline-none focus:ring-0"
                                        />
                                    </div>

                                    <FieldDescription>
                                        Press enter or comma to add a tag.
                                    </FieldDescription>

                                    {fieldState.error && (
                                        <FieldError>
                                            {fieldState.error.message}
                                        </FieldError>
                                    )}
                                </Field>
                            );
                        }}
                    />
                </FieldGroup>

                <Button
                    type="submit"
                    form="gig-form"
                    isLoading={form.formState.isSubmitting}
                    loadingText="Submitting"
                >
                    Submit
                    <ArrowRight size={16} />
                </Button>
            </form>
        </div>
    );
}

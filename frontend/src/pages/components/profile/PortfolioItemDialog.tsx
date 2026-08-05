import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { makePortfolioItemId, type PortfolioItem } from "@/lib/profile";

const urlField = z
    .string()
    .trim()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal(""));

const portfolioItemSchema = z.object({
    title: z.string().trim().min(1, "Project title is required"),
    description: z
        .string()
        .trim()
        .min(1, "Project description is required")
        .max(600, "Keep it under 600 characters"),
    technologies: z.string().trim().min(1, "List at least one technology, comma-separated"),
    imageUrl: urlField,
    githubUrl: urlField,
    demoUrl: urlField,
});

type PortfolioItemFormValues = z.infer<typeof portfolioItemSchema>;

function itemToFormValues(item?: PortfolioItem | null): PortfolioItemFormValues {
    return {
        title: item?.title ?? "",
        description: item?.description ?? "",
        technologies: item?.technologies.join(", ") ?? "",
        imageUrl: item?.imageUrl ?? "",
        githubUrl: item?.githubUrl ?? "",
        demoUrl: item?.demoUrl ?? "",
    };
}

interface PortfolioItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pass an existing item to edit it; omit/null to add a new one. */
    item?: PortfolioItem | null;
    /** Titles of the user's other portfolio items, for duplicate-name validation. */
    existingTitles: string[];
    onSave: (item: PortfolioItem) => void;
}

export default function PortfolioItemDialog({
    open,
    onOpenChange,
    item,
    existingTitles,
    onSave,
}: PortfolioItemDialogProps) {
    const isEditing = !!item;

    const form = useForm<PortfolioItemFormValues>({
        resolver: zodResolver(portfolioItemSchema),
        defaultValues: itemToFormValues(item),
    });

    // Re-seed the form whenever a different item is opened for editing (or the
    // dialog re-opens in "add" mode) — Dialog keeps this component mounted.
    useEffect(() => {
        if (open) form.reset(itemToFormValues(item));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item]);

    function onSubmit(values: PortfolioItemFormValues) {
        const normalizedTitle = values.title.trim().toLowerCase();
        const isDuplicate = existingTitles.some((t) => t.trim().toLowerCase() === normalizedTitle);
        if (isDuplicate) {
            form.setError("title", {
                message: "You already have a portfolio item with this title",
            });
            return;
        }

        const technologies = values.technologies
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        onSave({
            id: item?.id ?? makePortfolioItemId(),
            title: values.title.trim(),
            description: values.description.trim(),
            technologies,
            imageUrl: values.imageUrl || undefined,
            githubUrl: values.githubUrl || undefined,
            demoUrl: values.demoUrl || undefined,
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit portfolio item" : "Add portfolio item"}</DialogTitle>
                    <DialogDescription>
                        Showcase a project you&apos;ve worked on, with links so people can see it in
                        action.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="portfolio-item-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                    noValidate
                >
                    <Controller
                        name="title"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Project title</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Campus Marketplace App"
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="description"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Project description</FieldLabel>
                                <Textarea
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="What the project does, your role, and the outcome."
                                    className="min-h-24"
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="technologies"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Technologies used</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    aria-invalid={fieldState.invalid}
                                    placeholder="React, TypeScript, FastAPI"
                                />
                                {fieldState.invalid ? (
                                    <FieldError errors={[fieldState.error]} />
                                ) : (
                                    <p className="text-xs text-muted-foreground">Comma-separated.</p>
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="imageUrl"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Project image URL</FieldLabel>
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="githubUrl"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>GitHub repository</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="https://github.com/…"
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="demoUrl"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Live demo link</FieldLabel>
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
                    </div>
                </form>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="portfolio-item-form">
                        {isEditing ? "Save changes" : "Add item"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

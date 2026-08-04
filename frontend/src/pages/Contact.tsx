import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const GREEN = "#1b976f";

const contactFormSchema = z.object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email address"),
    subject: z.string().trim().min(3, "Subject must be at least 3 characters"),
    message: z
        .string()
        .trim()
        .min(20, "Message must be at least 20 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

type InfoCard = {
    icon: React.ComponentType<{
        size?: number;
        className?: string;
        style?: React.CSSProperties;
    }>;
    label: string;
    value: string;
};

const infoCards: InfoCard[] = [
    { icon: Mail, label: "Email", value: "support@nexgig.app" },
    { icon: Phone, label: "Phone", value: "+1 (555) 012-3456" },
    { icon: Clock, label: "Office Hours", value: "Mon–Fri, 9am–5pm" },
    { icon: MapPin, label: "Location", value: "Student Union, Room 214" },
];

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        mode: "onChange",
        defaultValues: { name: "", email: "", subject: "", message: "" },
    });

    async function onSubmit(_values: ContactFormValues) {
        // Frontend-only: no backend endpoint exists yet, so we simulate the
        // round trip and show a success state instead of firing a request.
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSubmitted(true);
        toast.success("Message sent — we'll get back to you soon.");
        form.reset();
    }

    return (
        <div className="min-h-screen bg-[#1b1b1b] text-white">
            <main className="mx-auto max-w-5xl px-5 py-16 md:px-12 md:py-24">
                <header className="max-w-xl">
                    <span className="text-label">Contact</span>
                    <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                        Get in <span style={{ color: GREEN }}>touch</span>
                    </h1>
                    <p className="mt-6 text-sm leading-relaxed text-[#9a9a9a]">
                        Questions about a gig, your account, or NexGiG in
                        general? Send us a message and our team will get back
                        to you.
                    </p>
                </header>

                {/* Contact info cards */}
                <section className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {infoCards.map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="flex flex-col gap-3 rounded-lg border border-white/8 bg-[#232323] p-6"
                        >
                            <div
                                className="grid h-10 w-10 place-items-center rounded-full"
                                style={{
                                    backgroundColor: "rgba(27,151,111,0.14)",
                                }}
                            >
                                <Icon size={18} style={{ color: GREEN }} />
                            </div>
                            <div>
                                <p className="text-label mb-1">{label}</p>
                                <p className="text-sm font-medium text-white">
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="mt-16 grid gap-8 lg:grid-cols-[3fr_2fr]">
                    {/* Contact form */}
                    <div className="rounded-lg border border-white/8 bg-[#232323] p-6 md:p-8">
                        <h2 className="text-xl font-semibold tracking-tight">
                            Send us a message
                        </h2>
                        <p className="mt-2 text-sm text-[#9a9a9a]">
                            Fill out the form below and we&apos;ll reply to
                            the email you provide.
                        </p>

                        {submitted && (
                            <div
                                role="status"
                                className="mt-6 rounded-md border border-[#234a3a] bg-[#12231c] px-4 py-3 text-sm text-[#7fd8b0]"
                            >
                                Thanks for reaching out — your message has
                                been sent. We typically reply within one
                                business day.
                            </div>
                        )}

                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="mt-6 flex flex-col gap-5"
                            noValidate
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Controller
                                    name="name"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>
                                                Name
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={fieldState.invalid}
                                                placeholder="Jane Student"
                                                autoComplete="name"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>
                                                Email
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id={field.name}
                                                type="email"
                                                aria-invalid={fieldState.invalid}
                                                placeholder="jane@university.edu"
                                                autoComplete="email"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>

                            <Controller
                                name="subject"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Subject
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                            placeholder="How can we help?"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="message"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Message
                                        </FieldLabel>
                                        <Textarea
                                            {...field}
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Tell us a bit about your question..."
                                            className="min-h-32"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                disabled={form.formState.isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Sending
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Send message
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Map placeholder */}
                    <div className="flex flex-col gap-5">
                        <div
                            role="img"
                            aria-label="Map showing NexGiG's campus office location"
                            className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-white/8 bg-[#1f2b26] text-center lg:h-full"
                        >
                            <MapPin size={28} style={{ color: GREEN }} />
                            <p className="text-sm font-medium text-white">
                                Student Union, Room 214
                            </p>
                            <p className="max-w-50 text-xs text-[#9a9a9a]">
                                Interactive map embed placeholder
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

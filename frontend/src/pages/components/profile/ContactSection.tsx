import { AtSign, Globe, Mail, Phone, X as XIcon } from "lucide-react";
import { FolderGit2 } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ContactInfo } from "@/lib/profile";

type ContactField = keyof ContactInfo;

const CONTACT_META: Record<
    ContactField,
    { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; placeholder: string; href: (v: string) => string }
> = {
    email: { label: "Email address", icon: Mail, placeholder: "you@university.edu", href: (v) => `mailto:${v}` },
    phone: { label: "Phone number", icon: Phone, placeholder: "+233 XXX XXX XXX", href: (v) => `tel:${v}` },
    linkedin: { label: "LinkedIn", icon: AtSign, placeholder: "https://linkedin.com/in/…", href: (v) => v },
    github: { label: "GitHub", icon: FolderGit2, placeholder: "https://github.com/…", href: (v) => v },
    website: { label: "Personal website", icon: Globe, placeholder: "https://…", href: (v) => v },
    twitter: { label: "X (Twitter)", icon: XIcon, placeholder: "https://x.com/…", href: (v) => v },
};

const CONTACT_FIELD_ORDER: ContactField[] = ["email", "phone", "linkedin", "github", "website", "twitter"];

interface ContactSectionProps {
    contact: ContactInfo;
    editable?: boolean;
    onChange?: (contact: ContactInfo) => void;
    errors?: Partial<Record<ContactField, string>>;
}

export default function ContactSection({ contact, editable = false, onChange, errors }: ContactSectionProps) {
    const populatedFields = CONTACT_FIELD_ORDER.filter((field) => !!contact[field]);

    if (!editable) {
        if (populatedFields.length === 0) {
            return <p className="text-sm text-muted-foreground">No contact information provided yet.</p>;
        }
        return (
            <ul className="flex flex-col gap-3">
                {populatedFields.map((field) => {
                    const meta = CONTACT_META[field];
                    const Icon = meta.icon;
                    const value = contact[field]!;
                    return (
                        <li key={field} className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--nex-surface-2) text-(--nex-accent)">
                                <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-label">{meta.label}</p>
                                <a
                                    href={meta.href(value)}
                                    target={field === "email" || field === "phone" ? undefined : "_blank"}
                                    rel="noreferrer"
                                    className="truncate text-sm text-(--nex-text) transition-colors hover:text-(--nex-accent)"
                                >
                                    {value}
                                </a>
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {CONTACT_FIELD_ORDER.map((field) => {
                const meta = CONTACT_META[field];
                const Icon = meta.icon;
                const error = errors?.[field];
                return (
                    <Field key={field} data-invalid={!!error}>
                        <FieldLabel htmlFor={`contact-${field}`}>
                            <Icon size={14} className="text-muted-foreground" />
                            {meta.label}
                        </FieldLabel>
                        <Input
                            id={`contact-${field}`}
                            value={contact[field] ?? ""}
                            onChange={(e) => onChange?.({ ...contact, [field]: e.target.value })}
                            placeholder={meta.placeholder}
                            aria-invalid={!!error}
                        />
                        {error && <FieldError>{error}</FieldError>}
                    </Field>
                );
            })}
        </div>
    );
}

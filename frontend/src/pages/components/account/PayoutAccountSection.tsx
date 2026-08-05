import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import Button from "../ui/Button";

interface Bank {
    name: string;
    code: string;
}

interface PayoutAccountData {
    bank_name: string;
    account_number: string;
    account_name: string;
    verified: boolean;
    updated_at: string;
}

const payoutSchema = z.object({
    bankCode: z.string().min(1, "Select a bank"),
    accountNumber: z.string().min(1, "Account number is required"),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

function errorMessage(error: unknown, fallback: string) {
    return axios.isAxiosError(error) && error.response?.data?.detail
        ? String(error.response.data.detail)
        : fallback;
}

export default function PayoutAccountSection() {
    const api = useApi();
    const [banks, setBanks] = useState<Bank[]>([]);
    const [existing, setExisting] = useState<PayoutAccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [resolvedName, setResolvedName] = useState<string | null>(null);
    const [resolving, setResolving] = useState(false);
    const [saving, setSaving] = useState(false);

    const form = useForm<PayoutFormValues>({
        resolver: zodResolver(payoutSchema),
        defaultValues: { bankCode: "", accountNumber: "" },
    });

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const [banksRes, accountRes] = await Promise.allSettled([
                    api.get<Bank[]>("/payments/banks"),
                    api.get<PayoutAccountData>("/payments/payout-account"),
                ]);
                if (cancelled) return;
                if (banksRes.status === "fulfilled") setBanks(banksRes.value.data);
                if (accountRes.status === "fulfilled") setExisting(accountRes.value.data);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleVerify() {
        const valid = await form.trigger();
        if (!valid) return;
        const { bankCode, accountNumber } = form.getValues();
        setResolving(true);
        setResolvedName(null);
        try {
            const { data } = await api.post<{ account_name: string }>(
                "/payments/payout-account/resolve",
                { bank_code: bankCode, account_number: accountNumber },
            );
            setResolvedName(data.account_name);
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't verify that account."));
        } finally {
            setResolving(false);
        }
    }

    async function handleSave() {
        const { bankCode, accountNumber } = form.getValues();
        const bank = banks.find((b) => b.code === bankCode);
        if (!bank || !resolvedName) return;
        setSaving(true);
        try {
            const { data } = await api.put<PayoutAccountData>("/payments/payout-account", {
                bank_code: bankCode,
                bank_name: bank.name,
                account_number: accountNumber,
            });
            setExisting(data);
            setEditing(false);
            setResolvedName(null);
            toast.success("Payout account saved.");
        } catch (error) {
            toast.error(errorMessage(error, "Couldn't save your payout account."));
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-muted-foreground" size={22} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payout details</CardTitle>
                <CardDescription>
                    Where we send your earnings once an order is complete and both sides confirm.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {existing && !editing ? (
                    <div className="flex items-center justify-between gap-4 rounded-md bg-(--nex-surface-2) p-3">
                        <div className="flex items-center gap-2">
                            {existing.verified && (
                                <CheckCircle2 size={16} className="text-(--nex-accent)" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-(--nex-text)">
                                    {existing.bank_name} · {existing.account_number}
                                </p>
                                <p className="text-xs text-(--nex-text-muted)">{existing.account_name}</p>
                            </div>
                        </div>
                        <Button type="button" className="w-auto shrink-0" onClick={() => setEditing(true)}>
                            Change
                        </Button>
                    </div>
                ) : (
                    <FieldGroup>
                        <Controller
                            name="bankCode"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="bankCode">Bank</FieldLabel>
                                    <select
                                        {...field}
                                        id="bankCode"
                                        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none md:text-sm"
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setResolvedName(null);
                                        }}
                                    >
                                        <option value="">Select your bank</option>
                                        {banks.map((b) => (
                                            <option key={b.code} value={b.code}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                </Field>
                            )}
                        />
                        <Controller
                            name="accountNumber"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="accountNumber">Account number</FieldLabel>
                                    <Input
                                        {...field}
                                        id="accountNumber"
                                        aria-invalid={fieldState.invalid}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setResolvedName(null);
                                        }}
                                    />
                                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                                </Field>
                            )}
                        />

                        {resolvedName ? (
                            <div className="flex items-center gap-2 rounded-md bg-(--nex-surface-2) p-3">
                                <CheckCircle2 size={16} className="text-(--nex-accent)" />
                                <p className="text-sm text-(--nex-text)">
                                    Is this you? <strong>{resolvedName}</strong>
                                </p>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                className="px-6"
                                disabled={resolving}
                                isLoading={resolving}
                                loadingText="Verifying"
                                onClick={handleVerify}
                            >
                                Verify account
                            </Button>
                        )}
                    </FieldGroup>
                )}
            </CardContent>
            {(!existing || editing) && (
                <CardFooter className="gap-2">
                    {editing && (
                        <Button
                            type="button"
                            className="w-auto"
                            onClick={() => {
                                setEditing(false);
                                setResolvedName(null);
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="button"
                        className="w-auto"
                        disabled={!resolvedName || saving}
                        isLoading={saving}
                        loadingText="Saving"
                        onClick={handleSave}
                    >
                        Save payout account
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

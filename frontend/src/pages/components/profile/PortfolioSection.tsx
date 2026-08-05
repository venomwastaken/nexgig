import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortfolioItem } from "@/lib/profile";
import PortfolioCard from "./PortfolioCard";
import PortfolioItemDialog from "./PortfolioItemDialog";

interface PortfolioSectionProps {
    items: PortfolioItem[];
    editable?: boolean;
    onChange?: (items: PortfolioItem[]) => void;
}

export default function PortfolioSection({ items, editable = false, onChange }: PortfolioSectionProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

    function openAddDialog() {
        setEditingItem(null);
        setDialogOpen(true);
    }

    function openEditDialog(item: PortfolioItem) {
        setEditingItem(item);
        setDialogOpen(true);
    }

    function handleSave(item: PortfolioItem) {
        const exists = items.some((i) => i.id === item.id);
        onChange?.(exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]);
    }

    function handleDelete(id: string) {
        onChange?.(items.filter((i) => i.id !== id));
    }

    if (items.length === 0 && !editable) {
        return <p className="text-sm text-muted-foreground">No portfolio items added yet.</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-5 sm:grid-cols-2">
                {items.map((item) => (
                    <PortfolioCard
                        key={item.id}
                        item={item}
                        editable={editable}
                        onEdit={() => openEditDialog(item)}
                        onDelete={() => handleDelete(item.id)}
                    />
                ))}
            </div>

            {editable && (
                <Button type="button" variant="outline" onClick={openAddDialog} className="self-start">
                    <Plus size={16} />
                    Add portfolio item
                </Button>
            )}

            <PortfolioItemDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                item={editingItem}
                existingTitles={items
                    .filter((i) => i.id !== editingItem?.id)
                    .map((i) => i.title)}
                onSave={handleSave}
            />
        </div>
    );
}

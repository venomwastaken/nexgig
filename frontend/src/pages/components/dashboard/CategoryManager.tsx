import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Category } from "./types";

interface CategoryManagerProps {
  categories: Category[];
  onAdd?: (name: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function CategoryManager({
  categories,
  onAdd,
  onEdit,
  onDelete,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    onAdd?.(newCategory.trim());
    setNewCategory("");
  };

  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-4">
      <h2 className="font-semibold text-sm text-[#f5f5f4]">Service categories</h2>

      <div className="flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New category name"
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f4] outline-none focus:border-[#1b976f] placeholder:text-[#8a8a8a]"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 bg-[#1b976f] text-[#0f0f0f] font-medium text-sm rounded-lg px-3 py-2 hover:bg-[#22b384] transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="flex flex-col divide-y divide-[#2a2a2a]">
        {categories.length === 0 ? (
          <p className="text-xs text-[#8a8a8a] py-4 text-center">No categories yet.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#f5f5f4]">{cat.name}</p>
                <p className="text-xs text-[#8a8a8a]">{cat.activeGigs} active gigs</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(cat.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors"
                >
                  <Pencil size={13} className="text-[#8a8a8a]" />
                </button>
                <button
                  onClick={() => onDelete?.(cat.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors"
                >
                  <Trash2 size={13} className="text-[#ef4444]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
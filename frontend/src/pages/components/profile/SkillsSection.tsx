import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SUGGESTED_SKILLS } from "@/lib/profile";
import SkillChip from "./SkillChip";

interface SkillsSectionProps {
    skills: string[];
    editable?: boolean;
    onChange?: (skills: string[]) => void;
}

/** Skills as chips, with an add/remove UI when `editable`. */
export default function SkillsSection({ skills, editable = false, onChange }: SkillsSectionProps) {
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);

    function addSkill(value: string) {
        const trimmed = value.trim();
        if (!trimmed) return;

        const isDuplicate = skills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
        if (isDuplicate) {
            setError(`"${trimmed}" is already in your skills list`);
            return;
        }

        onChange?.([...skills, trimmed]);
        setDraft("");
        setError(null);
    }

    function removeSkill(index: number) {
        onChange?.(skills.filter((_, i) => i !== index));
    }

    const unusedSuggestions = SUGGESTED_SKILLS.filter(
        (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase()),
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
                {skills.length === 0 && !editable && (
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
                {skills.map((skill, index) => (
                    <SkillChip
                        key={`${skill}-${index}`}
                        skill={skill}
                        onRemove={editable ? () => removeSkill(index) : undefined}
                    />
                ))}
            </div>

            {editable && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Input
                            value={draft}
                            onChange={(e) => {
                                setDraft(e.target.value);
                                if (error) setError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addSkill(draft);
                                }
                            }}
                            placeholder="e.g. Web Development"
                            aria-label="Add a skill"
                            aria-invalid={!!error}
                            list="skill-suggestions"
                        />
                        <datalist id="skill-suggestions">
                            {SUGGESTED_SKILLS.map((s) => (
                                <option key={s} value={s} />
                            ))}
                        </datalist>
                        <Button type="button" onClick={() => addSkill(draft)} variant="outline">
                            <Plus size={16} />
                            Add
                        </Button>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    {unusedSuggestions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Sparkles size={12} />
                                Suggestions:
                            </span>
                            {unusedSuggestions.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => addSkill(s)}
                                    className="badge badge-neutral transition-colors hover:text-foreground"
                                >
                                    + {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

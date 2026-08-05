import { X } from "lucide-react";

interface SkillChipProps {
    skill: string;
    onRemove?: () => void;
    className?: string;
}

/** A single skill tag. Pass `onRemove` to render it as removable (edit mode). */
export default function SkillChip({ skill, onRemove, className = "" }: SkillChipProps) {
    return (
        <span className={`badge badge-accent gap-1.5 ${className}`}>
            {skill}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${skill}`}
                    className="-mr-1 rounded-full p-0.5 transition-colors hover:bg-(--nex-accent)/20"
                >
                    <X size={12} />
                </button>
            )}
        </span>
    );
}

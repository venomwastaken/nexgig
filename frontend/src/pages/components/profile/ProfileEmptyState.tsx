import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileEmptyStateProps {
    onCreate: () => void;
}

export default function ProfileEmptyState({ onCreate }: ProfileEmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-white/8 bg-(--nex-surface-2) px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-(--nex-accent)/14 text-(--nex-accent)">
                <UserPlus size={26} />
            </span>
            <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold text-(--nex-text)">
                    You haven&apos;t created your freelancer profile yet.
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                    Showcase your skills, portfolio, and contact details so classmates can find and
                    hire you for gigs.
                </p>
            </div>
            <Button type="button" onClick={onCreate} size="lg" className="mt-2">
                Create Profile
            </Button>
        </div>
    );
}

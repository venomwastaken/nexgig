import { CalendarDays, GraduationCap, MapPin, Pencil, School } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
    avatarUrl?: string;
    fullName: string;
    username: string;
    professionalTitle?: string;
    university?: string;
    department?: string;
    yearOfStudy?: string;
    location?: string;
    onEdit: () => void;
}

const metaItem = (Icon: React.ComponentType<{ size?: number; className?: string }>, value?: string) =>
    value ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon size={14} className="shrink-0 text-muted-foreground" />
            {value}
        </span>
    ) : null;

export default function ProfileHeader({
    avatarUrl,
    fullName,
    username,
    professionalTitle,
    university,
    department,
    yearOfStudy,
    location,
    onEdit,
}: ProfileHeaderProps) {
    const initials =
        fullName
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "U";

    return (
        <Card>
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar size="lg" className="size-20 sm:size-24">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1.5">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-(--nex-text)">
                                {fullName}
                            </h1>
                            <p className="text-sm text-muted-foreground">@{username}</p>
                        </div>
                        {professionalTitle && (
                            <p className="text-sm font-medium text-(--nex-accent)">{professionalTitle}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                            {metaItem(School, university)}
                            {metaItem(GraduationCap, department)}
                            {metaItem(CalendarDays, yearOfStudy)}
                            {metaItem(MapPin, location)}
                        </div>
                    </div>
                </div>

                <Button type="button" variant="outline" onClick={onEdit} className="self-start">
                    <Pencil size={14} />
                    Edit Profile
                </Button>
            </CardContent>
        </Card>
    );
}

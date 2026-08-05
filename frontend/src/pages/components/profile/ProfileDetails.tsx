interface ProfileDetailsProps {
    bio?: string;
}

/** The "About" section — just the freelancer's bio, for now. */
export default function ProfileDetails({ bio }: ProfileDetailsProps) {
    if (!bio) {
        return <p className="text-sm text-muted-foreground">No bio added yet.</p>;
    }
    return <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{bio}</p>;
}

import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { emptyExtendedProfile } from "@/lib/profile";
import { useFreelancerProfile } from "@/hooks/useFreelancerProfile";
import ProfileForm from "./components/profile/ProfileForm";

export default function ProfileEdit() {
    const navigate = useNavigate();
    const { userId, base, extended, loading, error } = useFreelancerProfile();

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
        );
    }

    if (error || !base || !userId) {
        return (
            <div className="mx-auto my-10 max-w-3xl px-4">
                <div className="alert alert-error">
                    {error ?? "We couldn't find your account profile."}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto my-10 max-w-3xl px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-(--nex-text)">
                    Edit freelancer profile
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Keep your skills, portfolio, and contact details up to date.
                </p>
            </div>

            <ProfileForm
                userId={userId}
                initialBase={{
                    firstName: base.firstName,
                    lastName: base.lastName,
                    username: base.username,
                    avatarUrl: base.avatarUrl,
                    bio: base.bio,
                    university: base.university,
                }}
                initialExtended={extended ?? emptyExtendedProfile()}
                onCancel={() => navigate("/profile")}
                onSaved={() => navigate("/profile")}
            />
        </div>
    );
}

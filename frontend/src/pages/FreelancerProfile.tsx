import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFreelancerProfile } from "@/hooks/useFreelancerProfile";
import ProfileHeader from "./components/profile/ProfileHeader";
import ProfileDetails from "./components/profile/ProfileDetails";
import ProfileEmptyState from "./components/profile/ProfileEmptyState";
import SkillsSection from "./components/profile/SkillsSection";
import PortfolioSection from "./components/profile/PortfolioSection";
import ContactSection from "./components/profile/ContactSection";

export default function FreelancerProfile() {
    const navigate = useNavigate();
    const { base, extended, loading, error } = useFreelancerProfile();

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
        );
    }

    if (error || !base) {
        return (
            <div className="mx-auto my-10 max-w-3xl px-4">
                <div className="alert alert-error">
                    {error ?? "We couldn't find your account profile."}
                </div>
            </div>
        );
    }

    const fullName = `${base.firstName} ${base.lastName}`.trim();

    return (
        <div className="mx-auto my-10 flex max-w-5xl flex-col gap-8 px-4">
            <ProfileHeader
                avatarUrl={base.avatarUrl}
                fullName={fullName}
                username={base.username}
                professionalTitle={extended?.professionalTitle}
                university={base.university}
                department={extended?.department}
                yearOfStudy={extended?.yearOfStudy}
                location={extended?.location}
                onEdit={() => navigate("/profile/edit")}
            />

            {!extended ? (
                <ProfileEmptyState onCreate={() => navigate("/profile/edit")} />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProfileDetails bio={base.bio} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SkillsSection skills={extended.skills} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Portfolio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PortfolioSection items={extended.portfolio} />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Contact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ContactSection contact={extended.contact} />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

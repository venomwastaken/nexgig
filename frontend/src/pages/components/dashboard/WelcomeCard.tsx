
interface WelcomeBannerProps {
  name: string;
  subtitle?: string;
  hasNotification?: boolean;
}

export default function WelcomeBanner({
  name,
  subtitle = "Discover new gigs, complete projects and grow your portfolio.",

}: WelcomeBannerProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f4]">
          Welcome back, {name}
        </h1>
        <p className="text-[#8a8a8a] text-sm mt-1">{subtitle}</p>
      </div>


    </div>
  );
}
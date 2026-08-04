interface StatCardProps { label: string; value: string; sub?: string; accent?: string; }

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-1">
      <span className="text-[#8a8a8a] text-xs uppercase tracking-wider font-medium">{label}</span>
      <span className="text-2xl font-semibold text-[#f5f5f4] font-mono">{value}</span>
      {sub && <span className="text-xs mt-1" style={{ color: accent || "#8a8a8a" }}>{sub}</span>}
    </div>
  );
}

interface StatsRowProps {
  availableBalance: number;
  inEscrow: number;
  activeGigs: number;
  pendingReview: number;
  needsReply: number;
}

export default function StatsRow({
  availableBalance,
  inEscrow,
  activeGigs,
  pendingReview,
  needsReply,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Available balance" value={`GH₵ ${availableBalance.toLocaleString()}`} sub="Ready to withdraw" accent="#1b976f" />
      <StatCard label="In escrow" value={`GH₵ ${inEscrow.toLocaleString()}`} sub="Releases on delivery" />
      <StatCard
        label="Active gigs"
        value={String(activeGigs)}
        sub={needsReply > 0 ? `${needsReply} needs a reply` : "All caught up"}
        accent={needsReply > 0 ? "#d9a441" : undefined}
      />
      <StatCard
        label="Pending review"
        value={String(pendingReview)}
        sub={pendingReview > 0 ? "Awaiting admin approval" : "All caught up"}
        accent={pendingReview > 0 ? "#d9a441" : undefined}
      />
    </div>
  );
}

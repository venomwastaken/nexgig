import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { gigSubmissions as seedGigSubmissions } from "./mockData";
import { GigSubmission } from "./types";
import GigReviewTable from "./GigReviewTable";

const AdminDashboard = () => {
  const [gigs, setGigs] = useState<GigSubmission[]>(seedGigSubmissions);

  const counts = useMemo(
    () => ({
      pending: gigs.filter((g) => g.status === "pending").length,
      approved: gigs.filter((g) => g.status === "approved").length,
      rejected: gigs.filter((g) => g.status === "rejected").length,
    }),
    [gigs]
  );

  const handleApprove = (id: string) =>
    setGigs((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status: "approved", rejectionReason: undefined } : g
      )
    );

  const handleReject = (id: string, reason: string) =>
    setGigs((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: "rejected", rejectionReason: reason } : g))
    );

  return (
    <main className="min-h-screen space-y-6 bg-background p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Gig review</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject newly posted gigs before they go live.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="all">All ({gigs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <GigReviewTable
            gigs={gigs.filter((g) => g.status === "pending")}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <GigReviewTable
            gigs={gigs.filter((g) => g.status === "approved")}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <GigReviewTable
            gigs={gigs.filter((g) => g.status === "rejected")}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <GigReviewTable gigs={gigs} onApprove={handleApprove} onReject={handleReject} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default AdminDashboard;

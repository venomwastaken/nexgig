import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { ApiGigSubmission, GigSubmission, mapApiGigSubmission } from "./types";
import GigReviewTable from "./GigReviewTable";
import UserManagementPanel from "./users/UserManagementPanel";

const AdminDashboard = () => {
  const api = useApi();
  const [gigs, setGigs] = useState<GigSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<ApiGigSubmission[]>("/gigs/")
      .then((res) => {
        if (cancelled) return;
        setGigs(res.data.map(mapApiGigSubmission));
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load gigs. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => ({
      pending: gigs.filter((g) => g.status === "pending").length,
      approved: gigs.filter((g) => g.status === "approved").length,
      rejected: gigs.filter((g) => g.status === "rejected").length,
    }),
    [gigs]
  );

  const handleApprove = (id: string) => {
    api
      .patch<ApiGigSubmission>(`/admin/gigs/${id}/approve`)
      .then((res) => {
        const updated = mapApiGigSubmission(res.data);
        setGigs((prev) => prev.map((g) => (g.id === id ? updated : g)));
      })
      .catch(() => toast.error("Couldn't approve this gig. Please try again."));
  };

  const handleReject = (id: string, reason: string) => {
    api
      .patch<ApiGigSubmission>(`/admin/gigs/${id}/reject`, { rejection_reason: reason })
      .then((res) => {
        const updated = mapApiGigSubmission(res.data);
        setGigs((prev) => prev.map((g) => (g.id === id ? updated : g)));
      })
      .catch(() => toast.error("Couldn't reject this gig. Please try again."));
  };

  return (
    <main className="min-h-screen space-y-6 bg-background p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Moderate gig submissions and manage user accounts.
        </p>
      </div>

      <Tabs defaultValue="gigs">
        <TabsList>
          <TabsTrigger value="gigs">Gig review</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="gigs" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UserManagementPanel />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default AdminDashboard;

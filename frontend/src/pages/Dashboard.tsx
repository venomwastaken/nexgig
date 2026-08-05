import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Topbar from "./components/dashboard/Topbar";
import WelcomeCard from "./components/dashboard/WelcomeCard";
import StatsRow from "./components/dashboard/StatsRow";
import MyGigsPanel from "./components/dashboard/MyGigsPanel";
import ServiceRequestsPanel from "./components/dashboard/ServiceRequestsPanel";
import MyOrdersPanel from "./components/dashboard/MyOrdersPanel";
import { useApi } from "@/hooks/useApi";
import {
  ApiMe,
  ApiMyGig,
  ApiOrder,
  IncomingRequest,
  Me,
  MyGig,
  mapApiMe,
  mapApiMyGig,
  mapApiOrder,
  nextOrderStatus,
} from "./components/dashboard/types";

const Dashboard = () => {
  const api = useApi();
  const [me, setMe] = useState<Me | null>(null);
  const [gigs, setGigs] = useState<MyGig[]>([]);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [myOrders, setMyOrders] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get<ApiMe>("/users/me"),
      api.get<ApiMyGig[]>("/gigs/"),
      api.get<ApiOrder[]>("/orders/incoming"),
      api.get<ApiOrder[]>("/orders/mine"),
    ])
      .then(([meRes, gigsRes, requestsRes, myOrdersRes]) => {
        if (cancelled) return;
        const mappedMe = mapApiMe(meRes.data);
        setMe(mappedMe);
        setGigs(
          gigsRes.data
            .filter((g) => g.provider?.user_id === mappedMe.userId)
            .map(mapApiMyGig)
        );
        setRequests(requestsRes.data.map(mapApiOrder));
        setMyOrders(myOrdersRes.data.map(mapApiOrder));
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your dashboard. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      availableBalance: me?.availableTokens ?? 0,
      inEscrow: me?.tokensEscrowed ?? 0,
      activeGigs: gigs.filter((g) => g.status === "active" && g.approvalStatus === "approved")
        .length,
      pendingReview: gigs.filter((g) => g.approvalStatus === "pending").length,
      needsReply: requests.filter((r) => r.status === "requested").length,
    }),
    [gigs, me, requests]
  );

  const handleAdvanceRequest = async (id: string) => {
    const target = requests.find((r) => r.id === id);
    const upcoming = target && nextOrderStatus(target.status);
    if (!upcoming) return;
    try {
      const { data } = await api.patch<ApiOrder>(`/orders/${id}/status`, { status: upcoming });
      setRequests((prev) => prev.map((r) => (r.id === id ? mapApiOrder(data) : r)));
    } catch {
      toast.error("Couldn't update this request. Please try again.");
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      const { data } = await api.patch<ApiOrder>(`/orders/${id}/status`, {
        status: "cancelled",
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? mapApiOrder(data) : r)));
    } catch {
      toast.error("Couldn't decline this request. Please try again.");
    }
  };

  const handleCancelMyOrder = async (id: string) => {
    try {
      const { data } = await api.patch<ApiOrder>(`/orders/${id}/status`, {
        status: "cancelled",
      });
      setMyOrders((prev) => prev.map((o) => (o.id === id ? mapApiOrder(data) : o)));
    } catch {
      toast.error("Couldn't cancel this order. Please try again.");
    }
  };

  const handleConfirmComplete = async (id: string, kind: "incoming" | "mine") => {
    try {
      const { data } = await api.post<ApiOrder>(`/orders/${id}/confirm-complete`);
      const mapped = mapApiOrder(data);
      if (kind === "incoming") {
        setRequests((prev) => prev.map((r) => (r.id === id ? mapped : r)));
      } else {
        setMyOrders((prev) => prev.map((r) => (r.id === id ? mapped : r)));
      }
    } catch {
      toast.error("Couldn't confirm completion. Please try again.");
    }
  };

  const refetchMyOrder = async (id: string) => {
    try {
      const { data } = await api.get<ApiOrder[]>("/orders/mine");
      const updated = data.find((o) => o.id === id);
      if (updated) {
        setMyOrders((prev) => prev.map((r) => (r.id === id ? mapApiOrder(updated) : r)));
      }
    } catch {
      // next load will pick up the real state; not worth surfacing an error here
    }
  };

  const handleSaveGig = async (
    id: string,
    payload: {
      title: string;
      category_name: string;
      price: number;
      turnaround_time: string;
      description: string;
    }
  ) => {
    try {
      const { data } = await api.patch<ApiMyGig>(`/gigs/${id}`, payload);
      setGigs((prev) => prev.map((g) => (g.id === id ? mapApiMyGig(data) : g)));
      toast.success("Gig updated.");
      return true;
    } catch {
      toast.error("Couldn't save changes. Please try again.");
      return false;
    }
  };

  const handleToggleStatus = async (gig: MyGig) => {
    const nextStatus = gig.status === "active" ? "paused" : "active";
    try {
      const { data } = await api.patch<ApiMyGig>(`/gigs/${gig.id}/status`, {
        status: nextStatus,
      });
      setGigs((prev) => prev.map((g) => (g.id === gig.id ? mapApiMyGig(data) : g)));
    } catch {
      toast.error("Couldn't update gig status. Please try again.");
    }
  };

  const handleDeleteGig = async (id: string) => {
    try {
      await api.delete(`/gigs/${id}`);
      setGigs((prev) => prev.filter((g) => g.id !== id));
      toast.success("Gig deleted.");
    } catch {
      toast.error("Couldn't delete this gig. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1b1b1b]">
        <Loader2 className="animate-spin text-[#8a8a8a]" size={24} />
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6 bg-[#1b1b1b] min-h-screen">
      <Topbar avatarUrl={me?.avatarUrl} />
      <WelcomeCard name={me?.firstName || "there"} />
      <StatsRow
        availableBalance={stats.availableBalance}
        inEscrow={stats.inEscrow}
        activeGigs={stats.activeGigs}
        pendingReview={stats.pendingReview}
        needsReply={stats.needsReply}
      />
      <ServiceRequestsPanel
        requests={requests}
        onCancel={handleCancelRequest}
        onAdvance={handleAdvanceRequest}
        onConfirmComplete={(id) => handleConfirmComplete(id, "incoming")}
      />
      <MyOrdersPanel
        orders={myOrders}
        buyerEmail={me?.email ?? ""}
        onPaid={refetchMyOrder}
        onConfirmComplete={(id) => handleConfirmComplete(id, "mine")}
        onCancel={handleCancelMyOrder}
      />
      <MyGigsPanel
        gigs={gigs}
        onSave={handleSaveGig}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteGig}
      />
    </main>
  );
};

export default Dashboard;

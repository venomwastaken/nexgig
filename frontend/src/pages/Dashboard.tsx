import { useMemo, useState } from "react";
import Topbar from "./components/dashboard/Topbar";
import WelcomeCard from "./components/dashboard/WelcomeCard";
import StatsRow from "./components/dashboard/StatsRow";
import TransactionsPanel from "./components/dashboard/TransactionsPanel";
import ServiceRequestsPanel from "./components/dashboard/ServiceRequestsPanel";
import { Gig, Notification } from "./components/dashboard/types";
import {
  CURRENT_USER_ID,
  users,
  gigs as seedGigs,
  notifications as seedNotifications,
} from "./components/dashboard/mockData";
import {
  gigsForUser,
  gigToTransaction,
  gigToServiceRequest,
  computeStats,
  nextStatus,
  notificationsForUser,
} from "./components/dashboard/derive";

const Dashboard = () => {
  const [gigs, setGigs] = useState<Gig[]>(seedGigs);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)!;

  const myGigs = useMemo(() => gigsForUser(gigs, currentUser.id), [gigs, currentUser.id]);
  const myNotifications = useMemo(
    () => notificationsForUser(notifications, currentUser.id),
    [notifications, currentUser.id]
  );
  const transactions = useMemo(() => myGigs.map(gigToTransaction), [myGigs]);
  const serviceRequests = useMemo(() => myGigs.map(gigToServiceRequest), [myGigs]);
  const stats = useMemo(() => computeStats(myGigs), [myGigs]);

  const handleCancelRequest = (id: string) =>
    setGigs((prev) => prev.filter((g) => g.id !== id));

  const handleAdvanceStatus = (id: string) => {
    setGigs((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const advanced = nextStatus(g.projectStatus);
        if (!advanced) return g;
        return {
          ...g,
          projectStatus: advanced,
          paymentStatus: advanced === "completed" ? "completed" : g.paymentStatus,
        };
      })
    );
  };

  const handleMarkRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6 bg-[#1b1b1b] min-h-screen">
      <Topbar notifications={myNotifications} onMarkRead={handleMarkRead} />
      <WelcomeCard name={currentUser.name} />
      <TransactionsPanel transactions={transactions} />
      <StatsRow
        availableBalance={stats.availableBalance}
        inEscrow={stats.inEscrow}
        activeGigs={stats.activeGigs}
        needsReply={stats.needsReply}
        rating={currentUser.rating}
        reviewCount={currentUser.reviewCount}
      />
      <ServiceRequestsPanel
        requests={serviceRequests}
        onCancel={handleCancelRequest}
        onAdvance={handleAdvanceStatus}
      />
    </main>
  );
};

export default Dashboard;
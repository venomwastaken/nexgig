import { useState } from "react";
import { Check, X as XIcon, MoreHorizontal, Eye } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GigSubmission } from "./types";

interface GigReviewTableProps {
  gigs: GigSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const STATUS_STYLES: Record<GigSubmission["status"], string> = {
  pending: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
};

const STATUS_LABELS: Record<GigSubmission["status"], string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const initials = (name: string) =>
  name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function GigReviewTable({ gigs, onApprove, onReject }: GigReviewTableProps) {
  const [rejectTarget, setRejectTarget] = useState<GigSubmission | null>(null);
  const [reason, setReason] = useState("");

  const openReject = (gig: GigSubmission) => {
    setRejectTarget(gig);
    setReason(gig.rejectionReason ?? "");
  };

  const handleConfirmReject = () => {
    if (!rejectTarget || !reason.trim()) return;
    onReject(rejectTarget.id, reason.trim());
    setRejectTarget(null);
    setReason("");
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gig</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gigs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No gigs here.
                </TableCell>
              </TableRow>
            ) : (
              gigs.map((gig) => (
                <TableRow key={gig.id}>
                  <TableCell className="max-w-xs whitespace-normal">
                    <p className="font-medium text-foreground">{gig.title}</p>
                    <p className="text-xs text-muted-foreground">{gig.category}</p>
                    {gig.status === "rejected" && gig.rejectionReason && (
                      <p className="mt-1 text-xs text-red-400">Reason: {gig.rejectionReason}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(gig.provider.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-foreground">{gig.provider.name}</p>
                        <p className="text-xs text-muted-foreground">@{gig.provider.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>GH₵ {gig.price.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{gig.submittedAt}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[gig.status]}`}
                    >
                      {STATUS_LABELS[gig.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {gig.status === "pending" && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => onApprove(gig.id)}>
                            <Check /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openReject(gig)}>
                            <XIcon /> Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye /> View details
                          </DropdownMenuItem>
                          {gig.status !== "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openReject(gig)} variant="destructive">
                                <XIcon /> {gig.status === "rejected" ? "Edit rejection reason" : "Reject"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject gig</DialogTitle>
            <DialogDescription>
              Tell {rejectTarget?.provider.name.split(" ")[0]} why "{rejectTarget?.title}" isn't
              being approved. They'll see this reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. This listing violates platform guidelines, or the category isn't supported yet."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!reason.trim()} onClick={handleConfirmReject}>
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

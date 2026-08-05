import { X } from "lucide-react";
import {
  IncomingRequest,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  nextOrderStatus,
  canProviderConfirmComplete,
} from "./types";

interface ServiceRequestsPanelProps {
  requests: IncomingRequest[];
  onCancel?: (id: string) => void;
  onAdvance?: (id: string) => void;
  onConfirmComplete?: (id: string) => void;
}

export default function ServiceRequestsPanel({
  requests,
  onCancel,
  onAdvance,
  onConfirmComplete,
}: ServiceRequestsPanelProps) {
  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#f5f5f4]">Service requests</h2>
        <span className="text-[11px] text-[#8a8a8a]">{requests.length} total</span>
      </div>

      {requests.length === 0 ? (
        <p className="text-xs text-[#8a8a8a] py-4 text-center">
          No one has requested your gigs yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requests.map((r) => {
            const upcoming = nextOrderStatus(r.status);
            const awaitingPayment = r.status === "confirmed" && r.paymentStatus !== "success";
            const canConfirm = canProviderConfirmComplete(r);
            const waitingOnBuyer =
              r.status === "in_progress" && r.providerConfirmedAt && !r.buyerConfirmedAt;
            return (
              <div
                key={r.id}
                className="border border-[#2a2a2a] rounded-lg p-3.5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#f5f5f4] line-clamp-1">
                    {r.gigTitle}
                  </p>
                  {r.status === "requested" && (
                    <button
                      onClick={() => onCancel?.(r.id)}
                      title="Decline this request"
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors shrink-0"
                    >
                      <X size={12} className="text-[#ef4444]" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8a8a8a]">
                  {r.buyerName} · GH₵ {r.price.toLocaleString()}
                </p>
                {r.note && (
                  <p className="text-xs text-[#8a8a8a] line-clamp-2 italic">"{r.note}"</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${ORDER_STATUS_COLORS[r.status]}1a`,
                      color: ORDER_STATUS_COLORS[r.status],
                    }}
                  >
                    {ORDER_STATUS_LABELS[r.status]}
                  </span>
                  {upcoming && (
                    <button
                      onClick={() => onAdvance?.(r.id)}
                      className="text-[11px] font-medium text-[#1b976f] hover:text-[#22b384] transition-colors"
                    >
                      Mark {ORDER_STATUS_LABELS[upcoming].toLowerCase()} →
                    </button>
                  )}
                  {awaitingPayment && (
                    <span className="text-[10px] text-[#8a8a8a]">Awaiting payment</span>
                  )}
                  {canConfirm && (
                    <button
                      onClick={() => onConfirmComplete?.(r.id)}
                      className="text-[11px] font-medium text-[#1b976f] hover:text-[#22b384] transition-colors"
                    >
                      I've delivered — confirm complete →
                    </button>
                  )}
                  {waitingOnBuyer && (
                    <span className="text-[10px] text-[#8a8a8a]">Waiting on buyer</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

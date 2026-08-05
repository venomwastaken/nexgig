import { X } from "lucide-react";
import {
  IncomingRequest,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  canBuyerConfirmComplete,
} from "./types";
import PayButton from "./PayButton";

interface MyOrdersPanelProps {
  orders: IncomingRequest[];
  buyerEmail: string;
  onPaid: (id: string) => void;
  onConfirmComplete: (id: string) => void;
  onCancel?: (id: string) => void;
}

export default function MyOrdersPanel({
  orders,
  buyerEmail,
  onPaid,
  onConfirmComplete,
  onCancel,
}: MyOrdersPanelProps) {
  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#f5f5f4]">My orders</h2>
        <span className="text-[11px] text-[#8a8a8a]">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-xs text-[#8a8a8a] py-4 text-center">
          You haven't requested any gigs yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orders.map((o) => {
            const awaitingPayment = o.status === "confirmed" && o.paymentStatus !== "success";
            const canConfirm = canBuyerConfirmComplete(o);
            const waitingOnProvider =
              o.status === "in_progress" && o.buyerConfirmedAt && !o.providerConfirmedAt;

            return (
              <div
                key={o.id}
                className="border border-[#2a2a2a] rounded-lg p-3.5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#f5f5f4] line-clamp-1">{o.gigTitle}</p>
                  {o.status === "requested" && (
                    <button
                      onClick={() => onCancel?.(o.id)}
                      title="Cancel this order"
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors shrink-0"
                    >
                      <X size={12} className="text-[#ef4444]" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8a8a8a]">GH₵ {o.price.toLocaleString()}</p>
                {o.note && (
                  <p className="text-xs text-[#8a8a8a] line-clamp-2 italic">"{o.note}"</p>
                )}
                <div className="flex items-center justify-between mt-1 gap-2">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${ORDER_STATUS_COLORS[o.status]}1a`,
                      color: ORDER_STATUS_COLORS[o.status],
                    }}
                  >
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>

                  {awaitingPayment && (
                    <PayButton
                      orderId={o.id}
                      price={o.price}
                      buyerEmail={buyerEmail}
                      onPaid={() => onPaid(o.id)}
                    />
                  )}
                  {o.paymentStatus === "success" && o.status !== "completed" && (
                    <span className="text-[10px] text-[#8a8a8a]">
                      {o.escrowStatus === "released" ? "Funds released" : "Held in escrow"}
                    </span>
                  )}
                  {canConfirm && (
                    <button
                      onClick={() => onConfirmComplete(o.id)}
                      className="text-[11px] font-medium text-[#1b976f] hover:text-[#22b384] transition-colors"
                    >
                      Confirm complete →
                    </button>
                  )}
                  {waitingOnProvider && (
                    <span className="text-[10px] text-[#8a8a8a]">Waiting on provider</span>
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

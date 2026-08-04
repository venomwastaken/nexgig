import { X } from "lucide-react";
import { OrderedService, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "./types";

interface OrderedServicesPanelProps {
  orders: OrderedService[];
  onCancel?: (id: string) => void;
}

export default function OrderedServicesPanel({ orders, onCancel }: OrderedServicesPanelProps) {
  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#f5f5f4]">Services you've ordered</h2>
        <span className="text-[11px] text-[#8a8a8a]">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-xs text-[#8a8a8a] py-4 text-center">
          You haven't ordered any services yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="border border-[#2a2a2a] rounded-lg p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#f5f5f4] line-clamp-1">{o.gigTitle}</p>
                {(o.status === "requested" || o.status === "confirmed") && (
                  <button
                    onClick={() => onCancel?.(o.id)}
                    title="Cancel this order"
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors shrink-0"
                  >
                    <X size={12} className="text-[#ef4444]" />
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8a8a8a]">
                {o.providerName} · GH₵ {o.price.toLocaleString()}
              </p>
              {o.note && (
                <p className="text-xs text-[#8a8a8a] line-clamp-2 italic">"{o.note}"</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${ORDER_STATUS_COLORS[o.status]}1a`,
                    color: ORDER_STATUS_COLORS[o.status],
                  }}
                >
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

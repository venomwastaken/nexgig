import { Trash2 } from "lucide-react";
import {
  ServiceRequest,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
} from "./types";
import { nextStatus } from "./derive";

interface ServiceRequestsPanelProps {
  requests: ServiceRequest[];
  onCancel?: (id: string) => void;
  onAdvance?: (id: string) => void;
}

export default function ServiceRequestsPanel({
  requests,
  onCancel,
  onAdvance,
}: ServiceRequestsPanelProps) {
  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#f5f5f4]">Service requests</h2>
        <span className="text-[11px] text-[#8a8a8a]">{requests.length} total</span>
      </div>

      {requests.length === 0 ? (
        <p className="text-xs text-[#8a8a8a] py-4 text-center">
          No service requests yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requests.map((r) => {
            const upcoming = nextStatus(r.status);
            return (
              <div
                key={r.id}
                className="border border-[#2a2a2a] rounded-lg p-3.5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#f5f5f4]">{r.title}</p>
                  {r.status === "requested" && (
                    <button
                      onClick={() => onCancel?.(r.id)}
                      title="Only pending requests can be removed"
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors shrink-0"
                    >
                      <Trash2 size={12} className="text-[#ef4444]" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8a8a8a]">{r.client}</p>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${REQUEST_STATUS_COLORS[r.status]}1a`,
                      color: REQUEST_STATUS_COLORS[r.status],
                    }}
                  >
                    {REQUEST_STATUS_LABELS[r.status]}
                  </span>
                  {upcoming && (
                    <button
                      onClick={() => onAdvance?.(r.id)}
                      className="text-[11px] font-medium text-[#1b976f] hover:text-[#22b384] transition-colors"
                    >
                      Mark {REQUEST_STATUS_LABELS[upcoming].toLowerCase()} →
                    </button>
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
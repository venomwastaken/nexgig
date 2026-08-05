import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useApi } from "@/hooks/useApi";
import { ApiOrder, IncomingRequest, mapApiOrder } from "./types";

interface PayButtonProps {
  orderId: string;
  price: number;
  buyerEmail: string;
  onPaid: (order: IncomingRequest) => void;
}

function errorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError(error) && error.response?.data?.detail
    ? String(error.response.data.detail)
    : fallback;
}

export default function PayButton({ orderId, price, buyerEmail, onPaid }: PayButtonProps) {
  const api = useApi();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!window.PaystackPop) {
      toast.error("Payment couldn't load. Please refresh and try again.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{
        reference: string;
        access_code: string;
        public_key: string;
        amount: number;
      }>(`/payments/orders/${orderId}/initialize`);

      const handler = window.PaystackPop.setup({
        key: data.public_key,
        email: buyerEmail,
        amount: Math.round(data.amount * 100), // GHS -> pesewas; Paystack's inline widget validates this client-side even with access_code set
        ref: data.reference,
        access_code: data.access_code,
        currency: "GHS",
        onClose: () => setLoading(false),
        callback: async () => {
          try {
            const { data: order } = await api.post<ApiOrder>(`/payments/verify/${data.reference}`);
            toast.success("Payment received — funds are held in escrow.");
            onPaid(mapApiOrder(order));
          } catch (error) {
            toast.error(
              errorMessage(error, "Payment succeeded but we couldn't confirm it yet. It'll update shortly."),
            );
          } finally {
            setLoading(false);
          }
        },
      });
      handler.openIframe();
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't start payment. Please try again."));
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#1b976f] text-white hover:bg-[#22b384] transition-colors disabled:opacity-60 flex items-center gap-1.5"
    >
      {loading && <Loader2 size={11} className="animate-spin" />}
      Pay now — GH₵ {price.toLocaleString()}
    </button>
  );
}

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";

interface PayButtonProps {
  orderId: string;
  price: number;
  buyerEmail: string;
  onPaid: () => void;
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
        amount: 0, // ignored by Paystack once access_code is supplied — amount is already fixed server-side
        ref: data.reference,
        access_code: data.access_code,
        currency: "GHS",
        onClose: () => setLoading(false),
        onSuccess: async () => {
          try {
            await api.post(`/payments/verify/${data.reference}`);
            toast.success("Payment received — funds are held in escrow.");
            onPaid();
          } catch {
            toast.error("Payment succeeded but we couldn't confirm it yet. It'll update shortly.");
          } finally {
            setLoading(false);
          }
        },
      });
      handler.openIframe();
    } catch {
      toast.error("Couldn't start payment. Please try again.");
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

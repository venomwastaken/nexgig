import { ArrowDownLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Transaction } from "./types";

const STATUS_STYLES: Record<Transaction["status"], string> = {
  pending: "bg-[#d9a441]/10 text-[#d9a441]",
  completed: "bg-[#1b976f]/10 text-[#1b976f]",
  refunded: "bg-[#ef4444]/10 text-[#ef4444]",
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncoming = tx.status !== "refunded";

  return (
    <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center shrink-0">
          {isIncoming ? (
            <ArrowDownLeft size={14} className="text-[#1b976f]" />
          ) : (
            <ArrowUpRight size={14} className="text-[#ef4444]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#f5f5f4] truncate">{tx.gigTitle}</p>
          <p className="text-xs text-[#8a8a8a]">{tx.counterparty} · {tx.date}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-mono text-[#f5f5f4]">{tx.amount}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[tx.status]}`}>
          {tx.status}
        </span>
      </div>
    </div>
  );
}

interface TransactionsPanelProps {
  transactions: Transaction[];
}

export default function TransactionsPanel({ transactions }: TransactionsPanelProps) {
  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#f5f5f4]">Transactions</h2>
        <span className="flex items-center gap-1 text-[10px] text-[#8a8a8a]">
          <ShieldCheck size={12} className="text-[#1b976f]" /> Escrow secured
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[#2a2a2a]">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}

export const mockTransactions: Transaction[] = [
  { id: "TX-1042", gigTitle: "Landing page redesign", counterparty: "Ama K.", amount: "GH₵ 450", status: "pending", date: "Jul 24" },
  { id: "TX-1038", gigTitle: "Logo + brand kit", counterparty: "Kwabena O.", amount: "GH₵ 180", status: "completed", date: "Jul 20" },
  { id: "TX-1031", gigTitle: "CSV data cleanup", counterparty: "Efua T.", amount: "GH₵ 90", status: "refunded", date: "Jul 15" },
];
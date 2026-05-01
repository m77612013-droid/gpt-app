"use client";

import { useTransition } from "react";
import { updateWithdrawalStatus } from "../actions";

export default function WithdrawalActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (status !== "pending") {
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === "completed"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}
      >
        {status === "completed" ? "✓ مكتمل" : "✗ مرفوض"}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => startTransition(() => updateWithdrawalStatus(id, "completed"))}
        disabled={isPending}
        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
      >
        {isPending ? "..." : "قبول"}
      </button>
      <button
        onClick={() => startTransition(() => updateWithdrawalStatus(id, "rejected"))}
        disabled={isPending}
        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
      >
        {isPending ? "..." : "رفض"}
      </button>
    </div>
  );
}

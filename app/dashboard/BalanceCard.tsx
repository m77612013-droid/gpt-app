"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { Wallet, RefreshCw } from "lucide-react";

interface Props {
  userId:         string;
  initialBalance: number;
  initialTotalEarned?: number; // kept for API compat but unused here
}

export default function BalanceCard({ userId, initialBalance }: Props) {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [flash,   setFlash]   = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── On mount: fetch fresh balance directly from browser client ────────────
  // Only selects balance_points to avoid failure if total_earned column is missing.
  useEffect(() => {
    let cancelled = false;
    async function fetchBalance() {
      try {
        const supabase = getSupabase();
        const { data, error: qErr } = await supabase
          .from("profiles")
          .select("balance_points")
          .eq("id", userId)
          .single();
        if (cancelled) return;
        if (qErr) { setError(qErr.message); return; }
        if (data) setBalance(data.balance_points ?? 0);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }
    fetchBalance();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Realtime: update instantly when DB changes ────────────────────────────
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`profile-balance-${userId}`)
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload: { new: { balance_points: number } }) => {
          setBalance(payload.new.balance_points ?? 0);
          setFlash(true);
          setTimeout(() => setFlash(false), 1800);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Manual refresh button ─────────────────────────────────────────────────
  async function handleRefresh() {
    setSyncing(true);
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("profiles")
        .select("balance_points")
        .eq("id", userId)
        .single();
      if (data) {
        setBalance(data.balance_points ?? 0);
        setFlash(true);
        setTimeout(() => setFlash(false), 1800);
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={`bg-white/5 backdrop-blur-md rounded-2xl border p-6 flex flex-col gap-2 sm:col-span-1 transition-all duration-500 ${
      flash
        ? "border-emerald-400/60 shadow-lg shadow-emerald-500/20"
        : "border-blue-500/20 hover:border-blue-400/40"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">رصيدك الحالي</p>
        <button
          onClick={handleRefresh}
          disabled={syncing}
          title="تحديث الرصيد"
          className="text-slate-600 hover:text-blue-400 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex items-end gap-1.5">
        <span className={`text-4xl font-bold transition-colors duration-500 ${flash ? "text-emerald-400" : "text-white"}`}>
          {balance.toLocaleString("ar-EG")}
        </span>
        <span className="text-slate-400 text-sm mb-1">نقطة</span>
      </div>

      <p className="text-lg font-semibold text-emerald-400">
        ${(balance / 100).toFixed(2)}
      </p>

      {/* ── Progress bar toward withdrawal minimum ── */}
      {(() => {
        const MIN = 100;
        const pct = Math.min(100, Math.round((balance / MIN) * 100));
        const canWithdraw = balance >= MIN;
        return (
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">الحد الأدنى للسحب</span>
              {canWithdraw
                ? <span className="text-emerald-400 font-bold animate-pulse">🎉 يمكنك السحب الآن!</span>
                : <span className="text-slate-400">{balance} / {MIN} نقطة</span>
              }
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${canWithdraw ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {!canWithdraw && (
              <p className="text-[11px] text-slate-500">بقي <span className="text-blue-400 font-medium">{MIN - balance}</span> نقطة لتتمكن من السحب</p>
            )}
          </div>
        );
      })()}

      {flash && (
        <p className="text-emerald-400 text-xs font-medium animate-pulse">✓ تم تحديث الرصيد</p>
      )}

      {error && (
        <p className="text-red-400 text-xs" title={error}>⚠ تعذّر تحميل الرصيد</p>
      )}

      <p className="text-[11px] text-slate-600 mt-1">
        100 نقطة = $1.00
      </p>
      <Link
        href="/withdraw"
        className="mt-2 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-150 shadow-lg shadow-blue-500/20"
      >
        <Wallet className="w-4 h-4" />
        سحب الأرباح
      </Link>
    </div>
  );
}

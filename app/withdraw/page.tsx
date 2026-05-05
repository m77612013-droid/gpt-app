"use client";

import LogoBrand from "@/app/components/LogoBrand";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { submitWithdrawal } from "./actions";
import { Wallet, Loader2, CheckCircle2, ArrowRight, Coins } from "lucide-react";

type PaymentMethod = "ShamCard" | "PayPal" | "Syriatel Cash" | "MTN Cash" | "USDT";

interface Method {
  value: PaymentMethod;
  label: string;
  sublabel: string;
  placeholder: string;
  icon: string;
  gradient: string;
  glow: string;
  border: string;
}

const METHODS: Method[] = [
  {
    value: "ShamCard",
    label: "ShamCard",
    sublabel: "بطاقة شام الإلكترونية",
    placeholder: "رقم البطاقة أو البريد المرتبط",
    icon: "💳",
    gradient: "from-emerald-500/20 to-teal-500/10",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/30",
  },
  {
    value: "PayPal",
    label: "PayPal",
    sublabel: "سحب دولي فوري",
    placeholder: "البريد الإلكتروني لحساب PayPal",
    icon: "🌐",
    gradient: "from-blue-500/20 to-sky-500/10",
    glow: "shadow-blue-500/20",
    border: "border-blue-500/30",
  },
  {
    value: "Syriatel Cash",
    label: "Syriatel Cash",
    sublabel: "محفظة Syriatel الذكية",
    placeholder: "رقم هاتف Syriatel",
    icon: "📱",
    gradient: "from-red-500/20 to-rose-500/10",
    glow: "shadow-red-500/20",
    border: "border-red-500/30",
  },
  {
    value: "MTN Cash",
    label: "MTN Cash",
    sublabel: "تحويل عبر شبكة MTN",
    placeholder: "رقم هاتف MTN",
    icon: "💛",
    gradient: "from-yellow-500/20 to-amber-500/10",
    glow: "shadow-yellow-500/20",
    border: "border-yellow-500/30",
  },
  {
    value: "USDT",
    label: "USDT",
    sublabel: "عملة مستقرة · TRC-20",
    placeholder: "عنوان محفظة USDT (TRC-20)",
    icon: "🪙",
    gradient: "from-teal-500/20 to-cyan-500/10",
    glow: "shadow-teal-500/20",
    border: "border-teal-500/30",
  },
];

const MIN_POINTS = 100;

export default function WithdrawPage() {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("ShamCard");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Load user balance on mount
  useEffect(() => {
    async function loadBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("balance_points")
        .eq("id", user.id)
        .single();
      setBalance(data?.balance_points ?? 0);
      setBalanceLoading(false);
    }
    loadBalance();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pts = parseFloat(amount);

    // Client-side pre-check for UX only — real check happens server-side
    if (isNaN(pts) || pts < MIN_POINTS) {
      setError(`الحد الأدنى للسحب هو ${MIN_POINTS} نقطة.`);
      return;
    }

    setLoading(true);

    // Server Action — validates balance against real DB, never trusts client
    const result = await submitWithdrawal(pts, method, account);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "حدث خطأ غير متوقع.");
      return;
    }

    setSuccess(true);
  }

  const selectedMethod = METHODS.find((m) => m.value === method)!;

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[600px] bg-blue-600/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Nav removed — global Header handles navigation */}

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-6">

        {/* ── Balance Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-blue-600/10 border border-blue-500/25 p-6 flex items-center justify-between gap-4">
          <div className="absolute inset-0 bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs text-blue-300/70 font-medium uppercase tracking-widest mb-1">رصيدك الحالي</p>
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-slate-500 text-sm">جارٍ التحميل…</span>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white tabular-nums">
                    {(balance ?? 0).toLocaleString("ar-EG")}
                  </span>
                  <span className="text-blue-300/70 text-sm mb-1">نقطة</span>
                </div>
                <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                  ${((balance ?? 0) / 100).toFixed(2)}
                </p>
              </>
            )}
            <p className="text-xs text-slate-500 mt-1">
              الحد الأدنى للسحب: <span className="text-blue-400">{MIN_POINTS} نقطة</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              معدل التحويل: <span className="text-slate-500">100 نقطة = $1.00</span>
            </p>

            {/* ── Progress bar ── */}
            {!balanceLoading && (
              <div className="mt-3 w-full flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  {(balance ?? 0) >= MIN_POINTS
                    ? <span className="text-emerald-400 font-bold">🎉 يمكنك السحب الآن!</span>
                    : <span className="text-slate-500">بقي <span className="text-blue-400 font-medium">{MIN_POINTS - (balance ?? 0)}</span> نقطة</span>
                  }
                  <span className="text-slate-600">{Math.min(100, Math.round(((balance ?? 0) / MIN_POINTS) * 100))}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${(balance ?? 0) >= MIN_POINTS ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(100, ((balance ?? 0) / MIN_POINTS) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="relative w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
            <Coins className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-blue-500/20 p-7 sm:p-9">

          {success ? (
            <div className="text-center py-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center shadow-lg shadow-green-500/10">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-white text-xl mb-1">تم استلام طلبك! 🎉</p>
                <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                  سيتم مراجعة طلب السحب عبر{" "}
                  <span className="text-white font-medium">{selectedMethod.label}</span>{" "}
                  ومعالجته خلال ٢٤–٤٨ ساعة.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                العودة إلى لوحة التحكم
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">

              {/* ── Method cards ── */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-slate-400">اختر طريقة الاستلام</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {METHODS.map((m) => {
                    const isActive = method === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => { setMethod(m.value); setAccount(""); setError(null); }}
                        className={[
                          "group relative flex items-center gap-4 p-4 rounded-2xl border text-start transition-all duration-200",
                          isActive
                            ? `bg-gradient-to-l ${m.gradient} ${m.border} shadow-lg ${m.glow} scale-[1.01]`
                            : "bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/8 hover:scale-[1.005]",
                        ].join(" ")}
                      >
                        {isActive && (
                          <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
                        )}
                        <span className="text-2xl leading-none">{m.icon}</span>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm leading-none mb-0.5 transition-colors ${isActive ? "text-white" : "text-slate-300"}`}>
                            {m.label}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{m.sublabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Account input (key change triggers smooth remount) ── */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">
                  معلومات حساب{" "}
                  <span className="text-white">{selectedMethod.label}</span>
                </label>
                <input
                  key={method}
                  type="text"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={selectedMethod.placeholder}
                  dir="ltr"
                  className="w-full rounded-xl border border-blue-500/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* ── Amount input ── */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-400">عدد النقاط المراد سحبها</label>
                  {balance !== null && balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(balance))}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      سحب الكل
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min={MIN_POINTS}
                  max={balance ?? undefined}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${MIN_POINTS} كحد أدنى`}
                  dir="ltr"
                  className="w-full rounded-xl border border-blue-500/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200"
                />
                {amount && balance !== null && parseFloat(amount) > balance && (
                  <p className="text-xs text-red-400 mt-0.5">النقاط المطلوبة تتجاوز رصيدك الحالي</p>
                )}
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                  <span className="shrink-0">⚠</span>
                  {error}
                </div>
              )}

              {/* ── Note ── */}
              <div className="flex items-start gap-3 bg-white/5 border border-blue-500/10 rounded-xl px-4 py-3">
                <Wallet className="w-4 h-4 text-blue-400/60 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  سيتم خصم النقاط تلقائياً عند الموافقة على طلبك. وقت المعالجة المعتاد{" "}
                  <span className="text-slate-400">٢٤–٤٨ ساعة</span>.
                </p>
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={loading || balanceLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ الإرسال…
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    تقديم طلب السحب
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

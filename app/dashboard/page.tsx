import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LogoBrand from "@/app/components/LogoBrand";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  Wallet,
} from "lucide-react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  offer_name: string;
  points_earned: number;
  status: "pending" | "completed" | "rejected";
  created_at: string;
}

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Transaction["status"] }) {
  const map = {
    completed: {
      label: "مكتمل",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      cls: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    pending: {
      label: "قيد الانتظار",
      icon: <Clock className="w-3.5 h-3.5" />,
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    rejected: {
      label: "مرفوض",
      icon: <XCircle className="w-3.5 h-3.5" />,
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };
  const { label, icon, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

// ── Dashboard (Server Component) ─────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, balance_points, total_earned")
    .eq("id", user.id)
    .single();

  // Fetch recent transactions (last 20)
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, offer_name, points_earned, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const balance = profile?.balance_points ?? 0;
  const totalEarned = profile?.total_earned ?? 0;
  const fullName = profile?.full_name || user.email;
  const txList: Transaction[] = transactions ?? [];

  const completedCount = txList.filter((t) => t.status === "completed").length;

  return (
    <main className="min-h-screen bg-slate-950 relative">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
      </div>

      {/* ── Top nav ── */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-blue-500/15 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <LogoBrand size="sm" />
          <div className="flex items-center gap-3">
            <Link
              href="/withdraw"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              سحب الأرباح
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                formAction={async () => {
                  "use server";
                  const s = await createSupabaseServerClient();
                  await s.auth.signOut();
                  redirect("/login");
                }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        {/* ── Welcome ── */}
        <div>
          <p className="text-sm text-slate-500 mb-1">مرحباً،</p>
          <h1 className="text-2xl font-bold text-white">{fullName}</h1>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Balance */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-blue-500/20 p-6 flex flex-col gap-2 sm:col-span-1 hover:border-blue-400/40 transition-colors">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">رصيدك الحالي</p>
            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold text-white">{balance.toLocaleString("ar-EG")}</span>
              <span className="text-slate-400 text-sm mb-1">نقطة</span>
            </div>
            <p className="text-[11px] text-slate-600">
              1000 نقطة = $1.00 · الحد الأدنى للسحب 500 نقطة
            </p>
            <Link
              href="/withdraw"
              className="mt-2 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-150 shadow-lg shadow-blue-500/20"
            >
              <Wallet className="w-4 h-4" />
              سحب الأرباح
            </Link>
          </div>

          {/* Total earned */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-blue-500/20 p-6 flex flex-col gap-2 hover:border-blue-400/40 transition-colors">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">إجمالي المكتسب</p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-green-400">{totalEarned.toLocaleString("ar-EG")}</span>
              <span className="text-slate-400 text-sm mb-1">نقطة</span>
            </div>
            <p className="text-xs text-slate-500">من {txList.length} معاملة</p>
          </div>

          {/* Completed offers */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-blue-500/20 p-6 flex flex-col gap-2 hover:border-blue-400/40 transition-colors">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">عروض مكتملة</p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-blue-400">{completedCount}</span>
              <span className="text-slate-400 text-sm mb-1">عرض</span>
            </div>
            <Link href="/offers" className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors">استعرض المزيد ←</Link>
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-blue-500/20 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-blue-500/10">
            <TrendingUp className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
            <h2 className="font-semibold text-white text-sm">آخر المعاملات</h2>
          </div>

          {txList.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-600 text-sm">لا توجد معاملات بعد — أكمل أول عرض!</p>
              <Link href="/offers" className="mt-4 inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">تصفّح العروض ←</Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {txList.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.offer_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-4">
                    <StatusBadge status={tx.status} />
                    <span className="text-sm font-bold text-green-400">+{tx.points_earned.toLocaleString("ar-EG")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

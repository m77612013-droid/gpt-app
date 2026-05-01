import { createAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

// Reads from ADMIN_EMAIL env var (set in Vercel Dashboard / .env.local)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "aboutgamaa@gmail.com";

async function getStats() {
  const admin = createAdminClient();

  // List all users
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const totalUsers = authData?.users?.length ?? 0;

  // Total points in circulation
  const { data: pointsData } = await admin
    .from("profiles")
    .select("balance_points");
  const totalPoints = (pointsData ?? []).reduce(
    (sum: number, r: { balance_points: number }) => sum + (r.balance_points ?? 0),
    0
  );

  // Pending withdrawals count
  const { count: pendingCount } = await admin
    .from("withdrawals")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Total amount completed (approved)
  const { data: approvedData } = await admin
    .from("withdrawals")
    .select("amount")
    .eq("status", "completed");
  const totalWithdrawn = (approvedData ?? []).reduce(
    (sum: number, r: { amount: number }) => sum + (r.amount ?? 0),
    0
  );

  return { totalUsers, totalPoints, pendingCount: pendingCount ?? 0, totalWithdrawn };
}

export default async function AdminOverviewPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) redirect("/");

  const { totalUsers, totalPoints, pendingCount, totalWithdrawn } = await getStats();

  const stats = [
    { label: "إجمالي المستخدمين", value: totalUsers.toLocaleString(), icon: "👥", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
    { label: "النقاط المتداولة", value: totalPoints.toLocaleString(), icon: "🪙", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
    { label: "طلبات سحب معلقة", value: pendingCount.toLocaleString(), icon: "⏳", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
    { label: "إجمالي المسحوب (نقطة)", value: totalWithdrawn.toLocaleString(), icon: "✅", color: "from-emerald-500/20 to-green-500/20 border-emerald-500/30" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">نظرة عامة</h1>
        <p className="text-slate-400 mt-1">إحصائيات المنصة الكاملة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-gradient-to-br ${s.color} backdrop-blur-md border rounded-2xl p-6`}
          >
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-slate-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/admin/users"
          className="bg-white/5 border border-blue-500/20 rounded-2xl p-6 hover:bg-white/10 transition-all group"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">إدارة المستخدمين</div>
          <div className="text-slate-500 text-sm mt-1">عرض وتعديل أرصدة المستخدمين</div>
        </a>
        <a
          href="/admin/withdrawals"
          className="bg-white/5 border border-blue-500/20 rounded-2xl p-6 hover:bg-white/10 transition-all group"
        >
          <div className="text-2xl mb-2">💸</div>
          <div className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">طلبات السحب</div>
          <div className="text-slate-500 text-sm mt-1">قبول أو رفض طلبات السحب المعلقة</div>
        </a>
      </div>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import WithdrawalActions from "./WithdrawalActions";

// Reads from ADMIN_EMAIL env var (set in Vercel Dashboard / .env.local)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "aboutgamaa@gmail.com";

interface Withdrawal {
  id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: string;
  created_at: string;
  profiles: { email: string; full_name: string } | null;
}

const STATUS_FILTER: Record<string, string> = {
  all: "الكل",
  pending: "معلق",
  completed: "مكتمل",
  rejected: "مرفوض",
};

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) redirect("/");

  const { status = "pending", q } = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from("withdrawals")
    .select("id, amount, payment_method, account_details, status, created_at, profiles(email, full_name)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  let withdrawals: Withdrawal[] = (data as unknown as Withdrawal[]) ?? [];

  if (q) {
    withdrawals = withdrawals.filter((w) =>
      w.profiles?.email?.includes(q) || w.account_details?.includes(q)
    );
  }

  const METHOD_LABELS: Record<string, string> = {
    shamcard: "شام كارد",
    paypal: "PayPal",
    syriatel: "سيريتل كاش",
    mtn: "MTN كاش",
    usdt: "USDT (TRC20)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">طلبات السحب</h1>
        <p className="text-slate-400 mt-1">{withdrawals.length} طلب</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {Object.entries(STATUS_FILTER).map(([val, label]) => (
          <a
            key={val}
            href={`/admin/withdrawals?status=${val}${q ? `&q=${q}` : ""}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              status === val
                ? "bg-blue-600/30 text-blue-300 border-blue-500/40"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            }`}
          >
            {label}
          </a>
        ))}

        <form method="GET" className="flex gap-2 mr-auto">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="بحث بالإيميل أو الحساب..."
            className="bg-white/5 border border-blue-500/20 rounded-xl px-4 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-400 transition-colors w-56"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm transition-colors">
            بحث
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-blue-500/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-500/20 text-slate-400">
                <th className="text-right px-6 py-4 font-medium">المستخدم</th>
                <th className="text-right px-6 py-4 font-medium">المبلغ (نقطة)</th>
                <th className="text-right px-6 py-4 font-medium">الطريقة</th>
                <th className="text-right px-6 py-4 font-medium">الحساب</th>
                <th className="text-right px-6 py-4 font-medium">التاريخ</th>
                <th className="text-right px-6 py-4 font-medium">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w, i) => (
                <tr
                  key={w.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                >
                  <td className="px-6 py-4">
                    <div className="text-white font-medium text-xs">{w.profiles?.full_name || "—"}</div>
                    <div className="text-slate-500 font-mono text-xs mt-0.5">{w.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-yellow-400 font-bold">{(w.amount ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-xs">
                    {METHOD_LABELS[w.payment_method] ?? w.payment_method}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{w.account_details}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(w.created_at).toLocaleDateString("ar-SY")}
                  </td>
                  <td className="px-6 py-4">
                    <WithdrawalActions id={w.id} status={w.status} />
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-12">
                    لا توجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

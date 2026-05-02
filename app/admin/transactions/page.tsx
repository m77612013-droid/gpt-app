import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "aboutgamaa@gmail.com";

export default async function AdminTransactionsPage() {
  // Auth guard
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) redirect("/");

  const admin = createAdminClient();

  // Fetch last 50 transactions with user email
  const { data: transactions, error } = await admin
    .from("transactions")
    .select("id, user_id, offer_name, points_earned, provider, transaction_id, status, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-8 text-red-400">
        خطأ في جلب البيانات: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">سجل العمليات</h1>
        <p className="text-slate-400 text-sm mt-1">آخر 50 عملية postback وصلت للموقع</p>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-slate-300 font-semibold">لا توجد عمليات بعد</p>
          <p className="text-slate-500 text-sm mt-2">
            لم يصل أي postback للموقع حتى الآن.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">العرض</th>
                  <th className="px-4 py-3 text-right">المزود</th>
                  <th className="px-4 py-3 text-right">النقاط</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">TX ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {transactions.map((tx: any) => {
                  const date = new Date(tx.created_at);
                  const dateStr = date.toLocaleDateString("ar-SY", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("ar-SY", {
                    hour: "2-digit", minute: "2-digit",
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-xs">
                        {dateStr} {timeStr}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        <div>{(tx.profiles as any)?.email ?? "—"}</div>
                        <div className="text-slate-600 font-mono text-[10px] truncate max-w-[140px]">
                          {tx.user_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white max-w-[160px] truncate">
                        {tx.offer_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                          {tx.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-bold text-right">
                        +{tx.points_earned.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          tx.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                            : tx.status === "pending"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                            : "bg-red-500/15 text-red-300 border-red-500/25"
                        }`}>
                          {tx.status === "completed" ? "مكتمل" : tx.status === "pending" ? "معلق" : "مرفوض"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[10px] max-w-[120px] truncate">
                        {tx.transaction_id ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-700/50 text-slate-500 text-xs text-left">
            إجمالي النتائج: {transactions.length}
          </div>
        </div>
      )}
    </div>
  );
}

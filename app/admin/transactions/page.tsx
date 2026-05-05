import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Reads from ADMIN_EMAIL env var (set in Vercel Dashboard / .env.local)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "aboutgamaa@gmail.com";

export default async function AdminTransactionsPage() {
  // Auth guard
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) redirect("/");

  const admin = createAdminClient();

  // Fetch last 50 successful transactions with user email
  const { data: transactions, error } = await admin
    .from("transactions")
    .select("id, user_id, offer_name, points_earned, status, created_at, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch last 30 postback log entries (all statuses — for failure monitoring)
  const { data: logs } = await admin
    .from("postback_logs")
    .select("id, received_at, provider, user_id_raw, payout_raw, status, error_message, points_credited, ip_address")
    .order("received_at", { ascending: false })
    .limit(30);

  if (error) {
    return (
      <div className="p-8 text-red-400">
        خطأ في جلب البيانات: {error.message}
      </div>
    );
  }

  const errorLogs = (logs ?? []).filter((l: any) => l.status === "error" || l.status === "rejected");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">سجل العمليات</h1>
        <p className="text-slate-400 text-sm mt-1">آخر 50 عملية postback ناجحة + سجل الأخطاء</p>
      </div>

      {/* ── Failure alert banner ── */}
      {errorLogs.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-red-300 font-semibold text-sm mb-3">
            ⚠️ {errorLogs.length} محاولة postback فاشلة في آخر 30 عملية
          </p>
          <div className="space-y-2">
            {errorLogs.map((log: any) => (
              <div key={log.id} className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2 text-xs font-mono">
                <span className="text-red-400 font-bold">[{log.status.toUpperCase()}]</span>
                <span className="text-slate-400 mx-2">{new Date(log.received_at).toLocaleString("ar-SY")}</span>
                <span className="text-slate-300">user: {log.user_id_raw ?? "—"}</span>
                <span className="text-slate-500 mx-2">|</span>
                <span className="text-rose-300">{log.error_message ?? "—"}</span>
                <span className="text-slate-600 ml-2">IP: {log.ip_address}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Successful transactions ── */}
      {!transactions || transactions.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-slate-300 font-semibold">لا توجد عمليات بعد</p>
          <p className="text-slate-500 text-sm mt-2">
            لم يصل أي postback ناجح للموقع حتى الآن.
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
                  <th className="px-4 py-3 text-right">النقاط</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
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

      {/* ── Full postback log (all statuses) ── */}
      {logs && logs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">سجل Postback الكامل (آخر 30)</h2>
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-2 text-right">الوقت</th>
                    <th className="px-3 py-2 text-right">الحالة</th>
                    <th className="px-3 py-2 text-right">المزود</th>
                    <th className="px-3 py-2 text-right">User ID</th>
                    <th className="px-3 py-2 text-right">المبلغ</th>
                    <th className="px-3 py-2 text-right">النقاط</th>
                    <th className="px-3 py-2 text-right">الخطأ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log: any) => (
                    <tr key={log.id} className={`transition-colors ${
                      log.status === "success"   ? "hover:bg-emerald-500/5" :
                      log.status === "duplicate" ? "hover:bg-amber-500/5" :
                                                   "hover:bg-red-500/5"
                    }`}>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {new Date(log.received_at).toLocaleString("ar-SY")}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "success"   ? "bg-emerald-500/20 text-emerald-300" :
                          log.status === "duplicate" ? "bg-amber-500/20 text-amber-300" :
                          log.status === "rejected"  ? "bg-orange-500/20 text-orange-300" :
                                                       "bg-red-500/20 text-red-300"
                        }`}>
                          {log.status === "success" ? "✅ نجاح" :
                           log.status === "duplicate" ? "⟳ مكرر" :
                           log.status === "rejected" ? "🚫 مرفوض" : "❌ خطأ"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{log.provider}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[120px]" title={log.user_id_raw}>
                        {log.user_id_raw ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{log.payout_raw ?? "—"}</td>
                      <td className="px-3 py-2 text-emerald-400">
                        {log.points_credited ? `+${log.points_credited}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-red-400 max-w-[200px] truncate" title={log.error_message}>
                        {log.error_message ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import EditBalanceForm from "./EditBalanceForm";

// Reads from ADMIN_EMAIL env var (set in Vercel Dashboard / .env.local)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "aboutgamaa@gmail.com";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  balance_points: number;
  created_at: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) redirect("/");

  const { q } = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select("id, email, full_name, balance_points, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("email", `%${q}%`);
  }

  const { data: profiles } = await query;
  const users: Profile[] = profiles ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">المستخدمون</h1>
        <p className="text-slate-400 mt-1">{users.length} مستخدم مسجل</p>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="ابحث بالبريد الإلكتروني..."
          className="flex-1 bg-white/5 border border-blue-500/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
        >
          بحث
        </button>
        {q && (
          <a
            href="/admin/users"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-medium transition-colors"
          >
            مسح
          </a>
        )}
      </form>

      {/* Table */}
      <div className="bg-white/5 border border-blue-500/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-500/20 text-slate-400">
                <th className="text-right px-6 py-4 font-medium">الاسم</th>
                <th className="text-right px-6 py-4 font-medium">البريد الإلكتروني</th>
                <th className="text-right px-6 py-4 font-medium">الرصيد (نقطة)</th>
                <th className="text-right px-6 py-4 font-medium">تاريخ التسجيل</th>
                <th className="text-right px-6 py-4 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                >
                  <td className="px-6 py-4 text-white font-medium">{u.full_name || "—"}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-yellow-400 font-bold">{(u.balance_points ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString("ar-SY")}
                  </td>
                  <td className="px-6 py-4">
                    <EditBalanceForm userId={u.id} currentBalance={u.balance_points ?? 0} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-12">
                    لا يوجد مستخدمون
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

import { redirect } from "next/navigation";
import { TrendingUp, Shield } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOfferwallSettings } from "@/app/admin/actions";
import OffersClient from "./OffersClient";

// Force server-render on every request — no static/ISR cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OffersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/offers");

  const s = await getOfferwallSettings().catch(() => null);

  const cpagripId   = s?.cpagrip_app_id || process.env.NEXT_PUBLIC_CPAGRIP_APP_ID  || "";
  const adgemId     = s?.adgem_app_id   || process.env.NEXT_PUBLIC_ADGEM_APP_ID    || "32530";

  const userId      = user.id;
  const adgemUrl    = `https://wall.adgem.com/?appid=${adgemId}&playerid=${encodeURIComponent(userId)}`;

  return (
    <main className="min-h-screen bg-slate-950 relative">
      {/* خلفية متوهجة */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[20%] w-[600px] h-[500px] bg-violet-600/6 rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-blue-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[50%] w-[500px] h-[350px] bg-emerald-600/5 rounded-full blur-[130px]" />
      </div>

      {/* المحتوى */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* عنوان الصفحة */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" strokeWidth={2} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{"مركز التكسّب"}</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              {"اختر طريقتك وابدأ الربح الآن — كل النقاط تُضاف تلقائياً لحسابك فور الإتمام"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full shrink-0">
            <Shield className="w-3.5 h-3.5" />
            {"منصة موثوقة 100%"}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "شبكات اعلانية", value: "2"         },
            { label: "اقصى مكافاة",   value: "600 نقطة" },
            { label: "وقت الاضافة",   value: "فورا"      },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 text-center"
            >
              <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* مكون العميل - البطاقات والنافذة المنبثقة */}
        <OffersClient
          userId={userId}
          cpagripScriptId={cpagripId}
          adgemUrl={adgemUrl}
        />
      </div>
    </main>
  );
}
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Shield } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOfferwallSettings } from "@/app/admin/actions";
import OffersClient from "./OffersClient";
import LogoBrand from "@/app/components/LogoBrand";

export default async function OffersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/offers");

  // Read offerwall IDs from DB (admin-managed), fall back to env vars
  const s = await getOfferwallSettings().catch(() => null);

  const monlixId    = s?.monlix_app_id         || process.env.NEXT_PUBLIC_MONLIX_APP_ID    || "";
  const cpalId      = s?.cpalead_app_id         || process.env.NEXT_PUBLIC_CPALEAD_APP_ID   || "";
  const adgateId    = s?.adgate_app_id          || process.env.NEXT_PUBLIC_ADGATE_APP_ID    || "";
  const lootablyId  = s?.lootably_placement_id  || process.env.NEXT_PUBLIC_LOOTABLY_PID     || "";
  const adscendId   = s?.adscend_app_id         || process.env.NEXT_PUBLIC_ADSCEND_APP_ID   || "";
  const cpagripId   = s?.cpagrip_app_id         || process.env.NEXT_PUBLIC_CPAGRIP_APP_ID   || "";

  const userId = user.id;

  const monlixUrl   = monlixId   ? `https://offers.monlix.com/?app=${monlixId}&user=${encodeURIComponent(userId)}` : "";
  const cpalUrl     = cpalId     ? `https://cpalead.com/dashboard/reports/campaign_iframe.php?id=${cpalId}&subid=${encodeURIComponent(userId)}` : "";
  const adgateUrl   = adgateId   ? `https://wall.adgaterewards.com/${adgateId}/?uid=${encodeURIComponent(userId)}` : "";
  const lootablyUrl = lootablyId ? `https://wall.lootably.com/?placementID=${lootablyId}&uid=${encodeURIComponent(userId)}` : "";
  const adscendUrl  = adscendId  ? `https://offerwall.adscendmedia.com/offers.php?app_id=${adscendId}&sub_id=${encodeURIComponent(userId)}` : "";
  // CPAGrip uses a JS script tag (not an iframe) — we pass the raw ID + userId to CPAGripPanel
  const cpagripScriptId = cpagripId; // e.g. "1893275"

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

        {/* شريط الاحصاءات */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "شبكات اعلانية", value: "6+" },
            { label: "اقصى مكافاة",   value: "500 نقطة" },
            { label: "وقت الاضافة",   value: "فورا" },
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
          monlixUrl={monlixUrl}
          cpalUrl={cpalUrl}
          adgateUrl={adgateUrl}
          lootablyUrl={lootablyUrl}
          adscendUrl={adscendUrl}
          cpagripScriptId={cpagripScriptId}
        />
      </div>
    </main>
  );
}
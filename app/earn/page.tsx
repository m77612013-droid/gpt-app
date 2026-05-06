import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Coins, TrendingUp, Shield, Zap } from "lucide-react";
import GemiWallEmbed from "./GemiWallEmbed";

export const dynamic = "force-dynamic";

export default async function EarnPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated visitors to login, then back here
  if (!user) redirect("/login?redirect=/earn");

  const iframeSrc = `https://gemiwall.com/?placementid=597079498228802fb9ffeb7f&userid=${encodeURIComponent(user.id)}`;

  return (
    <main className="min-h-screen bg-slate-950 relative">

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25">
              <Coins className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              اكسب النقاط
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            أكمل العروض والمهام أدناه واحصل على نقاط فورية تُضاف إلى رصيدك.
          </p>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { icon: <Zap        className="w-4 h-4" />, label: "رصيد فوري",     color: "text-amber-400",   bg: "bg-amber-500/10  border-amber-500/20"  },
            { icon: <TrendingUp className="w-4 h-4" />, label: "عروض متجددة",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { icon: <Shield     className="w-4 h-4" />, label: "دفع آمن",       color: "text-violet-400",  bg: "bg-violet-500/10  border-violet-500/20"  },
          ].map(({ icon, label, color, bg }) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium ${color} ${bg}`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* ── GemiWall iframe (client component) ─────────────────────── */}
        <GemiWallEmbed src={iframeSrc} />

      </div>
    </main>
  );
}

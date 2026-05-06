"use client";

import { useState } from "react";
import { ExternalLink, Sparkles, ChevronRight, Gift, Zap, CheckCircle2 } from "lucide-react";

interface Props {
  userId: string;
}

const PLACEMENT_ID = "597079498228802fb9ffeb7f";

export default function GemiWallEmbed({ userId }: Props) {
  const [clicked, setClicked] = useState(false);

  const wallUrl =
    `https://gemiwall.com/?placementid=${PLACEMENT_ID}&userid=${encodeURIComponent(userId)}`;

  function openWall() {
    // noreferrer strips the Referer header AND sets noopener ó GemiWall
    // receives the request as a direct visit with no origin domain visible.
    window.open(wallUrl, "_blank", "noreferrer,noopener");
    setClicked(true);
  }

  return (
    <div className="space-y-6">

      {/* Hero launch card */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40">

        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6 px-6 py-14 sm:py-20">

          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-500/15 border border-violet-500/25 shadow-lg shadow-violet-500/10">
            <Sparkles className="w-9 h-9 text-violet-300" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              „—ﬂ“ «·⁄—Ê÷
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-md">
              √ﬂ„· «” ÿ·«⁄« ° «·⁄«»° Ê„Â«„ »”Ìÿ… Ê«ﬂ”» ‰ﬁ«ÿ«  ÕÊ·Â« ≈·Ï —’Ìœ ÕﬁÌﬁÌ.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: <Zap className="w-3.5 h-3.5" />,          label: "‰ﬁ«ÿ ›Ê—Ì…" },
              { icon: <Gift className="w-3.5 h-3.5" />,         label: "„∆«  «·⁄—Ê÷" },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "—’Ìœ ¬„‰" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={openWall}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-semibold text-base sm:text-lg shadow-xl shadow-violet-500/25 border border-violet-400/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <ExternalLink className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
            «› Õ „—ﬂ“ «·⁄—Ê÷
            <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {clicked && (
            <p className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
               „ › Õ „—ﬂ“ «·⁄—Ê÷ ›Ì  »ÊÌ» ÃœÌœ
            </p>
          )}

          <p className="text-xs text-slate-600 max-w-sm">
            ”Ìı› Õ „—ﬂ“ «·⁄—Ê÷ ›Ì ‰«›–… „‰›’·…. √ﬂ„· √Ì ⁄—÷ Ê”Ìı÷«› —’Ìœﬂ  ·ﬁ«∆Ì«.
          </p>

        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { step: "1", title: "«› Õ „—ﬂ“ «·⁄—Ê÷", desc: "«÷€ÿ «·“— √⁄·«Â ·⁄—÷ Ã„Ì⁄ «·⁄—Ê÷ «·„ «Õ…" },
          { step: "2", title: "√ﬂ„· ⁄—÷«",       desc: "«Œ — ⁄—÷« Ê« »⁄ «· ⁄·Ì„«  Õ Ï «·‰Â«Ì…" },
          { step: "3", title: "«” ·„ ‰ﬁ«ÿﬂ",      desc: "Ìı÷«› —’Ìœﬂ ›Ê— «· Õﬁﬁ „‰ «·≈ „«„" },
        ].map(({ step, title, desc }) => (
          <div
            key={step}
            className="flex gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/[0.06]"
          >
            <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-300 font-bold text-sm">
              {step}
            </span>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

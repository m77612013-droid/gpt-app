"use client";

import { useState } from "react";
import { RefreshCw, Maximize2, Loader2 } from "lucide-react";

interface Props {
  src: string;
}

export default function GemiWallEmbed({ src }: Props) {
  const [key, setKey]         = useState(0);   // increment to force iframe reload
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`
        relative rounded-2xl border border-white/8 bg-slate-900/60
        backdrop-blur-sm overflow-hidden transition-all duration-300
        ${expanded ? "fixed inset-4 z-50 rounded-2xl" : "w-full"}
      `}
    >

      {/* \u2500\u2500 Toolbar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-slate-800/50">
        <div className="flex items-center gap-2">
          {/* Traffic-light dots */}
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-amber-500/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-xs text-slate-400 font-mono hidden sm:inline">
            gemiwall.com
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Reload */}
          <button
            onClick={() => { setLoading(true); setKey(k => k + 1); }}
            title="إعادة تحميل"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Expand / collapse */}
          <button
            onClick={() => setExpanded(e => !e)}
            title={expanded ? "تصغير" : "تكبير"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* \u2500\u2500 Loading overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      {loading && (
        <div className="absolute inset-0 top-[41px] z-10 flex flex-col items-center justify-center bg-slate-900/90 gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-sm">جارٍ تحميل العروض…</p>
        </div>
      )}

      {/* \u2500\u2500 Iframe \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
      <iframe
        key={key}
        src={src}
        title="GemiWall Offerwall"
        width="100%"
        // Tall on desktop; fills remaining viewport height when expanded
        style={{ height: expanded ? "calc(100vh - 100px)" : "860px", display: "block" }}
        onLoad={() => setLoading(false)}
        // allow="payment" lets certain offer flows open in-frame without prompts
        allow="payment; clipboard-write"
        // Prevent the iframe from navigating the top-level page
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
}

"use client";

/**
 * CPAGripPanel — embeds the full CPAGrip Offer Wall (20+ live offers) directly
 * inside the parent modal via an <iframe>.
 *
 * • subid (u=userId) is forwarded so every completed offer postbacks to the
 *   correct Supabase user automatically.
 * • A branded "Jana Rewards" spinner overlays the iframe while it loads.
 * • iframeKey (from parent's reload button) remounts the iframe on demand.
 *
 * Endpoint:  https://singingfiles.com/show.php?l=1&id=SCRIPT_ID&u=USER_ID
 */

import { useState } from "react";

interface Props {
  scriptId: string;
  userId: string;
  iframeKey?: number;
}

export default function CPAGripPanel({ scriptId, userId, iframeKey = 0 }: Props) {
  const [loading, setLoading] = useState(true);

  /* ── Not configured ─────────────────────────────────────────────────── */
  if (!scriptId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mb-1">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-slate-300 text-sm font-semibold">لم يتم تهيئة CPAGrip بعد</p>
        <p className="text-slate-500 text-xs leading-relaxed">
          اذهب إلى{" "}
          <span className="text-blue-400 font-mono">/admin/offerwalls</span>{" "}
          وأضف معرّف CPAGrip Script ID.
        </p>
      </div>
    );
  }

  const wallUrl =
    `https://singingfiles.com/show.php` +
    `?l=1` +
    `&id=${encodeURIComponent(scriptId)}` +
    `&u=${encodeURIComponent(userId)}`;

  return (
    /* Outer wrapper — fills whatever height the modal gives us */
    <div className="relative flex-1 w-full overflow-hidden bg-slate-950">

      {/* ── Branded loading overlay ───────────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-slate-950">
          {/* Spinning ring */}
          <div className="relative w-16 h-16">
            {/* Static track */}
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            {/* Animated arc */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            {/* Inner glow dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/60 animate-pulse" />
            </div>
          </div>

          {/* Brand label */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-white tracking-wide">Jana Rewards</span>
            <span className="text-xs text-slate-500">جارٍ تحميل العروض…</span>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CPAGrip Offer Wall iframe ─────────────────────────────────── */}
      <iframe
        key={iframeKey}
        src={wallUrl}
        title="CPAGrip Offer Wall — Jana Rewards"
        onLoad={() => setLoading(false)}
        className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        /*
         * Sandbox permissions explained:
         *   allow-scripts                        CPAGrip wall is JS-driven
         *   allow-same-origin                    CPAGrip needs its own cookies / session
         *   allow-forms                          survey & sign-up flows inside offers
         *   allow-popups                         some offers open a confirmation pop-up
         *   allow-popups-to-escape-sandbox       lets offer landing pages behave normally
         *   allow-top-navigation-by-user-activation
         *       only a real user click can navigate the top frame — prevents silent
         *       redirects away from janarewards.xyz
         */
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
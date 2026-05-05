"use client";
// build: 2026-05-05
import { useState, useCallback } from "react";
import CPAGripPanel from "./CPAGripPanel";
import {
  ClipboardList,
  Smartphone,
  Gamepad2,
  Play,
  Zap,
  TrendingUp,
  Shield,
  Flame,
  Star,
  X,
  Maximize2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Offer definition ─────────────────────────────────────────────────────────
interface Offer {
  id: string;
  provider: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  gradient: string;         // border / glow color
  iconGlow: string;         // icon background
  iconColor: string;
  maxPoints: string;
  badge?: { label: string; type: "trending" | "highpaying" | "new" | "hot" };
  iframeUrl: string;        // iframe-based offerwalls
  scriptId?: string;        // script-based offerwalls (e.g. CPAGrip)
  comingSoon?: boolean;     // hides provider details and disables the card
}

type BadgeType = NonNullable<Offer["badge"]>["type"];

const BADGE_STYLES: Record<BadgeType, string> = {
  trending:   "bg-blue-500/20   text-blue-300   border-blue-400/30",
  highpaying: "bg-amber-500/20  text-amber-300  border-amber-400/30",
  new:        "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  hot:        "bg-rose-500/20   text-rose-300   border-rose-400/30",
};

const BADGE_ICONS: Record<BadgeType, React.ReactNode> = {
  trending:   <TrendingUp className="w-3 h-3" />,
  highpaying: <Star       className="w-3 h-3" />,
  new:        <Zap        className="w-3 h-3" />,
  hot:        <Flame      className="w-3 h-3" />,
};

// ── Props from server ────────────────────────────────────────────────────────
interface Props {
  userId:          string;
  cpagripScriptId: string;
  adgemUrl:        string;
}

export default function OffersClient({
  userId,
  cpagripScriptId,
  adgemUrl,
}: Props) {
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [iframeKey,   setIframeKey]   = useState(0); // used to force reload

  const OFFERS: Offer[] = [
    // ── Active providers ────────────────────────────────────────────────────
    {
      id: "cpagrip",
      provider: "CPAGrip",
      title: "عروض متنوعة عالية الربح",
      desc: "أكمل عروضاً حصرية من CPAGrip — تثبيت تطبيقات، استطلاعات، واشتراكات بمكافآت ضخمة.",
      icon: Zap,
      gradient: "from-blue-500/30 to-indigo-500/10 border-blue-500/40",
      iconGlow:  "bg-blue-500/20",
      iconColor: "text-blue-300",
      maxPoints: "حتى 600 نقطة",
      badge: { label: "الأعلى ربحاً", type: "highpaying" },
      iframeUrl: "",          // not used — CPAGrip uses script injection
      scriptId:  cpagripScriptId,
    },
    {
      id: "adgem",
      provider: "AdGem",
      title: "عروض AdGem المتنوعة",
      desc: "أكمل عروضاً وتطبيقات واستطلاعات من شبكة AdGem واحصل على نقاطك فوراً بعد التحقق.",
      icon: Zap,
      gradient: "from-cyan-500/30 to-teal-500/10 border-cyan-500/40",
      iconGlow:  "bg-cyan-500/20",
      iconColor: "text-cyan-300",
      maxPoints: "حتى 400 نقطة",
      badge: { label: "جديد", type: "new" },
      iframeUrl: adgemUrl,
    },

    // ── Coming soon placeholders (anonymous, non-clickable) ─────────────────
    {
      id: "placeholder-1",
      provider: "", title: "", desc: "",
      icon: ClipboardList,
      gradient: "from-slate-700/20 to-slate-800/10 border-slate-700/30",
      iconGlow: "bg-slate-700/30", iconColor: "text-slate-600",
      maxPoints: "—", iframeUrl: "", comingSoon: true,
    },
    {
      id: "placeholder-2",
      provider: "", title: "", desc: "",
      icon: Smartphone,
      gradient: "from-slate-700/20 to-slate-800/10 border-slate-700/30",
      iconGlow: "bg-slate-700/30", iconColor: "text-slate-600",
      maxPoints: "—", iframeUrl: "", comingSoon: true,
    },
    {
      id: "placeholder-3",
      provider: "", title: "", desc: "",
      icon: Gamepad2,
      gradient: "from-slate-700/20 to-slate-800/10 border-slate-700/30",
      iconGlow: "bg-slate-700/30", iconColor: "text-slate-600",
      maxPoints: "—", iframeUrl: "", comingSoon: true,
    },
    {
      id: "placeholder-4",
      provider: "", title: "", desc: "",
      icon: Play,
      gradient: "from-slate-700/20 to-slate-800/10 border-slate-700/30",
      iconGlow: "bg-slate-700/30", iconColor: "text-slate-600",
      maxPoints: "—", iframeUrl: "", comingSoon: true,
    },
    {
      id: "placeholder-5",
      provider: "", title: "", desc: "",
      icon: TrendingUp,
      gradient: "from-slate-700/20 to-slate-800/10 border-slate-700/30",
      iconGlow: "bg-slate-700/30", iconColor: "text-slate-600",
      maxPoints: "—", iframeUrl: "", comingSoon: true,
    },
  ];

  const handleClose = useCallback(() => setActiveOffer(null), []);
  const handleReload = useCallback(() => setIframeKey((k) => k + 1), []);

  return (
    <>
      {/* ── Cards grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {OFFERS.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onOpen={() => { setActiveOffer(offer); setIframeKey((k) => k + 1); }}
          />
        ))}
      </div>

      {/* ── User ID chip ─────────────────────────────────────────────────────── */}
      <p className="text-center text-[11px] text-slate-600 mt-6 font-mono select-all">
        معرّفك: {userId}
      </p>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {activeOffer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
          onClick={handleClose}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Panel — full screen on mobile, modal on desktop */}
          <div
            className={`relative z-10 w-full sm:max-w-4xl h-[92vh] sm:h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden border bg-gradient-to-br ${activeOffer.gradient} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-950/80 border-b border-white/10 flex-shrink-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeOffer.iconGlow}`}>
                <activeOffer.icon className={`w-4 h-4 ${activeOffer.iconColor}`} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 leading-none mb-0.5">
                  {activeOffer.provider}
                </p>
                <p className="text-sm font-semibold text-white truncate">{activeOffer.title}</p>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handleReload}
                  title="إعادة التحميل"
                  className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <a
                  href={
                    activeOffer.scriptId
                      ? `https://singingfiles.com/show.php?l=1&id=${encodeURIComponent(activeOffer.scriptId)}&u=${encodeURIComponent(userId)}`
                      : activeOffer.iframeUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title="فتح في نافذة جديدة"
                  className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={handleClose}
                  title="إغلاق"
                  className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content — iframe or CPAGrip offerwall panel */}
            {(activeOffer.id === "cpagrip" || activeOffer.scriptId) ? (
              /* CPAGrip: opens direct offer wall link with userId for postback tracking */
              <CPAGripPanel
                scriptId={activeOffer.scriptId}
                userId={userId}
                iframeKey={iframeKey}
              />
            ) : activeOffer.iframeUrl ? (
              <iframe
                key={iframeKey}
                src={activeOffer.iframeUrl}
                title={activeOffer.title}
                className="flex-1 w-full border-0 bg-slate-950"
                allow="clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
                <Maximize2 className="w-10 h-10 text-slate-600" />
                <p className="text-slate-400 text-sm font-semibold">
                  لم يتم تهيئة هذه الشبكة بعد.
                </p>
                <p className="text-slate-500 text-xs">
                  اذهب إلى <span className="text-blue-400 font-mono">/admin/offerwalls</span> وأضف المعرّف من لوحة التحكم.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Individual card ──────────────────────────────────────────────────────────
function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  const Icon = offer.icon;
  const badge = offer.badge;
  const isActive = !offer.comingSoon &&
    (Boolean(offer.iframeUrl) || Boolean(offer.scriptId) || offer.id === "cpagrip");

  // ── Coming-soon anonymous placeholder ──────────────────────────────────────
  if (offer.comingSoon) {
    return (
      <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/20 border border-slate-700/25 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden min-h-[180px] sm:min-h-0 cursor-not-allowed select-none">
        {/* Anonymous icon */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-slate-700/30 ring-1 ring-white/5">
            <Icon className="w-6 h-6 text-slate-700" strokeWidth={1.75} />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-slate-700/30 text-slate-500 border-slate-600/30 leading-none">
            قريباً
          </span>
        </div>

        {/* Redacted body lines */}
        <div className="flex-1 flex flex-col justify-center gap-2.5">
          <div className="h-3 w-3/4 rounded-full bg-slate-700/50" />
          <div className="h-2.5 w-full rounded-full bg-slate-800/60" />
          <div className="h-2.5 w-5/6 rounded-full bg-slate-800/60" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-600 bg-slate-800/50 border border-slate-700/30 px-3 py-1.5 rounded-full">
            شبكة قادمة
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-800/40 border border-slate-700/30 px-3 py-1.5 rounded-full">
            قريباً
          </span>
        </div>
      </div>
    );
  }

  // ── Active offer card ───────────────────────────────────────────────────────
  return (
    <div
      className={`group relative bg-gradient-to-br ${offer.gradient} backdrop-blur-md border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden min-h-[180px] sm:min-h-0
        ${isActive
          ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98]"
          : "opacity-50 cursor-not-allowed"
        }`}
      onClick={isActive ? onOpen : undefined}
    >
      {/* Top shimmer line on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Subtle radial glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 relative">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${offer.iconGlow} ring-1 ring-white/10`}>
          <Icon className={`w-6 h-6 ${offer.iconColor}`} strokeWidth={1.75} />
        </div>

        {badge && (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${BADGE_STYLES[badge.type]} leading-none`}
          >
            {BADGE_ICONS[badge.type]}
            {badge.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 relative">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
          {offer.provider}
        </p>
        <h3 className="font-bold text-white text-base leading-snug mb-1.5">
          {offer.title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">{offer.desc}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 relative">
        <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          {offer.maxPoints}
        </span>
        {isActive ? (
          <span
            className={`text-sm font-bold ${offer.iconColor} group-hover:gap-2 flex items-center gap-1 transition-all duration-200 sm:bg-transparent bg-white/10 sm:px-0 px-3 py-2 rounded-xl sm:rounded-none sm:py-0`}
          >
            ابدأ الربح الآن
            <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">←</span>
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-500 bg-slate-800/60 border border-slate-700/40 px-3 py-1.5 rounded-full">
            قريباً
          </span>
        )}
      </div>
    </div>
  );
}

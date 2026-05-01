"use client";

/**
 * Cookie Consent Banner (GDPR)
 *
 * Shows on first visit. Stores user preference in localStorage.
 * Required by AdscendMedia, BitLabs, and most serious offerwall networks.
 *
 * Usage: <CookieBanner /> in root layout (inside a client boundary).
 */

import { useState, useEffect } from "react";
import { Cookie, X, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "jana_cookie_consent";

type ConsentState = "accepted" | "rejected" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>("accepted"); // hidden until loaded
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
      if (!stored) {
        // Slight delay so banner doesn't flash during hydration
        setTimeout(() => setVisible(true), 800);
        setConsent(null);
      } else {
        setConsent(stored);
      }
    } catch {
      // localStorage unavailable (SSR edge case) — show banner
      setVisible(true);
    }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch { /* noop */ }
    setConsent("accepted");
    setVisible(false);
  }

  function reject() {
    try { localStorage.setItem(STORAGE_KEY, "rejected"); } catch { /* noop */ }
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="إشعار ملفات تعريف الارتباط"
      className={`
        fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm
        z-[9998] bg-slate-900/95 backdrop-blur-md border border-blue-500/20
        rounded-2xl p-4 shadow-2xl shadow-black/40
        transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}
      `}
    >
      {/* Close */}
      <button
        onClick={reject}
        aria-label="رفض وإغلاق"
        className="absolute top-3 left-3 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-2">
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Cookie className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-1">
            نستخدم ملفات تعريف الارتباط
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            نستخدم ملفات تعريف الارتباط لتحسين تجربتك وعرض العروض المناسبة لك.
            يمكنك الاطلاع على{" "}
            <a href="/privacy" className="text-blue-400 hover:underline">
              سياسة الخصوصية
            </a>{" "}
            لمزيد من التفاصيل.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={accept}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          قبول الكل
        </button>
        <button
          onClick={reject}
          className="flex-1 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 py-2.5 rounded-xl transition-colors border border-white/10"
        >
          رفض غير الضروري
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useTransition } from "react";
import { getOfferwallSettings, saveOfferwallSettings } from "../actions";
import type { OfferwallSettings } from "../actions";
import { Save, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

// ── Field definitions ─────────────────────────────────────────────────────────
const SECTIONS = [
  {
    provider: "Monlix",
    icon: "📋",
    color: "violet",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/10",
    accent: "text-violet-400",
    ring: "focus:ring-violet-500/40 focus:border-violet-500/60",
    fields: [
      { key: "monlix_app_id" as keyof OfferwallSettings, label: "App ID", placeholder: "com.yourapp.id", secret: false },
      { key: "monlix_secret_key" as keyof OfferwallSettings, label: "Secret Key", placeholder: "sk_xxxxxxxxxxxxxxxxxx", secret: true },
    ],
  },
  {
    provider: "Revlum",
    icon: "💫",
    color: "cyan",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    accent: "text-cyan-400",
    ring: "focus:ring-cyan-500/40 focus:border-cyan-500/60",
    fields: [
      { key: "revlum_api_key" as keyof OfferwallSettings, label: "API Key", placeholder: "rv_xxxxxxxxxxxxxxxxxx", secret: true },
    ],
  },
  {
    provider: "Lootably",
    icon: "🎮",
    color: "emerald",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    accent: "text-emerald-400",
    ring: "focus:ring-emerald-500/40 focus:border-emerald-500/60",
    fields: [
      { key: "lootably_placement_id" as keyof OfferwallSettings, label: "Placement ID", placeholder: "pl_xxxxxxxxxxxxxxxxxx", secret: false },
    ],
  },
  {
    provider: "CPALead",
    icon: "📱",
    color: "blue",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    accent: "text-blue-400",
    ring: "focus:ring-blue-500/40 focus:border-blue-500/60",
    fields: [
      { key: "cpalead_app_id" as keyof OfferwallSettings, label: "App ID", placeholder: "xxxxxxxx", secret: false },
    ],
  },
  {
    provider: "AdGate Rewards",
    icon: "⚡",
    color: "amber",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    accent: "text-amber-400",
    ring: "focus:ring-amber-500/40 focus:border-amber-500/60",
    fields: [
      { key: "adgate_app_id" as keyof OfferwallSettings, label: "App ID", placeholder: "xxxxxxxx", secret: false },
    ],
  },
  {
    provider: "AdscendMedia",
    icon: "▶️",
    color: "rose",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/10",
    accent: "text-rose-400",
    ring: "focus:ring-rose-500/40 focus:border-rose-500/60",
    fields: [
      { key: "adscend_app_id" as keyof OfferwallSettings, label: "App ID", placeholder: "xxxxxxxx", secret: false },
    ],
  },
  {
    provider: "CPAGrip",
    icon: "💠",
    color: "blue",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    accent: "text-blue-400",
    ring: "focus:ring-blue-500/40 focus:border-blue-500/60",
    fields: [
      { key: "cpagrip_app_id" as keyof OfferwallSettings, label: "Offerwall Script ID", placeholder: "1893275", secret: false },
    ],
  },
];

const EMPTY: OfferwallSettings = {
  monlix_app_id: "", monlix_secret_key: "", revlum_api_key: "",
  lootably_placement_id: "", cpalead_app_id: "", adgate_app_id: "", adscend_app_id: "",
  cpagrip_app_id: "",
};

export default function OfferwallsSettingsPage() {
  const [values, setValues] = useState<OfferwallSettings>(EMPTY);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Load current settings on mount
  useEffect(() => {
    getOfferwallSettings().then(setValues).catch(console.error);
  }, []);

  function set(key: keyof OfferwallSettings, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function toggleReveal(key: string) {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    startTransition(async () => {
      const result = await saveOfferwallSettings(values);
      if (result.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(result.message);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-32 sm:pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">إعدادات جدران العروض</h1>
        <p className="text-slate-400 mt-1 text-sm">
          أضف معرّفات وأسرار مزودي العروض — تُحفظ في قاعدة البيانات وتُطبَّق فوراً
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/25 rounded-xl px-4 py-3 text-sm text-blue-300">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
        <span>
          القيم المحفوظة هنا تُستخدم مباشرةً في بناء روابط جدار العروض لكل مستخدم. الحقول الفارغة تُخفي المزوّد المقابل تلقائياً.
        </span>
      </div>

      {/* Provider cards */}
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.provider}
            className={`bg-white/[0.03] backdrop-blur-md border ${section.border} rounded-2xl p-4 sm:p-5 shadow-lg ${section.glow}`}
          >
            {/* Card header */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xl">{section.icon}</span>
              <h2 className={`font-bold text-base ${section.accent}`}>{section.provider}</h2>
              {section.fields.every((f) => values[f.key]) && (
                <span className="ms-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> مُفعَّل
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.secret && !revealed[field.key] ? "password" : "text"}
                      value={values[field.key]}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      dir="ltr"
                      className={`w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none ring-2 ring-transparent transition-all duration-200 ${section.ring} ${field.secret ? "pr-10" : ""}`}
                    />
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => toggleReveal(field.key)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                      >
                        {revealed[field.key]
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save button — sticky on mobile, inline on desktop */}
      <div className="fixed bottom-0 inset-x-0 sm:static sm:inset-auto z-40 sm:z-auto bg-slate-950/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-blue-500/20 sm:border-0 px-4 py-4 sm:px-0 sm:py-0 sm:pb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={handleSave}
            disabled={isPending || status === "saving"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 text-sm"
          >
            {status === "saving"
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {status === "saving" ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </button>

          {status === "saved" && (
            <span className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> تم الحفظ بنجاح — الروابط محدَّثة
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center justify-center gap-1.5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import LogoBrand from "@/app/components/LogoBrand";
import { useState } from "react";
import { Send, Loader2, CheckCircle2, Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        console.error("[contact]", data.error);
      } else {
        setStatus("sent");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="bg-white/[0.04] backdrop-blur-md border-b border-white/[0.07] sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/"><LogoBrand size="sm" /></Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">← الرئيسية</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2">اتصل بنا</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            هل لديك سؤال أو مشكلة؟ فريقنا يرد خلال 24–48 ساعة في أيام العمل.
          </p>
        </div>

        {/* Contact info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 border border-blue-500/20 rounded-2xl p-5 flex gap-3 items-start">
            <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white text-sm mb-0.5">البريد الإلكتروني</p>
              {/* INSERT YOUR SUPPORT EMAIL */}
              <a href="mailto:support@jana-rewards.com" className="text-blue-400 text-sm hover:underline">
                support@jana-rewards.com
              </a>
            </div>
          </div>
          <div className="bg-white/5 border border-blue-500/20 rounded-2xl p-5 flex gap-3 items-start">
            <MessageSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white text-sm mb-0.5">وقت الاستجابة</p>
              <p className="text-slate-400 text-sm">24–48 ساعة</p>
            </div>
          </div>
        </div>

        {/* Form */}
        {status === "sent" ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <h2 className="text-lg font-semibold text-white">تم الإرسال بنجاح!</h2>
            <p className="text-slate-400 text-sm">سنرد عليك في أقرب وقت ممكن.</p>
            <button
              onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
              className="mt-2 text-sm text-blue-400 hover:underline"
            >
              إرسال رسالة أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-blue-500/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="الاسم الكامل"
                required
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="محمد أحمد"
              />
              <Field
                label="البريد الإلكتروني"
                type="email"
                required
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="example@gmail.com"
              />
            </div>
            <Field
              label="الموضوع"
              required
              value={form.subject}
              onChange={(v) => setForm({ ...form, subject: v })}
              placeholder="مشكلة في السحب / استفسار عن العروض..."
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300 font-medium">الرسالة <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="اكتب رسالتك هنا..."
                className="bg-white/5 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 resize-none transition-colors"
              />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-400">حدث خطأ. حاول مرة أخرى.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              {status === "sending" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
              ) : (
                <><Send className="w-4 h-4" /> إرسال الرسالة</>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-slate-300 font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border border-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
      />
    </div>
  );
}

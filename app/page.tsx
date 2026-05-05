import LogoBrand from "./components/LogoBrand";
import ScrollReveal from "./components/ScrollReveal";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Users,
  ClipboardList,
  Smartphone,
  Gamepad2,
  Play,
  Zap,
  ArrowLeft,
} from "lucide-react";

interface PaymentMethod {
  name: string;
  icon: string;
  desc: string;
}

function PaymentCard({ method }: { method: PaymentMethod }) {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-4 sm:p-6 hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl bg-white/5 border border-white/10">
        {method.icon}
      </div>
      <p className="font-semibold text-white text-xs sm:text-sm text-center">{method.name}</p>
      <p className="text-[10px] sm:text-xs text-slate-400 text-center leading-relaxed hidden sm:block">{method.desc}</p>
    </div>
  );
}

export default function Home() {
  // ── Active offer networks ────────────────────────────────────────────────
  const activeOffers = [
    {
      icon: Zap,
      label: "CPAGrip",
      title: "عروض متنوعة عالية الربح",
      desc: "تثبيت تطبيقات، استطلاعات، واشتراكات بمكافآت ضخمة.",
      points: "600",
      color: "text-blue-400",
      bg: "bg-blue-500/15",
      border: "border-blue-500/30",
      glow: "shadow-blue-500/20",
      badge: "الأعلى ربحاً ⭐",
      badgeColor: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    },
    {
      icon: Zap,
      label: "AdGem",
      title: "عروض AdGem المتنوعة",
      desc: "عروض وتطبيقات واستطلاعات — نقاطك تُضاف فوراً بعد التحقق.",
      points: "400",
      color: "text-cyan-400",
      bg: "bg-cyan-500/15",
      border: "border-cyan-500/30",
      glow: "shadow-cyan-500/20",
      badge: "جديد ✦",
      badgeColor: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    { name: "Syriatel Cash", icon: "📱", desc: "سحب فوري عبر محفظة Syriatel Cash" },
    { name: "MTN Cash",      icon: "💛", desc: "تحويل سريع عبر شبكة MTN" },
    { name: "ShamCard",      icon: "💳", desc: "بطاقة شام الإلكترونية القابلة للشحن" },
    { name: "PayPal",        icon: "🌐", desc: "سحب دولي عبر حساب PayPal" },
    { name: "USDT",          icon: "🪙", desc: "عملة USDT المستقرة عبر شبكة TRC-20" },
  ];

  return (
    <main className="flex flex-col items-center gap-14 sm:gap-20 lg:gap-24 px-4 sm:px-6 py-10 sm:py-16 bg-slate-950 min-h-screen relative overflow-hidden">

      {/* ── Background radial glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-800/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-14 sm:gap-20 lg:gap-24 w-full">

      {/* ── Hero ── */}
      <ScrollReveal direction="up" duration={0.8} className="w-full flex justify-center">
      <section className="text-center max-w-2xl w-full">
        <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
          ✦ منصة جنى الاحترافية
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 sm:mb-6 tracking-tight">
          اربح النقاط،{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-blue-600">سحب أرباحك بسرعة</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
          أكمل العروض البسيطة، اجمع النقاط، وحوّلها إلى رصيد حقيقي عبر أكثر من ٥ طرق دفع محلية وعالمية.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <a
            href="/offers"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-white font-semibold shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-200"
          >
            ابدأ الآن — مجاناً ✦
          </a>
          <a
            href="/offers"
            className="inline-flex items-center justify-center rounded-xl border border-blue-500/25 bg-white/5 backdrop-blur-sm px-8 py-3.5 text-slate-300 font-semibold hover:border-blue-400/50 hover:text-white transition-all duration-200"
          >
            استعرض العروض
          </a>
        </div>
      </section>
      </ScrollReveal>

      {/* ── Stats bar ── */}
      <ScrollReveal direction="up" delay={0.1} className="w-full max-w-3xl">
      <section className="w-full">
        <div className="grid grid-cols-3 gap-4">
          {[
                      { label: "مستخدم نشط", value: "12,400+", icon: "👥", color: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/25", glow: "shadow-blue-500/10" },
            { label: "نقطة موزعة", value: "3.2M+",   icon: "⚡", color: "from-violet-500/20 to-violet-600/5", border: "border-violet-500/25", glow: "shadow-violet-500/10" },
            { label: "طلب سحب مكتمل", value: "8,900+", icon: "✅", color: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/25", glow: "shadow-emerald-500/10" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border ${stat.border} bg-gradient-to-b ${stat.color} backdrop-blur-md py-5 sm:py-7 px-2 sm:px-4 shadow-lg ${stat.glow} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden`}
            >
              {/* background glow blob */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 text-[80px] pointer-events-none select-none">
                {stat.icon}
              </div>
              <span className="text-xl sm:text-2xl">{stat.icon}</span>
              <span className="text-xl sm:text-3xl font-bold text-white tracking-tight">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 text-center leading-relaxed">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* ── Earning Hub Preview ── */}
      <ScrollReveal direction="up" delay={0.05} className="w-full max-w-5xl">
      <section className="w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
              <h2 className="text-2xl font-bold text-white">مركز التكسّب</h2>
            </div>
            <p className="text-sm text-slate-400">اختر طريقة التكسّب المناسبة لك — كل النقاط تُضاف فوراً لحسابك</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full shrink-0">
            <Shield className="w-3.5 h-3.5" />
            منصة موثوقة 100%
          </div>
        </div>

        {/* Preview cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* ── Active networks ── */}
          {activeOffers.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.label}
                href="/offers"
                className={`group relative bg-white/[0.04] backdrop-blur-md border ${m.border} rounded-2xl p-5 flex flex-col gap-4 hover:-translate-y-1.5 hover:shadow-2xl ${m.glow} transition-all duration-300 overflow-hidden cursor-pointer`}
              >
                {/* shimmer top line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="flex items-start justify-between gap-2 relative">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${m.bg} ring-1 ring-white/10`}>
                    <Icon className={`w-5 h-5 ${m.color}`} strokeWidth={1.75} />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${m.badgeColor} leading-none mt-0.5 shrink-0`}>
                    {m.badge}
                  </span>
                </div>

                <div className="flex-1 relative">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{m.label}</p>
                  <h3 className="font-bold text-white text-base leading-snug mb-1">{m.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                </div>

                <div className="flex items-center justify-between relative">
                  <span className={`text-xs font-semibold ${m.bg} border ${m.border} ${m.color} px-3 py-1.5 rounded-full`}>
                    حتى {m.points} نقطة
                  </span>
                  <span className={`text-sm font-bold ${m.color} flex items-center gap-1 group-hover:gap-2 transition-all duration-200`}>
                    ابدأ الآن
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* ── Coming-soon anonymous premium slots ── */}
          {[
            { icon: ClipboardList },
            { icon: Smartphone   },
            { icon: Gamepad2     },
            { icon: Play         },
          ].map(({ icon: Icon }, i) => (
            <div
              key={`placeholder-${i}`}
              className="relative bg-gradient-to-br from-slate-800/25 to-slate-900/15 border border-slate-700/25 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden cursor-not-allowed select-none"
            >
              {/* Noise texture overlay */}
              <div className="absolute inset-0 rounded-2xl opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')]" />

              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-700/30 ring-1 ring-white/5">
                  <Icon className="w-5 h-5 text-slate-700" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-slate-700/20 text-slate-500 border-slate-600/25 leading-none mt-0.5 shrink-0">
                  قريباً
                </span>
              </div>

              {/* Skeleton lines */}
              <div className="flex-1 flex flex-col gap-2.5 justify-center">
                <div className="h-2.5 w-1/3 rounded-full bg-slate-700/40" />
                <div className="h-3.5 w-4/5 rounded-full bg-slate-700/50" />
                <div className="h-2.5 w-full rounded-full bg-slate-800/50" />
                <div className="h-2.5 w-2/3 rounded-full bg-slate-800/40" />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 bg-slate-800/40 border border-slate-700/25 px-3 py-1.5 rounded-full">
                  شبكة مميزة قريباً
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-800/30 border border-slate-700/25 px-3 py-1.5 rounded-full">
                  Premium
                </span>
              </div>
            </div>
          ))}

        </div>

        {/* CTA banner */}
        <div className="mt-6 relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-l from-blue-600/10 to-blue-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-40%] right-[-5%] w-72 h-72 bg-blue-500/8 rounded-full blur-[80px]" />
          </div>
          <div className="relative text-center sm:text-right">
            <p className="text-white font-bold text-base mb-1">جاهز للبدء؟</p>
            <p className="text-slate-400 text-sm">سجّل مجاناً وابدأ الكسب من أي شبكة إعلانية فوراً</p>
          </div>
          <div className="relative flex gap-3 shrink-0">
            <Link
              href="/offers"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-200"
            >
              ابدأ الآن ✦
            </Link>
            <Link
              href="/offers"
              className="inline-flex items-center gap-1.5 justify-center rounded-xl border border-blue-500/30 bg-white/5 px-6 py-2.5 text-slate-300 font-semibold text-sm hover:border-blue-400/50 hover:text-white transition-all duration-200"
            >
              عرض جميع العروض
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-white/5 border border-blue-500/10 rounded-xl px-4 py-3">
          <Users className="w-4 h-4 text-slate-500 shrink-0" />
          <p className="text-xs text-slate-500">يتم اعتماد النقاط تلقائياً عبر نظام Postback الآمن فور إتمام أي عرض.</p>
        </div>
      </section>
      </ScrollReveal>

      {/* ── How it works ── */}
      <ScrollReveal direction="up" delay={0.05} className="w-full max-w-3xl">
      <section className="w-full">
        <h2 className="text-2xl font-bold text-white mb-3 text-center">كيف تعمل المنصة؟</h2>
        <p className="text-center text-slate-400 text-sm mb-10">ثلاث خطوات بسيطة تفصلك عن أول ربح</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { step: "١", title: "سجّل حساباً", desc: "أنشئ حسابك مجاناً في ثوانٍ باستخدام بريدك الإلكتروني." },
            { step: "٢", title: "أكمل العروض", desc: "تصفّح عروض الاستطلاعات والتطبيقات والمهام واجمع نقاطك." },
            { step: "٣", title: "سحب أرباحك", desc: "حوّل نقاطك إلى أموال حقيقية عبر طريقة الدفع المفضلة لديك." },
          ].map((item) => (
            <div key={item.step} className="bg-white/5 backdrop-blur-md rounded-2xl border border-blue-500/20 p-6 flex flex-col gap-3 hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/20">
                {item.step}
              </div>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* ── Withdrawal Methods ── */}
      <ScrollReveal direction="up" delay={0.05} className="w-full max-w-3xl">
      <section className="w-full">
        <h2 className="text-2xl font-bold text-white mb-3 text-center">طرق السحب المدعومة</h2>
        <p className="text-center text-slate-400 text-sm mb-10">اختر الطريقة الأنسب لك وسحب أرباحك في أي وقت</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {paymentMethods.map((m) => (
            <PaymentCard key={m.name} method={m} />
          ))}
        </div>
      </section>
      </ScrollReveal>

      </div>
    </main>
  );
}

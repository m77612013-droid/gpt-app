"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const hidden = ["/login", "/register", "/admin"].some(p => pathname.startsWith(p));
  if (hidden) return null;

  return (
    <footer className="border-t border-white/[0.06] bg-slate-950 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">

        {/* Top row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <p className="text-lg font-bold text-white tracking-tight">جنى <span className="text-blue-400">JANA</span></p>
            <p className="text-xs text-slate-500 leading-relaxed">منصة مكافآت تتيح لك كسب نقاط وتحويلها إلى أموال حقيقية عبر طرق دفع متعددة.</p>
            <p className="text-[11px] text-slate-600">100 نقطة = $1.00 · الحد الأدنى 100 نقطة</p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">التنقل</p>
            <Link href="/"          className="text-slate-400 hover:text-white transition-colors">الرئيسية</Link>
            <Link href="/offers"    className="text-slate-400 hover:text-white transition-colors">العروض</Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">لوحة التحكم</Link>
            <Link href="/withdraw"  className="text-slate-400 hover:text-white transition-colors">سحب الأرباح</Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">قانوني</p>
            <Link href="/terms"   className="text-slate-400 hover:text-white transition-colors">شروط الاستخدام</Link>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">سياسة الخصوصية</Link>
            <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">اتصل بنا</Link>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">الدعم</p>
            <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">الدعم الفني</Link>
            <Link href="/register" className="text-slate-400 hover:text-white transition-colors">إنشاء حساب</Link>
            <Link href="/login"    className="text-slate-400 hover:text-white transition-colors">تسجيل الدخول</Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.05]" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} جنى JANA — جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms"   className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

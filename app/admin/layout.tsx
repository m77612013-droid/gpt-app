"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin",                  label: "نظرة عامة",       icon: "📊" },
  { href: "/admin/users",            label: "المستخدمون",       icon: "👥" },
  { href: "/admin/withdrawals",      label: "طلبات السحب",    icon: "💸" },
  { href: "/admin/transactions",     label: "سجل العمليات",   icon: "📋" },
  { href: "/admin/offerwalls",       label: "إعدادات العروض", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavLinks = () => (
    <>
      <div className="text-center mb-8">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          لوحة الإدارة
        </div>
        <div className="text-slate-500 text-xs mt-1">JANA Admin</div>
      </div>

      {ADMIN_NAV.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-blue-500/20">
        <Link
          href="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-all border border-transparent"
        >
          <span>←</span>
          العودة للوحة
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex" dir="rtl">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white/5 border-l border-blue-500/20 backdrop-blur-md flex-col py-8 px-4 gap-2">
        <NavLinks />
      </aside>

      {/* ── Mobile: top bar + drawer ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 h-14 bg-slate-950/90 backdrop-blur-md border-b border-blue-500/20">
        <div className="text-sm font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">لوحة الإدارة</div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-300 hover:text-white transition-colors p-1"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={`md:hidden fixed top-14 right-0 z-50 h-[calc(100vh-3.5rem)] w-64 bg-slate-900 border-l border-blue-500/20 flex flex-col py-6 px-4 gap-2 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <NavLinks />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:min-h-screen">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 60% -10%, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">{children}</div>
      </main>
    </div>
  );
}

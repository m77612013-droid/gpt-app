"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import LogoBrand from "./LogoBrand";
import {
  LayoutDashboard,
  Gift,
  Wallet,
  Home,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Coins,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  authRequired?: boolean;
  guestOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/",          label: "الرئيسية",     icon: <Home          className="w-4 h-4" /> },
  { href: "/earn",      label: "مركز الكسب",   icon: <Coins         className="w-4 h-4" />, authRequired: true },
  { href: "/offers",    label: "العروض",        icon: <Gift          className="w-4 h-4" />, authRequired: true },
  { href: "/dashboard", label: "لوحة التحكم",  icon: <LayoutDashboard className="w-4 h-4" />, authRequired: true },
  { href: "/withdraw",  label: "سحب الأرباح",  icon: <Wallet        className="w-4 h-4" />, authRequired: true },
];

export default function Header() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [authed,  setAuthed]  = useState<boolean | null>(null);
  const [open,    setOpen]    = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Detect auth state once on mount
  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setAuthed(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev: string, session: Session | null) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (open && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Hide header on admin pages and auth pages
  const hidden = ["/login", "/register", "/admin"].some(p => pathname.startsWith(p));
  if (hidden) return null;

  const visibleLinks = NAV_LINKS.filter(link => {
    if (link.authRequired && !authed) return false;
    if (link.guestOnly && authed)    return false;
    return true;
  });

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-white/[0.07] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <LogoBrand size="sm" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive(link.href)
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/25"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {authed === false && (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  دخول
                </Link>
                <Link
                  href="/offers"
                  className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  ابدأ مجاناً
                </Link>
              </>
            )}
            {authed && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                خروج
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="القائمة"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-white/[0.07] z-50 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.07]">
          <LogoBrand size="sm" />
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          {visibleLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all ${
                isActive(link.href)
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer bottom */}
        <div className="p-4 border-t border-white/[0.07]">
          {authed === false && (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-400 border border-white/10 px-4 py-2.5 rounded-xl hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
              <Link
                href="/offers"
                className="flex items-center justify-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all"
              >
                <UserPlus className="w-4 h-4" />
                ابدأ مجاناً
              </Link>
            </div>
          )}
          {authed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/20 px-4 py-2.5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          )}
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { Tajawal, Amiri } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import ToastProvider from "./components/ToastProvider";
import CookieBanner from "./components/CookieBanner";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-amiri",
  display: "swap",
});

const tajawal = Tajawal({
  weight: ["300", "400", "500", "700", "800"],
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "جنى | اربح نقاط وسحب أرباحك",
  description:
    "منصة جنى الاحترافية – أكمل العروض واجمع النقاط وسحب أرباحك بسهولة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white font-[family-name:var(--font-tajawal)] scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-700">
        <ToastProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
          <CookieBanner />
        </ToastProvider>
      </body>
    </html>
  );
}

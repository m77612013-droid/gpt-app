"use client";

/**
 * Lightweight toast notification system.
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("تم بنجاح!");
 *   toast.error("حدث خطأ.");
 *   toast.info("معلومة مهمة.");
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  toast: {
    success: (msg: string, duration?: number) => void;
    error: (msg: string, duration?: number) => void;
    info: (msg: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Individual toast item ─────────────────────────────────────────────────
function ToastCard({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 300);
    }, item.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.duration, item.id, onRemove]);

  const styles: Record<ToastType, { border: string; icon: React.ReactNode; text: string }> = {
    success: {
      border: "border-green-500/40 bg-green-500/10",
      icon: <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
      text: "text-green-100",
    },
    error: {
      border: "border-red-500/40 bg-red-500/10",
      icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
      text: "text-red-100",
    },
    info: {
      border: "border-blue-500/40 bg-blue-500/10",
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
      text: "text-blue-100",
    },
  };

  const s = styles[item.type];

  return (
    <div
      role="alert"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
        shadow-xl pointer-events-auto max-w-sm w-full
        transition-all duration-300
        ${s.border}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {s.icon}
      <p className={`text-sm font-medium flex-1 leading-snug ${s.text}`}>
        {item.message}
      </p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(item.id), 300);
        }}
        className="text-slate-500 hover:text-white transition-colors shrink-0"
        aria-label="إغلاق"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────
export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback(
    (message: string, type: ToastType, duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, d?: number) => add(msg, "success", d),
    error: (msg: string, d?: number) => add(msg, "error", d),
    info: (msg: string, d?: number) => add(msg, "info", d),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — bottom-right on desktop, bottom-center on mobile */}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[9999] flex flex-col gap-2 pointer-events-none w-[calc(100vw-2rem)] sm:w-auto"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

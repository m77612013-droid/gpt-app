"use client";

import { useState, useTransition } from "react";
import { updateBalance } from "../actions";

export default function EditBalanceForm({
  userId,
  currentBalance,
}: {
  userId: string;
  currentBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [delta, setDelta] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    const amount = parseInt(delta);
    if (isNaN(amount) || amount <= 0) {
      setError("أدخل قيمة صحيحة أكبر من صفر");
      return;
    }
    const newBalance = mode === "add" ? currentBalance + amount : currentBalance - amount;
    if (newBalance < 0) {
      setError("الرصيد لا يمكن أن يكون سالباً");
      return;
    }
    setError("");
    startTransition(async () => {
      await updateBalance(userId, newBalance);
      setOpen(false);
      setDelta("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    });
  }

  function handleClose() {
    setOpen(false);
    setDelta("");
    setError("");
  }

  return (
    <>
      {success ? (
        <span className="text-emerald-400 text-xs font-medium">✓ تم التحديث</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-all"
        >
          تعديل الرصيد
        </button>
      )}

      {/* Modal Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* Modal Panel */}
          <div
            className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-1">تعديل الرصيد</h3>
            <p className="text-slate-400 text-xs mb-4">
              الرصيد الحالي:{" "}
              <span className="text-yellow-400 font-bold">{currentBalance.toLocaleString()} نقطة</span>
            </p>

            {/* Add / Subtract toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("add")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  mode === "add"
                    ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                }`}
              >
                ➕ إضافة
              </button>
              <button
                onClick={() => setMode("subtract")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  mode === "subtract"
                    ? "bg-red-600/30 text-red-300 border-red-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                }`}
              >
                ➖ خصم
              </button>
            </div>

            <input
              type="number"
              min="1"
              placeholder="عدد النقاط"
              value={delta}
              onChange={(e) => { setDelta(e.target.value); setError(""); }}
              className="w-full bg-slate-800 border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 transition-colors mb-2"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />

            {delta && !isNaN(parseInt(delta)) && parseInt(delta) > 0 && (
              <p className="text-slate-500 text-xs mb-2">
                الرصيد الجديد:{" "}
                <span
                  className={`font-bold ${
                    mode === "add" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {(
                    mode === "add"
                      ? currentBalance + parseInt(delta)
                      : currentBalance - parseInt(delta)
                  ).toLocaleString()}{" "}
                  نقطة
                </span>
              </p>
            )}

            {error && (
              <p className="text-red-400 text-xs mb-2">{error}</p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
              >
                {isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

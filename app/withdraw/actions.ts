"use server";

/**
 * Secure withdrawal handler — Server Action.
 *
 * ALL validation is server-side. The client cannot manipulate:
 *   - the user's balance
 *   - the minimum withdrawal limit
 *   - the user_id (always read from the authenticated session)
 *
 * Flow:
 *   1. Get authenticated user from session (server-side, unforgeable)
 *   2. Fetch real balance from DB
 *   3. Validate requested amount against real DB balance
 *   4. If valid → insert withdrawal request with status 'pending'
 */

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const MIN_POINTS = 100;
const MAX_POINTS = 1_000_000;

const ALLOWED_METHODS = [
  "ShamCard",
  "PayPal",
  "Syriatel Cash",
  "MTN Cash",
  "USDT",
] as const;

type PaymentMethod = (typeof ALLOWED_METHODS)[number];

export interface WithdrawResult {
  success: boolean;
  error?: string;
}

export async function submitWithdrawal(
  amount: number,
  paymentMethod: string,
  accountDetails: string
): Promise<WithdrawResult> {

  // ── 1. Server-side auth — cannot be spoofed ──────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "غير مصرح — يجب تسجيل الدخول." };
  }

  // ── 2. Validate payment method against allowlist ─────────────────────────
  if (!ALLOWED_METHODS.includes(paymentMethod as PaymentMethod)) {
    return { success: false, error: "طريقة الدفع غير مدعومة." };
  }

  // ── 3. Validate amount is a sane number ──────────────────────────────────
  if (
    !Number.isFinite(amount) ||
    amount < MIN_POINTS ||
    amount > MAX_POINTS
  ) {
    return {
      success: false,
      error: `يجب أن تكون النقاط بين ${MIN_POINTS} و ${MAX_POINTS.toLocaleString()}.`,
    };
  }

  const pts = Math.floor(amount); // prevent fractional point games

  // ── 4. Validate account details ──────────────────────────────────────────
  const cleanAccount = accountDetails.trim().slice(0, 200);
  if (cleanAccount.length < 3) {
    return { success: false, error: "يجب إدخال تفاصيل الحساب." };
  }

  // ── 5. Fetch REAL balance from DB (server-side, never trust client) ───────
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("balance_points")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "تعذّر قراءة رصيدك. حاول مجدداً." };
  }

  const realBalance: number = profile.balance_points ?? 0;

  // ── 6. Reject if insufficient balance ────────────────────────────────────
  if (pts > realBalance) {
    return {
      success: false,
      error: `رصيدك غير كافٍ. رصيدك الحالي: ${realBalance.toLocaleString("ar-EG")} نقطة.`,
    };
  }

  // ── 7. Check for pending withdrawal (one at a time per user) ─────────────
  const { count: pendingCount } = await admin
    .from("withdrawals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if ((pendingCount ?? 0) > 0) {
    return {
      success: false,
      error: "لديك طلب سحب معلّق بالفعل. يرجى الانتظار حتى تتم معالجته.",
    };
  }

  // ── 8. Insert withdrawal request ─────────────────────────────────────────
  const { error: insertError } = await admin.from("withdrawals").insert({
    user_id:         user.id,
    amount:          pts,
    payment_method:  paymentMethod,
    account_details: cleanAccount,
    status:          "pending",
  });

  if (insertError) {
    console.error("[withdrawal] insert error:", insertError);
    return { success: false, error: "حدث خطأ في الخادم. يرجى المحاولة مجدداً." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

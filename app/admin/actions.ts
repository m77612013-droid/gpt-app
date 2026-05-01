"use server";

import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateBalance(userId: string, newBalance: number) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ balance_points: newBalance })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function updateWithdrawalStatus(id: string, status: "completed" | "rejected") {
  const admin = createAdminClient();
  const { error } = await admin
    .from("withdrawals")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/withdrawals");
}

// ── Offerwall Settings ────────────────────────────────────────────────────────

export interface OfferwallSettings {
  monlix_app_id:         string;
  monlix_secret_key:     string;
  revlum_api_key:        string;
  lootably_placement_id: string;
  cpalead_app_id:        string;
  adgate_app_id:         string;
  adscend_app_id:        string;
  cpagrip_app_id:        string;
}

const OFFERWALL_KEYS: (keyof OfferwallSettings)[] = [
  "monlix_app_id",
  "monlix_secret_key",
  "revlum_api_key",
  "lootably_placement_id",
  "cpalead_app_id",
  "adgate_app_id",
  "adscend_app_id",
  "cpagrip_app_id",
];

export async function getOfferwallSettings(): Promise<OfferwallSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("settings")
      .select("key, value")
      .in("key", OFFERWALL_KEYS);

    if (error) {
      // Table may not exist yet — return empty defaults silently
      console.warn("[getOfferwallSettings] DB error (table may not exist):", error.message);
      return EMPTY_SETTINGS;
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return {
      monlix_app_id:         map["monlix_app_id"]         ?? "",
      monlix_secret_key:     map["monlix_secret_key"]     ?? "",
      revlum_api_key:        map["revlum_api_key"]        ?? "",
      lootably_placement_id: map["lootably_placement_id"] ?? "",
      cpalead_app_id:        map["cpalead_app_id"]        ?? "",
      adgate_app_id:         map["adgate_app_id"]         ?? "",
      adscend_app_id:        map["adscend_app_id"]        ?? "",
      cpagrip_app_id:        map["cpagrip_app_id"]        ?? "",
    };
  } catch (e) {
    console.error("[getOfferwallSettings] unexpected error:", e);
    return EMPTY_SETTINGS;
  }
}

const EMPTY_SETTINGS: OfferwallSettings = {
  monlix_app_id: "", monlix_secret_key: "", revlum_api_key: "",
  lootably_placement_id: "", cpalead_app_id: "", adgate_app_id: "", adscend_app_id: "",
  cpagrip_app_id: "",
};

export type SaveResult = { ok: true } | { ok: false; message: string };

export async function saveOfferwallSettings(settings: OfferwallSettings): Promise<SaveResult> {
  try {
    const admin = createAdminClient();

    const rows = OFFERWALL_KEYS.map((key) => ({
      key,
      value: (settings[key] ?? "").trim(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin
      .from("settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      console.error("[saveOfferwallSettings] upsert error:", error);
      return {
        ok: false,
        message: error.code === "42P01"
          ? "جدول settings غير موجود — شغيل الّـ SQL أولاً من Supabase Dashboard"
          : error.message,
      };
    }

    revalidatePath("/admin/offerwalls");
    revalidatePath("/offers");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    console.error("[saveOfferwallSettings] exception:", e);
    return { ok: false, message: msg };
  }
}

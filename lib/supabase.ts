import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ── Browser / client-side client ──────────────────────────────────
// Uses createBrowserClient from @supabase/ssr so the session is stored
// in cookies (not localStorage) — making it visible to middleware.
// Lazy singleton: created on first call, not at module evaluation time,
// so the build never crashes when env vars are absent at build phase.
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// Backwards-compat named export for files that still use `supabase` directly
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    return (getSupabase() as never)[prop];
  },
});

// ── Server-side / admin client ────────────────────────────────────
// Uses the service-role key; BYPASSES Row Level Security.
// Import this ONLY in server components, API routes, or server actions.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

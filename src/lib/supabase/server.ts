import { createClient } from "@supabase/supabase-js";

// Server-only client using the service-role key. Never import this from a
// "use client" component — it bypasses RLS entirely by design (single-user app).
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

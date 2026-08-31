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

// The "receipts" bucket is private (see 0005_private_receipts.sql), so the
// UI needs a short-lived signed URL to render a photo instead of a stored
// public one. Batches one Storage API call for all paths on a page.
export async function getReceiptSignedUrls(
  paths: string[],
  expiresInSeconds = 3600
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabaseAdmin()
    .storage.from("receipts")
    .createSignedUrls(paths, expiresInSeconds);
  if (error) throw error;
  const entries: [string, string][] = [];
  for (const item of data) {
    if (item.signedUrl && item.path) entries.push([item.path, item.signedUrl]);
  }
  return Object.fromEntries(entries);
}

// Admin-only: create a learner with a temporary password.
// The learner must still verify their email before first sign-in.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who, error: whoErr } = await admin.auth.getUser(token);
    if (whoErr || !who?.user) return json({ error: "Not signed in" }, 401);
    const { data: me } = await admin.from("profiles").select("role, username, email").eq("id", who.user.id).single();
    if (me?.role !== "admin") return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim().toLowerCase();
    const full_name = String(body.full_name ?? "").trim().slice(0, 80);
    const password = String(body.password ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Enter a valid email" }, 400);
    if (!/^[a-z0-9_.-]{3,32}$/.test(username)) return json({ error: "Username: 3–32 lowercase letters, digits, . _ -" }, 400);
    if (password.length < 12) return json({ error: "Temporary password must be at least 12 characters" }, 400);

    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: false,
      user_metadata: { username, full_name, invited: "true" },
    });
    if (error) return json({ error: error.message }, 400);

    await admin.from("audit_log").insert({
      actor_id: who.user.id, actor_label: me.username ?? me.email, subject_id: data.user?.id,
      action: "admin.user_created", detail: { username },
    });
    return json({ ok: true, id: data.user?.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

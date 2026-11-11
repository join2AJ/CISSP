// Records a sign-in or daily visit for the signed-in learner.
// The IP address is read from the request on the server; device details and
// approximate (IP-based) location come from the browser. Precise GPS is stored
// only if the learner has switched "share precise location" on.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);
const num = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v * 1e5) / 1e5 : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who, error } = await admin.auth.getUser(token);
    if (error || !who?.user) return json({ error: "Not signed in" }, 401);
    const uid = who.user.id;

    const b = await req.json().catch(() => ({}));
    const geo = (b && typeof b.geo === "object" && b.geo) || {};
    const gps = (b && typeof b.gps === "object" && b.gps) || null;

    // the site's proxy passes the visitor's address in x-nf-client-connection-ip
    const ip = (req.headers.get("x-nf-client-connection-ip") || req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim().slice(0, 64) || null;

    const { data: prof } = await admin.from("profiles").select("share_precise_location").eq("id", uid).single();
    const useGps = !!(gps && prof?.share_precise_location && num(gps.lat, -90, 90) !== null && num(gps.lon, -180, 180) !== null);
    const ipLat = num(geo.lat, -90, 90), ipLon = num(geo.lon, -180, 180);
    const types = ["mobile", "tablet", "desktop"];

    const row = {
      user_id: uid,
      event: b.event === "sign_in" ? "sign_in" : "visit",
      ip,
      city: str(geo.city, 80),
      region: str(geo.region, 80),
      country: str(geo.country, 80) || str(req.headers.get("x-country"), 80),
      latitude: useGps ? num(gps.lat, -90, 90) : ipLat,
      longitude: useGps ? num(gps.lon, -180, 180) : ipLon,
      geo_source: useGps ? "gps" : (ipLat !== null ? "ip" : null),
      gps_accuracy_m: useGps && typeof gps.acc === "number" ? Math.min(100000, Math.round(gps.acc)) : null,
      user_agent: str(req.headers.get("user-agent"), 400),
      browser: str(b.browser, 60),
      os: str(b.os, 60),
      device_type: types.includes(b.device_type) ? b.device_type : "unknown",
      device_model: str(b.device_model, 80),
      screen: str(b.screen, 30),
      language: str(b.language, 20),
      timezone: str(b.timezone, 60),
    };
    const { error: insErr } = await admin.from("access_log").insert(row);
    if (insErr) return json({ error: insErr.message }, 400);

    // retention: keep 180 days
    await admin.from("access_log").delete().eq("user_id", uid).lt("at", new Date(Date.now() - 180 * 864e5).toISOString());
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

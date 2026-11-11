/* The CISSP Reader — data layer.
   Cloud mode: Supabase (auth, Postgres with RLS, storage, edge function).
   Local mode: everything in this browser's localStorage (no accounts). */
(function () {
  "use strict";
  const C = window.CISSP_CONFIG || {};
  const cloud = !!(C.supabaseUrl && C.supabaseKey && window.supabase);
  let sb = null, user = null;

  const L = {
    get(k, d) { try { const v = localStorage.getItem("cissp.local." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("cissp.local." + k, JSON.stringify(v)); } catch (e) {} }
  };
  const must = ({ data, error }) => { if (error) throw error; return data; };
  const uid = () => user && user.id;

  const db = {
    mode: cloud ? "cloud" : "local",
    get user() { return user; },

    async init(onAuth) {
      if (!cloud) { user = { id: "local", email: "" }; return user; }
      sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" }
      });
      sb.auth.onAuthStateChange((ev, session) => { user = session ? session.user : null; onAuth && onAuth(ev, session); });
      const { data } = await sb.auth.getSession();
      user = data.session ? data.session.user : null;
      return user;
    },

    /* ---------- auth ---------- */
    async usernameAvailable(u) { if (!cloud) return true; return must(await sb.rpc("username_available", { p: u })); },
    async signUp({ email, password, username, full_name, consent, plan }) {
      return must(await sb.auth.signUp({ email, password, options: {
        emailRedirectTo: location.origin + location.pathname,
        data: { username, full_name, plan: plan || "silver", consent: consent ? "true" : "false" } } }));
    },
    async signIn(identifier, password) {
      let email = identifier.trim();
      if (!email.includes("@")) {
        email = must(await sb.rpc("email_for_login", { p: email }));
        if (!email) throw new Error("Invalid login credentials");
      }
      const r = must(await sb.auth.signInWithPassword({ email, password }));
      db.logEvent("user.login", {});
      return r;
    },
    async resend(email) { return must(await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: location.origin + location.pathname } })); },
    async resetPassword(email) { return must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })); },
    async updatePassword(password) { const r = must(await sb.auth.updateUser({ password })); db.logEvent("user.password_changed", {}); return r; },
    async signOut() { if (!cloud) return; await db.logEvent("user.logout", {}); await sb.auth.signOut(); },

    /* ---------- plans ---------- */
    async plans() {
      if (!cloud) return null;
      return must(await sb.from("plans").select("*").order("sort"));
    },

    /* ---------- profile ---------- */
    async getProfile() {
      if (!cloud) return L.get("profile", { id: "local", role: "learner", privileged: false, onboarded: false, self_assessment: {}, consent_analytics: true, consent_terms_at: "local" });
      return must(await sb.from("profiles").select("*").eq("id", uid()).single());
    },
    async updateProfile(patch) {
      if (!cloud) { const p = Object.assign(await db.getProfile(), patch); L.set("profile", p); return p; }
      return must(await sb.from("profiles").update(patch).eq("id", uid()).select().single());
    },
    async touch() { if (cloud) await sb.rpc("touch"); },

    /* ---------- study state ---------- */
    async loadState() {
      if (!cloud) return null;
      const r = must(await sb.from("user_state").select("state").eq("user_id", uid()).maybeSingle());
      return r ? r.state : null;
    },
    async saveState(state) {
      if (!cloud) return;
      must(await sb.from("user_state").upsert({ user_id: uid(), state, updated_at: new Date().toISOString() }));
    },

    /* ---------- time ---------- */
    async addTime(day, area, domain, topic, seconds) {
      if (!cloud) {
        const t = L.get("time", []); const k = [day, area, domain, topic].join("|");
        const row = t.find(r => r.k === k); if (row) row.seconds += seconds; else t.push({ k, day, area, domain, topic, seconds });
        L.set("time", t); return;
      }
      await sb.rpc("add_time", { p_day: day, p_area: area, p_domain: domain || "", p_topic: topic || "", p_seconds: seconds });
    },
    async myTime(since) {
      if (!cloud) return L.get("time", []).filter(r => !since || r.day >= since);
      let q = sb.from("time_log").select("day,area,domain,topic,seconds").eq("user_id", uid());
      if (since) q = q.gte("day", since);
      return must(await q.limit(5000));
    },

    /* ---------- attempts, mocks, cards ---------- */
    async recordAttempts(rows) {
      if (!rows.length) return;
      if (!cloud) { L.set("attempts", L.get("attempts", []).concat(rows.map(r => Object.assign({ created_at: new Date().toISOString() }, r)))); return; }
      must(await sb.from("attempts").insert(rows.map(r => Object.assign({ user_id: uid() }, r))));
    },
    async myAttempts() {
      if (!cloud) return L.get("attempts", []);
      return must(await sb.from("attempts").select("qid,domain,topic,correct,mode,created_at").eq("user_id", uid()).order("created_at").limit(10000));
    },
    async saveMock(m) {
      if (!cloud) { L.set("mocks", L.get("mocks", []).concat([Object.assign({ created_at: new Date().toISOString() }, m)])); return; }
      must(await sb.from("mocks").insert(Object.assign({ user_id: uid() }, m)));
    },
    async myMocks() {
      if (!cloud) return L.get("mocks", []);
      return must(await sb.from("mocks").select("total,correct,seconds,breakdown,created_at").eq("user_id", uid()).order("created_at"));
    },
    async cards() {
      if (!cloud) return L.get("cards", {});
      const rows = must(await sb.from("cards").select("card_id,box,due,reviews").eq("user_id", uid()));
      return Object.fromEntries(rows.map(r => [r.card_id, r]));
    },
    async saveCard(c) {
      if (!cloud) { const all = L.get("cards", {}); all[c.card_id] = c; L.set("cards", all); return; }
      must(await sb.from("cards").upsert(Object.assign({ user_id: uid() }, c)));
    },

    /* ---------- personal library ---------- */
    async resources() {
      if (!cloud) return L.get("resources", []);
      return must(await sb.from("resources").select("*").eq("user_id", uid()).order("created_at", { ascending: false }));
    },
    async addResource(r, file) {
      if (!cloud) {
        if (file) throw new Error("File uploads need the online database. Add a link instead.");
        const all = L.get("resources", []); all.unshift(Object.assign({ id: "l" + Date.now(), created_at: new Date().toISOString() }, r)); L.set("resources", all); return;
      }
      let storage_path = null;
      if (file) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
        storage_path = `${uid()}/${crypto.randomUUID()}-${safe}`;
        must(await sb.storage.from("learner-files").upload(storage_path, file, { contentType: file.type, upsert: false }));
      }
      must(await sb.from("resources").insert(Object.assign({ user_id: uid(), storage_path }, r)));
    },
    async deleteResource(r) {
      if (!cloud) { L.set("resources", L.get("resources", []).filter(x => x.id !== r.id)); return; }
      if (r.storage_path) await sb.storage.from("learner-files").remove([r.storage_path]);
      must(await sb.from("resources").delete().eq("id", r.id));
    },
    async fileUrl(path) { return must(await sb.storage.from("learner-files").createSignedUrl(path, 300)).signedUrl; },

    /* ---------- privacy rights ---------- */
    async request(kind, details) {
      if (!cloud) throw new Error("Requests need the online database.");
      const p = await db.getProfile();
      must(await sb.from("dsr_requests").insert({ user_id: uid(), user_label: p.username || p.email, kind, details }));
    },
    async myRequests() { if (!cloud) return []; return must(await sb.from("dsr_requests").select("*").eq("user_id", uid()).order("created_at", { ascending: false })); },
    async exportMyData() {
      if (!cloud) { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("cissp")) o[k] = localStorage.getItem(k); } return o; }
      return must(await sb.rpc("export_my_data"));
    },
    async deleteMyAccount() {
      if (!cloud) { Object.keys(localStorage).filter(k => k.startsWith("cissp")).forEach(k => localStorage.removeItem(k)); return; }
      const files = must(await sb.storage.from("learner-files").list(uid(), { limit: 1000 }));
      if (files && files.length) await sb.storage.from("learner-files").remove(files.map(f => `${uid()}/${f.name}`));
      must(await sb.rpc("delete_my_account"));
      await sb.auth.signOut();
    },
    async logEvent(action, detail) { if (!cloud || !user) return; try { await sb.rpc("log_event", { p_action: action, p_detail: detail || {} }); } catch (e) {} },
    async privateContent(key) {
      if (!cloud) return null;
      const r = must(await sb.from("private_content").select("body").eq("key", key).maybeSingle());
      return r ? r.body : null;
    },

    /* ---------- admin ---------- */
    admin: {
      users: async () => must(await sb.rpc("admin_users")),
      time: async (since) => must(await sb.from("time_log").select("user_id,day,area,domain,topic,seconds").gte("day", since).limit(20000)),
      attempts: async (since) => must(await sb.from("attempts").select("user_id,domain,topic,correct,mode,created_at").gte("created_at", since).limit(20000)),
      mocks: async () => must(await sb.from("mocks").select("user_id,total,correct,seconds,created_at").order("created_at", { ascending: false }).limit(1000)),
      audit: async ({ limit = 300, action, actor, from, to } = {}) => {
        let q = sb.from("audit_log").select("*").order("at", { ascending: false }).limit(limit);
        if (action) q = q.ilike("action", `%${action}%`);
        if (actor) q = q.ilike("actor_label", `%${actor}%`);
        if (from) q = q.gte("at", from);
        if (to) q = q.lte("at", to + "T23:59:59");
        return must(await q);
      },
      requests: async () => must(await sb.from("dsr_requests").select("*").order("created_at", { ascending: false })),
      updateRequest: async (id, patch) => must(await sb.from("dsr_requests").update(patch).eq("id", id)),
      updatePlan: async (id, patch) => must(await sb.from("plans").update(patch).eq("id", id)),
      updateProfile: async (id, patch) => must(await sb.from("profiles").update(patch).eq("id", id)),
      userDetail: async (id) => {
        const [time, attempts, mocks, resources] = await Promise.all([
          sb.from("time_log").select("day,area,domain,topic,seconds").eq("user_id", id).limit(5000),
          sb.from("attempts").select("domain,topic,correct,mode,created_at").eq("user_id", id).limit(5000),
          sb.from("mocks").select("total,correct,seconds,created_at").eq("user_id", id),
          sb.from("resources").select("title,kind,url,storage_path,domain,created_at").eq("user_id", id)
        ]);
        return { time: must(time), attempts: must(attempts), mocks: must(mocks), resources: must(resources) };
      },
      deleteUser: async (id, reason) => {
        const files = must(await sb.storage.from("learner-files").list(id, { limit: 1000 }));
        if (files && files.length) await sb.storage.from("learner-files").remove(files.map(f => `${id}/${f.name}`));
        must(await sb.rpc("admin_delete_user", { p: id, p_reason: reason }));
      },
      createUser: async (payload) => {
        const { data, error } = await sb.functions.invoke("admin-create-user", { body: payload });
        if (error) { let msg = error.message; try { msg = (await error.context.json()).error || msg; } catch (e) {} throw new Error(msg); }
        if (data && data.error) throw new Error(data.error);
        try { await db.resend(payload.email); } catch (e) {}
        return data;
      }
    }
  };
  window.DB = db;
})();

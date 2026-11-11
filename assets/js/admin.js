/* StudyCISSP — admin console: analytics, learners, audit trail, privacy requests */
(function () {
  "use strict";
  const A = window.App, { D, byId, $, $$, esc, dc, ymd, today, addDays, fmtDur, fmtD, fmtDY, band, db } = A;
  const tabs = [["overview", "Overview"], ["learners", "Learners"], ["audit", "Audit trail"], ["requests", "Privacy requests"], ["plans", "Plans & pricing"], ["add", "Add learner"]];
  let cache = null, auditF = { action: "", actor: "", from: "", to: "" }, lq = "", sortKey = "seconds_7d";

  const head = (tab) => `<div class="kicker">Admin console</div><h1 class="h-display">Who’s learning, <em>and how</em></h1>
    <div class="seg-tabs big" role="tablist">${tabs.map(([k, l]) => `<a href="#/admin/${k}" class="${tab === k ? "on" : ""}">${l}</a>`).join("")}</div>`;
  const notCloud = () => `<div class="page"><div class="kicker">Admin console</div><h1 class="h-display">Connect the <em>database</em></h1><p class="lede">The admin console needs the online database. It isn’t connected yet.</p></div>`;

  async function load(force) {
    if (cache && !force && Date.now() - cache.t < 60000) return cache;
    const since = ymd(addDays(today(), -89));
    const [users, time, attempts, mocks, requests] = await Promise.all([
      db.admin.users(), db.admin.time(since), db.admin.attempts(addDays(today(), -89).toISOString()), db.admin.mocks(), db.admin.requests()
    ]);
    cache = { t: Date.now(), users, time, attempts, mocks, requests, since };
    return cache;
  }
  const name = (u) => u ? (u.full_name || u.username || u.email) : "—";

  async function render(r) {
    if (db.mode !== "cloud") return notCloud();
    const tab = r.a || "overview";
    if (tab === "overview") return overview(await load());
    if (tab === "learners") return learners(await load(), r.b);
    if (tab === "audit") return audit();
    if (tab === "requests") return requests(await load());
    if (tab === "add") return `<div class="page">${head("add")}${addForm()}</div>`;
    if (tab === "plans") { await A.loadPlans(); return plansTab(); }
    return overview(await load());
  }

  function overview(c) {
    const U = c.users, learnersOnly = U.filter(u => u.role !== "admin");
    const active7 = new Set(c.time.filter(t => t.day > ymd(addDays(today(), -7))).map(t => t.user_id)).size;
    const total = c.time.reduce((n, t) => n + t.seconds, 0);
    const acc = c.attempts.length ? Math.round(c.attempts.filter(a => a.correct).length / c.attempts.length * 100) : null;
    const days = 30, series = Array.from({ length: days }, (_, i) => ymd(addDays(today(), i - days + 1)));
    const perDay = {}, perDayUsers = {};
    c.time.forEach(t => { perDay[t.day] = (perDay[t.day] || 0) + t.seconds; (perDayUsers[t.day] = perDayUsers[t.day] || new Set()).add(t.user_id); });
    const maxD = Math.max(60, ...series.map(d => perDay[d] || 0));
    const byDom = {}; c.time.forEach(t => { if (t.domain) byDom[t.domain] = (byDom[t.domain] || 0) + t.seconds; });
    const maxDom = Math.max(1, ...Object.values(byDom));
    const domAcc = {}; c.attempts.forEach(a => { domAcc[a.domain] = domAcc[a.domain] || [0, 0]; domAcc[a.domain][1]++; if (a.correct) domAcc[a.domain][0]++; });
    const byArea = {}; c.time.forEach(t => { byArea[t.area] = (byArea[t.area] || 0) + t.seconds; });
    const lb = U.slice().sort((a, b) => b.seconds_7d - a.seconds_7d).slice(0, 8);
    const topicT = {}; c.time.forEach(t => { if (t.topic && t.domain) { const k = t.domain + ":" + t.topic; topicT[k] = (topicT[k] || 0) + t.seconds; } });
    const topics = Object.entries(topicT).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const missT = {}; c.attempts.forEach(a => { if (!a.correct && a.topic) { const k = a.domain + ":" + a.topic; missT[k] = (missT[k] || 0) + 1; } });
    const hard = Object.entries(missT).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const sec = (k) => { const [d, t] = k.split(":"); const s = byId[d] && byId[d].sections.find(x => x.id === t); return `<span class="toc-dot" style="display:inline-block;background:var(--${d});margin-right:6px"></span>D${byId[d] ? byId[d].n : "?"} · ${esc(s ? s.title : t)}`; };
    const open = c.requests.filter(r => r.status === "open" || r.status === "in_progress").length;
    const unverified = U.filter(u => !u.verified).length;
    const upcoming = learnersOnly.filter(u => u.target_date && A.daysTo(u.target_date) >= 0 && A.daysTo(u.target_date) <= 30);
    return `<div class="page">${head("overview")}
      <section class="facts" style="border-top:1px solid var(--rule)">
        <div class="fact"><b>${learnersOnly.length}</b><span>learners · ${unverified} unverified</span></div>
        <div class="fact"><b>${active7}</b><span>active in the last 7 days</span></div>
        <div class="fact"><b>${fmtDur(total)}</b><span>studied in 90 days</span></div>
        <div class="fact"><b>${acc == null ? "—" : acc + "%"}</b><span>quiz accuracy (90 days)</span></div>
      </section>
      ${open ? `<a class="warnbox" href="#/admin/requests" style="display:block;margin-top:18px;text-decoration:none">${open} privacy request${open > 1 ? "s" : ""} waiting. DPDP and GDPR expect a response within 30 days →</a>` : ""}
      <h2 class="h-section">Daily study time, all learners</h2>
      <div class="daychart">${series.map(d => `<div class="dc-col" title="${fmtD(d)}: ${fmtDur(perDay[d] || 0)} · ${(perDayUsers[d] || new Set()).size} learners"><i style="height:${Math.round((perDay[d] || 0) / maxD * 100)}%"></i></div>`).join("")}</div>
      <div class="dc-axis"><span>${fmtD(series[0])}</span><span>today</span></div>
      <div class="grid-2" style="margin-top:36px">
        <div class="card"><h3>Time and accuracy by domain</h3><div class="bars">${D.map(d => { const s = byDom[d.id] || 0, a = domAcc[d.id] ? Math.round(domAcc[d.id][0] / domAcc[d.id][1] * 100) : null; return `<div class="hbar" style="${dc(d)}"><span>D${d.n}</span><div class="meter"><i style="width:${s / maxDom * 100}%"></i></div><b>${fmtDur(s)}</b><span class="band ${band(a)}">${a == null ? "—" : a + "%"}</span></div>`; }).join("")}</div></div>
        <div class="card"><h3>Most time this week</h3>${lb.length ? lb.map((u, i) => `<div class="kv"><a href="#/admin/learners/${u.id}">${i + 1}. ${esc(name(u))}</a><b>${fmtDur(u.seconds_7d)}</b></div>`).join("") : "<p>No learners yet.</p>"}</div>
        <div class="card"><h3>Most-studied topics</h3>${topics.length ? topics.map(([k, v]) => `<div class="kv"><span>${sec(k)}</span><b>${fmtDur(v)}</b></div>`).join("") : "<p>No reading time yet.</p>"}</div>
        <div class="card"><h3>Hardest topics (most misses)</h3>${hard.length ? hard.map(([k, v]) => `<div class="kv"><span>${sec(k)}</span><b>${v} misses</b></div>`).join("") : "<p>No quiz data yet.</p>"}</div>
        <div class="card"><h3>Where time goes</h3>${Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${fmtDur(v)}</b></div>`).join("") || "<p>—</p>"}</div>
        <div class="card"><h3>Exams in the next 30 days</h3>${upcoming.length ? upcoming.map(u => `<div class="kv"><a href="#/admin/learners/${u.id}">${esc(name(u))}</a><b>${fmtD(u.target_date)}</b></div>`).join("") : "<p>None scheduled.</p>"}</div>
      </div>
      <div class="btn-row"><button class="btn small ghost" id="refresh">Refresh data</button></div>
    </div>`;
  }

  function learners(c, id) {
    if (id) return detail(c, id);
    const q = lq.toLowerCase();
    const rows = c.users.filter(u => !q || [u.email, u.username, u.full_name].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (b[sortKey] ?? 0) > (a[sortKey] ?? 0) ? 1 : -1);
    const th = (k, l) => `<th><button class="sortbtn ${sortKey === k ? "on" : ""}" data-sort="${k}">${l}</button></th>`;
    return `<div class="page">${head("learners")}
      <div class="form-row"><label style="flex:1">Search<input id="lq" value="${esc(lq)}" placeholder="name, username or email"></label><button class="btn small" id="csv">Export CSV</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Learner</th><th>Plan</th>${th("seconds_7d", "7 days")}${th("total_seconds", "Total time")}${th("sections_read", "Read")}<th>Accuracy</th>${th("best_mock", "Best mock")}${th("target_date", "Exam")}${th("last_seen_at", "Last seen")}</tr></thead><tbody>
      ${rows.map(u => { const a = u.attempts ? Math.round(u.correct / u.attempts * 100) : null; return `<tr class="rowlink" data-href="#/admin/learners/${u.id}">
        <td><b>${esc(name(u))}</b>${u.role === "admin" ? ` <span class="tag plain">admin</span>` : ""}${!u.verified ? ` <span class="tag weak">unverified</span>` : ""}<div style="font-size:12px;color:var(--muted)">${esc(u.username || "")} · ${esc(u.email)}</div></td>
        <td><span class="plan-chip plan-${esc(u.plan || "silver")}">${esc(A.planById(u.plan).name)}</span>${u.plan_expires_at && new Date(u.plan_expires_at) < new Date() ? `<div style="font-size:11px;color:var(--bad)">expired</div>` : ""}</td>
        <td>${fmtDur(u.seconds_7d)}</td><td>${fmtDur(u.total_seconds)}</td><td>${u.sections_read}/54</td><td><span class="band ${band(a)}">${a == null ? "—" : a + "%"}</span></td>
        <td>${u.best_mock == null ? "—" : `<span class="band ${band(u.best_mock)}">${u.best_mock}%</span>`}</td><td>${u.target_date ? fmtD(u.target_date) : "—"}</td><td>${u.last_seen_at ? fmtD(u.last_seen_at) : "never"}</td></tr>`; }).join("")}
      </tbody></table></div></div>`;
  }

  async function detailData(id) { return db.admin.userDetail(id); }
  function detail(c, id) {
    const u = c.users.find(x => x.id === id);
    if (!u) return `<div class="page">${head("learners")}<p>Learner not found.</p></div>`;
    return `<div class="page">${head("learners")}
      <a class="btn small ghost" href="#/admin/learners">← All learners</a>
      <div class="card" style="margin-top:16px"><div style="display:flex;gap:16px;flex-wrap:wrap;align-items:baseline"><h3 style="font-size:28px;margin:0">${esc(name(u))}</h3><span class="tag plain">${esc(u.role)}</span>${u.verified ? `<span class="tag strong">verified</span>` : `<span class="tag weak">unverified</span>`}</div>
        <p>${esc(u.username || "")} · ${esc(u.email)} · joined ${fmtDY(u.created_at)} · exam ${u.target_date ? fmtDY(u.target_date) : "not set"} · analytics ${u.consent_analytics ? "on" : "off"}</p>
        <div class="btn-row"><button class="btn small" data-role="${u.role === "admin" ? "learner" : "admin"}">${u.role === "admin" ? "Remove admin" : "Make admin"}</button><button class="btn small" data-priv="${u.privileged ? 0 : 1}">${u.privileged ? "Hide private content" : "Show private content"}</button><button class="btn small danger-btn" id="erase">Erase learner…</button></div></div>
      <div class="card" style="margin-top:14px"><h3>Plan</h3><div class="form-row">
        <label>Plan<select id="uPlan">${A.plans.map(p => `<option value="${p.id}" ${p.id === u.plan ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
        <label>Free until<input id="uExp" type="date" value="${u.plan_expires_at ? String(u.plan_expires_at).slice(0, 10) : ""}"></label>
        <button class="btn small primary" id="uPlanSave">Save plan</button></div></div>
      <div id="detailBody"><div class="loading"><span></span><span></span><span></span></div></div></div>`;
  }
  async function fillDetail(id) {
    const el = $("#detailBody"); if (!el) return;
    try {
      const d = await detailData(id);
      const byDom = {}; d.time.forEach(t => { if (t.domain) byDom[t.domain] = (byDom[t.domain] || 0) + t.seconds; });
      const max = Math.max(1, ...Object.values(byDom));
      const acc = {}; d.attempts.forEach(a => { acc[a.domain] = acc[a.domain] || [0, 0]; acc[a.domain][1]++; if (a.correct) acc[a.domain][0]++; });
      const days = 30, perDay = {}; d.time.forEach(t => { perDay[t.day] = (perDay[t.day] || 0) + t.seconds; });
      const series = Array.from({ length: days }, (_, i) => ymd(addDays(today(), i - days + 1))), maxD = Math.max(60, ...series.map(x => perDay[x] || 0));
      el.innerHTML = `<h2 class="h-section">Last 30 days</h2><div class="daychart">${series.map(x => `<div class="dc-col" title="${fmtD(x)}: ${fmtDur(perDay[x] || 0)}"><i style="height:${Math.round((perDay[x] || 0) / maxD * 100)}%"></i></div>`).join("")}</div>
        <h2 class="h-section">By domain</h2><div class="bars">${D.map(dm => { const s = byDom[dm.id] || 0, a = acc[dm.id] ? Math.round(acc[dm.id][0] / acc[dm.id][1] * 100) : null; return `<div class="hbar" style="${dc(dm)}"><span>D${dm.n} ${esc(dm.short)}</span><div class="meter"><i style="width:${s / max * 100}%"></i></div><b>${fmtDur(s)}</b><span class="band ${band(a)}">${a == null ? "—" : a + "%"}</span></div>`; }).join("")}</div>
        <div class="grid-2" style="margin-top:30px"><div class="card"><h3>Mock exams</h3>${d.mocks.length ? d.mocks.map(m => { const v = Math.round(m.correct / m.total * 100); return `<div class="kv"><span>${fmtD(m.created_at)} · ${m.total} q · ${fmtDur(m.seconds)}</span><span class="band ${band(v)}">${v}%</span></div>`; }).join("") : "<p>None yet.</p>"}</div>
        <div class="card"><h3>Library</h3>${d.resources.length ? d.resources.map(r => `<div class="kv"><span>${esc(r.title)}</span><b>${esc(r.kind)}</b></div>`).join("") : "<p>Empty.</p>"}</div></div>`;
    } catch (e) { el.innerHTML = `<div class="warnbox">${esc(A.errMsg(e))}</div>`; }
  }

  async function audit() {
    let rows = [];
    try { rows = await db.admin.audit(auditF); } catch (e) { A.toast(A.errMsg(e)); }
    A._audit = rows;
    const cls = a => /erase|delete|admin\./.test(a) ? "weak" : /privacy|consent|export/.test(a) ? "medium" : "plain";
    return `<div class="page">${head("audit")}
      <p class="sub">Append-only: entries can’t be edited or deleted, by anyone. When a learner is erased, their entries are pseudonymised.</p>
      <div class="form-row">
        <label>Action contains<input id="aAction" value="${esc(auditF.action)}" placeholder="login, profile, erase…"></label>
        <label>Actor contains<input id="aActor" value="${esc(auditF.actor)}" placeholder="username"></label>
        <label>From<input id="aFrom" type="date" value="${esc(auditF.from)}"></label><label>To<input id="aTo" type="date" value="${esc(auditF.to)}"></label>
        <button class="btn small primary" id="aGo">Filter</button><button class="btn small" id="aCsv">Export CSV</button>
      </div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td style="white-space:nowrap">${new Date(r.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>${esc(r.actor_label || "system")}</td><td><span class="tag ${cls(r.action)}">${esc(r.action)}</span></td><td style="font-family:var(--mono);font-size:12px">${esc(JSON.stringify(r.detail || {})).slice(0, 160)}</td></tr>`).join("") || `<tr><td colspan="4">No entries.</td></tr>`}
      </tbody></table></div><p class="hint">Showing the latest ${rows.length} entries matching the filter.</p></div>`;
  }

  function requests(c) {
    return `<div class="page">${head("requests")}
      <p class="sub">Data-subject requests under GDPR and DPDP. Aim to respond within 30 days. Erasure can be done directly from a learner’s page.</p>
      ${c.requests.length ? c.requests.map(r => { const u = c.users.find(x => x.id === r.user_id); const age = Math.round((Date.now() - new Date(r.created_at)) / 864e5);
        return `<div class="card" style="margin-bottom:14px"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="tag ${r.status === "open" ? "weak" : r.status === "done" ? "strong" : "medium"}">${esc(r.status)}</span><b>${esc(r.kind)}</b><span class="phase-date">${fmtDY(r.created_at)} · ${age} days ago</span><span style="margin-left:auto">${u ? `<a href="#/admin/learners/${u.id}">${esc(name(u))}</a>` : esc(r.user_label || "erased user")}</span></div>
          <p style="margin-top:10px">${esc(r.details || "")}</p>
          <div class="form-row"><label>Status<select data-rs="${r.id}">${["open", "in_progress", "done", "rejected"].map(s => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}</select></label><label style="flex:1">Response to learner<textarea data-rr="${r.id}" maxlength="2000">${esc(r.resolution || "")}</textarea></label><button class="btn small primary" data-rsave="${r.id}">Save</button></div></div>`; }).join("") : `<p class="sub">No requests. 🎉</p>`}
    </div>`;
  }

  function plansTab() {
    const M = A.P.modules || {};
    return `<div class="page">${head("plans")}
      <p class="sub">Change prices, free periods and what each plan includes. Changes apply straight away to what learners see. A new free period applies to new sign-ups; extend an existing learner from their page under Learners.</p>
      <div class="plan-edit">${A.plans.map(p => `<form class="card stack plan-form plan-${p.id}" data-plan="${p.id}">
        <div class="plan-top"><span class="plan-gem"></span><b>${esc(p.name)}</b></div>
        <div class="form-row"><label style="flex:1">Name<input name="name" value="${esc(p.name)}" maxlength="30"></label><label style="flex:2">Tagline<input name="tagline" value="${esc(p.tagline || "")}" maxlength="160"></label></div>
        <div class="form-row"><label>Price per year after the free period<input name="price" type="number" min="0" step="1" value="${esc(p.price)}" style="min-width:110px"></label>
          <label>Currency<select name="currency">${["INR", "USD", "EUR", "GBP", "AED", "SGD"].map(c => `<option ${c === p.currency ? "selected" : ""}>${c}</option>`).join("")}</select></label>
          <label>Free period (months)<input name="free_months" type="number" min="0" max="120" value="${esc(p.free_months)}" style="min-width:90px"></label>
          <label class="check" style="align-self:center"><input type="checkbox" name="active" ${p.active !== false ? "checked" : ""}><span>Offered</span></label></div>
        <div><div class="hint" style="margin-bottom:6px">Modules included</div><div class="mod-grid">${Object.entries(M).map(([k, l]) => `<label class="check"><input type="checkbox" name="mod" value="${k}" ${(p.modules || []).includes(k) ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div></div>
        <label>What you get (one line each, shown on the cards)<textarea name="perks" rows="5">${esc((p.perks || []).join("\n"))}</textarea></label>
        <button class="btn small primary">Save ${esc(p.name)}</button></form>`).join("")}</div>
      <h2 class="h-section">Preview</h2>${A.planCards({})}</div>`;
  }

  function addForm() {
    return `<div class="card stack" style="max-width:640px">
      <h3>Create a learner account</h3>
      <p>The learner receives a verification email and must confirm their address before signing in. On first sign-in they’ll accept the privacy notice and set up their plan.</p>
      <div class="form-row"><label style="flex:1">Full name<input id="nName" maxlength="80"></label><label style="flex:1">Username<input id="nUser" maxlength="32" placeholder="lowercase"></label></div>
      <label>Email<input id="nEmail" type="email"></label>
      <div class="form-row"><label style="flex:1">Temporary password<input id="nPw" minlength="12"></label><button class="btn small" id="nGen" type="button">Generate</button></div>
      <p class="hint">Share the password privately (not by the same email). Ask them to change it under Profile after first sign-in.</p>
      <button class="btn primary" id="nGo">Create learner</button><div id="nMsg"></div></div>`;
  }

  const csv = (rows, cols) => [cols.join(",")].concat(rows.map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  const download = (text, file) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = file; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };

  function bind(r) {
    const tab = r.a || "overview";
    const rf = $("#refresh"); if (rf) rf.addEventListener("click", async () => { await load(true); A.rerender(); });
    if (tab === "learners") {
      const q = $("#lq"); if (q) { q.addEventListener("input", () => { lq = q.value; clearTimeout(q._t); q._t = setTimeout(() => { A.rerender(); setTimeout(() => { const n = $("#lq"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 50); }, 300); }); }
      $$("[data-sort]").forEach(b => b.addEventListener("click", () => { sortKey = b.dataset.sort; A.rerender(); }));
      $$(".rowlink").forEach(tr => tr.addEventListener("click", () => { location.hash = tr.dataset.href; }));
      const c = $("#csv"); if (c) c.addEventListener("click", () => { download(csv(cache.users, ["full_name", "username", "email", "role", "verified", "created_at", "last_seen_at", "target_date", "total_seconds", "seconds_7d", "sections_read", "attempts", "correct", "mocks", "best_mock"]), `learners-${ymd(today())}.csv`); db.logEvent("user.admin_export_learners", {}); });
      if (r.b) {
        fillDetail(r.b);
        $$("[data-role]").forEach(b => b.addEventListener("click", async () => { if (!confirm(`Change role to ${b.dataset.role}?`)) return; try { await db.admin.updateProfile(r.b, { role: b.dataset.role }); await load(true); A.rerender(); } catch (e) { A.toast(A.errMsg(e)); } }));
        $$("[data-priv]").forEach(b => b.addEventListener("click", async () => { try { await db.admin.updateProfile(r.b, { privileged: b.dataset.priv === "1" }); await load(true); A.rerender(); } catch (e) { A.toast(A.errMsg(e)); } }));
        const ps = $("#uPlanSave"); if (ps) ps.addEventListener("click", async () => {
          const exp = $("#uExp").value;
          try { await db.admin.updateProfile(r.b, { plan: $("#uPlan").value, plan_expires_at: exp ? new Date(exp + "T23:59:59").toISOString() : null }); A.toast("Plan saved"); await load(true); A.rerender(); } catch (e) { A.toast(A.errMsg(e)); }
        });
        const er = $("#erase"); if (er) er.addEventListener("click", async () => {
          const u = cache.users.find(x => x.id === r.b);
          const reason = prompt(`Erase ${name(u)} permanently? This deletes their account, data and files and pseudonymises their audit entries.\n\nType a reason (e.g. "erasure request #12") to confirm:`);
          if (!reason) return;
          try { await db.admin.deleteUser(r.b, reason); A.toast("Learner erased"); await load(true); location.hash = "#/admin/learners"; } catch (e) { A.toast(A.errMsg(e)); }
        });
      }
    }
    if (tab === "audit") {
      $("#aGo").addEventListener("click", () => { auditF = { action: $("#aAction").value.trim(), actor: $("#aActor").value.trim(), from: $("#aFrom").value, to: $("#aTo").value }; A.rerender(); });
      $("#aCsv").addEventListener("click", () => { download(csv((A._audit || []).map(x => Object.assign({}, x, { detail: JSON.stringify(x.detail) })), ["at", "actor_label", "action", "detail"]), `audit-${ymd(today())}.csv`); db.logEvent("user.admin_export_audit", {}); });
    }
    if (tab === "requests") $$("[data-rsave]").forEach(b => b.addEventListener("click", async () => {
      const id = b.dataset.rsave, status = $(`[data-rs="${id}"]`).value;
      try { await db.admin.updateRequest(id, { status, resolution: $(`[data-rr="${id}"]`).value.trim() || null, resolved_at: ["done", "rejected"].includes(status) ? new Date().toISOString() : null, resolved_by: db.user.id }); A.toast("Saved"); await load(true); A.rerender(); }
      catch (e) { A.toast(A.errMsg(e)); }
    }));
    if (tab === "plans") $$(".plan-form").forEach(f => f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const g = n => f.elements[n];
      const patch = { name: g("name").value.trim(), tagline: g("tagline").value.trim(), price: Math.max(0, +g("price").value || 0), currency: g("currency").value,
        free_months: Math.max(0, Math.min(120, parseInt(g("free_months").value, 10) || 0)), active: g("active").checked,
        modules: Array.from(f.querySelectorAll('input[name="mod"]:checked')).map(x => x.value),
        perks: g("perks").value.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 12) };
      if (!patch.name) return A.toast("Give the plan a name");
      try { await db.admin.updatePlan(f.dataset.plan, patch); await A.loadPlans(); A.toast(`${patch.name} saved`); A.rerender(); } catch (x) { A.toast(A.errMsg(x)); }
    }));
    if (tab === "add") {
      $("#nUser").addEventListener("input", e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""); });
      $("#nGen").addEventListener("click", () => { const cs = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%"; const a = new Uint32Array(16); crypto.getRandomValues(a); $("#nPw").value = Array.from(a, x => cs[x % cs.length]).join(""); });
      $("#nGo").addEventListener("click", async (e) => {
        const payload = { full_name: $("#nName").value.trim(), username: $("#nUser").value.trim(), email: $("#nEmail").value.trim(), password: $("#nPw").value };
        e.target.disabled = true; e.target.textContent = "Creating…";
        try { await db.admin.createUser(payload); $("#nMsg").innerHTML = `<div class="okbox">Created ${esc(payload.username)}. A verification email has been sent to ${esc(payload.email)}.</div>`; ["#nName", "#nUser", "#nEmail", "#nPw"].forEach(s => { $(s).value = ""; }); cache = null; }
        catch (x) { $("#nMsg").innerHTML = `<div class="warnbox">${esc(A.errMsg(x))}</div>`; }
        e.target.disabled = false; e.target.textContent = "Create learner";
      });
    }
  }

  A.register("admin", { render, bind, admin: true, title: "Admin", nav: "admin", area: "other" });
})();

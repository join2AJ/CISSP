/* StudyCISSP — core: state, router, personalisation, time tracking, reading views */
(function () {
  "use strict";

  const App = window.App = {};
  const D = window.DOMAINS.slice().sort((a, b) => a.n - b.n);
  const P = window.PAGES, B = window.BANK, db = window.DB, C = window.CISSP_CONFIG || {};
  const byId = Object.fromEntries(D.map(d => [d.id, d]));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const view = $("#view"), toc = $("#toc");
  Object.assign(App, { D, P, B, db, byId, $, $$ });

  /* ---------------- helpers ---------------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysTo = s => Math.round((parseD(s) - today()) / 864e5);
  const fmtD = s => parseD(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const fmtDY = s => parseD(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtDur = s => { s = Math.round(s || 0); if (s < 60) return s + "s"; const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h ${pad(m)}m` : `${m}m`; };
  const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const prioLabel = { weak: "Focus", medium: "Build", strong: "Strength" };
  const words = d => d.sections.reduce((n, s) => n + strip(s.body).split(" ").length, strip(d.intro).split(" ").length);
  const readMins = d => Math.max(1, Math.round(words(d) / 220));
  const band = v => (v == null || v === "" || isNaN(v)) ? "none" : v >= 85 ? "green" : v >= 65 ? "orange" : "red";
  const bandLabel = { green: "Green", orange: "Orange", red: "Red", none: "—" };
  const dc = d => `--dc: var(--${d.id})`;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  Object.assign(App, { esc, strip, pad, ymd, today, parseD, addDays, daysTo, fmtD, fmtDY, fmtDur, roman, prioLabel, readMins, band, bandLabel, dc, shuffle, pick });

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }
  App.toast = toast;
  App.errMsg = e => (e && (e.message || e.error_description || e.msg)) || String(e);

  /* ---------------- per-user state ---------------- */
  const blank = () => ({ read: {}, quiz: {}, scores: {}, mocks: [], errors: [], tasks: {}, last: null, planStart: null });
  let S = blank(), stateKey = "cissp.v1:local", saveTimer = null;
  App.state = () => S;
  function loadLocal(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function save() {
    try { localStorage.setItem(stateKey, JSON.stringify(S)); } catch (e) {}
    if (db.mode === "cloud" && db.user) { clearTimeout(saveTimer); saveTimer = setTimeout(() => db.saveState(S).catch(() => {}), 1500); }
  }
  App.save = save;

  let settings;
  try { settings = JSON.parse(localStorage.getItem("cissp.settings") || "{}"); } catch (e) { settings = {}; }
  const saveSettings = () => { try { localStorage.setItem("cissp.settings", JSON.stringify(settings)); } catch (e) {} };

  /* ---------------- profile & personalisation ---------------- */
  App.profile = null; App.attempts = []; App.mocks = []; App.timeRows = null;
  /* plans & access */
  App.plans = P.plans.slice();
  App.planById = id => App.plans.find(p => p.id === id) || App.plans[0];
  App.FEATURE = { read: "chapters", domain: "chapters", latest: "chapters", glossary: "glossary", plan: "plan", tactics: "plan", flashcards: "flashcards", quiz: "quiz", mock: "mock", insights: "insights", tracker: "insights", library: "library" };
  App.planExpired = () => { const p = App.profile; return !!(p && p.plan_expires_at && new Date(p.plan_expires_at) < new Date()); };
  App.can = (feature) => {
    if (!feature || db.mode === "local") return true;
    if (App.isAdmin() || App.isPrivileged()) return true;
    if (!App.profile) return false;
    if (App.planExpired()) return ["chapters", "glossary"].includes(feature);
    return (App.planById(App.profile.plan).modules || []).includes(feature);
  };
  App.money = (v, cur) => { try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur || "INR", maximumFractionDigits: v % 1 ? 2 : 0 }).format(v); } catch (e) { return (cur || "") + " " + v; } };
  App.planCards = (opts = {}) => {
    const cur = App.profile && App.profile.plan;
    return `<div class="plans">${App.plans.filter(p => p.active !== false).map(p => {
      const mine = cur === p.id && db.user;
      const after = +p.price > 0 ? `then ${App.money(+p.price, p.currency)} a year` : "no charge set after that yet";
      const cta = opts.signup ? `<a class="btn ${p.id === "gold" ? "primary" : ""}" href="#/signup/${p.id}">Start free with ${esc(p.name)}</a>`
        : mine ? `<span class="btn ghost" aria-disabled="true">✓ Your plan</span>` : opts.request ? `<button class="btn" data-upgrade="${p.id}">Request ${esc(p.name)}</button>` : "";
      return `<div class="plan plan-${p.id} ${mine ? "mine" : ""}">
        <div class="plan-top"><span class="plan-gem"></span><b>${esc(p.name)}</b>${p.id === "gold" ? `<span class="plan-pop">Most popular</span>` : ""}</div>
        <p class="plan-tag">${esc(p.tagline || "")}</p>
        <div class="plan-price"><b>Free</b><span>for ${p.free_months} month${p.free_months == 1 ? "" : "s"}</span></div>
        <p class="plan-after">${esc(after)}</p>
        <ul>${(p.perks || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        ${cta}</div>`;
    }).join("")}</div>`;
  };
  App.publicMode = () => db.mode === "cloud" ? !db.user : !(App.profile && App.profile.onboarded);
  App.isAdmin = () => !!(App.profile && App.profile.role === "admin");
  App.isPrivileged = () => !!(App.profile && (App.profile.privileged || App.profile.role === "admin"));
  App.firstName = () => { const p = App.profile || {}; return (p.full_name || p.username || "").split(" ")[0] || "there"; };
  const prioMap = { new: "weak", some: "medium", confident: "strong" };
  const prio = d => prioMap[((App.profile || {}).self_assessment || {})[d.id]] || "medium";
  App.prio = prio;
  const prioRank = { weak: 0, medium: 1, strong: 2 };
  App.pathOrder = () => D.slice().sort((a, b) => prioRank[prio(a)] - prioRank[prio(b)] || b.weight - a.weight || a.n - b.n);
  App.examTarget = () => (App.profile && App.profile.target_date) || ymd(addDays(today(), 91));
  App.examLatest = () => (App.profile && App.profile.latest_date) || App.examTarget();

  const domProgress = d => { const r = d.sections.filter(s => S.read[d.id + ":" + s.id]).length; return { r, t: d.sections.length, pct: Math.round(r / d.sections.length * 100) }; };
  const allProgress = () => { let r = 0, t = 0; D.forEach(d => { const p = domProgress(d); r += p.r; t += p.t; }); return { r, t, pct: Math.round(r / t * 100) }; };
  App.domProgress = domProgress; App.allProgress = allProgress;

  /* question pool: chapter questions + bank */
  App.questions = (() => {
    const out = [];
    D.forEach(d => d.questions.forEach((q, i) => out.push({ id: `${d.id}-c${i}`, d: d.id, t: (B.chapterTopics[d.id] || [])[i] || "", q: q.q, o: q.options, a: q.answer, w: q.why, chapter: i })));
    const idx = {};
    B.questions.forEach(q => { idx[q.d] = (idx[q.d] || 0) + 1; out.push({ id: `${q.d}-b${idx[q.d]}`, d: q.d, t: q.t, q: q.q, o: q.o, a: q.a, w: q.w }); });
    return out;
  })();
  /* Shuffle answer options so the right answer isn't always in the same place.
     With a seed (e.g. the question id) the order is stable across visits. */
  App.shuffleQ = (q, seed) => {
    let s = 0;
    if (seed != null) for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = seed == null ? Math.random : () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const idx = q.o.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return Object.assign({}, q, { o: idx.map(i => q.o[i]), a: idx.indexOf(q.a) });
  };
  /* The section after a given one, skipping ahead to the next domain at the end of a chapter. */
  App.nextSection = (did, sid) => {
    const d = byId[did]; if (!d) return null;
    const i = d.sections.findIndex(s => s.id === sid);
    if (i >= 0 && i < d.sections.length - 1) return { d, s: d.sections[i + 1], i: i + 1 };
    const nd = D[D.indexOf(d) + 1];
    return nd ? { d: nd, s: nd.sections[0], i: 0 } : null;
  };
  App.cards = (() => { const out = []; Object.entries(B.flashcards).forEach(([d, list]) => list.forEach((c, i) => out.push({ id: `${d}-f${i}`, d, front: c[0], back: c[1] }))); return out; })();

  App.quizAccuracy = (dom) => {
    const rows = App.attempts.filter(a => !dom || a.domain === dom);
    if (!rows.length) return null;
    return Math.round(rows.filter(a => a.correct).length / rows.length * 100);
  };
  App.domainScore = (id) => {
    const s = S.scores[id];
    if (s && s.latest !== "" && s.latest != null) return { v: +s.latest, src: "tracker" };
    const rows = App.attempts.filter(a => a.domain === id);
    if (rows.length >= 5) return { v: App.quizAccuracy(id), src: "quizzes" };
    return { v: null, src: null };
  };

  /* plan generator: weak domains first, days in proportion to weight × need */
  App.plan = function () {
    const start = parseD(S.planStart || ymd(today()));
    const target = parseD(App.examTarget());
    const latest = parseD(App.examLatest());
    const taperStart = addDays(target, -3);
    const total = Math.max(14, Math.round((taperStart - start) / 864e5));
    const i1 = Math.round(total * 0.55), i2 = Math.round(total * 0.25), i3 = total - i1 - i2;
    const need = { weak: 3, medium: 2, strong: 1.1 };
    const order = App.pathOrder();
    const deep = order.filter(d => prio(d) !== "strong"), fast = order.filter(d => prio(d) === "strong");
    const units = deep.map(d => ({ ds: [d], w: d.weight * need[prio(d)] }));
    if (fast.length) units.push({ ds: fast, w: fast.reduce((n, d) => n + d.weight * need.strong, 0), fast: true });
    const W = units.reduce((n, u) => n + u.w, 0);
    let cursor = new Date(start);
    const phases = [];
    units.forEach((u, k) => {
      const days = k === units.length - 1 ? Math.max(2, Math.round((addDays(start, i1) - cursor) / 864e5)) : Math.max(2, Math.round(i1 * u.w / W));
      const end = addDays(cursor, days - 1);
      const d0 = u.ds[0];
      const names = u.ds.map(d => "D" + d.n).join(", ");
      phases.push({
        id: "i1-" + u.ds.map(d => d.id).join(""), start: ymd(cursor), end: ymd(end), iter: "Iteration 1 · Learn", domain: d0.id,
        title: u.fast ? `Fast pass: ${names}` : `Domain ${d0.n}: ${d0.title}`,
        text: u.fast ? "Your strengths. Read for ISC2’s wording and its differences from frameworks you already know, then test yourself."
          : prio(d0) === "weak" ? "A focus domain. Read every section slowly, tick each one you understand, and do the chapter questions straight after."
          : "Build this domain to confidence: read each section, then quiz yourself by topic.",
        exit: u.fast ? "Every section ticked and a 10-question quiz at 70%+ per domain." : `All D${d0.n} sections read and a D${d0.n} quiz at 65%+.`,
        tasks: u.ds.flatMap(d => [`Read all D${d.n} sections in the Reader`, `Sybex: ${d.sybex.split(" · ")[0]}${d.sybex.includes("·") ? " and the rest of the listed chapters" : ""}`, `Take a 10-question D${d.n} quiz`, `Review the D${d.n} flashcards`])
          .concat(k === 0 ? ["Take a cold diagnostic quiz before reading", App.profile && App.profile.exam_booked ? "Confirm the booking details and ID" : "Book the exam at Pearson VUE"] : [])
      });
      cursor = addDays(end, 1);
    });
    const i2s = addDays(start, i1), i2e = addDays(i2s, i2 - 1), i3s = addDays(i2e, 1), i3e = addDays(taperStart, -1);
    phases.push({ id: "i2", start: ymd(i2s), end: ymd(i2e), iter: "Iteration 2 · Fix", domain: order[0].id, title: "Targeted fixing of red and orange domains",
      text: "Quiz by domain and by topic. Spend most of your time where Insights shows red or orange. Log every miss with its reason.",
      exit: "No domain below 65%, most at 75% or higher.",
      tasks: order.filter(d => prio(d) !== "strong").map(d => `Two topic quizzes on your weakest D${d.n} topics`).concat(["Domain quizzes for your strength domains", "Clear all due flashcards each week", "Review the error log by reason", "Line up an ISC2-certified endorser"]) });
    phases.push({ id: "i3", start: ymd(i3s), end: ymd(i3e), iter: "Iteration 3 · Drill", domain: "d7", title: "Mixed sets, error log and mock exams",
      text: `Mixed quizzes and at least two timed mocks. Use outside banks (Official Practice Tests, Boson) for volume.`,
      exit: "Two mocks at 75%+.",
      tasks: ["Mock exam 1 (in the app, full bank)", "Mixed set from an outside bank, 100+ questions", "Mock exam 2", "Re-read every Memorise card"] });
    phases.push({ id: "taper", start: ymd(taperStart), end: ymd(addDays(target, -1)), iter: "Taper", domain: "d2", title: "Rest and light review",
      text: "Memorise cards and flashcards only. Sleep. No new material.", exit: "Rested, with logistics confirmed.",
      tasks: ["Read Exam tactics once", "Check your ID matches the booking exactly", "Plan travel with a 30-minute buffer"] });
    phases.push({ id: "exam", start: ymd(target), end: ymd(latest > target ? latest : target), iter: "Exam", domain: "d5", title: "Sit the exam",
      text: "Arrive early. Read each question for its qualifier. Think like a manager. One question at a time.",
      exit: "Pass, then complete the endorsement within nine months.", tasks: ["Sit the exam", "Start the endorsement application"] });
    const focus = D.filter(d => prio(d) !== "strong").map(d => d.id);
    const checkpoints = [
      { date: ymd(addDays(start, i1 - 1)), check: `${focus.length ? focus.map(id => "D" + byId[id].n).join(", ") : "All domains"} at 65%+`, ifMissed: "Push the target date back if your latest date allows, or trim strength-domain review.",
        test: () => (focus.length ? focus : D.map(d => d.id)).every(id => (App.domainScore(id).v || 0) >= 65) },
      { date: ymd(i2e), check: "No red domains (all 65%+)", ifMissed: "Use the buffer before your latest date; drill only red domains.",
        test: () => D.every(d => (App.domainScore(d.id).v || 0) >= 65) },
      { date: ymd(addDays(taperStart, -1)), check: "Two mocks at 75%+", ifMissed: "Move to your latest possible date if you have one.",
        test: () => App.mocks.filter(m => m.correct / m.total >= .75).length + S.mocks.filter(m => m.score >= 75).length >= 2 }
    ];
    return { phases, checkpoints, start: ymd(start) };
  };
  App.currentPhase = () => {
    const now = today(), ph = App.plan().phases;
    return ph.find(p => parseD(p.start) <= now && now <= parseD(p.end)) || (now < parseD(ph[0].start) ? ph[0] : null);
  };

  /* ---------------- time tracking ---------------- */
  const T = { ctx: null, buf: {}, last: Date.now(), active: Date.now() };
  App.setTrack = (ctx) => { T.ctx = ctx; };
  ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach(ev => addEventListener(ev, () => { T.active = Date.now(); }, { passive: true }));
  setInterval(() => {
    const now = Date.now(), dt = Math.round((now - T.last) / 1000); T.last = now;
    if (!T.ctx || document.hidden || now - T.active > 90000 || dt > 30 || !App.profile || App.profile.consent_analytics === false) return;
    const k = [ymd(today()), T.ctx.area, T.ctx.domain || "", T.ctx.topic || ""].join("|");
    T.buf[k] = (T.buf[k] || 0) + dt;
  }, 5000);
  async function flush() {
    const entries = Object.entries(T.buf); T.buf = {};
    for (const [k, s] of entries) {
      const [day, area, domain, topic] = k.split("|");
      if (App.timeRows) App.timeRows.push({ day, area, domain, topic, seconds: s });
      try { await db.addTime(day, area, domain, topic, s); } catch (e) {}
    }
  }
  App.flushTime = flush;
  setInterval(flush, 30000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
  addEventListener("pagehide", flush);
  App.loadTime = async () => { if (!App.timeRows) { try { App.timeRows = await db.myTime(ymd(addDays(today(), -400))); } catch (e) { App.timeRows = []; } } return App.timeRows; };
  App.streak = () => {
    const days = {}; (App.timeRows || []).forEach(r => { days[r.day] = (days[r.day] || 0) + r.seconds; });
    let n = 0, d = today();
    if (!(days[ymd(d)] >= 300)) d = addDays(d, -1);
    while (days[ymd(d)] >= 300) { n++; d = addDays(d, -1); }
    return n;
  };
  App.secondsSince = (since) => (App.timeRows || []).filter(r => r.day >= since).reduce((n, r) => n + r.seconds, 0);

  /* ---------------- router ---------------- */
  const routes = {};
  App.routes = routes;
  App.register = (name, def) => { routes[name] = def; };
  function parse() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b, c] = h.split("/");
    return { page: a || "home", a: b ? decodeURIComponent(b) : b, b: c ? decodeURIComponent(c) : c };
  }
  App.parse = parse;
  const sessionGet = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return "x"; } };
  App.sessionSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };
  const redirect = (h) => { history.replaceState(null, "", h); route(); };
  App.redirect = redirect;

  let observer = null, rendered = null, token = 0;
  async function route() {
    const r = parse();
    let def = routes[r.page] || routes.home;
    // gate
    if (db.mode === "cloud") {
      if (!db.user && !def.public) return redirect("#/landing");
      if (db.user && App.profile) {
        if (!App.profile.consent_terms_at && !def.public && r.page !== "consent") return redirect("#/consent");
        if (App.profile.consent_terms_at && !App.profile.onboarded && !["welcome", "privacy", "consent", "choose"].includes(r.page) && !(def.admin && App.isAdmin())) return redirect("#/welcome");
        if (["login", "signup", "landing"].includes(r.page)) return redirect("#/");
      }
    } else if (App.profile && !App.profile.onboarded && !def.public && !["welcome", "privacy", "signup", "login"].includes(r.page)) return redirect("#/landing");
    if (App.profile && App.isAdmin() && r.page === "home" && !sessionGet("cissp.mode")) return redirect("#/choose");
    if (def.admin && !App.isAdmin()) return redirect("#/");
    if (db.mode === "cloud" && !db.user && !def.public && r.page !== "landing") return redirect("#/landing");
    const feat = App.FEATURE[r.page];
    if (feat && db.user !== undefined && App.profile && !App.can(feat)) def = Object.assign({}, def, { render: () => lockedView(feat), bind: bindLocked, area: "other" });

    rendered = r.page === "domain" ? "domain:" + r.a : r.page + ":" + (r.a || "");
    if (observer) { observer.disconnect(); observer = null; }
    closeToc(); closeMenu();
    const site = !!def.site || (!!def.public && App.publicMode());
    document.body.classList.toggle("site", site);
    document.body.classList.toggle("bare", !!def.bare || site);
    const my = ++token;
    let out = def.render(r);
    if (out && typeof out.then === "function") {
      view.innerHTML = `<div class="page-narrow"><div class="loading"><span></span><span></span><span></span></div></div>`;
      try { out = await out; } catch (e) { out = `<div class="page-narrow"><h1 class="h-display">Something went wrong</h1><p class="lede">${esc(App.errMsg(e))}</p></div>`; }
      if (my !== token) return;
    }
    view.innerHTML = out + (site ? (App.siteFooter ? App.siteFooter() : "") : def.bare ? "" : footer());
    view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter");
    if (!def.bare && !site) renderToc(r);
    paintNav(r, def);
    document.documentElement.style.setProperty("--pc", r.page === "domain" && byId[r.a] ? `var(--${r.a})` : "var(--accent)");
    App.setTrack(def.area ? { area: typeof def.area === "function" ? def.area(r) : def.area, domain: r.page === "domain" ? r.a : "", topic: "" } : null);
    bindCommon(r);
    if (def.bind) def.bind(r);
    if (r.page === "domain" && r.b) {
      const el = document.getElementById(r.b);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); else window.scrollTo(0, 0);
    } else window.scrollTo(0, 0);
    if (r.page === "domain") { S.last = { d: r.a, s: r.b || null }; save(); }
    document.title = (def.title ? (typeof def.title === "function" ? def.title(r) : def.title) + " · " : "") + "StudyCISSP";
    onScroll();
  }
  App.route = route;
  App.rerender = () => { rendered = null; const y = scrollY; route().then(() => scrollTo(0, y)); };

  function paintNav(r, def) {
    const key = def.nav || r.page;
    $$(".mainnav a, .pubnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === key));
    const signedIn = db.mode === "cloud" ? !!db.user : !!(App.profile && App.profile.onboarded);
    const ps = $("#pubSignin"), pst = $("#pubStart");
    if (ps) { ps.hidden = signedIn || r.page === "login"; }
    if (pst) { pst.textContent = signedIn ? "Open dashboard" : "Get started"; pst.setAttribute("href", signedIn ? "#/" : "#/signup/gold"); }
    $$(".pub-mobile-actions").forEach(x => { x.innerHTML = signedIn ? `<a href="#/" class="btn small primary">Open dashboard</a>` : `<a href="#/login" class="btn small">Sign in</a><a href="#/signup/gold" class="btn small primary">Get started</a>`; });
    const pn = $("#pubnav"); if (pn) pn.classList.remove("open");
    const adm = $("#navAdmin"); if (adm) adm.hidden = !App.isAdmin();
    $$(".mainnav a").forEach(a => a.classList.toggle("locked", !!App.profile && !App.can(App.FEATURE[a.dataset.nav === "read" ? "read" : a.dataset.nav])));
    const signed = db.mode === "local" || !!db.user;
    $("#userBtn").hidden = !signed || (!!def.bare && !(App.profile && App.profile.onboarded)) || (db.mode === "cloud" && !db.user);
    $(".mainnav").style.visibility = def.bare && !document.body.classList.contains("site") ? "hidden" : "";
    $("#searchOpen").style.visibility = def.bare ? "hidden" : "";
    const ini = $("#userIni"); if (ini) { const p = App.profile || {}; ini.textContent = ((p.full_name || p.username || "•")[0] || "•").toUpperCase(); }
  }

  /* ---------------- TOC & menus ---------------- */
  function renderToc(r) {
    const all = allProgress();
    const order = App.pathOrder();
    let h = `<div class="mob-nav">
      ${[["", "Home"], ["read", "Chapters"], ["quiz", "Quiz"], ["flashcards", "Flashcards"], ["mock", "Mock exam"], ["glossary", "Glossary"], ["plan", "Plan"], ["insights", "Insights"], ["library", "My library"]].concat(App.isAdmin() ? [["admin", "Admin"]] : []).map(([k, v]) => `<a href="#/${k}">${v}</a>`).join("")}
    </div>`;
    h += `<div class="toc-head">Your path · weakest first</div><ol class="toc-list">`;
    order.forEach(d => {
      const p = domProgress(d);
      const active = r.page === "domain" && r.a === d.id;
      h += `<li><a href="#/domain/${d.id}" class="${active ? "active" : ""}" style="${dc(d)}">
        <span class="toc-dot" style="background:var(--${d.id})"></span><span>D${d.n} ${esc(d.short)}</span><span class="toc-pct">${p.pct}%</span></a>`;
      if (active) h += `<ol class="toc-sub">` + d.sections.map((s, i) => `<li><a href="#/domain/${d.id}/${s.id}" data-sec="${s.id}" class="${S.read[d.id + ":" + s.id] ? "read" : ""}">${d.n}.${i + 1} ${esc(s.title)}</a></li>`).join("") + `</ol>`;
      h += `</li>`;
    });
    const L = (k, ico, t) => `<li><a href="#/${k}" class="${r.page === k ? "active" : ""}"><span class="toc-num">${ico}</span>${t}</a></li>`;
    h += `</ol><div class="toc-head">Practise</div><ol class="toc-list">
      ${L("glossary", "Aa", "Glossary A–Z")}${L("quiz", "?", "Quiz by domain or topic")}${L("flashcards", "❐", "Flashcards")}${L("mock", "◷", "Mock exam")}
    </ol><div class="toc-head">Companion</div><ol class="toc-list">
      ${L("plan", "▤", "My study plan")}${L("insights", "◔", "Insights & time spent")}${L("tracker", "▦", "Scores & error log")}${L("library", "❏", "My library")}
      ${L("tactics", "◎", "Exam tactics")}${L("latest", "✦", "What’s new, 2024–2026")}${L("resources", "§", "Resources")}${L("privacy", "⚿", "Privacy & trust")}
    </ol>
    <div class="toc-card"><b>${all.pct}%</b>read · ${all.r} of ${all.t} sections<div class="meter" style="margin-top:10px"><i style="width:${all.pct}%;background:var(--accent)"></i></div></div>`;
    toc.innerHTML = h;
  }
  App.renderToc = renderToc;
  const closeToc = () => { toc.classList.remove("open"); $("#scrim").classList.remove("on"); };
  const closeMenu = () => { const m = $("#userMenu"); if (m) m.hidden = true; };

  /* ---------------- shared view parts ---------------- */
  function countdown() {
    const t = daysTo(App.examTarget()), dl = daysTo(App.examLatest());
    const same = App.examTarget() === App.examLatest();
    const has = App.profile && App.profile.target_date;
    return `
      <div class="count target"><div class="count-num">${Math.max(t, 0)}</div><div class="count-lbl">${t > 0 ? "days to your target date" : t === 0 ? "exam day is today" : "target date reached"}<small>${has ? fmtDY(App.examTarget()) : "Set your date in Profile"}</small></div></div>
      ${same ? "" : `<div class="count deadline"><div class="count-num">${Math.max(dl, 0)}</div><div class="count-lbl">days to your latest possible date<small>${fmtDY(App.examLatest())}</small></div></div>`}`;
  }
  App.countdown = countdown;

  function bookCard(d) {
    const p = domProgress(d), pr = prio(d);
    return `<a class="book" href="#/domain/${d.id}" style="${dc(d)}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="book-num">${roman[d.n]}</span><span class="tag ${pr}">${prioLabel[pr]}</span></div>
      <div class="book-title">${esc(d.title)}</div>
      <div class="book-meta">${d.weight}% of exam · ${d.sections.length} sections · ${readMins(d)} min read</div>
      <div class="book-foot"><div class="meter"><i style="width:${p.pct}%"></i></div><span class="book-pct">${p.pct}%</span></div>
    </a>`;
  }
  App.bookCard = bookCard;

  function nextSection() {
    for (const d of App.pathOrder()) for (const s of d.sections) if (!S.read[d.id + ":" + s.id]) return { d, s };
    return null;
  }

  function footer() {
    return `<footer class="foot"><span>© ${new Date().getFullYear()} StudyCISSP · independent study material, not affiliated with ISC2. CISSP® is a registered mark of ISC2, Inc.</span><span class="foot-links"><a href="#/about">About CISSP</a><a href="#/faq">FAQ</a><a href="#/contact">Contact</a><a href="#/terms">Terms</a><a href="#/privacy">Privacy &amp; trust</a></span></footer>
    <button class="back-top" id="backTop" aria-label="Back to top">↑</button>`;
  }

  /* ---------------- reading views ---------------- */
  async function viewHome() {
    await App.loadTime();
    const all = allProgress(), ph = App.currentPhase(), nx = nextSection();
    const wk = App.secondsSince(ymd(addDays(today(), -6))), streak = App.streak(), acc = App.quizAccuracy();
    const due = App.dueCards ? App.dueCards().length : 0;
    const weakest = App.pathOrder()[0];
    const hr = new Date().getHours();
    const greet = hr < 5 ? "Burning the midnight oil" : hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const last = S.last && byId[S.last.d] ? byId[S.last.d] : null;
    const cont = last ? `<a class="btn primary" href="#/domain/${last.id}${S.last.s ? "/" + S.last.s : ""}">Continue · D${last.n} ${esc(last.short)} →</a>`
      : nx ? `<a class="btn primary" href="#/domain/${nx.d.id}/${nx.s.id}">Start with D${nx.d.n} ${esc(nx.d.short)} →</a>` : `<a class="btn primary" href="#/mock">Take a mock exam →</a>`;
    return `<div class="page">
      <section class="hero">
        <div>
          <div class="kicker">${greet}, ${esc(App.firstName())}</div>
          <h1 class="h-display">Read slowly.<br><em>Pass once.</em></h1>
          <p class="lede">${esc(pick(B.encouragement))}</p>
          <div class="btn-row">${cont}<a class="btn" href="#/quiz">Quick quiz</a></div>
        </div>
        <div class="hero-aside">
          ${countdown()}
          ${ph ? `<a class="count" href="#/plan" style="text-decoration:none"><div class="count-lbl" style="flex:1"><span class="kicker" style="--kc:var(--${ph.domain})">Now · ${esc(ph.iter)}</span><div style="font-family:var(--display);font-size:20px;margin-top:4px">${esc(ph.title)}</div><small>${fmtD(ph.start)} – ${fmtD(ph.end)} · exit: ${esc(ph.exit)}</small></div></a>` : ""}
        </div>
      </section>

      ${planBanner()}
      <section class="facts">
        <div class="fact"><b>${streak}<small class="unit"> day${streak === 1 ? "" : "s"}</small></b><span>study streak (5+ min a day)</span></div>
        <div class="fact"><b>${fmtDur(wk)}</b><span>studied in the last 7 days</span></div>
        <div class="fact"><b>${all.r}<small class="unit">/${all.t}</small></b><span>sections understood</span></div>
        <div class="fact"><b>${acc == null ? "—" : acc + "%"}</b><span>quiz accuracy so far</span></div>
      </section>

      <h2 class="h-section">Today’s focus</h2>
      <p class="sub">Three small things. Do one and today counts.</p>
      <div class="grid-3">
        <a class="card focus" href="${nx ? `#/domain/${nx.d.id}/${nx.s.id}` : "#/read"}" style="${nx ? dc(nx.d) : ""}"><span class="kicker" style="--kc:var(--dc,var(--accent))">Read · ~6 min</span><h3>${nx ? esc(nx.s.title) : "All sections read"}</h3><p>${nx ? `D${nx.d.n} ${esc(nx.d.short)} · your ${prioLabel[prio(nx.d)].toLowerCase()} domain` : "Revisit Memorise cards before the exam."}</p></a>
        <a class="card focus" href="#/flashcards"><span class="kicker">Flashcards · ~5 min</span><h3>${due} card${due === 1 ? "" : "s"} due</h3><p>Spaced repetition keeps the facts you’ve learned from fading.</p></a>
        <a class="card focus" href="#/quiz/run/domain/${weakest.id}" style="${dc(weakest)}"><span class="kicker" style="--kc:var(--dc)">Quiz · ~8 min</span><h3>10 questions on D${weakest.n}</h3><p>${esc(weakest.title)}: where the most marks are waiting.</p></a>
      </div>

      <h2 class="h-section">Your path</h2>
      <p class="sub">Ordered from your self-assessment: focus domains first, strengths last. Change it any time in <a href="#/profile">your profile</a>.</p>
      <div class="shelf">${App.pathOrder().map(bookCard).join("")}</div>

      <h2 class="h-section">The exam, to scale</h2>
      <p class="sub">Width is each domain’s exam weight. The shaded height is your current score (Tracker or quiz accuracy).</p>
      <div class="wmap">${D.map(d => {
        const sc = App.domainScore(d.id).v || 0;
        return `<a href="#/domain/${d.id}" style="flex:${d.weight};${dc(d)}" title="D${d.n} ${esc(d.title)}: ${d.weight}%"><div class="fill" style="height:${sc}%"></div><b>${d.weight}%</b><span>D${d.n} ${esc(d.short)}</span></a>`;
      }).join("")}</div>
      <p class="legend">Bands used throughout: <span class="band green">85%+</span> <span class="band orange">65–84%</span> <span class="band red">&lt;65%</span></p>

      <h2 class="h-section">The pathway</h2>
      <p class="sub">From ISC2’s <a href="#/resources">Ultimate Guide to the CISSP</a>: six steps from candidate to certified member.</p>
      <div class="path">${P.pathway.map((s, i) => `<div class="step"><b>${i + 1}</b><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join("")}</div>

      <p class="quote">“Think like a manager, act like an adviser, and never forget that people come first.”</p>
      <p class="quote-by">The one sentence that answers more CISSP questions than any fact.</p>
    </div>`;
  }

  function viewChapters() {
    return `<div class="page">
      <div class="kicker">Contents</div>
      <h1 class="h-display">The eight <em>chapters</em></h1>
      <p class="lede">Each chapter opens with a short essay, then walks through every objective of its domain. Callouts mark what the exam tests, the manager’s view, memory hooks, common traps and what changed between 2024 and 2026. Shown in your personal order.</p>
      <div class="shelf" style="margin-top:34px">${App.pathOrder().map(bookCard).join("")}</div>
    </div>`;
  }

  /* Chapters read like a book: an opening page, one page per subsection, and a Memorise & practice page. */
  const qCount = (d, s) => App.questions.filter(x => x.d === d.id && x.t === s.id).length;
  function chapterBar(d, cur) {
    const p = domProgress(d);
    return `<div class="ch-bar">
        <a class="ch-bar-title" href="#/domain/${d.id}"><span class="kicker" style="--kc:var(--dc)">Domain ${pad(d.n)} · ${d.weight}%</span><b>${esc(d.title)}</b></a>
        <div class="ch-bar-prog" title="Sections understood"><span class="meter"><i style="width:${p.pct}%"></i></span><span id="chPct">${p.pct}%</span></div>
      </div>
      <nav class="steps" aria-label="Pages in this chapter">
        <a href="#/domain/${d.id}" class="${!cur ? "on" : ""}" title="Introduction">Intro</a>
        ${d.sections.map((s, i) => `<a href="#/domain/${d.id}/${s.id}" class="${cur === s.id ? "on" : ""} ${S.read[d.id + ":" + s.id] ? "done" : ""}" title="${d.n}.${i + 1} ${esc(s.title)}">${d.n}.${i + 1}</a>`).join("")}
        <a href="#/domain/${d.id}/memorise" class="${cur === "memorise" ? "on" : ""}" title="Memorise &amp; practice">★</a>
      </nav>`;
  }
  function viewDomain(r) {
    const d = byId[r.a]; if (!d) return viewChapters();
    if (r.b === "memorise") return viewMemorise(d);
    const si = r.b ? d.sections.findIndex(s => s.id === r.b) : -1;
    if (si >= 0) return viewSection(d, si);
    return viewChapterIntro(d);
  }
  function viewChapterIntro(d) {
    const p = domProgress(d), pr = prio(d);
    const firstUnread = d.sections.find(s => !S.read[d.id + ":" + s.id]);
    const start = firstUnread || d.sections[0], si = d.sections.indexOf(start);
    const enc = pr === "weak" ? "This is one of your focus domains. Go slowly; understanding beats coverage." : pr === "strong" ? "One of your strengths. Read for ISC2’s wording, then prove it with a quiz." : "You have some exposure here. Fill the gaps, then test yourself by topic.";
    return `<article class="chapter" style="${dc(d)}">
      <header class="ch-head">
        <span class="ch-numeral" aria-hidden="true">${roman[d.n]}</span>
        <div class="kicker">Domain ${pad(d.n)} · ${d.weight}% of the exam <span class="tag ${pr}">${prioLabel[pr]}</span></div>
        <h1 class="h-display">${esc(d.title)}</h1>
        <p class="lede"><em>${esc(d.lede)}</em></p>
        <div class="ch-meta">
          <span>◷ ${readMins(d)} min read</span><span>§ ${d.sections.length} sections</span><span>? ${App.questions.filter(q => q.d === d.id).length} questions</span>
          <span><span class="meter"><i style="width:${p.pct}%"></i></span> <span id="chPct">${p.pct}%</span></span>
        </div>
        <p class="encourage">${esc(enc)}</p>
        <div class="btn-row"><a class="btn primary" href="#/domain/${d.id}/${start.id}">${firstUnread && p.r ? "Continue at" : "Start reading"} ${d.n}.${si + 1} ${esc(start.title)} →</a>${p.pct === 100 ? `<a class="btn" href="#/domain/${d.id}/memorise">★ Memorise &amp; practice</a>` : ""}</div>
      </header>
      <div class="prose">
        <p class="intro">${esc(d.intro)}</p>
        ${App.personal && App.personal[d.id] ? `<div class="note personal"><p>${esc(App.personal[d.id])}</p></div>` : ""}
        ${(window.HISTORY || {})[d.id] ? `<div class="note history"><p>${esc(window.HISTORY[d.id])}</p></div>` : ""}
      </div>
      <nav class="contents-box" aria-label="In this chapter" style="margin-top:28px"><h3>In this chapter</h3><ol>
        ${d.sections.map((s, i) => `<li><a href="#/domain/${d.id}/${s.id}" class="${S.read[d.id + ":" + s.id] ? "read" : ""}"><span class="n">${d.n}.${i + 1}</span>${esc(s.title)}</a></li>`).join("")}
        <li><a href="#/domain/${d.id}/memorise"><span class="n">★</span>Memorise &amp; practice</a></li>
      </ol></nav>
    </article>`;
  }
  function viewSection(d, i) {
    const s = d.sections[i], k = d.id + ":" + s.id, on = !!S.read[k];
    const prevS = d.sections[i - 1], nextS = d.sections[i + 1];
    const nextHref = nextS ? `#/domain/${d.id}/${nextS.id}` : `#/domain/${d.id}/memorise`;
    const nextName = nextS ? `${d.n}.${i + 2} ${nextS.title}` : "Memorise & practice";
    const prevHref = prevS ? `#/domain/${d.id}/${prevS.id}` : `#/domain/${d.id}`;
    const prevName = prevS ? `${d.n}.${i} ${prevS.title}` : "Introduction";
    return `<article class="chapter sec-page" style="${dc(d)}">
      ${chapterBar(d, s.id)}
      <div class="prose">
        <section class="sec" data-sec="${s.id}">
          <div class="sec-head"><span class="sec-num">${d.n}.${i + 1}</span><h2>${esc(s.title)}</h2></div>
          ${s.body}
          ${s.exam ? `<div class="note tests"><p>${esc(s.exam)}</p></div>` : ""}
        </section>
      </div>
      <div class="sec-finish">
        <a class="btn primary big-next" id="readNext" href="${nextHref}" data-read-key="${k}">${on ? "Next" : "Got it — next"}: ${esc(nextName)} →</a>
        <div class="sec-finish-row">
          <a class="btn small" href="#/quiz/run/topic/${d.id}.${s.id}">Quiz this topic (${qCount(d, s)})</a>
          <button class="understood small ${on ? "on" : ""}" data-read="${k}" aria-pressed="${on}"><span class="box"></span><span>${on ? "Understood" : "Mark as understood"}</span></button>
        </div>
        <div class="sec-pager"><a href="${prevHref}">← ${esc(prevName)}</a><a href="${nextHref}" class="skip">Skip to ${esc(nextName)} →</a></div>
        <p class="hint" style="text-align:center">Tip: use the ← and → keys to turn pages.</p>
      </div>
    </article>`;
  }
  function viewMemorise(d) {
    const idx = D.indexOf(d), next = D[idx + 1], last = d.sections[d.sections.length - 1];
    const qs = d.questions.map((q, i) => questionCard(d, q, i)).join("");
    return `<article class="chapter sec-page" style="${dc(d)}">
      ${chapterBar(d, "memorise")}
      <div class="ch-end" style="margin-top:28px">
        <div class="memorise"><div class="kicker" style="--kc:var(--dc)">Before you move on</div><h3>Memorise</h3><ul>${d.memorise.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>
        <div class="btn-row"><a class="btn" href="#/flashcards/${d.id}">Flashcards for D${d.n}</a><a class="btn" href="#/quiz/run/domain/${d.id}">Full D${d.n} quiz</a><a class="btn" href="#/glossary/${d.id}">D${d.n} glossary</a></div>
        <p class="chapters-src"><b>Read alongside:</b> Sybex Official Study Guide — ${esc(d.sybex)}. Chapter numbers follow the 9th/10th editions; match by title if yours differ.</p>
        <h2 class="h-section" style="margin-top:44px">Check yourself</h2>
        <p class="sub">CISSP-style questions. Answer, then read the reasoning. Misses can go straight into your error log.</p>
        <div class="quiz">${qs}</div>
        <div class="sec-finish">
          ${next ? `<a class="btn primary big-next" href="#/domain/${next.id}">Next chapter: D${next.n} ${esc(next.title)} →</a>` : `<a class="btn primary big-next" href="#/mock">You’ve finished every chapter. Take a mock exam →</a>`}
          <div class="sec-pager"><a href="#/domain/${d.id}/${last.id}">← ${d.n}.${d.sections.length} ${esc(last.title)}</a><a href="#/read" class="skip">All chapters</a></div>
        </div>
      </div>
    </article>`;
  }

  const chapterView = (d, q, i) => { const v = App.shuffleQ({ o: q.options, a: q.answer }, d.id + "-c" + i); return Object.assign({}, q, { options: v.o, answer: v.a }); };
  function questionCard(d, q0, i) {
    const q = chapterView(d, q0, i);
    const k = d.id + ":" + i, ans = S.quiz[k], done = ans != null, L = "ABCD";
    return `<div class="q" data-q="${k}" style="${dc(d)}">
      <div class="q-top"><span class="dot"></span>Question ${i + 1}${done ? (ans === q.answer ? ` · <span style="color:var(--good)">correct</span>` : ` · <span style="color:var(--bad)">missed</span>`) : ""}</div>
      <p class="q-stem">${esc(q.q)}</p>
      <div class="q-opts">${q.options.map((o, j) => {
        let cls = ""; if (done) { if (j === q.answer) cls = "correct"; else if (j === ans) cls = "wrong"; }
        return `<button class="opt ${cls}" data-opt="${j}" ${done ? "disabled" : ""}><span class="l">${L[j]}</span><span>${esc(o)}</span></button>`;
      }).join("")}</div>
      ${done ? `<div class="why"><b style="color:${ans === q.answer ? "var(--good)" : "var(--bad)"}">${ans === q.answer ? "Correct" : "Not quite. The answer is " + L[q.answer]}</b>${esc(q.why)}
        <div class="actions">${ans === q.answer ? "" : `<button class="btn small" data-log="${d.id}:c${i}">+ Add to error log</button>`}<button class="btn small ghost" data-reset="${k}">Try again</button></div></div>` : ""}
    </div>`;
  }

  App.logMiss = (domain, text, reason) => {
    S.errors.push({ date: ymd(today()), d: domain, reason: reason || "Knowledge gap", note: text.slice(0, 90) + (text.length > 90 ? "…" : "") });
    save();
  };

  // tasks the site can confirm from your activity
  function autoDone(t) {
    const dn = (m) => D.find(d => d.n === +m);
    let m;
    if ((m = t.match(/^Read all D(\d) sections/))) return domProgress(dn(m[1])).pct === 100;
    if ((m = t.match(/^Take a 10-question D(\d) quiz/))) return App.attempts.filter(a => a.domain === dn(m[1]).id && a.mode !== "chapter").length >= 10;
    if ((m = t.match(/^Review the D(\d) flashcards/))) return !!App.cardsReviewed && App.cardsReviewed(dn(m[1]).id) >= 5;
    if ((m = t.match(/^Two topic quizzes on your weakest D(\d)/))) { const per = {}; App.attempts.filter(a => a.domain === dn(m[1]).id && a.mode === "quiz" && a.topic).forEach(a => { per[a.topic] = (per[a.topic] || 0) + 1; }); return Object.values(per).filter(n => n >= 3).length >= 2; }
    if (/^Take a cold diagnostic quiz/.test(t)) return App.attempts.length >= 10;
    if (/^Mock exam 1/.test(t)) return App.mocks.length >= 1;
    if (/^Mock exam 2/.test(t)) return App.mocks.length >= 2;
    if (/^Clear all due flashcards/.test(t)) return !!App.dueCards && App.dueCards().length === 0 && App.cards.length > 0;
    return false;
  }
  function viewPlan() {
    const now = today(), pl = App.plan(), ph = App.currentPhase();
    const phases = pl.phases.map(p => {
      const st = parseD(p.start), en = parseD(p.end);
      const state = now > en ? "done" : (now >= st && now <= en) || p === ph ? "now" : "";
      const done = p.tasks.filter((t, i) => S.tasks[p.id + ":" + i] || autoDone(t)).length;
      return `<div class="phase ${state}" style="--pc:var(--${p.domain})"><div class="phase-card">
        <div class="phase-top"><span class="phase-date">${fmtD(p.start)} – ${fmtDY(p.end)}</span><span class="kicker" style="--kc:var(--${p.domain})">${esc(p.iter)}</span>${state === "now" ? `<span class="now-pill">You are here</span>` : ""}<span class="phase-date" style="margin-left:auto">${done}/${p.tasks.length}</span>
        <h3>${esc(p.title)}</h3></div>
        <p>${esc(p.text)}</p><p class="exit"><b>Exit criterion:</b> ${esc(p.exit)}</p>
        <ul class="tasks">${p.tasks.map((t, i) => { const k = p.id + ":" + i, auto = autoDone(t);
          return `<li><label class="${auto ? "auto" : ""}"><input type="checkbox" data-task="${k}" ${S.tasks[k] || auto ? "checked" : ""} ${auto ? "disabled" : ""}><span>${esc(t)}${auto ? ` <small class="auto-tag">done automatically</small>` : ""}</span></label></li>`; }).join("")}</ul>
      </div></div>`;
    }).join("");
    const cps = pl.checkpoints.map(c => {
      const d = daysTo(c.date), met = c.test();
      const st = met ? "met" : d < 0 ? "missed" : d <= 7 ? "due" : "later";
      const lbl = { met: "Met", missed: "Missed", due: "Due soon", later: `In ${d} days` }[st];
      return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="phase-date">${fmtDY(c.date)}</span><span class="status ${st}">${lbl}</span></div>
        <h3 style="margin-top:6px">${esc(c.check)}</h3><p style="color:var(--muted);font-size:14px">If missed: ${esc(c.ifMissed)}</p></div>`;
    }).join("");
    const weeks = Math.max(1, Math.round((parseD(App.examTarget()) - parseD(pl.start)) / 864e5 / 7));
    return `<div class="page-narrow">
      <div class="kicker">Your study plan</div>
      <h1 class="h-display">${weeks} weeks, <em>one attempt</em></h1>
      <p class="lede">Built from your target date and self-assessment. Focus domains get the most days; strengths share a fast pass. Change your dates or ratings in <a href="#/profile">your profile</a> and the plan redraws itself.</p>
      <div class="grid-2" style="margin-top:28px">${countdown()}</div>
      <div class="btn-row"><button class="btn small ghost" id="restartPlan">Restart the plan from today</button></div>
      <h2 class="h-section">Checkpoints</h2>
      <p class="sub">Checked automatically from your quiz accuracy, Tracker scores and mock exams.</p>
      <div class="grid-3">${cps}</div>
      <h2 class="h-section">The calendar</h2>
      <p class="sub">About ${(App.profile && App.profile.weekly_hours) || 10} hours a week, measured weekly so busy weeks can flex.</p>
      <div class="timeline">${phases}</div>
      <div class="note manager" style="font-family:var(--serif);font-size:17px"><p>Treat the last three days like a taper before a race. Fresh legs matter more than one extra workout.</p></div>
    </div>`;
  }

  function viewTracker() {
    const rows = D.map(d => {
      const s = S.scores[d.id] || {}, b = band(s.latest === "" ? null : s.latest), qa = App.quizAccuracy(d.id);
      return `<tr style="${dc(d)}"><td><span class="toc-dot" style="display:inline-block;background:var(--${d.id});margin-right:8px"></span><b>D${d.n}</b> ${esc(d.short)}<div style="font-size:12px;color:var(--muted)">${d.weight}% weight · in-app quizzes ${qa == null ? "—" : qa + "%"}</div></td>
        <td><input type="number" min="0" max="100" data-score="${d.id}:base" value="${s.base ?? ""}" aria-label="Baseline D${d.n}"></td>
        <td><input type="number" min="0" max="100" data-score="${d.id}:latest" value="${s.latest ?? ""}" aria-label="Latest D${d.n}"></td>
        <td><span class="band ${b}" data-band="${d.id}">${bandLabel[b]}</span></td></tr>`;
    }).join("");
    const reasons = P.errorReasons, counts = reasons.map(r => S.errors.filter(e => e.reason === r).length), totalE = S.errors.length;
    const top = totalE ? Math.max(...counts) : 0, topReason = totalE && top / totalE > .5 ? reasons[counts.indexOf(top)] : null;
    return `<div class="page-narrow">
      <div class="kicker">Tracker</div>
      <h1 class="h-display">Scores, mocks <em>&amp; mistakes</em></h1>
      <p class="lede">Record scores from outside practice sets (Sybex, Boson). In-app quiz results are tracked automatically in <a href="#/insights">Insights</a>.</p>
      <div class="card" style="margin-top:26px;display:flex;gap:26px;align-items:center;flex-wrap:wrap">
        <div><div class="kicker">Weighted readiness</div><div id="ready" style="font-family:var(--display);font-size:54px;line-height:1">—</div></div>
        <p style="flex:1;min-width:220px;margin:0">Scores weighted by each domain’s share of the exam (Tracker score, or quiz accuracy when you haven’t entered one). Aim for 75%+ before your first mock.</p>
      </div>
      <h2 class="h-section">Domain scores</h2>
      <div class="tbl-wrap"><table class="tbl trk"><thead><tr><th>Domain</th><th>Baseline</th><th>Latest</th><th>Band</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h2 class="h-section">Outside mock exams</h2>
      <div class="form-row">
        <label>Date<input type="date" id="mDate" value="${ymd(today())}"></label>
        <label>Source<input type="text" id="mSrc" placeholder="Boson set A"></label>
        <label>Score %<input type="number" id="mScore" min="0" max="100" style="min-width:90px;width:90px"></label>
        <button class="btn small primary" id="mAdd">Add mock</button>
      </div>
      ${S.mocks.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Source</th><th>Score</th><th></th></tr></thead><tbody>
        ${S.mocks.map((m, i) => `<tr><td>${esc(m.date)}</td><td>${esc(m.src || "")}</td><td><span class="band ${band(m.score)}">${m.score}%</span></td><td><button class="del" data-mdel="${i}" aria-label="Delete">×</button></td></tr>`).join("")}
      </tbody></table></div>` : `<p class="sub">None yet. In-app mocks are saved automatically.</p>`}
      <h2 class="h-section">Error log</h2>
      <p class="sub">The most valuable habit there is. Every wrong answer, with the reason you got it wrong.</p>
      <div class="form-row">
        <label>Domain<select id="eDom">${D.map(d => `<option value="${d.id}">D${d.n} ${esc(d.short)}</option>`).join("")}</select></label>
        <label>Reason<select id="eReason">${reasons.map(r => `<option>${esc(r)}</option>`).join("")}</select></label>
        <label style="flex:1">Topic / note<textarea id="eNote" placeholder="e.g. Picked AH; needed confidentiality so ESP"></textarea></label>
        <button class="btn small primary" id="eAdd">Log it</button>
      </div>
      ${totalE ? `<div class="card"><h3>Why you miss</h3><div class="reason-bars">${reasons.map((r, i) => `<div class="rbar"><span>${esc(r)}</span><div class="meter"><i style="width:${counts[i] / totalE * 100}%"></i></div><span style="font-family:var(--mono);font-size:12px">${counts[i]}</span></div>`).join("")}</div>
        ${topReason ? `<div class="warnbox">More than half your misses are “${esc(topReason)}”. Fix the habit, not just the facts.</div>` : ""}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Domain</th><th>Reason</th><th>Note</th><th></th></tr></thead><tbody>
        ${S.errors.map((e, i) => ({ e, i })).reverse().map(({ e, i }) => { const d = byId[e.d]; return `<tr><td style="white-space:nowrap">${esc(e.date)}</td><td style="white-space:nowrap"><span class="toc-dot" style="display:inline-block;background:var(--${e.d});margin-right:6px"></span>D${d ? d.n : "?"}</td><td><select data-ereason="${i}" class="mini">${reasons.map(r => `<option ${r === e.reason ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></td><td>${esc(e.note || "")}</td><td><button class="del" data-edel="${i}" aria-label="Delete">×</button></td></tr>`; }).join("")}
        </tbody></table></div>` : `<p class="sub">Nothing logged yet.</p>`}
    </div>`;
  }

  function viewLatest() {
    return `<div class="page-narrow">
      <div class="kicker" style="--kc:var(--d3)">What’s new</div>
      <h1 class="h-display">The field, <em>2024–2026</em></h1>
      <p class="lede">The exam is written to the 2024 outline, but questions are framed in today’s practice. These are the developments worth recognising by name.</p>
      <div style="margin-top:34px;display:grid;gap:16px">
        ${P.latest.map(x => `<div class="card"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="tag plain">${esc(x.tag)}</span><span class="phase-date">${esc(x.date)}</span>
          <span style="margin-left:auto;display:flex;gap:6px">${x.domains.map(id => `<a class="chip" style="height:26px;font-size:12px;${dc(byId[id])}" href="#/domain/${id}"><i></i>D${byId[id].n}</a>`).join("")}</span></div>
          <h3 style="margin-top:10px">${esc(x.title)}</h3><p style="font-family:var(--serif);font-size:17.5px;line-height:1.6">${esc(x.body)}</p></div>`).join("")}
      </div>
      <p class="sub" style="margin-top:24px">Dates and details reflect public announcements up to late 2026. Confirm anything exam-critical on the ISC2 site.</p>
    </div>`;
  }

  function viewTactics() {
    const T = P.tactics;
    return `<div class="page-narrow">
      <div class="kicker">Exam tactics</div>
      <h1 class="h-display">How to <em>answer</em></h1>
      <p class="lede">Most CISSP questions have two plausible answers. Knowledge gets you to those two. Method picks the right one.</p>
      <h2 class="h-section">The method, per question</h2>
      <ol style="list-style:none;padding:0;margin:20px 0 0;display:grid;gap:12px">${T.method.map((m, i) => `<li class="card" style="display:flex;gap:16px;align-items:flex-start"><span style="font-family:var(--display);font-style:italic;font-size:34px;line-height:1;color:var(--accent);min-width:28px">${i + 1}</span><div><h3 style="margin:0 0 4px">${esc(m[0])}</h3><p style="margin:0">${esc(m[1])}</p></div></li>`).join("")}</ol>
      <h2 class="h-section">Ten rules of thumb</h2>
      <div class="prose" style="margin:16px 0 0;max-width:none"><ol>${T.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ol></div>
      <h2 class="h-section">How the adaptive exam behaves</h2>
      <div class="prose" style="margin:16px 0 0;max-width:none"><ul>${T.cat.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>
      <h2 class="h-section">Exam-day logistics</h2>
      <ul class="tasks">${T.logistics.map((t, i) => `<li><label><input type="checkbox" data-task="log:${i}" ${S.tasks["log:" + i] ? "checked" : ""}><span>${esc(t)}</span></label></li>`).join("")}</ul>
    </div>`;
  }

  function viewResources() {
    return `<div class="page-narrow">
      <div class="kicker">Resources</div>
      <h1 class="h-display">The <em>library</em></h1>
      <p class="lede">A short list on purpose. One core book, one practice bank, one mobile app, free video for review, and the primary sources. Add your own in <a href="#/library">My library</a>.</p>
      <div class="featured">
        <div class="pdf-cover"><small>ISC2 · PDF · 15 pages</small><b>The Ultimate Guide to the CISSP</b></div>
        <div>
          <div class="kicker">Official overview from ISC2</div>
          <h3 style="font-family:var(--display);font-weight:500;font-size:26px;margin:6px 0 8px">The Ultimate Guide to the CISSP</h3>
          <p style="color:var(--ink-2);margin:0 0 6px">Who the CISSP is for, the experience requirement, domain weights, exam format (100–150 CAT items, 3 hours, 700/1000), the six-step pathway, endorsement within nine months, and CPE rules (120 over three years, US$135 AMF). It also notes the new exam outline from 15 April 2027.</p>
          <div class="btn-row" style="margin-top:14px"><a class="btn primary small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" target="_blank" rel="noopener">Open the PDF</a><a class="btn small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" download>Download</a></div>
        </div>
      </div>
      ${P.resources.map(g => `<h2 class="h-section">${esc(g.group)}</h2>${g.items.map(r => `<div class="res"><div class="res-ico">${r.ico}</div><div><h4><a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t)} ↗</a></h4><p>${esc(r.d)}</p><div class="tags">${r.tags.map(t => `<span class="tag plain">${esc(t)}</span>`).join("")}</div></div></div>`).join("")}`).join("")}
      <div id="privateBlock"></div>
    </div>`;
  }

  /* ---------------- plans: banner, locked, landing ---------------- */
  function planBanner() {
    const p = App.profile; if (db.mode !== "cloud" || !p || !p.plan_expires_at || App.isAdmin() || App.isPrivileged()) return "";
    const left = Math.ceil((new Date(p.plan_expires_at) - new Date()) / 864e5), pl = App.planById(p.plan);
    if (left < 0) return `<a class="warnbox banner" href="#/plans">Your free ${esc(pl.name)} period ended on ${fmtDY(p.plan_expires_at)}. Chapters and the glossary stay open. Ask your administrator to renew →</a>`;
    if (left <= 30) return `<a class="okbox banner" href="#/plans">${left} day${left === 1 ? "" : "s"} left of your free ${esc(pl.name)} year. Plan ahead →</a>`;
    return "";
  }
  function lockedView(feat) {
    const name = (P.modules || {})[feat] || feat;
    const which = App.plans.filter(p => (p.modules || []).includes(feat)).map(p => p.name);
    const expired = App.planExpired();
    return `<div class="page">
      <div class="kicker">${expired ? "Free period ended" : "Upgrade"}</div>
      <h1 class="h-display">${esc(name)} is <em>${expired ? "paused" : "waiting for you"}</em></h1>
      <p class="lede">${expired ? `Your free ${esc(App.planById(App.profile.plan).name)} period has ended. Chapters and the glossary stay open; ask your administrator to renew.` : `${esc(name)} is part of ${which.join(" and ")}. Your current plan is ${esc(App.planById(App.profile.plan).name)}. Every plan is free for its first year.`}</p>
      ${App.planCards({ request: true })}
      <p class="sub" style="margin-top:18px">Upgrade requests go to your administrator, who can switch your plan straight away.</p>
    </div>`;
  }
  function bindLocked() {
    $$("[data-upgrade]").forEach(b => b.addEventListener("click", async () => {
      try { await db.request("other", `Plan upgrade request: please move me to ${App.planById(b.dataset.upgrade).name}.`); b.textContent = "✓ Requested"; b.disabled = true; toast("Request sent to your administrator"); }
      catch (e) { toast(App.errMsg(e)); }
    }));
  }
  function viewPlans() {
    const p = App.profile || {}, pl = App.planById(p.plan);
    return `<div class="page">
      <div class="kicker">Plans</div>
      <h1 class="h-display">Every plan, <em>free for a year</em></h1>
      ${db.mode === "cloud" && p.plan ? `<p class="lede">You’re on <b>${esc(pl.name)}</b>${p.plan_expires_at ? `, free until <b>${fmtDY(p.plan_expires_at)}</b>` : ""}.</p>` : `<p class="lede">Pick the depth that suits you. You can move up at any time.</p>`}
      ${App.planCards({ request: db.mode === "cloud" && !App.isAdmin() })}
    </div>`;
  }
  function viewLanding() {
    const order = D;
    return `<div class="landing">
      <section class="hero land-hero">
        <div>
          <div class="kicker">A CISSP study companion</div>
          <h1 class="h-display">Read slowly.<br><em>Pass once.</em></h1>
          <p class="lede">Eight beautifully written chapters, small animations for the tricky ideas, a plan built around your exam date, and quizzes, flashcards and mock exams that show exactly where you stand. Whatever your background, you can do this.</p>
          <div class="btn-row">${db.mode === "cloud" ? `<a class="btn primary" href="#/signup/gold">Create a free account</a><a class="btn" href="#/login">Sign in</a>` : `<a class="btn primary" href="#/welcome">Start studying on this device</a>`}</div>
          ${db.mode === "cloud" ? `<ol class="land-steps"><li><b>1</b>Create your free account</li><li><b>2</b>Verify your email</li><li><b>3</b>Tell us your exam date and what you know</li><li><b>4</b>Get your personal plan</li></ol>` : `<ol class="land-steps"><li><b>1</b>Tell us your exam date and what you know</li><li><b>2</b>Get your personal plan</li></ol>`}
        </div>
        <div class="land-teaser"><div class="anim" data-anim="handshake"></div></div>
      </section>
      <section class="trust-strip"><span>✓ Written to the official 2024 exam outline</span><span>✓ Free for the first year</span><span>✓ Works on phone, tablet and laptop</span><span>✓ Your data, your control</span></section>
      <section class="facts">${P.exam.facts.map(f => `<div class="fact"><b>${esc(f.big)}</b><span>${esc(f.label)}</span></div>`).join("")}</section>
      <h2 class="h-section">Inside: the eight chapters</h2>
      <p class="sub">Every objective of the official exam outline, explained in plain language with the manager’s lens the exam rewards.</p>
      <div class="shelf">${order.map(d => `<a class="book" href="#/signup/silver" style="${dc(d)}"><div style="display:flex;justify-content:space-between"><span class="book-num">${roman[d.n]}</span><span class="tag plain">🔒 sign in</span></div><div class="book-title">${esc(d.title)}</div><div class="book-meta">${d.weight}% of exam · ${d.sections.length} sections</div><p class="land-lede">${esc(d.lede)}</p></a>`).join("")}</div>
      <h2 class="h-section">What you get</h2>
      <p class="sub">Three plans. Each one is free for its first year. Sign in to see your plan, your path and your progress.</p>
      ${App.planCards({ signup: true })}
      <h2 class="h-section">The pathway to CISSP</h2>
      <div class="path">${P.pathway.map((s, i) => `<div class="step"><b>${i + 1}</b><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join("")}</div>
      <p class="quote">“Every CISSP you admire once didn’t know what Biba was either.”</p>
      <p class="quote-by">Start today. One section at a time.</p>
    </div>`;
  }

  /* ---------------- glossary ---------------- */
  const G = window.GLOSSARY || {};
  const glossAll = () => Object.entries(G).flatMap(([d, list]) => list.map(e => ({ d, term: e[0], mean: e[1], where: e[2], tools: e[3] })));
  let gq = "";
  function viewGlossary(r) {
    const dom = r.a && byId[r.a] ? r.a : "all";
    const q = gq.toLowerCase();
    const rows = glossAll().filter(x => (dom === "all" || x.d === dom) && (!q || [x.term, x.mean, x.where, x.tools].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base", numeric: true }));
    const letter = t => { const c = t[0].toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
    const letters = [...new Set(rows.map(x => letter(x.term)))];
    let last = "";
    const body = rows.map((x, i) => {
      const L = letter(x.term), head = L !== last ? (last = L, `<tr class="g-letter" id="g-${L}"><td colspan="6">${L}</td></tr>`) : "";
      const d = byId[x.d];
      return head + `<tr style="${dc(d)}"><td class="g-n">${i + 1}</td><td class="g-term"><b>${esc(x.term)}</b></td><td>${esc(x.mean)}</td><td>${esc(x.where)}</td><td class="g-tools">${esc(x.tools)}</td><td><a class="chip" style="height:26px;font-size:12px;${dc(d)}" href="#/domain/${d.id}"><i></i>D${d.n}</a></td></tr>`;
    }).join("");
    const total = glossAll().length;
    return `<div class="page">
      <div class="kicker">Glossary</div>
      <h1 class="h-display">Words of the <em>trade</em></h1>
      <p class="lede">${total} terms, A to Z: what each one means, where you’ll meet it, and the tools or examples that bring it to life. Filter by domain or search.</p>
      <div class="filters">
        <a class="chip ${dom === "all" ? "on" : ""}" href="#/glossary">All domains</a>
        ${D.map(d => `<a class="chip ${dom === d.id ? "on" : ""}" href="#/glossary/${d.id}" style="${dc(d)}"><i></i>D${d.n} ${esc(d.short)}</a>`).join("")}
      </div>
      <div class="form-row"><label style="flex:1">Search the glossary<input id="gq" value="${esc(gq)}" placeholder="e.g. Kerberos, SIEM, RPO…"></label></div>
      <div class="g-jump">${letters.map(l => `<a href="#g-${l}" data-jump="${l}">${l}</a>`).join("")}</div>
      <div class="tbl-wrap"><table class="tbl gloss"><thead><tr><th>S.No</th><th>Term</th><th>Meaning</th><th>Where it’s used</th><th>Tools / examples</th><th>Domain</th></tr></thead>
        <tbody>${body || `<tr><td colspan="6">No terms match “${esc(gq)}”.</td></tr>`}</tbody></table></div>
      <p class="sub" style="margin-top:16px">Tool names are examples to help you picture each idea. The exam is vendor-neutral and never asks about products.</p>
    </div>`;
  }
  function bindGlossary() {
    const i = $("#gq");
    i.addEventListener("input", () => { gq = i.value; clearTimeout(i._t); i._t = setTimeout(() => { App.rerender(); setTimeout(() => { const n = $("#gq"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 250); });
    $$("[data-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const el = document.getElementById("g-" + a.dataset.jump); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  }

  /* ---------------- admin / study choice ---------------- */
  function viewChoose() {
    return `<div class="auth wide">
      <h1 class="h-display" style="font-size:44px">Welcome back, <em>${esc(App.firstName())}</em></h1>
      <p class="lede">What would you like to do?</p>
      <div class="grid-2" style="margin-top:26px">
        <button class="card focus choose" data-mode="study"><span class="kicker">Learner</span><h3>Study CISSP</h3><p>Your plan, chapters, quizzes, flashcards and mock exams.</p></button>
        <button class="card focus choose" data-mode="admin" style="--dc:var(--d7)"><span class="kicker" style="--kc:var(--d7)">Administrator</span><h3>View admin console</h3><p>Learner analytics, audit trail, privacy requests and accounts.</p></button>
      </div>
      <p class="hint" style="text-align:center;margin-top:18px">You can switch any time from the menu under your initial.</p></div>`;
  }
  function bindChoose() {
    $$(".choose").forEach(b => b.addEventListener("click", () => {
      App.sessionSet("cissp.mode", b.dataset.mode);
      location.hash = b.dataset.mode === "admin" ? "#/admin" : "#/";
    }));
  }

  /* ---------------- bindings ---------------- */
  let currentSec = null;
  function markCurrent() { $$(".toc-sub a").forEach(a => a.classList.toggle("current", a.dataset.sec === currentSec)); }

  function bindCommon(r) {
    const bt = $("#backTop"); if (bt) bt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    $$("[data-task]").forEach(c => c.addEventListener("change", () => { if (c.checked) S.tasks[c.dataset.task] = 1; else delete S.tasks[c.dataset.task]; save(); }));
  }

  function markRead(k, on) {
    if (on) S.read[k] = S.read[k] || Date.now(); else delete S.read[k];
    save();
    const [did] = k.split(":"); const p = domProgress(byId[did]);
    const pc = $("#chPct"); if (pc) { pc.textContent = p.pct + "%"; pc.previousElementSibling.firstElementChild.style.width = p.pct + "%"; }
    if (on) { db.logEvent("user.section_read", { s: k }); if (p.pct === 100) toast(`Chapter ${roman[byId[did].n]} complete. Brilliant work ✓`); }
    return p;
  }
  let pageKeys = null;
  document.addEventListener("keydown", e => {
    if (!pageKeys || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!/^#\/domain\//.test(location.hash)) return;
    if (e.key === "ArrowRight" && pageKeys.next) { location.hash = pageKeys.next; }
    if (e.key === "ArrowLeft" && pageKeys.prev) { location.hash = pageKeys.prev; }
  });
  function bindDomain(r) {
    const d = byId[r.a]; if (!d) return;
    currentSec = r.b && r.b !== "memorise" ? r.b : null; markCurrent();
    App.setTrack({ area: "read", domain: d.id, topic: currentSec || (r.b === "memorise" ? "memorise" : "intro") });
    // page turning with the arrow keys
    const ids = [null].concat(d.sections.map(s => s.id), ["memorise"]);
    const at = Math.max(0, ids.indexOf(r.b || null));
    const href = (id) => id ? `#/domain/${d.id}/${id}` : `#/domain/${d.id}`;
    pageKeys = { prev: at > 0 ? href(ids[at - 1]) : null, next: at < ids.length - 1 ? href(ids[at + 1]) : null };
    // "Got it — next": mark as understood and turn the page
    const rn = $("#readNext"); if (rn) rn.addEventListener("click", () => { if (!S.read[rn.dataset.readKey]) markRead(rn.dataset.readKey, true); });
    $$("[data-read]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.read, on = !S.read[k];
      markRead(k, on);
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
      b.lastElementChild.textContent = on ? "Understood" : "Mark as understood";
      const step = $(`.steps a[href="#/domain/${d.id}/${k.split(":")[1]}"]`); if (step) step.classList.toggle("done", on);
      renderToc(parse()); markCurrent();
      if (on) toast(pick(["Marked as read. Keep going.", "One more down.", "Nice. Understanding compounds."]));
    }));
    $$(".q").forEach(qel => qel.addEventListener("click", e => {
      const opt = e.target.closest("[data-opt]");
      const [did, qi] = qel.dataset.q.split(":");
      const dd = byId[did], q = dd.questions[+qi];
      if (opt && !opt.disabled) {
        const ch = +opt.dataset.opt;
        S.quiz[qel.dataset.q] = ch; save();
        const row = { mode: "chapter", qid: `${did}-c${qi}`, domain: did, topic: (B.chapterTopics[did] || [])[+qi] || null, correct: ch === chapterView(dd, q, +qi).answer, chosen: ch };
        App.attempts.push(row); db.recordAttempts([row]).catch(() => {});
        qel.outerHTML = questionCard(dd, q, +qi); bindQuizExtras();
      }
    }));
    bindQuizExtras();
    if (window.Anim) window.Anim.mountAll(view);
    // keep the current step visible in the step bar on small screens
    const onStep = $(".steps a.on"); if (onStep && onStep.scrollIntoView) onStep.scrollIntoView({ block: "nearest", inline: "center" });
  }
  addEventListener("hashchange", () => { if (!/^#\/domain\//.test(location.hash)) pageKeys = null; });
  function bindQuizExtras() {
    $$("[data-log]").forEach(b => { if (b._b) return; b._b = 1; b.addEventListener("click", () => {
      const [did, ci] = b.dataset.log.split(":"); const q = byId[did].questions[+ci.slice(1)];
      App.logMiss(did, q.q); b.textContent = "✓ Logged"; b.disabled = true; toast("Added to your error log");
    }); });
    $$("[data-reset]").forEach(b => { if (b._b) return; b._b = 1; b.addEventListener("click", () => {
      const k = b.dataset.reset; delete S.quiz[k]; save();
      const [did, qi] = k.split(":"); const qel = b.closest(".q");
      qel.outerHTML = questionCard(byId[did], byId[did].questions[+qi], +qi); bindDomain._rebind && bindDomain._rebind();
      App.rerender();
    }); });
  }

  function bindTracker() {
    const readiness = () => {
      const el = $("#ready"); if (!el) return;
      let w = 0, s = 0;
      D.forEach(d => { const v = App.domainScore(d.id).v; if (v != null) { w += d.weight; s += d.weight * v; } });
      if (!w) { el.textContent = "—"; el.style.color = ""; return; }
      const v = Math.round(s / w); el.textContent = v + "%"; el.style.color = `var(--${{ green: "good", orange: "warn", red: "bad" }[band(v)]})`;
    };
    $$("[data-score]").forEach(inp => inp.addEventListener("input", () => {
      const [id, f] = inp.dataset.score.split(":");
      S.scores[id] = S.scores[id] || {};
      const v = inp.value === "" ? "" : Math.max(0, Math.min(100, +inp.value));
      S.scores[id][f] = v; save();
      const b = $(`[data-band="${id}"]`); if (b && f === "latest") { const bb = band(v === "" ? null : v); b.className = "band " + bb; b.textContent = bandLabel[bb]; }
      readiness();
    }));
    readiness();
    $("#mAdd").addEventListener("click", () => {
      const sc = +$("#mScore").value; if (!$("#mScore").value || sc < 0 || sc > 100) { toast("Enter a score between 0 and 100"); return; }
      S.mocks.push({ date: $("#mDate").value, src: $("#mSrc").value.trim(), score: sc }); save(); App.rerender(); toast("Mock added");
    });
    $$("[data-mdel]").forEach(b => b.addEventListener("click", () => { S.mocks.splice(+b.dataset.mdel, 1); save(); App.rerender(); }));
    $("#eAdd").addEventListener("click", () => {
      S.errors.push({ date: ymd(today()), d: $("#eDom").value, reason: $("#eReason").value, note: $("#eNote").value.trim() }); save(); App.rerender(); toast("Logged");
    });
    $$("[data-edel]").forEach(b => b.addEventListener("click", () => { S.errors.splice(+b.dataset.edel, 1); save(); App.rerender(); }));
    $$("[data-ereason]").forEach(s => s.addEventListener("change", () => { S.errors[+s.dataset.ereason].reason = s.value; save(); }));
  }

  async function bindResources() {
    if (!App.isPrivileged()) return;
    let body = null; try { body = await db.privateContent("ai_tutor_prompt"); } catch (e) {}
    if (!body) return;
    const el = $("#privateBlock"); if (!el) return;
    el.innerHTML = `<h2 class="h-section">An AI tutor prompt <span class="tag plain">Private</span></h2>
      <p class="sub">Useful for D3, D4 and D8 topics you haven’t worked with hands-on. Replace [TOPIC] and paste it into any assistant.</p>
      <div class="prompt-box" id="promptBox">${esc(body)}</div><button class="btn small" id="copyPrompt">Copy prompt</button>`;
    $("#copyPrompt").addEventListener("click", () => {
      (navigator.clipboard ? navigator.clipboard.writeText(body) : Promise.reject()).then(() => toast("Prompt copied")).catch(() => {
        const rng = document.createRange(); rng.selectNodeContents($("#promptBox")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rng); toast("Selected. Press Ctrl+C to copy");
      });
    });
  }

  App.register("home", { render: viewHome, area: "other", nav: "home" });
  App.register("read", { render: viewChapters, title: "Chapters", nav: "read", area: "read" });
  App.register("domain", { render: viewDomain, bind: bindDomain, nav: "read", area: "read", title: r => byId[r.a] ? `D${byId[r.a].n} ${byId[r.a].title}` : "Chapter" });
  App.register("plan", { render: viewPlan, title: "Study plan", nav: "plan", area: "plan", bind: () => {
    $("#restartPlan").addEventListener("click", () => { if (confirm("Redraw the plan starting today? Ticked tasks stay ticked.")) { S.planStart = ymd(today()); save(); App.rerender(); } });
  } });
  App.register("tracker", { render: viewTracker, bind: bindTracker, title: "Tracker", nav: "insights", area: "insights" });
  App.register("landing", { render: viewLanding, bind: () => { if (window.Anim) window.Anim.mountAll(view); }, title: "CISSP study, made calm", public: true, site: true, nav: "landing" });
  App.register("plans", { render: viewPlans, bind: bindLocked, title: "Plans", nav: "plan", area: "other" });
  App.register("glossary", { render: viewGlossary, bind: bindGlossary, title: "Glossary", nav: "glossary", area: "read" });
  App.register("choose", { render: viewChoose, bind: bindChoose, title: "Welcome", bare: true });
  App.register("latest", { render: viewLatest, title: "What’s new", nav: "read", area: "read" });
  App.register("tactics", { render: viewTactics, title: "Exam tactics", nav: "plan", area: "plan" });
  App.register("resources", { render: viewResources, bind: bindResources, title: "Resources", nav: "library", area: "library" });

  /* ---------------- scroll progress ---------------- */
  const bar = $("#readBar");
  function onScroll() {
    const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0) + "%";
    const bt = $("#backTop"); if (bt) bt.classList.toggle("show", h.scrollTop > 900);
  }
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- search ---------------- */
  const index = [];
  D.forEach(d => {
    index.push({ k: `Domain ${d.n}`, t: d.title, s: d.lede, u: `#/domain/${d.id}`, id: d.id, txt: (d.title + " " + d.lede + " " + d.intro).toLowerCase() });
    d.sections.forEach((s, i) => { const plain = strip(s.body); index.push({ k: `D${d.n}.${i + 1} · ${d.short}`, t: s.title, s: plain, u: `#/domain/${d.id}/${s.id}`, id: d.id, txt: (s.title + " " + plain).toLowerCase() }); });
    d.memorise.forEach(m => index.push({ k: `D${d.n} · Memorise`, t: m.slice(0, 70) + (m.length > 70 ? "…" : ""), s: m, u: `#/domain/${d.id}/memorise`, id: d.id, txt: m.toLowerCase() }));
  });
  Object.entries(window.GLOSSARY || {}).forEach(([d, list]) => list.forEach(e => index.push({ k: `D${byId[d].n} · Glossary`, t: e[0], s: e[1] + " " + e[2], u: `#/glossary/${d}`, id: d, txt: e.join(" ").toLowerCase() })));
  App.cards.forEach(c => index.push({ k: `D${byId[c.d].n} · Flashcard`, t: c.front, s: c.back, u: `#/flashcards/${c.d}`, id: c.d, txt: (c.front + " " + c.back).toLowerCase() }));
  [["Study plan", "#/plan", "calendar phases checkpoints iteration exam date deadline hours"], ["Quiz", "#/quiz", "questions practice topic domain"], ["Flashcards", "#/flashcards", "cards spaced repetition"], ["Mock exam", "#/mock", "timed test full"], ["Insights", "#/insights", "time spent analytics streak accuracy"], ["Exam tactics", "#/tactics", "method qualifier manager cat adaptive logistics rules"], ["Tracker", "#/tracker", "scores error log mock readiness"], ["What’s new 2024–2026", "#/latest", P.latest.map(x => x.title + " " + x.body).join(" ")], ["Resources", "#/resources", "books sybex boson pdf ultimate guide video nist owasp"], ["My library", "#/library", "upload documents youtube links"], ["Privacy & trust", "#/privacy", "gdpr dpdp iso 27001 31000 delete data export"]]
    .forEach(([t, u, x]) => index.push({ k: "Page", t, s: "", u, id: null, txt: (t + " " + x).toLowerCase() }));

  const modal = $("#searchModal"), sIn = $("#searchInput"), sRes = $("#searchResults");
  let sel = 0;
  function openSearch() { if (document.body.classList.contains("bare")) return; modal.hidden = false; sIn.value = ""; doSearch(); setTimeout(() => sIn.focus(), 20); }
  function closeSearch() { modal.hidden = true; }
  const hl = (text, terms) => { let out = esc(text); terms.forEach(t => { if (t.length < 2) return; out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); }); return out; };
  const snippet = (s, term) => { const i = s.toLowerCase().indexOf(term); if (i < 0) return s.slice(0, 160); const st = Math.max(0, i - 60); return (st ? "…" : "") + s.slice(st, st + 170) + "…"; };
  function doSearch() {
    const q = sIn.value.trim().toLowerCase(); sel = 0;
    if (!q) sRes.innerHTML = D.map(d => `<li><a href="#/domain/${d.id}" style="${dc(d)}"><div class="sr-k">Domain ${d.n}</div><div class="sr-t">${esc(d.title)}</div></a></li>`).join("");
    else {
      const terms = q.split(/\s+/).filter(Boolean);
      const res = index.map(x => { let sc = 0; for (const t of terms) { if (!x.txt.includes(t)) return null; sc += (x.t.toLowerCase().includes(t) ? 5 : 0) + 1; } return [sc, x]; })
        .filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 14).map(a => a[1]);
      sRes.innerHTML = res.length ? res.map(x => `<li><a href="${x.u}" style="${x.id ? "--dc:var(--" + x.id + ")" : ""}"><div class="sr-k">${esc(x.k)}</div><div class="sr-t">${hl(x.t, terms)}</div>${x.s ? `<div class="sr-s">${hl(snippet(x.s, terms[0]), terms)}</div>` : ""}</a></li>`).join("")
        : `<li class="search-empty">Nothing found for “${esc(q)}”. Try a protocol, model or acronym.</li>`;
    }
    paintSel();
  }
  function paintSel() { $$("#searchResults a").forEach((a, i) => a.classList.toggle("sel", i === sel)); const a = $$("#searchResults a")[sel]; if (a) a.scrollIntoView({ block: "nearest" }); }
  sIn.addEventListener("input", doSearch);
  sIn.addEventListener("keydown", e => {
    const items = $$("#searchResults a");
    if (e.key === "ArrowDown") { sel = Math.min(items.length - 1, sel + 1); paintSel(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); paintSel(); e.preventDefault(); }
    else if (e.key === "Enter" && items[sel]) { location.hash = items[sel].getAttribute("href"); closeSearch(); }
  });
  sRes.addEventListener("click", e => { if (e.target.closest("a")) closeSearch(); });
  modal.addEventListener("click", e => { if (e.target === modal) closeSearch(); });
  $("#searchOpen").addEventListener("click", openSearch);
  document.addEventListener("keydown", e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openSearch(); }
    else if (e.key === "Escape") { closeSearch(); hideSettings(); closeToc(); closeMenu(); }
  });

  /* ---------------- settings & user menu ---------------- */
  const pop = $("#settings"), sBtn = $("#settingsOpen");
  function paintSettings() {
    const th = document.documentElement.dataset.theme;
    $$("[data-theme-set]").forEach(b => b.classList.toggle("on", b.dataset.themeSet === th));
    const face = settings.face || "serif";
    $$("[data-face]").forEach(b => b.classList.toggle("on", b.dataset.face === face));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
  }
  const hideSettings = () => { pop.hidden = true; sBtn.setAttribute("aria-expanded", "false"); };
  sBtn.addEventListener("click", e => { e.stopPropagation(); closeMenu(); pop.hidden = !pop.hidden; sBtn.setAttribute("aria-expanded", String(!pop.hidden)); paintSettings(); });
  document.addEventListener("click", e => {
    if (!pop.hidden && !pop.contains(e.target) && e.target !== sBtn) hideSettings();
    const m = $("#userMenu"); if (m && !m.hidden && !m.contains(e.target) && !e.target.closest("#userBtn")) closeMenu();
  });
  $$("[data-theme-set]").forEach(b => b.addEventListener("click", () => { document.documentElement.dataset.theme = b.dataset.themeSet; settings.theme = b.dataset.themeSet; saveSettings(); paintSettings(); }));
  $$("[data-size]").forEach(b => b.addEventListener("click", () => {
    const d = +b.dataset.size, cur = settings.size || (innerWidth <= 640 ? 18 : 19);
    settings.size = d === 0 ? undefined : Math.max(15, Math.min(25, cur + d));
    if (settings.size) document.documentElement.style.setProperty("--fs", settings.size + "px"); else document.documentElement.style.removeProperty("--fs");
    saveSettings();
  }));
  $$("[data-face]").forEach(b => b.addEventListener("click", () => { settings.face = b.dataset.face; document.documentElement.dataset.face = b.dataset.face; saveSettings(); paintSettings(); }));
  paintSettings();

  $("#userBtn").addEventListener("click", e => {
    e.stopPropagation(); hideSettings();
    const m = $("#userMenu"); m.hidden = !m.hidden;
    const p = App.profile || {};
    m.innerHTML = `<div class="um-head"><b>${esc(p.full_name || p.username || "Learner")}</b><small>${esc(db.mode === "cloud" ? (p.email || "") : "Device-only mode")}</small>${App.isAdmin() ? `<span class="tag plain" style="margin-top:6px">Admin</span>` : ""}</div>
      ${db.mode === "cloud" && p.plan ? `<a href="#/plans">Plan: ${esc(App.planById(p.plan).name)}${p.plan_expires_at ? " · free until " + fmtD(p.plan_expires_at) : ""}</a>` : ""}
      <a href="#/profile">Profile &amp; exam dates</a><a href="#/insights">Insights</a><a href="#/library">My library</a><a href="#/tracker">Scores &amp; error log</a><a href="#/privacy">Privacy &amp; my data</a>
      ${App.isAdmin() ? `<a href="#/admin">Admin console</a><a href="#/choose">Switch: study or admin</a>` : ""}
      ${db.mode === "cloud" ? `<button id="signOut">Sign out</button>` : ""}`;
    const so = $("#signOut"); if (so) so.addEventListener("click", async () => { await flush(); await db.signOut(); location.hash = "#/login"; location.reload(); });
    m.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
  });

  $("#pubMenuBtn").addEventListener("click", (e) => { e.stopPropagation(); const pn = $("#pubnav"); pn.classList.toggle("open"); $("#pubMenuBtn").setAttribute("aria-expanded", String(pn.classList.contains("open"))); });
  document.addEventListener("click", (e) => { const pn = $("#pubnav"); if (pn && pn.classList.contains("open") && !pn.contains(e.target)) pn.classList.remove("open"); });
  $("#tocToggle").addEventListener("click", () => { toc.classList.add("open"); $("#scrim").classList.add("on"); });
  $("#scrim").addEventListener("click", closeToc);

  /* ---------------- start ---------------- */
  App.loadPlans = async () => { try { const pl = await db.plans(); if (pl && pl.length) App.plans = pl; } catch (e) {} };
  App.afterLogin = async function () {
    const uidv = db.mode === "cloud" ? db.user.id : "local";
    stateKey = "cissp.v1:" + uidv;
    const cloud = db.mode === "cloud";
    // load everything at once: one network round-trip of waiting instead of seven
    const [profile, cloudState, attempts, mocks, notes] = await Promise.all([
      db.getProfile(),
      cloud ? db.loadState().catch(() => null) : Promise.resolve(null),
      db.myAttempts().catch(() => []),
      db.myMocks().catch(() => []),
      cloud ? db.privateContent("personal_notes").catch(() => null) : Promise.resolve(null),
      App.loadCards ? App.loadCards() : Promise.resolve()
    ]);
    App.profile = profile;
    let st = cloudState || loadLocal(stateKey);
    if (!st) { const legacy = loadLocal("cissp.v1"); if (legacy && (!cloud || profile.privileged)) st = legacy; }
    S = Object.assign(blank(), st || {});
    if (!S.planStart) S.planStart = ymd(today());
    save();
    App.timeRows = null;
    App.attempts = attempts; App.mocks = mocks;
    App.personal = null;
    if (notes && App.isPrivileged()) { try { App.personal = JSON.parse(notes); } catch (e) {} }
    db.touch().catch(() => {});
  };

  App.start = async function () {
    let recovering = /type=recovery/.test(location.hash);
    const hashErr = location.hash.match(/error_description=([^&]+)/);
    await db.init(async (ev) => {
      if (ev === "PASSWORD_RECOVERY") { recovering = true; redirect("#/reset"); }
    });
    if (hashErr) { setTimeout(() => toast(decodeURIComponent(hashErr[1].replace(/\+/g, " "))), 300); history.replaceState(null, "", "#/login"); }
    else if (/access_token=/.test(location.hash)) {
      if (/type=signup/.test(location.hash)) setTimeout(() => toast("Email verified. Welcome aboard!"), 600);
      history.replaceState(null, "", recovering ? "#/reset" : "#/");
    }
    await App.loadPlans();
    if (db.user) { try { await App.afterLogin(); } catch (e) { toast(App.errMsg(e)); } }
    // a bookmarked or autocompleted #/welcome should not skip the public page
    if (db.mode === "local" && /^#\/welcome/.test(location.hash) && !(App.profile && App.profile.onboarded)) history.replaceState(null, "", "#/landing");
    addEventListener("hashchange", route);
    route();
    if (db.mode === "local" && !App._localNote) { App._localNote = true; }
  };
  addEventListener("DOMContentLoaded", () => App.start());
})();

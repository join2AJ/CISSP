/* StudyCISSP - core: state, router, personalisation, time tracking, reading views */
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
  const bandLabel = { green: "Green", orange: "Orange", red: "Red", none: "-" };
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
    B.questions.forEach(q => { if (q.src) { out.push({ id: q.id, d: q.d, t: q.t, q: q.q, o: q.o, a: q.a, w: q.w, src: q.src }); return; }
      idx[q.d] = (idx[q.d] || 0) + 1; out.push({ id: `${q.d}-b${idx[q.d]}`, d: q.d, t: q.t, q: q.q, o: q.o, a: q.a, w: q.w }); });
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
    const MIX = { read: [0.62, 0.23], balanced: [0.55, 0.25], practice: [0.45, 0.32] }[S.planMix || "balanced"] || [0.55, 0.25];
    const latest = parseD(App.examLatest());
    const taperStart = addDays(target, -3);
    const total = Math.max(14, Math.round((taperStart - start) / 864e5));
    const i1 = Math.round(total * MIX[0]), i2 = Math.round(total * MIX[1]), i3 = total - i1 - i2;
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
    const exKey = r.page === "quiz" && r.a === "run" ? null : r.page === "tracker" ? "tracker" : r.page;
    if (exKey && !site) out = withExplain(out, exKey);
    view.innerHTML = out + (site ? (App.siteFooter ? App.siteFooter() : "") : def.bare ? "" : footer());
    App.stackTables(view);
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

  /* "What is this page?" panels: short, human, dismissible */
  const EXPLAIN = {
    read: ["All eight CISSP domains, written as short pages you can actually finish.", "Questions only stick once the idea makes sense. Reading first saves time later.", "Start with the domains marked Focus. Read one page, tap Got it - next, and keep going."],
    quiz: ["Short sets of exam-style questions, with the reasoning shown after every answer.", "The CISSP tests judgement. The explanations show you how the examiners think.", "Do a topic quiz right after you read it. Once a week, try My weak areas."],
    flashcards: ["Quick recall cards for terms, numbers and models.", "Cards you know come back less often; cards you miss come back tomorrow. That's how memory sticks.", "Five minutes a day. Clear the cards due today and stop."],
    mock: ["A timed exam with no hints until the end.", "It builds stamina and shows how ready you really are.", "Take one once you've read most chapters, then every week or two before the exam."],
    glossary: ["Every term in one place, A to Z, with where you'll meet it.", "Acronyms trip people up on exam day.", "Search, or filter by your weakest domain and skim the list."],
    plan: ["Your route from today to exam day, built from your date and your answers.", "A date and a routine do more than motivation ever will.", "Set your study times below, add them to your calendar, and tick tasks as you go. Many tick themselves."],
    insights: ["Where your study time goes and how you're scoring.", "It shows whether your time is going where the marks are.", "Look once a week. Move time towards the red domains."],
    tracker: ["Scores from outside practice tests, plus your error log.", "The pattern in your mistakes matters more than any single score.", "After each outside test, enter the score and log every miss with a reason."],
    library: ["Your own notes, PDFs and videos, kept next to the chapters they belong to.", "Everything you rely on, in one place.", "Add a link or upload a file and tag it with a domain."],
    resources: ["Official documents and a short list of study material we trust.", "When two sources disagree, the primary source settles it.", "Use these to check a detail. You don't need to read them cover to cover."],
    tactics: ["How to read and answer CISSP questions.", "Often two answers look right. Method picks the better one.", "Read it once now and again in the week before your exam."],
    latest: ["What changed in the field between 2024 and 2026.", "Exam questions use today's terms and frameworks.", "Skim it, then follow the links into the chapters."]
  };
  App.explainBlock = (key) => {
    const e = EXPLAIN[key]; if (!e) return "";
    let closed = false; try { closed = localStorage.getItem("cissp.ex." + key) === "1"; } catch (x) {}
    return `<details class="explain" data-ex="${key}" ${closed ? "" : "open"}><summary>What is this page for?</summary>
      <div class="ex-grid"><div><b>What</b><p>${esc(e[0])}</p></div><div><b>Why it helps</b><p>${esc(e[1])}</p></div><div><b>How to use it</b><p>${esc(e[2])}</p></div></div></details>`;
  };
  function withExplain(out, key) {
    const block = App.explainBlock(key); if (!block) return out;
    const m = out.match(/<p class="lede">[\s\S]*?<\/p>/);
    if (m) return out.replace(m[0], m[0] + block);
    return out.replace("</h1>", "</h1>" + block);
  }
  document.addEventListener("toggle", (e) => {
    const d = e.target; if (!d.classList || !d.classList.contains("explain")) return;
    try { localStorage.setItem("cissp.ex." + d.dataset.ex, d.open ? "0" : "1"); } catch (x) {}
  }, true);

  /* wide tables become stacked cards on phones */
  App.stackTables = (root) => {
    // wide tables scroll sideways, so keyboard users must be able to focus them
    (root || view).querySelectorAll(".tbl-wrap").forEach(w => { if (!w.hasAttribute("tabindex")) { w.tabIndex = 0; w.setAttribute("role", "region"); w.setAttribute("aria-label", "Scrollable table"); } });
    (root || view).querySelectorAll(".prose table, .tbl.stackable").forEach(t => {
      if (t.dataset.stacked) return; t.dataset.stacked = "1"; t.classList.add("stack");
      const heads = [...t.querySelectorAll("thead th")].map(th => th.textContent.trim());
      t.querySelectorAll("tbody tr").forEach(tr => [...tr.children].forEach((td, i) => {
        if (heads[i]) td.setAttribute("data-label", heads[i]);
        // keep text and inline tags together so the grid has one value cell, not a cell per fragment
        if (td.childNodes.length && !(td.children.length === 1 && td.firstElementChild.classList.contains("cv"))) { const v = document.createElement("span"); v.className = "cv"; while (td.firstChild) v.appendChild(td.firstChild); td.appendChild(v); }
      }));
    });
  };
  App.rerender = () => { rendered = null; const y = scrollY; route().then(() => scrollTo(0, y)); };

  function paintNav(r, def) {
    const key = def.nav || r.page;
    const navKey = r.page === "domain" ? "read" : (document.querySelector(`.mainnav [data-nav="${r.page}"]`) ? r.page : key);
    $$(".pubnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === key));
    $$(".mainnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === navKey));
    $$(".mainnav .nav-group").forEach(g => { g.classList.remove("open"); g.querySelector(".nav-top").setAttribute("aria-expanded", "false"); g.classList.toggle("active", !!g.querySelector(`[data-nav="${navKey}"]`)); });
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
    let h = `<div class="mob-nav"><a href="#/" class="${r.page === "home" ? "active" : ""}">Home</a>${App.isAdmin() ? `<a href="#/admin">Admin</a>` : ""}</div>`;
    const inGroup = (pages) => pages.includes(r.page);
    const onChapters = r.page === "domain" || r.page === "read";
    h += `<details class="toc-group" ${onChapters || window.innerWidth > 1000 ? "open" : ""}><summary class="toc-head">Chapters <small>weakest first · ${all.pct}% read</small></summary><ol class="toc-list">`;
    order.forEach(d => {
      const p = domProgress(d);
      const active = r.page === "domain" && r.a === d.id;
      h += `<li><a href="#/domain/${d.id}" class="${active ? "active" : ""}" style="${dc(d)}">
        <span class="toc-dot" style="background:var(--${d.id})"></span><span>D${d.n} ${esc(d.short)}</span><span class="toc-pct">${p.pct}%</span></a>`;
      if (active) h += `<ol class="toc-sub">` + d.sections.map((s, i) => `<li><a href="#/domain/${d.id}/${s.id}" data-sec="${s.id}" class="${S.read[d.id + ":" + s.id] ? "read" : ""}">${d.n}.${i + 1} ${esc(s.title)}</a></li>`).join("") + `</ol>`;
      h += `</li>`;
    });
    const L = (k, ico, t) => `<li><a href="#/${k}" class="${r.page === k ? "active" : ""}"><span class="toc-num">${ico}</span>${t}</a></li>`;
    const G = (title, pages, body) => `<details class="toc-group" ${inGroup(pages) || window.innerWidth > 1000 ? "open" : ""}><summary class="toc-head">${title}</summary><ol class="toc-list">${body}</ol></details>`;
    h += `</ol></details>`
      + G("Learn more", ["glossary", "latest", "resources"], L("glossary", "Aa", "Glossary A-Z") + L("latest", "✦", "What’s new, 2024-2026") + L("resources", "§", "Resources"))
      + G("Practise", ["quiz", "flashcards", "mock", "tactics"], L("quiz", "?", "Quiz by domain or topic") + L("flashcards", "❐", "Flashcards") + L("mock", "◷", "Mock exam") + L("tactics", "◎", "Exam tactics"))
      + G("Progress", ["plan", "insights", "tracker", "notes", "library", "privacy"], L("plan", "▤", "My study plan") + L("insights", "◔", "Insights & time spent") + L("tracker", "▦", "Scores & error log") + L("notes", "✎", "My notes") + L("library", "❏", "My library") + L("privacy", "⚿", "Privacy & trust"));
    h += `
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
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const schedule = () => (S.schedule && S.schedule.days) || {};
  const fmtTime = t => { const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`; };
  function nextSession() {
    const sc = schedule(), now = new Date();
    for (let k = 0; k < 8; k++) {
      const d = addDays(today(), k), slot = sc[d.getDay()];
      if (!slot || !slot.on) continue;
      const [h, m] = slot.start.split(":").map(Number); const at = new Date(d); at.setHours(h, m, 0, 0);
      if (k === 0 && at.getTime() + slot.dur * 60000 < now.getTime()) continue;
      return { k, d, slot, label: k === 0 ? "Today" : k === 1 ? "Tomorrow" : DAYS[d.getDay()] };
    }
    return null;
  }
  /* exam readiness: coverage, accuracy and mock results, weighted by the exam outline */
  App.readiness = () => {
    const W = D.reduce((n, d) => n + d.weight, 0);
    const coverage = D.reduce((n, d) => n + d.weight * domProgress(d).pct, 0) / W;
    const recent = App.attempts.slice(-600);
    const perDom = D.map(d => { const r = recent.filter(a => a.domain === d.id), c = r.filter(a => a.correct).length;
      return { d, n: r.length, acc: (c + 1.25) / (r.length + 5) * 100 }; });  // few answers pull towards a guess (25%)
    const answered = recent.length >= 5;
    const accuracy = answered ? perDom.reduce((n, x) => n + x.d.weight * x.acc, 0) / W : 0;
    const mocks = App.mocks.slice(-3).map(m => m.correct / m.total * 100);
    const mock = mocks.length ? Math.max(...mocks) : null;
    let score = mock == null ? Math.min(70, 0.35 * coverage + 0.65 * accuracy) : 0.3 * coverage + 0.4 * accuracy + 0.3 * mock;
    score = Math.round(Math.max(0, Math.min(100, score)));
    const label = score >= 75 ? "Exam ready" : score >= 60 ? "Getting close" : score >= 40 ? "Building" : "Early days";
    const tips = [];
    const unread = D.slice().sort((a, b) => b.weight * (100 - domProgress(b).pct) - a.weight * (100 - domProgress(a).pct))[0];
    if (unread && domProgress(unread).pct < 100) tips.push({ t: `Read D${unread.n} ${unread.short} (${domProgress(unread).pct}% done, ${unread.weight}% of the exam)`, h: `#/domain/${unread.id}` });
    const weak = perDom.filter(x => x.n >= 1).sort((a, b) => a.acc - b.acc)[0] || perDom.slice().sort((a, b) => b.d.weight - a.d.weight)[0];
    tips.push({ t: weak.n ? `Quiz D${weak.d.n} ${weak.d.short}: your weakest score` : `Start answering questions: try D${weak.d.n} ${weak.d.short}`, h: `#/quiz/run/domain/${weak.d.id}` });
    if (mock == null) tips.push({ t: coverage >= 50 ? "Take your first mock exam. Readiness is capped at 70 until you do" : "Take a mock once you have read about half the chapters", h: "#/mock" });
    return { score, label, coverage: Math.round(coverage), accuracy: answered ? Math.round(accuracy) : null, mock: mock == null ? null : Math.round(mock), tips: tips.slice(0, 3) };
  };
  function readinessCard() {
    const r = App.readiness(), C = 2 * Math.PI * 42, band = r.score >= 75 ? "good" : r.score >= 60 ? "ok" : "low";
    const part = (k, v, w) => `<div class="rd-part"><span>${k} <small>${w}</small></span><span class="meter"><i style="width:${v == null ? 0 : v}%"></i></span><b>${v == null ? "-" : v + "%"}</b></div>`;
    return `<section class="card rd" aria-label="Exam readiness">
      <div class="rd-ring ${band}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" class="trk"/><circle cx="50" cy="50" r="42" class="val" stroke-dasharray="${(r.score / 100 * C).toFixed(1)} ${C.toFixed(1)}"/></svg><div><b>${r.score}</b><small>of 100</small></div></div>
      <div class="rd-body">
        <span class="kicker">Exam readiness</span><h3>${r.label}</h3>
        ${part("Chapters read", r.coverage, "30%")}${part("Question accuracy", r.accuracy, "40%")}${part("Best recent mock", r.mock, "30%")}
        <p class="rd-next"><b>Biggest gains next:</b></p>
        <ul class="rd-tips">${r.tips.map(t => `<li><a href="${t.h}">${esc(t.t)} →</a></li>`).join("")}</ul>
        <p class="hint">An estimate from your own activity, weighted like the exam. 75 or more, with mocks at 75%+, is a sensible point to sit the exam.</p>
      </div>
    </section>`;
  }

  /* priority matrix: exam weight against how far behind you are in each domain */
  function priorityMatrix() {
    const rows = D.map(d => {
      const p = domProgress(d), sc = App.domainScore(d.id), pr = prio(d);
      const readGap = 100 - p.pct, scoreGap = sc.v == null ? 40 : Math.max(0, 80 - sc.v) * 2.5;
      const need = readGap * 0.45 + Math.min(100, scoreGap) * 0.4 + (pr === "weak" ? 25 : pr === "strong" ? -10 : 0);
      const why = [p.pct < 100 ? `${p.pct}% read` : "all read", sc.v == null ? "no score yet" : `scoring ${sc.v}%`].concat(pr === "weak" ? ["focus domain"] : []).join(" · ");
      return { d, p, sc, need, why, big: d.weight >= 13 };
    });
    // the four domains furthest behind are urgent (ties go to the bigger share), plus anything scoring under 65%
    const ranked = rows.slice().sort((a, b) => b.need - a.need || b.d.weight - a.d.weight || a.d.n - b.d.n);
    rows.forEach(r => { r.urgent = (ranked.indexOf(r) < 4 && r.need > 15) || (r.sc.v != null && r.sc.v < 65); });
    const go = (r) => r.p.pct < 80 ? { href: `#/domain/${r.d.id}`, t: "Read" } : { href: `#/quiz/run/domain/${r.d.id}`, t: "Quiz" };
    const chip = (r) => { const g = go(r); return `<a class="pm-chip" href="${g.href}" style="${dc(r.d)}"><span class="toc-dot" style="background:var(--${r.d.id})"></span><b>D${r.d.n} ${esc(r.d.short)}</b><small>${r.d.weight}% · ${esc(r.why)}</small><span class="pm-go">${g.t} →</span></a>`; };
    const Q = [
      { k: "now", t: "Do now", s: "Big share of the exam and you are behind", f: r => r.big && r.urgent },
      { k: "fresh", t: "Keep fresh", s: "Big share and on track. Short quizzes and flashcards", f: r => r.big && !r.urgent },
      { k: "quick", t: "Quick wins", s: "Smaller share, but behind. A few focused sessions", f: r => !r.big && r.urgent },
      { k: "keep", t: "Maintain", s: "Smaller share and on track. Light review only", f: r => !r.big && !r.urgent }
    ];
    return `<section class="pm" aria-label="Priority matrix">
      <div class="pm-grid">${Q.map(q => { const list = rows.filter(q.f).sort((a, b) => b.need - a.need);
        return `<div class="pm-q pm-${q.k}"><div class="pm-h"><b>${q.t}</b><small>${q.s}</small></div>${list.length ? list.map(chip).join("") : `<p class="pm-empty">Nothing here right now.</p>`}</div>`; }).join("")}</div>
      <div class="pm-axis-x"><span>Behind: unread or a low score</span><span>On track</span></div>
    </section>`;
  }

  async function viewHome() {
    await App.loadTime();
    const all = allProgress(), ph = App.currentPhase(), nx = nextSection();
    const wk = App.secondsSince(ymd(addDays(today(), -6))), streak = App.streak(), acc = App.quizAccuracy();
    const cs = App.cardStats ? App.cardStats() : { total: App.cards.length, mastered: 0, due: App.cards.length, reviewed: 0 };
    const hr = new Date().getHours();
    const greet = hr < 5 ? "Up late" : hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const daysLeft = daysTo(App.examTarget());
    // where you are
    const last = S.last && byId[S.last.d] ? byId[S.last.d] : null;
    let cont = null;
    if (last) { const sec = S.last.s && last.sections.find(x => x.id === S.last.s); const si = sec ? last.sections.indexOf(sec) : -1;
      cont = { d: last, href: `#/domain/${last.id}${S.last.s ? "/" + S.last.s : ""}`, title: sec ? `${last.n}.${si + 1} ${sec.title}` : last.title, kicker: "Pick up where you left off" }; }
    else if (nx) cont = { d: nx.d, href: `#/domain/${nx.d.id}/${nx.s.id}`, title: `${nx.d.n}.${nx.d.sections.indexOf(nx.s) + 1} ${nx.s.title}`, kicker: "Start here" };
    const cp = cont ? domProgress(cont.d) : null;
    // quiz picture
    const quizRows = App.attempts.filter(a => a.mode !== "chapter");
    const perDom = D.map(d => { const r = App.attempts.filter(a => a.domain === d.id); return { d, n: r.length, v: r.length ? Math.round(r.filter(a => a.correct).length / r.length * 100) : null }; });
    const weakQ = perDom.filter(x => x.n >= 3).sort((a, b) => a.v - b.v)[0] || { d: App.pathOrder()[0], v: null };
    const mocks = App.mocks.slice(-1)[0], bestMock = App.mocks.length ? Math.max(...App.mocks.map(m => Math.round(m.correct / m.total * 100))) : null;
    const weekTarget = ((App.profile && App.profile.weekly_hours) || 10) * 3600;
    const ns = nextSession();
    const tasks = ph ? ph.tasks.map((t, i) => ({ t, k: ph.id + ":" + i, done: !!S.tasks[ph.id + ":" + i] || autoDone(t) })) : [];
    const open = tasks.filter(x => !x.done).slice(0, 3);
    const tile = (o) => `<a class="tile" href="${o.href}" style="${o.dc || ""}">
        <span class="tile-k">${o.k}</span><b class="tile-v">${o.v}</b><span class="tile-s">${o.s}</span>
        ${o.pct != null ? `<span class="meter"><i style="width:${Math.max(0, Math.min(100, o.pct))}%"></i></span>` : ""}
        <span class="tile-go">${o.go} →</span></a>`;
    const firstTime = !all.r && !App.attempts.length;
    return `<div class="page dash">
      <header class="dash-head">
        <div><div class="kicker">${greet}, ${esc(App.firstName())}</div><h1 class="dash-title">Your study desk</h1>
          <p class="sub" style="margin:4px 0 0">${esc(pick(B.encouragement))}</p></div>
        <div class="dash-chips">
          <span><b>${Math.max(daysLeft, 0)}</b> days to your exam</span>
          <span><b>${streak}</b> day streak</span>
          <span><b>${fmtDur(wk)}</b> this week</span>
        </div>
      </header>
      ${planBanner()}
      <section class="dash-main">
        ${cont ? `<a class="card dash-continue" href="${cont.href}" style="${dc(cont.d)}">
          <span class="kicker" style="--kc:var(--dc)">${cont.kicker}</span>
          <h2>${esc(cont.title)}</h2>
          <p>D${cont.d.n} ${esc(cont.d.title)} · ${cp.r} of ${cp.t} sections read</p>
          <span class="meter"><i style="width:${cp.pct}%"></i></span>
          <span class="btn primary">${last ? "Continue reading" : "Start reading"} →</span></a>`
          : `<a class="card dash-continue" href="#/mock"><span class="kicker">Every chapter read</span><h2>Time to test yourself</h2><p>Take a timed mock and see where you stand.</p><span class="btn primary">Start a mock →</span></a>`}
        <div class="card dash-today">
          <h3>Today</h3>
          <p class="today-line">${ns ? `<b>${ns.label}</b> ${fmtTime(ns.slot.start)} for ${ns.slot.dur} min` : `No study times set yet. <a href="#/plan/schedule">Choose your study times</a>`}</p>
          ${ph ? `<p class="today-phase"><span class="kicker" style="--kc:var(--${ph.domain})">${esc(ph.iter)}</span><br>${esc(ph.title)} <small>· until ${fmtD(ph.end)}</small></p>
            ${open.length ? `<ul class="tasks compact">${open.map(x => `<li><label><input type="checkbox" data-task="${x.k}"><span>${esc(x.t)}</span></label></li>`).join("")}</ul>` : `<p class="hint">All tasks in this stage are done. Nice work.</p>`}` : ""}
          <a class="btn small ghost" href="#/plan">Open my plan →</a>
        </div>
      </section>

      ${readinessCard()}
      <h2 class="h-section">Where you are</h2>
      <div class="dash-grid">
        ${tile({ k: "Reading", v: `${all.r}<small>/${all.t}</small>`, s: "sections understood", pct: all.pct, go: cont ? "Continue" : "Chapters", href: cont ? cont.href : "#/read" })}
        ${tile({ k: "Quizzes", v: quizRows.length ? `${acc}%` : "-", s: quizRows.length ? `${quizRows.length} answered · weakest D${weakQ.d.n}${weakQ.v != null ? " (" + weakQ.v + "%)" : ""}` : "not started", pct: acc, go: `Quiz D${weakQ.d.n}`, href: `#/quiz/run/domain/${weakQ.d.id}`, dc: dc(weakQ.d) })}
        ${tile({ k: "Flashcards", v: `${cs.due}`, s: `due today · ${cs.mastered}/${cs.total} mastered`, pct: cs.total ? cs.mastered / cs.total * 100 : 0, go: cs.due ? "Review now" : "Browse decks", href: "#/flashcards" })}
        ${tile({ k: "Mock exams", v: mocks ? Math.round(mocks.correct / mocks.total * 100) + "%" : "-", s: mocks ? `last of ${App.mocks.length} · best ${bestMock}%` : "not taken yet", pct: mocks ? Math.round(mocks.correct / mocks.total * 100) : null, go: "Start a mock", href: "#/mock" })}
        ${tile({ k: "Study time", v: fmtDur(wk), s: `this week · target ${Math.round(weekTarget / 3600)}h`, pct: wk / weekTarget * 100, go: "Insights", href: "#/insights" })}
        ${tile({ k: "Plan", v: ph ? `${tasks.filter(x => x.done).length}/${tasks.length}` : "-", s: ph ? "tasks done in this stage" : "set your exam date", pct: ph && tasks.length ? tasks.filter(x => x.done).length / tasks.length * 100 : null, go: "Open plan", href: "#/plan" })}
      </div>

      <h2 class="h-section">What to work on first</h2>
      <p class="sub">Every domain can fail you, so nothing here is unimportant. Up is a bigger share of the exam, left is where you are behind. It updates as you read and quiz.</p>
      ${priorityMatrix()}

      <details class="howto" ${firstTime ? "open" : ""}>
        <summary>How StudyCISSP works <small>(what each part is for)</small></summary>
        <ol class="howto-list">
          <li><a href="#/read"><b>Chapters</b></a> Read the eight domains one short page at a time. Tap <em>Got it - next</em> when a page makes sense.</li>
          <li><a href="#/quiz"><b>Quiz</b></a> Check yourself after each topic. Every answer explains why.</li>
          <li><a href="#/flashcards"><b>Flashcards</b></a> Five minutes a day keeps terms and numbers fresh.</li>
          <li><a href="#/plan"><b>Plan</b></a> Your route to exam day. Set your study times and add them to your calendar.</li>
          <li><a href="#/mock"><b>Mock exam</b></a> A timed run with no hints, once most chapters are done.</li>
          <li><a href="#/insights"><b>Insights</b></a> Where your time goes and which domains need more of it.</li>
          <li><a href="#/glossary"><b>Glossary</b></a> and <a href="#/resources"><b>Resources</b></a> for quick look-ups and official documents.</li>
        </ol>
      </details>

      <h2 class="h-section">Your chapters</h2>
      <p class="sub">In your order: focus domains first, strengths last. Change this in <a href="#/profile">your profile</a>.</p>
      <div class="shelf">${App.pathOrder().map(bookCard).join("")}</div>
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
          <div class="sec-tools"><span class="sec-time">◷ ${secMins(s)} min read</span>
            <button class="chip-btn ${(S.marks || {})[k] ? "on" : ""}" id="secMark" aria-pressed="${!!(S.marks || {})[k]}">${(S.marks || {})[k] ? "★ Saved" : "☆ Save for later"}</button>
            <button class="chip-btn ${((S.notes || {})[k] || {}).t ? "on" : ""}" id="secNoteBtn" aria-expanded="false">✎ ${((S.notes || {})[k] || {}).t ? "My note" : "Add a note"}</button></div>
          <div class="sec-note" id="secNote" hidden><textarea id="secNoteText" maxlength="4000" placeholder="Your own words help it stick. What is the one thing to remember here?">${esc(((S.notes || {})[k] || {}).t || "")}</textarea><small class="hint" id="secNoteState">Saved automatically. All notes are in <a href="#/notes">My notes</a>.</small></div>
          ${s.body}
          ${s.exam ? `<div class="note tests"><p>${esc(s.exam)}</p></div>` : ""}
        </section>
        ${quickCheck(d, s)}
      </div>
      <div class="sec-finish">
        <a class="btn primary big-next" id="readNext" href="${nextHref}" data-read-key="${k}">${on ? "Next" : "Got it - next"}: ${esc(nextName)} →</a>
        <div class="sec-finish-row">
          <a class="btn small ghost" href="#/quiz/run/topic/${d.id}.${s.id}">Practise this topic</a>
          <button class="understood small ${on ? "on" : ""}" data-read="${k}" aria-pressed="${on}"><span class="box"></span><span>${on ? "Understood" : "Mark as understood"}</span></button>
        </div>
        <div class="sec-pager"><a href="${prevHref}">← ${esc(prevName)}</a><a href="${nextHref}" class="skip">Skip to ${esc(nextName)} →</a></div>
        <p class="hint" style="text-align:center">Tip: use the ← and → keys to turn pages.</p>
      </div>
    </article>`;
  }
  const secMins = s => Math.max(1, Math.round(String(s.body).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));
  /* retrieval practice: one question at the end of each page, preferring ones not yet answered correctly */
  function quickCheck(d, s) {
    const pool = App.questions.filter(q => q.d === d.id && q.t === s.id); if (!pool.length) return "";
    const right = new Set(App.attempts.filter(a => a.correct).map(a => a.qid));
    const fresh = pool.filter(q => !right.has(q.id)), list = fresh.length ? fresh : pool;
    let h = 0; for (const ch of s.id + ymd(today()) + (QC.n || 0)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const q = App.shuffleQ(list[h % list.length], "qc" + h), ans = QC.key === q.id ? QC.ans : null;
    const L = ["A", "B", "C", "D"];
    return `<div class="qc" id="qc" data-qid="${q.id}" data-a="${q.a}">
      <div class="qc-head"><span class="kicker" style="--kc:var(--dc)">Quick check</span><small>${fresh.length ? `${pool.length - fresh.length} of ${pool.length} in this topic answered correctly` : "You’ve answered every question here correctly. Keep it fresh"}</small></div>
      <p class="qc-q">${esc(q.q)}</p>
      <div class="qc-opts">${q.o.map((o, j) => `<button class="opt ${ans != null ? (j === q.a ? "correct" : j === ans ? "wrong" : "") : ""}" data-qc="${j}" ${ans != null ? "disabled" : ""}><span class="l">${L[j]}</span><span>${esc(o)}</span></button>`).join("")}</div>
      ${ans != null ? `<div class="why"><b style="color:${ans === q.a ? "var(--good)" : "var(--bad)"}">${ans === q.a ? "Correct." : "Not quite. The answer is " + L[q.a] + "."}</b>${esc(q.w)}
        <div class="actions"><button class="btn small" id="qcMore">Another question</button><a class="btn small ghost" href="#/quiz/run/topic/${d.id}.${s.id}">Full topic quiz</a></div></div>` : `<p class="hint">Answering from memory, before looking back, is what makes it stick.</p>`}
    </div>`;
  }
  let QC = { key: null, ans: null, n: 0 };
  function bindQuickCheck() {
    const box = $("#qc"); if (!box) return;
    $$("[data-qc]", box).forEach(b => b.addEventListener("click", () => {
      const j = +b.dataset.qc, q = App.questions.find(x => x.id === box.dataset.qid); if (!q) return;
      const correct = j === +box.dataset.a;
      QC.key = q.id; QC.ans = j;
      const row = { mode: "quiz", qid: q.id, domain: q.d, topic: q.t || null, correct, chosen: j };
      App.attempts.push(row); db.recordAttempts([row]).catch(() => {});
      rerenderQC();
    }));
    const m = $("#qcMore"); if (m) m.addEventListener("click", () => { QC = { key: null, ans: null, n: (QC.n || 0) + 1 }; rerenderQC(); });
  }
  function rerenderQC() {
    const r = parse(), d = byId[r.a], s = d && d.sections.find(x => x.id === r.b); if (!s) return;
    const box = $("#qc"); box.outerHTML = quickCheck(d, s); bindQuickCheck();
  }
  addEventListener("hashchange", () => { QC = { key: null, ans: null, n: 0 }; });
  function bindSecTools(k) {
    const mk = $("#secMark"); if (!mk) return;
    mk.addEventListener("click", () => {
      S.marks = S.marks || {}; const on = !S.marks[k];
      if (on) S.marks[k] = new Date().toISOString(); else delete S.marks[k];
      save(); mk.classList.toggle("on", on); mk.setAttribute("aria-pressed", on); mk.textContent = on ? "★ Saved" : "☆ Save for later";
      toast(on ? "Saved. Find it in My notes." : "Removed from saved pages");
    });
    const nb = $("#secNoteBtn"), box = $("#secNote"), ta = $("#secNoteText");
    nb.addEventListener("click", () => { box.hidden = !box.hidden; nb.setAttribute("aria-expanded", String(!box.hidden)); if (!box.hidden) ta.focus(); });
    let t = null;
    ta.addEventListener("input", () => {
      clearTimeout(t); $("#secNoteState").textContent = "Saving…";
      t = setTimeout(() => {
        S.notes = S.notes || {}; const v = ta.value.trim();
        if (v) S.notes[k] = { t: v, at: new Date().toISOString() }; else delete S.notes[k];
        save(); nb.classList.toggle("on", !!v); nb.textContent = "✎ " + (v ? "My note" : "Add a note");
        $("#secNoteState").innerHTML = 'Saved. All notes are in <a href="#/notes">My notes</a>.';
      }, 600);
    });
    ta.addEventListener("keydown", e => e.stopPropagation());  // arrow keys move the cursor, not the page
  }

  /* my notes: every note and saved page, grouped by chapter, exportable */
  let notesFilter = "all";
  function viewNotes() {
    const N = S.notes || {}, M = S.marks || {};
    const keys = [...new Set(Object.keys(N).concat(Object.keys(M)))].filter(k => { const [d, s] = k.split(":"); return byId[d] && byId[d].sections.some(x => x.id === s); });
    const shown = keys.filter(k => notesFilter === "all" || (notesFilter === "notes" ? N[k] : M[k]));
    const byDom = D.map(d => ({ d, items: d.sections.map((s, i) => ({ s, i, k: d.id + ":" + s.id })).filter(x => shown.includes(x.k)) })).filter(g => g.items.length);
    return `<div class="page-narrow">
      <div class="kicker">My notes</div>
      <h1 class="h-display">In your <em>own words</em></h1>
      <p class="lede">Notes you write on any page, and pages you save for later, collected by chapter. Writing a line in your own words is one of the best ways to remember it.</p>
      <div class="filters">${[["all", `All (${keys.length})`], ["notes", `Notes (${Object.keys(N).length})`], ["marks", `Saved pages (${Object.keys(M).length})`]].map(([v, l]) => `<button class="chip ${notesFilter === v ? "on" : ""}" data-nf="${v}">${l}</button>`).join("")}
        ${Object.keys(N).length ? `<button class="btn small" id="notesExport" style="margin-left:auto">Download as a text file</button>` : ""}</div>
      ${byDom.length ? byDom.map(g => `<h2 class="h-section" style="${dc(g.d)}"><span class="toc-dot" style="display:inline-block;background:var(--${g.d.id});margin-right:8px"></span>D${g.d.n} ${esc(g.d.title)}</h2>
        ${g.items.map(x => `<div class="card note-card" style="${dc(g.d)}"><div class="note-top"><a href="#/domain/${g.d.id}/${x.s.id}"><b>${g.d.n}.${x.i + 1} ${esc(x.s.title)}</b></a>${M[x.k] ? `<span class="tag plain">★ saved</span>` : ""}${N[x.k] ? `<small>${fmtDY(N[x.k].at)}</small>` : ""}</div>
          ${N[x.k] ? `<p class="note-text">${esc(N[x.k].t).replace(/\n/g, "<br>")}</p>` : `<p class="hint">No note yet. <a href="#/domain/${g.d.id}/${x.s.id}">Open the page</a> to add one.</p>`}</div>`).join("")}`).join("")
        : `<div class="card" style="margin-top:24px"><h3>Nothing here yet</h3><p>On any chapter page, use <b>✎ Add a note</b> or <b>☆ Save for later</b> under the title.</p><a class="btn small primary" href="#/read">Open the chapters</a></div>`}
    </div>`;
  }
  function bindNotes() {
    $$("[data-nf]").forEach(b => b.addEventListener("click", () => { notesFilter = b.dataset.nf; App.rerender(); }));
    const ex = $("#notesExport"); if (ex) ex.addEventListener("click", () => {
      const N = S.notes || {}; let out = "StudyCISSP - my notes\n" + new Date().toLocaleDateString("en-GB") + "\n";
      D.forEach(d => { const items = d.sections.map((s, i) => ({ s, i, n: N[d.id + ":" + s.id] })).filter(x => x.n);
        if (items.length) { out += `\n# D${d.n} ${d.title}\n`; items.forEach(x => { out += `\n## ${d.n}.${x.i + 1} ${x.s.title}\n${x.n.t}\n`; }); } });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out], { type: "text/markdown" })); a.download = `cissp-notes-${ymd(today())}.md`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500); db.logEvent("user.notes_export", {});
    });
  }

  function viewMemorise(d) {
    const idx = D.indexOf(d), next = D[idx + 1], last = d.sections[d.sections.length - 1];
    const qs = d.questions.map((q, i) => questionCard(d, q, i)).join("");
    return `<article class="chapter sec-page" style="${dc(d)}">
      ${chapterBar(d, "memorise")}
      <div class="ch-end" style="margin-top:28px">
        <div class="memorise"><div class="kicker" style="--kc:var(--dc)">Before you move on</div><h3>Memorise</h3><ul>${d.memorise.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>
        <div class="btn-row"><a class="btn" href="#/flashcards/${d.id}">Flashcards for D${d.n}</a><a class="btn" href="#/quiz/run/domain/${d.id}">Full D${d.n} quiz</a><a class="btn" href="#/glossary/${d.id}">D${d.n} glossary</a></div>
        <p class="chapters-src"><b>Read alongside:</b> Sybex Official Study Guide - ${esc(d.sybex)}. Chapter numbers follow the 9th/10th editions; match by title if yours differ.</p>
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
  function scheduleCard() {
    const sc = schedule(), weekly = (App.profile && App.profile.weekly_hours) || 10;
    const row = (d) => { const sl = sc[d] || { on: false, start: d === 0 || d === 6 ? "09:00" : "19:00", dur: d === 0 || d === 6 ? 120 : 60 };
      return `<div class="sched-row ${sl.on ? "on" : ""}" data-day="${d}">
        <label class="check"><input type="checkbox" data-s-on ${sl.on ? "checked" : ""}><span>${DAYS[d]}</span></label>
        <input type="time" data-s-start value="${esc(sl.start)}" ${sl.on ? "" : "disabled"} aria-label="${DAYS[d]} start time">
        <select data-s-dur ${sl.on ? "" : "disabled"} aria-label="${DAYS[d]} length">${[30, 45, 60, 90, 120, 180].map(m => `<option value="${m}" ${m === +sl.dur ? "selected" : ""}>${m < 60 ? m + " min" : (m / 60) + " h"}</option>`).join("")}</select>
      </div>`; };
    return `<section class="card sched" id="schedule">
      <h3>My study times</h3>
      <p>Pick the days and times that fit around your work and family. Your dashboard shows the next session, and you can put them all in your phone or Google calendar with a reminder.</p>
      <div class="sched-grid">${[1, 2, 3, 4, 5, 6, 0].map(row).join("")}</div>
      <p class="sched-total">That’s <b id="schedTotal">0 h</b> a week. Your plan currently assumes <b>${weekly} h</b>.</p>
      <div class="btn-row"><button class="btn small primary" id="schedSave">Save my study times</button><button class="btn small" id="schedIcs">Add to my calendar</button></div>
      <p class="hint">The calendar file works with Google Calendar, Apple Calendar and Outlook. Each session repeats every week until your exam date.</p>
    </section>`;
  }
  function readSchedule() {
    const days = {};
    $$(".sched-row").forEach(r => { days[r.dataset.day] = { on: r.querySelector("[data-s-on]").checked, start: r.querySelector("[data-s-start]").value || "19:00", dur: +r.querySelector("[data-s-dur]").value }; });
    return days;
  }
  function bindSchedule() {
    if (!$("#schedule")) return;
    const total = () => { const d = readSchedule(); const m = Object.values(d).filter(x => x.on).reduce((n, x) => n + x.dur, 0); $("#schedTotal").textContent = fmtDur(m * 60); return m / 60; };
    $$(".sched-row").forEach(r => r.addEventListener("change", () => {
      const on = r.querySelector("[data-s-on]").checked; r.classList.toggle("on", on);
      r.querySelectorAll("[data-s-start],[data-s-dur]").forEach(x => { x.disabled = !on; }); total();
    }));
    total();
    $("#schedSave").addEventListener("click", async () => {
      S.schedule = { days: readSchedule(), updated: ymd(today()) }; save();
      const h = Math.max(1, Math.round(total()));
      if (App.profile && h !== App.profile.weekly_hours && Object.values(S.schedule.days).some(x => x.on)) {
        try { App.profile = await db.updateProfile({ weekly_hours: h }); } catch (e) {}
      }
      toast("Study times saved. Your plan now assumes " + h + " h a week."); App.rerender();
    });
    $("#schedIcs").addEventListener("click", () => {
      const days = readSchedule(), on = Object.entries(days).filter(([, x]) => x.on);
      if (!on.length) return toast("Tick at least one day first.");
      const BY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"], p2 = n => String(n).padStart(2, "0");
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
      const until = App.examTarget().replace(/-/g, "") + "T235959";
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StudyCISSP//Study times//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
      on.forEach(([d, x]) => {
        let first = today(); while (first.getDay() !== +d) first = addDays(first, 1);
        const [h, m] = x.start.split(":").map(Number);
        lines.push("BEGIN:VEVENT", `UID:study-${d}-${Date.now()}@studycissp`, `DTSTAMP:${stamp}`,
          `DTSTART:${first.getFullYear()}${p2(first.getMonth() + 1)}${p2(first.getDate())}T${p2(h)}${p2(m)}00`, `DURATION:PT${x.dur}M`,
          `RRULE:FREQ=WEEKLY;BYDAY=${BY[+d]};UNTIL=${until}`, "SUMMARY:CISSP study session",
          "DESCRIPTION:Open https://studycissp.netlify.app and pick up where you left off.",
          "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:CISSP study session in 10 minutes", "END:VALARM", "END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })); a.download = "cissp-study-times.ics"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      db.logEvent("user.calendar_export", {}); toast("Calendar file downloaded. Open it to add your sessions.");
    });
  }
  function planSettings() {
    const p = App.profile || {}, sa = p.self_assessment || {}, mix = S.planMix || "balanced";
    const lv = [["new", "New to me"], ["some", "Some"], ["confident", "Confident"]];
    const st = S.planStart || ymd(today());
    return `<details class="card plan-set" id="planSet">
      <summary><span><b>Plan settings</b><small>Exam ${fmtDY(App.examTarget())} · ${p.weekly_hours || 10} h a week · ${({ read: "more reading", balanced: "balanced", practice: "more practice" })[mix]} · from ${fmtD(st)}</small></span><span class="btn small">Change</span></summary>
      <div class="ps-grid stack">
        <label>Target exam date<input type="date" id="psTarget" min="${ymd(addDays(today(), 7))}" value="${esc(p.target_date || App.examTarget())}"></label>
        <label>Latest possible date (optional)<input type="date" id="psLatest" value="${esc(p.latest_date || "")}"></label>
        <label>Plan starts on<input type="date" id="psStart" value="${esc(st)}"></label>
        <label>Hours a week <b id="psHv">${p.weekly_hours || 10}</b><input type="range" id="psHours" min="2" max="30" value="${p.weekly_hours || 10}"></label>
      </div>
      <div class="ps-block"><span class="set-label">Pace</span>
        <div class="seg3" id="psMix" style="--dc:var(--accent)">${[["read", "More reading", "62% reading, 23% practice, 15% review"], ["balanced", "Balanced", "55% reading, 25% practice, 20% review"], ["practice", "More practice", "45% reading, 32% practice, 23% review"]].map(([v, l, h]) => `<button type="button" data-mix="${v}" class="${mix === v ? "on" : ""}" title="${h}">${l}</button>`).join("")}</div>
        <p class="hint" id="psMixHint"></p></div>
      <div class="ps-block"><span class="set-label">How confident are you in each domain?</span>
        <div class="ps-doms">${D.map(dm => `<div class="ps-dom" style="${dc(dm)}"><span><span class="toc-dot" style="display:inline-block;background:var(--${dm.id})"></span> D${dm.n} ${esc(dm.short)} <small>${dm.weight}%</small></span>
          <div class="seg3">${lv.map(([v, l]) => `<button type="button" data-psa="${dm.id}:${v}" class="${(sa[dm.id] || "some") === v ? "on" : ""}">${l}</button>`).join("")}</div></div>`).join("")}</div></div>
      <div class="btn-row"><button class="btn small primary" id="psSave">Save and redraw my plan</button><button class="btn small ghost" id="restartPlan">Restart from today</button></div>
    </details>`;
  }
  function bindPlanSettings() {
    if (!$("#planSet")) return;
    const sa = Object.assign({}, (App.profile || {}).self_assessment || {}); let mix = S.planMix || "balanced";
    const mixHint = () => { const b = $(`[data-mix="${mix}"]`); $("#psMixHint").textContent = b ? b.title + "." : ""; };
    mixHint();
    $("#psHours").addEventListener("input", e => { $("#psHv").textContent = e.target.value; });
    $$("[data-mix]").forEach(b => b.addEventListener("click", () => { mix = b.dataset.mix; $$("[data-mix]").forEach(x => x.classList.toggle("on", x === b)); mixHint(); }));
    $$("[data-psa]").forEach(b => b.addEventListener("click", () => { const [id, v] = b.dataset.psa.split(":"); sa[id] = v; $$(`[data-psa^="${id}:"]`).forEach(x => x.classList.toggle("on", x === b)); }));
    $("#psSave").addEventListener("click", async (e) => {
      const t = $("#psTarget").value, l = $("#psLatest").value || null, s = $("#psStart").value || ymd(today()), h = +$("#psHours").value;
      if (!t) return toast("Pick a target exam date");
      if (l && l < t) return toast("The latest date must be on or after the target date");
      if (s >= t) return toast("The plan has to start before the exam date");
      e.target.disabled = true;
      try {
        App.profile = await db.updateProfile({ target_date: t, latest_date: l, weekly_hours: h, self_assessment: sa });
        S.planStart = s; S.planMix = mix; save(); db.logEvent("user.plan_settings", { mix });
        toast("Plan redrawn"); App.rerender();
      } catch (err) { e.target.disabled = false; toast(App.errMsg ? App.errMsg(err) : String(err.message || err)); }
    });
  }
  function viewPlan() {
    const now = today(), pl = App.plan(), ph = App.currentPhase();
    const phases = pl.phases.map(p => {
      const st = parseD(p.start), en = parseD(p.end);
      const state = now > en ? "done" : (now >= st && now <= en) || p === ph ? "now" : "";
      const done = p.tasks.filter((t, i) => S.tasks[p.id + ":" + i] || autoDone(t)).length;
      return `<div class="phase ${state}" style="--pc:var(--${p.domain})"><div class="phase-card">
        <div class="phase-top"><span class="phase-date">${fmtD(p.start)} - ${fmtDY(p.end)}</span><span class="kicker" style="--kc:var(--${p.domain})">${esc(p.iter)}</span>${state === "now" ? `<span class="now-pill">You are here</span>` : ""}<span class="phase-date" style="margin-left:auto">${done}/${p.tasks.length}</span>
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
      <p class="lede">Built from your exam date and how confident you feel in each domain. Focus domains get the most days; strengths share a fast pass. Change anything below and the plan redraws itself.</p>
      <div class="grid-2" style="margin-top:28px">${countdown()}</div>
      ${planSettings()}
      ${scheduleCard()}
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
      return `<tr style="${dc(d)}"><td><span class="toc-dot" style="display:inline-block;background:var(--${d.id});margin-right:8px"></span><b>D${d.n}</b> ${esc(d.short)}<div style="font-size:12px;color:var(--muted)">${d.weight}% weight · in-app quizzes ${qa == null ? "-" : qa + "%"}</div></td>
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
        <div><div class="kicker">Weighted readiness</div><div id="ready" style="font-family:var(--display);font-size:54px;line-height:1">-</div></div>
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
      <h1 class="h-display">The field, <em>2024-2026</em></h1>
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
      <p class="lede">A short list, on purpose. Free official documents first, then the books and practice banks most people pass with. Add your own in <a href="#/library">My library</a>.</p>
      <div class="featured">
        <div class="pdf-cover"><small>ISC2 · PDF · 15 pages</small><b>The Ultimate Guide to the CISSP</b></div>
        <div>
          <div class="kicker">Official overview from ISC2</div>
          <h3 style="font-family:var(--display);font-weight:500;font-size:26px;margin:6px 0 8px">The Ultimate Guide to the CISSP</h3>
          <p style="color:var(--ink-2);margin:0 0 6px">Who the CISSP is for, the experience requirement, domain weights, exam format (100-150 CAT items, 3 hours, 700/1000), the six-step pathway, endorsement within nine months, and CPE rules (120 over three years, US$135 AMF). It also notes the new exam outline from 15 April 2027.</p>
          <div class="btn-row" style="margin-top:14px"><a class="btn primary small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" target="_blank" rel="noopener">Open the PDF</a><a class="btn small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" download>Download</a></div>
        </div>
      </div>
      <details class="pdf-view"><summary>Read the ISC2 guide here</summary><iframe src="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf#view=FitH" title="The Ultimate Guide to the CISSP (ISC2)" loading="lazy"></iframe></details>
      <div class="card own-copy"><h3>Your own copy of the Sybex books</h3><p>The Official Study Guide and Practice Tests are paid books, so they can’t be shared on this site. If you own a copy, upload it to <a href="#/library">My library</a>. Files there are private to your account and open on any device you sign in on.</p></div>
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
          <p class="lede">Study the CISSP one short page at a time. Each chapter is broken into small sections, the tricky ideas have little animations, and a quick quiz after each topic tells you if it has sunk in. Your plan works back from your exam date, so you always know what to do next.</p>
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
    if (currentSec) { bindSecTools(d.id + ":" + currentSec); bindQuickCheck(); }
    // "Got it - next": mark as understood and turn the page
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
      if (!w) { el.textContent = "-"; el.style.color = ""; return; }
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
    let body = null; try { body = App.plainDashes(await db.privateContent("ai_tutor_prompt")); } catch (e) {}
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
  App.register("plan", { render: viewPlan, title: "Study plan", nav: "plan", area: "plan", bind: (r) => {
    $("#restartPlan").addEventListener("click", () => { if (confirm("Redraw the plan starting today? Ticked tasks stay ticked.")) { S.planStart = ymd(today()); save(); App.rerender(); } });
    bindPlanSettings();
    bindSchedule();
    if (r.a === "schedule") { const el = $("#schedule"); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); }
  } });
  App.register("notes", { render: viewNotes, bind: bindNotes, title: "My notes", nav: "notes", area: "library" });
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
  [["Study plan", "#/plan", "calendar phases checkpoints iteration exam date deadline hours"], ["Quiz", "#/quiz", "questions practice topic domain"], ["Flashcards", "#/flashcards", "cards spaced repetition"], ["Mock exam", "#/mock", "timed test full"], ["Insights", "#/insights", "time spent analytics streak accuracy"], ["Exam tactics", "#/tactics", "method qualifier manager cat adaptive logistics rules"], ["Tracker", "#/tracker", "scores error log mock readiness"], ["What’s new 2024-2026", "#/latest", P.latest.map(x => x.title + " " + x.body).join(" ")], ["Resources", "#/resources", "books sybex boson pdf ultimate guide video nist owasp"], ["My library", "#/library", "upload documents youtube links"], ["Privacy & trust", "#/privacy", "gdpr dpdp iso 27001 31000 delete data export"]]
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
  const closeGroups = (except) => $$(".mainnav .nav-group.open").forEach(x => { if (x !== except) { x.classList.remove("open"); x.querySelector(".nav-top").setAttribute("aria-expanded", "false"); } });
  $$(".mainnav .nav-group").forEach(g => {
    const btn = g.querySelector(".nav-top");
    const set = (on) => { closeGroups(g); g.classList.toggle("open", on); btn.setAttribute("aria-expanded", String(on)); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); set(!g.classList.contains("open")); });
    g.addEventListener("keydown", (e) => { if (e.key === "Escape") { set(false); btn.focus(); } });
    g.addEventListener("focusout", (e) => { if (e.relatedTarget && !g.contains(e.relatedTarget)) set(false); });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".nav-group")) closeGroups(); });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && !/[?&]nosw/.test(location.search)) {
    addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
  let installEvt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; const b = $("#installBlock"); if (b) b.hidden = false; });
  const ib = $("#installApp"); if (ib) ib.addEventListener("click", async () => { if (!installEvt) return; installEvt.prompt(); const r = await installEvt.userChoice; installEvt = null; $("#installBlock").hidden = true; if (r.outcome === "accepted") db.logEvent("user.app_installed", {}); });
  addEventListener("offline", () => toast("You’re offline. Chapters you’ve opened still work; progress saves on this device."));
  addEventListener("online", () => { toast("Back online"); if (db.mode === "cloud" && db.user) save(); });
  const killBadge = () => document.querySelectorAll('#nl-badge-frame, iframe[title="Powered by Netlify"]').forEach(x => x.remove());
  new MutationObserver(killBadge).observe(document.body, { childList: true }); killBadge();
  $("#tocToggle").addEventListener("click", () => { toc.classList.add("open"); $("#scrim").classList.add("on"); });
  $("#scrim").addEventListener("click", closeToc);

  /* ---------------- start ---------------- */
  /* ---------------- access logging (sign-in + once a day per device) ---------------- */
  App.deviceInfo = async () => {
    const ua = navigator.userAgent || "";
    const m = (re) => { const x = ua.match(re); return x ? x[1] : null; };
    let browser = "Other";
    if (/Edg\//.test(ua)) browser = "Edge " + m(/Edg\/(\d+)/);
    else if (/OPR\//.test(ua)) browser = "Opera " + m(/OPR\/(\d+)/);
    else if (/SamsungBrowser\//.test(ua)) browser = "Samsung Internet " + m(/SamsungBrowser\/(\d+)/);
    else if (/Firefox\//.test(ua)) browser = "Firefox " + m(/Firefox\/(\d+)/);
    else if (/CriOS\//.test(ua)) browser = "Chrome " + m(/CriOS\/(\d+)/);
    else if (/Chrome\//.test(ua)) browser = "Chrome " + m(/Chrome\/(\d+)/);
    else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari " + m(/Version\/(\d+(?:\.\d+)?)/);
    const iPadDesktopUA = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    let os = "Other";
    if (/Windows NT 10/.test(ua)) os = "Windows 10/11"; else if (/Windows NT/.test(ua)) os = "Windows";
    else if (/iPhone OS/.test(ua)) os = "iOS " + (m(/iPhone OS (\d+(?:_\d+)?)/) || "").replace("_", ".");
    else if (/iPad/.test(ua) || iPadDesktopUA) os = "iPadOS";
    else if (/Android/.test(ua)) os = "Android " + (m(/Android (\d+(?:\.\d+)?)/) || "");
    else if (/CrOS/.test(ua)) os = "ChromeOS"; else if (/Mac OS X/.test(ua)) os = "macOS"; else if (/Linux/.test(ua)) os = "Linux";
    const type = /iPad|Tablet/.test(ua) || iPadDesktopUA || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "mobile" : "desktop";
    let model = /iPhone/.test(ua) ? "iPhone" : (/iPad/.test(ua) || iPadDesktopUA) ? "iPad" : null;
    if (!model && /Android/.test(ua)) { const am = ua.match(/Android [\d.]+; ([^;)]+)/); if (am && am[1] !== "K") model = am[1].trim(); }
    try {
      if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        const h = await navigator.userAgentData.getHighEntropyValues(["model", "platform", "platformVersion"]);
        if (h.model) model = h.model;
        if (h.platform === "Windows" && h.platformVersion) os = parseInt(h.platformVersion, 10) >= 13 ? "Windows 11" : "Windows 10";
        if (h.platform === "macOS" && h.platformVersion) os = "macOS " + h.platformVersion.split(".").slice(0, 2).join(".");
      }
    } catch (e) {}
    return { browser, os, device_type: type, device_model: model, screen: `${screen.width}×${screen.height} @${Math.round((devicePixelRatio || 1) * 10) / 10}x`,
      language: navigator.language || null, timezone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || null };
  };
  App.preciseLocation = () => new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }), () => res(null), { timeout: 10000, maximumAge: 600000, enableHighAccuracy: false });
  });
  App.logAccess = async (event, force) => {
    if (db.mode !== "cloud" || !db.user) return;
    const key = "cissp.visit:" + db.user.id, day = ymd(today());
    let last = null; try { last = localStorage.getItem(key); } catch (e) {}
    if (event !== "sign_in" && !force && last === day) return;
    try { localStorage.setItem(key, day); } catch (e) {}
    const [info, geo] = await Promise.all([App.deviceInfo(), fetch("/api/whereami", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null)]);
    const gps = App.profile && App.profile.share_precise_location ? await App.preciseLocation() : null;
    await db.logAccess(Object.assign({ event, geo: geo || {}, gps }, info));
  };
  // stored text may still contain long dashes; show plain hyphens everywhere
  App.plainDashes = (t) => typeof t === "string" ? t.replace(/ [—–] /g, " - ").replace(/[—–]/g, "-") : t;
  App.loadPlans = async () => { try { const pl = await db.plans(); if (pl && pl.length) App.plans = pl.map(p => Object.assign({}, p, { tagline: App.plainDashes(p.tagline), perks: (p.perks || []).map(App.plainDashes) })); } catch (e) {} };
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
    if (notes && App.isPrivileged()) { try { App.personal = JSON.parse(App.plainDashes(notes)); } catch (e) {} }
    db.touch().catch(() => {});
    setTimeout(() => App.logAccess("visit"), 1500);
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

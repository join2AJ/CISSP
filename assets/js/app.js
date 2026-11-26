/* LearNtime - core: state, router, personalisation, time tracking, reading views */
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
  const fmtDur = s => { s = Math.round(s || 0); if (s === 0) return "0 min"; if (s < 60) return s + "s"; const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h ${pad(m)}m` : `${m}m`; };
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
      const price = +p.price || 0, value = +p.value || 0, day = price / 365;
      const cta = opts.signup ? `<a class="btn ${p.id === "gold" ? "primary" : ""}" href="#/signup/${p.id}">Start my 90 days free →</a>`
        : mine ? `<span class="btn ghost" aria-disabled="true">✓ Your plan</span>` : opts.request ? `<button class="btn" data-upgrade="${p.id}">Request ${esc(p.name)}</button>` : "";
      return `<div class="plan plan-${p.id} ${mine ? "mine" : ""}">
        <div class="plan-top"><span class="plan-gem"></span><b>${esc(p.name)}</b>${p.id === "gold" ? `<span class="plan-pop">Most popular</span>` : ""}</div>
        <p class="plan-tag">${esc(p.tagline || "")}</p>
        ${value ? `<p class="plan-value">Worth <b>${App.money(value, p.currency)}+</b> if you bought the same elsewhere</p>` : ""}
        <div class="plan-price"><b>Free</b><span>when you finish in 90 days</span></div>
        ${price ? `<p class="plan-else">Otherwise <b>${App.money(price, p.currency)}</b> a year · just ${App.money(Math.round(day * 100) / 100, p.currency)} a day</p>` : ""}
        <ul>${(p.perks || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        ${cta}</div>`;
    }).join("")}</div>`;
  };
  /* the 90-day challenge: four goals that add up to exam readiness */
  App.challengeOffer = () => {
    const g = App.planById("gold") || App.plans[0] || {}, price = +g.price || 0;
    const prices = App.plans.filter(p => p.active !== false && +p.price > 0).map(p => App.money(+p.price, p.currency));
    return { price, money: price ? App.money(price, g.currency) : "", prices: prices.join(", ").replace(/, ([^,]*)$/, " or $1"), value: +g.value ? App.money(+g.value, g.currency) : "" };
  };
  App.challengeBlock = () => {
    const o = App.challengeOffer();
    return `<section class="chal" aria-label="The 90-day CISSP challenge">
      <div class="chal-hero"><span class="kicker">The 90-day CISSP challenge</span>
        <h2>Disappear for 90 days.<br><em>Come back exam-ready.</em></h2>
        <p>Just 60 minutes a day. 90 days. One certification.</p></div>
      <div class="chal-story">
        <div><b>Day 1</b><span>You’re motivated.</span></div>
        <div><b>Day 5</b><span>You miss a session.</span></div>
        <div><b>Day 10</b><span>Work gets busy.</span></div>
        <p>A few weeks later the book is on the shelf and the exam date is closer. Most people don’t fail the CISSP; they stop studying for it. That’s why we built the challenge.</p>
      </div>
      <ol class="chal-how">
        <li><b>1</b><div><h4>Start free</h4><p>No card, no payment. Pick a plan and your 90 days begin.${o.value ? ` You get a course worth ${o.value}+ elsewhere.` : ""}</p></div></li>
        <li><b>2</b><div><h4>Finish four goals in 90 days</h4><p>Read all 55 sections · answer 500 questions · score 70%+ in a mock · study on 60 different days. Your dashboard tracks every one.</p></div></li>
        <li><b>3</b><div><h4>Finish, and it stays free</h4><p>${o.price ? `Complete it in 90 days and you pay nothing. If you don’t, it’s ${o.prices} a year, depending on your plan.` : "Complete it in 90 days and you pay nothing."}</p></div></li>
      </ol>
      ${o.price ? `<p class="chal-line">Finish in 90 days and it costs you nothing. That’s your reason to show up, every day, until you’re ready.</p>` : ""}
    </section>`;
  };
  App.challenge = () => {
    const S0 = App.state(), start = S0.challengeStart; if (!start) return null;
    const end = ymd(addDays(parseD(start), 90)), left = Math.max(0, daysTo(end));
    const readN = D.reduce((n, d) => n + d.sections.filter(s => S0.read[d.id + ":" + s.id]).length, 0), allN = D.reduce((n, d) => n + d.sections.length, 0);
    const since = r => (r.created_at || "9999") >= start;
    const ans = App.attempts.filter(since).length;
    const best = Math.max(0, ...App.mocks.filter(since).map(m => Math.round(m.correct / m.total * 100)));
    const days = new Set((App.timeRows || []).filter(r => r.day >= start && r.seconds >= 300).map(r => r.day)).size;
    const goals = [["Read every section", readN, allN, `${readN} of ${allN}`, "#/read"], ["Answer 500 questions", Math.min(ans, 500), 500, `${ans} answered`, "#/quiz"],
      ["Score 70%+ in a mock", Math.min(best, 70), 70, best ? `best ${best}%` : "no mock yet", "#/mock"], ["Study on 60 days", Math.min(days, 60), 60, `${days} days`, "#/insights"]];
    const done = goals.every(g => g[1] >= g[2]);
    return { start, end, left, goals, done, day: Math.min(90, 90 - left + 1) };
  };
  function challengeCard() {
    const c = App.challenge(), o = App.challengeOffer();
    if (!c) return `<section class="card chal-mini"><div><span class="kicker">The 90-day challenge</span><h3>60 minutes a day for 90 days</h3>
      <p>Four goals: every section, 500 questions, a 70% mock and 60 study days. Finish them in 90 days and the course stays free${o.price ? `; otherwise it’s ${o.money} a year` : ""}.</p></div>
      <button class="btn primary" id="chalStart">I’m in. Start my 90 days</button></section>`;
    return `<section class="card chal-track ${c.done ? "done" : ""}">
      <div class="chal-track-head"><div><span class="kicker">The 90-day challenge</span><h3>${c.done ? "Challenge complete. Well done." : `Day ${c.day} of 90`}</h3>
        <p class="hint" style="margin:0">${c.done ? "Claim your free access below." : `${c.left} days left to finish free · ends ${fmtDY(c.end)}`}</p></div>
        <div class="chal-days" aria-hidden="true"><i style="width:${Math.round(c.day / 90 * 100)}%"></i></div></div>
      <div class="chal-goals">${c.goals.map(([t, v, max, lbl, h]) => `<a class="chal-goal ${v >= max ? "ok" : ""}" href="${h}"><span>${v >= max ? "✓ " : ""}${t}</span><span class="meter"><i style="width:${Math.round(v / max * 100)}%"></i></span><small>${lbl}</small></a>`).join("")}</div>
      ${c.done ? `<button class="btn primary" id="chalClaim" ${App.state().challengeClaimed ? "disabled" : ""}>${App.state().challengeClaimed ? "✓ Claimed. Your administrator has been told" : "Claim my free access"}</button>` : ""}
    </section>`;
  }
  function bindChallenge() {
    const s = $("#chalStart"); if (s) s.addEventListener("click", () => { S.challengeStart = ymd(today()); save(); db.logEvent("user.challenge_started", {}); toast("Your 90 days start today. See you tomorrow."); App.rerender(); });
    const c = $("#chalClaim"); if (c) c.addEventListener("click", () => { const ch = App.challenge(); if (!ch || !ch.done) return;
      S.challengeClaimed = new Date().toISOString(); save(); db.logEvent("user.challenge_completed", { start: ch.start, end: ch.end }); toast("Claimed. Your administrator will be in touch."); App.rerender(); });
  }
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

  /* ---------------- branch (CISSP or GRC) ---------------- */
  // Pages that belong to both branches keep whichever branch you were last in.
  const SHARED = ["profile", "privacy", "plans", "admin"];
  const CISSP_ONLY = ["home", "read", "domain", "plan", "quiz", "mock", "flashcards", "revision", "glossary", "latest", "tactics", "resources", "library", "insights", "notes", "tracker"];
  // CISSP / GRC switch shown on pages that exist in both branches
  App.branchTabs = (cur, cissp, grc) => App.isPrivileged() ? `<nav class="seg-tabs ins-branch" aria-label="Which course"><a class="${cur === "cissp" ? "on" : ""}" href="${cissp}" ${cur === "cissp" ? 'aria-current="page"' : ""}>CISSP</a><a class="${cur === "grc" ? "on" : ""}" href="${grc}" ${cur === "grc" ? 'aria-current="page"' : ""}>GRC</a></nav>` : "";
  App.branch = () => { try { return localStorage.getItem("cissp.branch") === "grc" ? "grc" : "cissp"; } catch (e) { return "cissp"; } };
  App.setBranch = b => { try { localStorage.setItem("cissp.branch", b); } catch (e) {} };
  App.inGrc = r => r.page === "grc" || (SHARED.includes(r.page) && App.branch() === "grc" && App.isPrivileged());
  // Which course a page belongs to: "cissp", "grc", or null for pages that belong to the whole site (choose, profile, privacy, admin, sign-in)
  App.course = r => r.page === "grc" ? "grc" : CISSP_ONLY.includes(r.page) || ["revision", "notes", "tracker", "latest", "tactics"].includes(r.page) ? "cissp" : null;
  const noteBranch = r => { if (r.page === "grc") App.setBranch("grc"); else if (CISSP_ONLY.includes(r.page)) App.setBranch("cissp"); };

  /* ---------------- router ---------------- */
  const routes = {};
  App.routes = routes;
  App.register = (name, def) => { routes[name] = def; };
  function parse() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b, c, d] = h.split("/");
    return { page: a || "home", a: b ? decodeURIComponent(b) : b, b: c ? decodeURIComponent(c) : c, c: d ? decodeURIComponent(d) : d };
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
    const exKey = r.page === "quiz" && r.a === "run" ? null : r.page === "tracker" ? "tracker" : r.page === "insights" && App.inGrc(r) ? "insights-grc" : r.page;
    if (exKey && !site) out = withExplain(out, exKey);
    view.innerHTML = out + (site ? (App.siteFooter ? App.siteFooter() : "") : def.bare ? "" : footer(r));
    App.stackTables(view);
    App.linkAbbr(view, App.inGrc(r) ? "grc" : "cissp");
    view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter");
    if (!def.bare && !site) renderToc(r);
    paintNav(r, def);
    document.documentElement.style.setProperty("--pc", r.page === "domain" && byId[r.a] ? `var(--${r.a})` : "var(--accent)");
    // GRC time is stored as area "other" with domain "grc" or "grc-<module>" (no database change needed)
    App.setTrack(r.page === "grc" ? { area: "other", domain: grcMod(r.a) ? "grc-" + r.a : "grc", topic: grcMod(r.a) && r.b ? String(r.b).slice(0, 48) : "" }
      : def.area ? { area: typeof def.area === "function" ? def.area(r) : def.area, domain: r.page === "domain" ? r.a : "", topic: "" } : null);
    bindCommon(r);
    if (def.bind) def.bind(r);
    if (r.page === "domain" && r.b) {
      const el = document.getElementById(r.b);
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); else window.scrollTo(0, 0);
    } else window.scrollTo(0, 0);
    if (r.page === "domain") { S.last = { d: r.a, s: r.b || null }; save(); }
    document.title = (def.title ? (typeof def.title === "function" ? def.title(r) : def.title) + " · " : "") + "LearNtime";
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
    "insights-grc": ["Your GRC course progress: time, lessons, lesson questions and controls tested.", "It shows which modules you have covered and where you are still thin.", "Look once a week. Finish the module you started before opening a new one."],
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
    (root || view).querySelectorAll(".tbl-wrap").forEach(w => { if (!w.hasAttribute("tabindex")) { w.tabIndex = 0; w.setAttribute("role", "region"); const h = (() => { let e = w; while (e && e !== document.body) { let p = e.previousElementSibling; while (p) { if (/^H[1-4]$/.test(p.tagName)) return p.textContent.trim(); const q = p.querySelector && p.querySelector("h1,h2,h3,h4"); if (q) return q.textContent.trim(); p = p.previousElementSibling; } e = e.parentElement; } return ""; })(); w.setAttribute("aria-label", (h ? h + ": " : "") + "scrollable table"); } });
    const seenL = {}; (root || view).querySelectorAll(".tbl-wrap[role=region]").forEach(w => { const l = w.getAttribute("aria-label"); seenL[l] = (seenL[l] || 0) + 1; if (seenL[l] > 1) w.setAttribute("aria-label", l + " " + seenL[l]); });
    (root || view).querySelectorAll(".prose table, .tbl.stackable").forEach(t => {
      if (t.dataset.stacked) return; t.dataset.stacked = "1"; t.classList.add("stk");
      const heads = [...t.querySelectorAll("thead th")].map(th => th.textContent.trim());
      t.querySelectorAll("tbody tr").forEach(tr => [...tr.children].forEach((td, i) => {
        if (heads[i]) td.setAttribute("data-label", heads[i]);
        // keep text and inline tags together so the grid has one value cell, not a cell per fragment
        if (td.childNodes.length && !(td.children.length === 1 && td.firstElementChild.classList.contains("cv"))) { const v = document.createElement("span"); v.className = "cv"; while (td.firstChild) v.appendChild(td.firstChild); td.appendChild(v); }
      }));
    });
  };
  /* short forms: tap any abbreviation to see its full form and meaning, with a link to the glossary */
  const NOLINK = new Set(["IT"]);
  const abbrIdx = {};
  App.abbrIndex = (branch) => {
    if (abbrIdx[branch]) return abbrIdx[branch];
    const m = new Map();
    (window.ABBR_EXTRA || []).forEach(([k, full, mean, br]) => { if (br === "both" || br === branch) m.set(k, { k, full, mean, where: "", g: "grc" }); });
    Object.entries(window.GLOSSARY || {}).forEach(([d, list]) => list.forEach(t => {
      const mm = String(t[0]).match(/^([A-Z][A-Za-z0-9\-\/&]*[A-Z0-9][A-Za-z0-9]*) \((.+)\)$/);
      if (mm && !m.has(mm[1])) m.set(mm[1], { k: mm[1], full: mm[2], mean: t[1], where: t[2] || "", g: "cissp" });
    }));
    (window.ABBR_EXTRA || []).forEach(([k, full, mean, br]) => { if (!m.has(k) && br !== branch) m.set(k, { k, full, mean, where: "", g: "grc" }); });
    const keys = [...m.keys()].filter(k => !NOLINK.has(k)).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"));
    return (abbrIdx[branch] = { map: m, re: new RegExp(`(?<![\\w-])(${keys.join("|")})(s?)(?![\\w-])`, "g") });
  };
  const ABBR_SKIP = "a, button, abbr, code, pre, kbd, h1, h2, h3, input, textarea, select, label, script, style, svg, .no-abbr, .opt, .nav-menu";
  App.linkAbbr = (root, branch) => {
    if (!root) return; const idx = App.abbrIndex(branch || (document.body.classList.contains("grc-mode") ? "grc" : "cissp"));
    const scopes = root.matches && root.matches(".prose, .why, .qc-q, .q-stem, .grc-lab, .memorise, .rev-sheet, .note-text, .lede, .grc-mod small, .grc-pbc-how, .grc-pbc-tbl") ? [root]
      : root.querySelectorAll(".prose, .why, .qc-q, .q-stem, .grc-lab, .memorise, .rev-sheet, .note-text, .grc-mod small, .grc-pbc-how, .grc-pbc-tbl");
    scopes.forEach(sc => {
      const walker = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(ABBR_SKIP) || !/[A-Z]{2}/.test(n.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(n => {
        const text = n.nodeValue; idx.re.lastIndex = 0; if (!idx.re.test(text)) return; idx.re.lastIndex = 0;
        const frag = document.createDocumentFragment(); let last = 0, m;
        while ((m = idx.re.exec(text))) {
          const e = idx.map.get(m[1]); if (!e) continue;
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const ab = document.createElement("abbr"); ab.className = "gl"; ab.tabIndex = 0; ab.title = e.full; ab.dataset.k = m[1]; ab.setAttribute("role", "button"); ab.textContent = m[1] + (m[2] || "");
          frag.appendChild(ab); last = m.index + m[0].length;
        }
        frag.appendChild(document.createTextNode(text.slice(last))); n.parentNode.replaceChild(frag, n);
      });
    });
  };
  let abbrPop = null;
  const closeAbbr = () => { if (abbrPop) { abbrPop.remove(); abbrPop = null; } };
  const openAbbr = (el) => {
    closeAbbr(); const branch = document.body.classList.contains("grc-mode") ? "grc" : "cissp";
    const e = App.abbrIndex(branch).map.get(el.dataset.k); if (!e) return;
    const href = e.g === "cissp" ? `#/glossary/q/${encodeURIComponent(e.k)}` : `#/grc/glossary/${encodeURIComponent(e.k)}`;
    abbrPop = document.createElement("div"); abbrPop.className = "abbr-pop"; abbrPop.setAttribute("role", "dialog"); abbrPop.setAttribute("aria-label", e.k);
    abbrPop.innerHTML = `<b>${esc(e.k)}</b><span class="abbr-full">${esc(e.full)}</span><p>${esc(e.mean)}</p>${e.where ? `<p class="abbr-where">Used in: ${esc(e.where)}</p>` : ""}<a href="${href}">Open in the ${e.g === "cissp" ? "CISSP" : "GRC"} glossary →</a>`;
    document.body.appendChild(abbrPop);
    const r = el.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    abbrPop.style.width = w + "px";
    abbrPop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + "px";
    const below = r.bottom + 8 + abbrPop.offsetHeight < innerHeight;
    abbrPop.style.top = (below ? r.bottom + 8 : Math.max(8, r.top - abbrPop.offsetHeight - 8)) + scrollY + "px";
    abbrPop.querySelector("a").addEventListener("click", closeAbbr);
  };
  document.addEventListener("click", (ev) => { const el = ev.target.closest && ev.target.closest("abbr.gl"); if (el) { ev.preventDefault(); ev.stopPropagation(); if (abbrPop && abbrPop.dataset.for === el.dataset.k + el.offsetTop) closeAbbr(); else { openAbbr(el); if (abbrPop) abbrPop.dataset.for = el.dataset.k + el.offsetTop; } return; } if (abbrPop && !abbrPop.contains(ev.target)) closeAbbr(); }, true);
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") closeAbbr(); else if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches("abbr.gl")) { ev.preventDefault(); openAbbr(ev.target); } });
  addEventListener("hashchange", closeAbbr);
  App.rerender = () => { rendered = null; const y = scrollY; route().then(() => scrollTo(0, y)); };

  function paintNav(r, def) {
    const key = def.nav || r.page;
    noteBranch(r);
    const grcMode = App.inGrc(r);
    $$(".mainnav").forEach(n => { n.hidden = n.classList.contains("grcnav") ? !grcMode : grcMode; });
    const brand = $(".topbar .brand"); if (brand) { brand.setAttribute("href", grcMode ? "#/grc" : "#/"); const sm = brand.querySelector("small"); if (sm) { const cs = App.course(r); sm.innerHTML = cs === "grc" ? `<span class="bb">GRC</span><span class="bt"> · governance, risk, compliance</span>` : cs === "cissp" ? `<span class="bb">CISSP</span><span class="bt"> · read slowly, pass once</span>` : `<span class="bt neutral">learn anytime, as often as you need</span>`; brand.setAttribute("href", cs === "grc" ? "#/grc" : cs === "cissp" ? "#/" : (App.profile && App.profile.onboarded ? "#/choose" : "#/")); } }
    document.body.classList.toggle("grc-mode", grcMode);
    const navKey = grcMode ? (!r.a ? "grc-home" : grcMod(r.a) ? "grc-" + r.a : "grc-" + r.a)
      : r.page === "domain" ? "read" : (document.querySelector(`.mainnav [data-nav="${r.page}"]`) ? r.page : key);
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
    const adm2 = $("#navAdmin2"); if (adm2) adm2.hidden = !App.isAdmin();
    const grc = $("#navGrc"); if (grc) grc.hidden = !App.isPrivileged();
    $$(".mainnav a").forEach(a => a.classList.toggle("locked", !!App.profile && !App.can(App.FEATURE[a.dataset.nav === "read" ? "read" : a.dataset.nav])));
    const signed = db.mode === "local" || !!db.user;
    $("#userBtn").hidden = !signed || (!!def.bare && !(App.profile && App.profile.onboarded)) || (db.mode === "cloud" && !db.user);
    $(".mainnav").style.visibility = def.bare && !document.body.classList.contains("site") ? "hidden" : "";
    $("#searchOpen").style.visibility = def.bare ? "hidden" : "";
    const ini = $("#userIni"); if (ini) { const p = App.profile || {}; ini.textContent = ((p.full_name || p.username || "•")[0] || "•").toUpperCase(); }
  }

  /* ---------------- TOC & menus ---------------- */
  const GRC_MODS = [["m1", "Foundations"], ["m2", "Risk management"], ["m3", "ISO 27001"], ["m4", "SOC 1 and SOC 2"], ["m5", "Controls and testing"], ["m6", "Third-party risk"], ["m7", "India: DPDP and CERT-In"], ["m8", "OT and critical infrastructure"], ["m9", "Incidents and continuity"], ["m10", "Reporting and leading"]];
  function renderGrcToc(r) {
    const C = window.GRC_COURSE || [], open = (pages) => pages.includes(r.a || "") || window.innerWidth > 1000;
    const L = (href, ico, t, on) => `<li><a href="${href}" class="${on ? "active" : ""}"><span class="toc-num">${ico}</span>${t}</a></li>`;
    const done = C.reduce((n, m) => n + grcProg(m).d, 0), all = C.reduce((n, m) => n + m.lessons.length, 0) || 32;
    let h = `<div class="mob-nav"><a href="#/grc" class="${!r.a ? "active" : ""}">GRC home</a><a href="#/" class="mob-switch">Study CISSP</a>${App.isAdmin() ? `<a href="#/admin">Admin</a>` : ""}</div>`;
    h += `<details class="toc-group" ${grcMod(r.a) || window.innerWidth > 1000 ? "open" : ""}><summary class="toc-head">Course <small>${done} of ${all} lessons</small></summary><ol class="toc-list">`;
    GRC_MODS.forEach(([id, t], i) => { const m = grcMod(id), p = m ? grcProg(m) : { pct: 0 }, active = r.a === id;
      h += `<li><a href="#/grc/${id}" class="${active ? "active" : ""}"><span class="toc-dot" style="background:#b8892a;margin-top:7px"></span><span class="toc-name">${i + 1}. ${esc(t)}<small>${p.pct}% done</small></span></a>`;
      if (active && m) h += `<ol class="toc-sub">` + m.lessons.map((l, j) => `<li><a href="#/grc/${id}/${l.id}" class="${grcDone()[grcKey(id, l.id)] ? "read" : ""} ${r.b === l.id ? "active" : ""}">${i + 1}.${j + 1} ${esc(l.title)}</a></li>`).join("") + `</ol>`;
      h += `</li>`; });
    h += `</ol></details>`;
    h += `<details class="toc-group" ${["insights", "notes", "log", "shelf"].includes(r.a || "") || window.innerWidth > 1000 ? "open" : ""}><summary class="toc-head">You</summary><ol class="toc-list">${L("#/grc", "⌂", "GRC desk", !r.a)}${L("#/grc/insights", "◔", "Insights", r.a === "insights")}${L("#/grc/notes", "✎", "Notes", r.a === "notes")}${L("#/grc/log", "✗", "Mistakes log", r.a === "log")}${L("#/grc/shelf", "❏", "My shelf", r.a === "shelf")}${L("#/grc/favourites", "♥", "Favourites", r.a === "favourites")}</ol></details>`;
    const G = (title, keys, inner) => `<details class="toc-group" open><summary class="toc-head">${title}</summary>${inner}</details>`;
    const S = (t, items) => `<p class="toc-subhead">${t}</p><ol class="toc-list">${items}</ol>`;
    h += G("Learn", ["library", "reading", "briefings", "visuals", "glossary", "landscape"],
      S("Read", `${L("#/grc/library", "❏", "Library (46 documents)", r.a === "library")}${L("#/grc/briefings", "✦", "Briefings", r.a === "briefings")}${L("#/grc/reading", "❡", "Reading room", r.a === "reading")}`) +
      S("Understand", `${L("#/grc/landscape", "⚖", "Regulators and standards", r.a === "landscape")}${L("#/grc/visuals", "◇", "Diagrams", r.a === "visuals")}${L("#/grc/glossary", "Aa", "GRC glossary", r.a === "glossary")}`));
    h += G("Tools", ["controls", "map", "calendar", "vendors", "pbc", "spend", "budget"],
      S("Controls", `${L("#/grc/controls", "◇", "Control workbench", r.a === "controls")}${L("#/grc/map/iso", "⊞", "Framework map", r.a === "map")}${L("#/grc/calendar", "▦", "Evidence calendar", r.a === "calendar")}`) +
      S("Registers", `${L("#/grc/vendors", "⇄", "Vendor register", r.a === "vendors")}${L("#/grc/pbc", "☑", "PBC list", r.a === "pbc")}`) +
      S("For leaders", `${L("#/grc/budget", "₹", "Budget planner", r.a === "budget")}${L("#/grc/spend", "❖", "CEO and CFO guide", r.a === "spend")}`));
    h += G("Practise", ["labs", "setup", "guide", "rooms"], `<ol class="toc-list">${L("#/grc/rooms", "⏱", "Scenario rooms", r.a === "rooms")}${L("#/grc/labs", "◎", "Hands-on labs", r.a === "labs")}${L("#/grc/setup", "⚙", "Run CISO Assistant", r.a === "setup")}${L("#/grc/guide", "▤", "Field guide", r.a === "guide")}</ol>`);
    h += `<div class="toc-card"><b>${Math.round(done / all * 100)}%</b>of the GRC course · ${done} of ${all} lessons<div class="meter" style="margin-top:10px"><i style="width:${Math.round(done / all * 100)}%;background:#b8892a"></i></div></div>`;
    toc.innerHTML = h;
  }
  function renderToc(r) {
    if (App.inGrc(r)) return renderGrcToc(r);
    const all = allProgress();
    const order = D;
    let h = `<div class="mob-nav"><a href="#/" class="${r.page === "home" ? "active" : ""}">Home</a>${App.isPrivileged() ? `<a href="#/grc" class="${r.page === "grc" ? "active" : ""}">Learn GRC</a>` : ""}${App.isAdmin() ? `<a href="#/admin">Admin</a>` : ""}</div>`;
    const inGroup = (pages) => pages.includes(r.page);
    const onChapters = r.page === "domain" || r.page === "read";
    h += `<details class="toc-group" ${onChapters || window.innerWidth > 1000 ? "open" : ""}><summary class="toc-head">Chapters <small>${all.pct}% read</small></summary><ol class="toc-list">`;
    order.forEach(d => {
      const p = domProgress(d);
      const active = r.page === "domain" && r.a === d.id;
      h += `<li><a href="#/domain/${d.id}" class="${active ? "active" : ""}" style="${dc(d)}">
        <span class="toc-dot" style="background:var(--${d.id})"></span><span class="toc-name">D${d.n} ${esc(d.short)}<small><span class="toc-prio ${prio(d)}">${prioLabel[prio(d)]}</span> · ${p.pct}% read</small></span></a>`;
      if (active) h += `<ol class="toc-sub">` + d.sections.map((s, i) => `<li><a href="#/domain/${d.id}/${s.id}" data-sec="${s.id}" class="${S.read[d.id + ":" + s.id] ? "read" : ""}">${d.n}.${i + 1} ${esc(s.title)}</a></li>`).join("") + `</ol>`;
      h += `</li>`;
    });
    const L = (k, ico, t) => `<li><a href="#/${k}" class="${r.page === k ? "active" : ""}"><span class="toc-num">${ico}</span>${t}</a></li>`;
    const G = (title, pages, body) => `<details class="toc-group" ${inGroup(pages) || window.innerWidth > 1000 ? "open" : ""}><summary class="toc-head">${title}</summary><ol class="toc-list">${body}</ol></details>`;
    h += `</ol></details>`
      + G("Learn more", ["glossary", "revision", "latest", "resources"], L("glossary", "Aa", "Glossary A-Z") + L("revision", "☰", "Revision sheets") + L("latest", "✦", "What’s new, 2024-2026") + L("resources", "§", "Resources"))
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

  function footer(r) {
    const cs = r ? App.course(r) : null, y = new Date().getFullYear();
    const brand = (sub) => `<a class="foot-brand" href="${cs === "grc" ? "#/grc" : cs === "cissp" ? "#/" : "#/choose"}"><b>LearN<span>time</span></b><small>${sub}</small></a>`;
    const L = (h, t) => `<a href="${h}">${t}</a>`;
    let top, legal;
    if (cs === "grc") {
      top = `${brand(`<span class="bb">Learn GRC</span> · governance, risk, compliance`)}
        <nav class="foot-cols" aria-label="Learn GRC footer">
          <div><h4>The course</h4>${L("#/grc", "GRC desk")}${L("#/grc/m1", "Ten modules")}${L("#/grc/rooms", "Scenario rooms")}${L("#/grc/labs", "Hands-on labs")}</div>
          <div><h4>Reference</h4>${L("#/grc/library", "Library")}${L("#/grc/landscape", "Regulators and standards")}${L("#/grc/glossary", "GRC glossary")}${L("#/grc/briefings", "Briefings")}</div>
          <div><h4>Tools</h4>${L("#/grc/controls", "Control workbench")}${L("#/grc/vendors", "Vendor register")}${L("#/grc/budget", "Budget planner")}${L("#/grc/spend", "CEO and CFO guide")}</div>
          <div><h4>LearNtime</h4>${L("#/", "CISSP course")}${L("#/contact", "Contact")}${L("#/terms", "Terms")}${L("#/privacy", "Privacy &amp; trust")}</div></nav>`;
      legal = `© ${y} LearNtime. Learn GRC is study material, not legal advice; check the official texts of laws and regulations before relying on them. ISO/IEC 27001 is published by ISO and IEC; SOC 2 is an AICPA framework; MITRE ATT&amp;CK® is a registered trademark of The MITRE Corporation. Third-party material is credited under its licence.`;
    } else if (cs === "cissp") {
      top = `${brand(`<span class="bb">CISSP course</span> · read slowly, pass once`)}
        <nav class="foot-cols" aria-label="CISSP footer">
          <div><h4>The course</h4>${L("#/", "Study desk")}${L("#/read", "Eight chapters")}${L("#/plan", "Your plan")}${L("#/mock", "Mock exam")}</div>
          <div><h4>Practise</h4>${L("#/quiz", "Quizzes")}${L("#/flashcards", "Flashcards")}${L("#/glossary", "CISSP glossary")}${L("#/revision", "Revision sheets")}</div>
          <div><h4>The exam</h4>${L("#/about", "About the CISSP")}${L("#/about/domains", "The eight domains")}${L("#/about/pathway", "Path to certification")}${L("#/faq", "FAQ")}</div>
          <div><h4>LearNtime</h4>${App.isPrivileged() ? L("#/grc", "Learn GRC course") : ""}${L("#/contact", "Contact")}${L("#/terms", "Terms")}${L("#/privacy", "Privacy &amp; trust")}</div></nav>`;
      legal = `© ${y} LearNtime. The CISSP course is independent study material, not affiliated with or endorsed by ISC2. CISSP® is a registered mark of ISC2, Inc.`;
    } else {
      top = `${brand("learn anytime, as often as you need")}
        <nav class="foot-cols" aria-label="Footer">
          <div><h4>Courses</h4>${L("#/", "CISSP course")}${App.isPrivileged() ? L("#/grc", "Learn GRC") : ""}</div>
          <div><h4>Your account</h4>${L("#/profile", "Profile")}${L("#/privacy", "Privacy &amp; my data")}${L("#/plans", "Plans")}</div>
          <div><h4>LearNtime</h4>${L("#/contact", "Contact")}${L("#/terms", "Terms")}${L("#/faq", "FAQ")}</div></nav>`;
      legal = `© ${y} LearNtime. Independent study material. CISSP® is a registered mark of ISC2, Inc.; LearNtime is not affiliated with ISC2.`;
    }
    return `<footer class="foot foot-${cs || "site"}">
      <div class="foot-top">${top}</div>
      <p class="foot-legal">${legal}</p>
    </footer>
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
          ${(() => { const d = cont.d, cur = (S.last && S.last.d === d.id && S.last.s) || (nx && nx.d === d ? nx.s.id : null), at = Math.max(0, d.sections.findIndex(x => x.id === cur));
            const up = d.sections.slice(at + 1).filter(x => !S.read[d.id + ":" + x.id]).slice(0, 3);
            return up.length ? `<div class="dc-next"><span class="dc-next-k">Then</span>${up.map(x => `<span class="dc-next-i"><b>${d.n}.${d.sections.indexOf(x) + 1}</b> ${esc(x.title)}</span>`).join("")}</div>` : ""; })()}
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

      ${App.reviewCard(false)}
      ${readinessCard()}
      ${challengeCard()}
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
        <summary>How LearNtime works <small>(what each part is for)</small></summary>
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
      <p class="sub">Domains 1 to 8. The tag on each shows its priority for you: <b>Focus</b>, <b>Build</b> or <b>Strength</b>. Change it in <a href="#/plan">Plan settings</a>.</p>
      <div class="shelf">${D.map(bookCard).join("")}</div>
    </div>`;
  }

  function viewChapters() {
    return `<div class="page">
      <div class="kicker">Contents</div>
      <h1 class="h-display">The eight <em>chapters</em></h1>
      <p class="lede">Each chapter opens with a short essay, then walks through every objective of its domain. Callouts mark what the exam tests, the manager’s view, memory hooks, common traps and what changed between 2024 and 2026. Listed 1 to 8, each tagged with its priority for you (Focus, Build or Strength).</p>
      <div class="shelf" style="margin-top:34px">${D.map(bookCard).join("")}</div>
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
        <div class="btn-row"><a class="start-btn" href="#/domain/${d.id}/${start.id}"><span><small>${firstUnread && p.r ? "Continue at" : "Start reading"}</small><b>${d.n}.${si + 1} ${esc(start.title)}</b></span><span class="start-arrow" aria-hidden="true">→</span></a>${p.pct === 100 ? `<a class="btn" href="#/domain/${d.id}/memorise">★ Memorise &amp; practice</a>` : ""}</div>
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
  /* ---------- Easy / Normal / Hard: rate a page, and it comes back for review ---------- */
  const DIFF = { hard: ["Hard", 2], normal: ["Normal", 7], easy: ["Easy", 21] };
  App.diffBar = (k) => { const v = ((S.diff || {})[k] || {}).v;
    return `<div class="diff-bar" data-diffk="${esc(k)}"><span class="diff-q">How did this page feel?</span><div class="diff-btns" role="group" aria-label="How did this page feel?">${["easy", "normal", "hard"].map(id => `<button class="diff ${id} ${v === id ? "on" : ""}" data-diff="${id}" aria-pressed="${v === id}"><b>${DIFF[id][0]}</b><small>back in ${DIFF[id][1]} days</small></button>`).join("")}</div></div>`; };
  const diffItem = (k, o) => {
    let t = null, h = null;
    if (k.startsWith("grcb:")) { const b = (window.GRC_BRIEFINGS || []).find(x => x.id === k.slice(5)); if (b) { t = "Briefing: " + b.t; h = "#/grc/briefings/" + b.id; } }
    else if (k.startsWith("grc:")) { const [, mi, li] = k.split(":"), m = grcMod(mi), l = m && m.lessons.find(x => x.id === li); if (l) { t = `${m.n}.${m.lessons.indexOf(l) + 1} ${l.title}`; h = `#/grc/${mi}/${li}`; } }
    else { const [di, si] = k.split(":"), d = byId[di], s = d && d.sections.find(x => x.id === si); if (s) { t = `${d.n}.${d.sections.indexOf(s) + 1} ${s.title}`; h = `#/domain/${di}/${si}`; } }
    if (!t) return null;
    const due = ymd(addDays(parseD(o.at), DIFF[o.v][1]));
    return { k, v: o.v, t, h, due, isDue: due <= ymd(today()) };
  };
  App.reviewCard = (grc) => {
    const all = Object.entries(S.diff || {}).filter(([k, o]) => o && DIFF[o.v] && k.startsWith("grc") === !!grc).map(([k, o]) => diffItem(k, o)).filter(Boolean);
    const by = { hard: [], normal: [], easy: [] }; all.forEach(x => by[x.v].push(x));
    Object.values(by).forEach(a => a.sort((x, y) => (y.isDue - x.isDue) || (x.due < y.due ? -1 : 1)));
    const first = ["hard", "normal", "easy"].find(v => by[v].length) || "hard", dueN = all.filter(x => x.isDue).length;
    return `<section class="card rev-card" aria-label="Pages to revisit">
      <div class="rev-top"><div><span class="kicker">Revisit</span><h3>${dueN ? `${dueN} page${dueN > 1 ? "s" : ""} due for review` : all.length ? "Nothing due today" : "Rate pages as you read"}</h3></div>
        <div class="seg-tabs rev-tabs" role="tablist" aria-label="Difficulty">${["hard", "normal", "easy"].map(v => `<button role="tab" class="${v === first ? "on" : ""}" aria-selected="${v === first}" data-revtab="${v}">${DIFF[v][0]} <small>${by[v].length}</small></button>`).join("")}</div></div>
      ${all.length ? ["hard", "normal", "easy"].map(v => `<div class="rev-list" role="tabpanel" data-revpanel="${v}" ${v === first ? "" : "hidden"}>${by[v].length ? by[v].slice(0, 8).map(x => `<a class="rev-item" href="${x.h}"><span>${esc(x.t)}</span><small class="${x.isDue ? "due" : ""}">${x.isDue ? "Due now" : "Next " + fmtD(x.due)}</small></a>`).join("") + (by[v].length > 8 ? `<p class="hint">and ${by[v].length - 8} more</p>` : "") : `<p class="hint">No pages marked ${DIFF[v][0].toLowerCase()} yet.</p>`}</div>`).join("")
        : `<p class="hint" style="margin:0">At the end of every ${grc ? "lesson" : "page"}, tap <b>Easy</b>, <b>Normal</b> or <b>Hard</b>. Hard pages come back in 2 days, normal in 7, easy in 21, and they are listed here so you know what to reread first.</p>`}
    </section>`;
  };
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest("[data-diff]");
    if (b) { const bar = b.closest("[data-diffk]"), k = bar.dataset.diffk, v = b.dataset.diff; S.diff = S.diff || {};
      S.diff[k] = { v, at: ymd(today()) }; save();
      bar.querySelectorAll("[data-diff]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      toast(`Marked ${DIFF[v][0].toLowerCase()}. It comes back for review on ${fmtD(ymd(addDays(today(), DIFF[v][1])))}.`); return; }
    const t = ev.target.closest && ev.target.closest("[data-revtab]");
    if (t) { const card = t.closest(".rev-card"); card.querySelectorAll("[data-revtab]").forEach(x => { x.classList.toggle("on", x === t); x.setAttribute("aria-selected", String(x === t)); });
      card.querySelectorAll("[data-revpanel]").forEach(p => { p.hidden = p.dataset.revpanel !== t.dataset.revtab; }); }
  });
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
      ${App.diffBar(k)}
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
  // prose at ~200 words a minute, plus time to study each table and diagram
  const secMins = s => { const b = String(s.body); return Math.max(2, Math.round(b.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200 + (b.match(/<table/g) || []).length * 1.5 + (b.match(/data-anim=/g) || []).length)); };
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
    const box = $("#qc"); box.outerHTML = quickCheck(d, s); bindQuickCheck(); App.linkAbbr($("#qc"), "cissp");
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

  /* revision sheets: the exam focus of every section, the memorise list and the formulas, one domain per sheet */
  let revDom = "all";
  function viewRevision() {
    const doms = revDom === "all" ? D : D.filter(d => d.id === revDom);
    const formulas = d => d.sections.flatMap(s => [...String(s.body).matchAll(/<div class="formula">([\s\S]*?)<\/div>/g)].map(m => m[1]));
    return `<div class="page-narrow rev">
      <div class="kicker no-print">Revision sheets</div>
      <h1 class="h-display">The last-week <em>sheets</em></h1>
      <p class="lede no-print">One page per domain: what the exam tests in every section, what to memorise, and the formulas. Read one a day in the final week, or print them.</p>
      <div class="filters no-print"><button class="chip ${revDom === "all" ? "on" : ""}" data-rv="all">All eight</button>${D.map(d => `<button class="chip ${revDom === d.id ? "on" : ""}" data-rv="${d.id}" style="${dc(d)}"><i></i>D${d.n}</button>`).join("")}
        <button class="btn small" id="revPrint" style="margin-left:auto">Print or save as PDF</button></div>
      ${doms.map(d => { const fx = formulas(d), p = prio(d);
        return `<section class="rev-sheet" style="${dc(d)}">
          <header class="rev-head"><span class="kicker" style="--kc:var(--dc)">Domain ${pad(d.n)} · ${d.weight}% of the exam</span><h2>${esc(d.title)}</h2><span class="tag ${p}">${prioLabel[p]}</span></header>
          <div class="rev-cols">
            <div><h3>What the exam tests</h3><ol class="rev-list">${d.sections.map((s, i) => s.exam ? `<li><a href="#/domain/${d.id}/${s.id}"><b>${d.n}.${i + 1} ${esc(s.title)}</b></a><span>${esc(s.exam)}</span></li>` : "").join("")}</ol></div>
            <div><h3>Memorise</h3><ul class="rev-mem">${d.memorise.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
              ${fx.length ? `<h3>Formulas</h3>${fx.map(f => `<div class="formula">${f}</div>`).join("")}` : ""}
              <p class="rev-more no-print"><a href="#/flashcards/${d.id}">Flashcards</a> · <a href="#/quiz/run/domain/${d.id}">Domain quiz</a> · <a href="#/glossary/${d.id}">Glossary</a></p></div>
          </div>
        </section>`; }).join("")}
    </div>`;
  }
  function bindRevision() {
    $$("[data-rv]").forEach(b => b.addEventListener("click", () => { revDom = b.dataset.rv; App.rerender(); }));
    $("#revPrint").addEventListener("click", () => { db.logEvent("user.revision_print", { domain: revDom }); print(); });
  }

  /* my notes: every note and saved page, grouped by chapter, exportable */
  let notesFilter = "all";
  function viewNotes() {
    const N = S.notes || {}, M = S.marks || {};
    const keys = [...new Set(Object.keys(N).concat(Object.keys(M)))].filter(k => { const [d, s] = k.split(":"); return byId[d] && byId[d].sections.some(x => x.id === s); });
    const shown = keys.filter(k => notesFilter === "all" || (notesFilter === "notes" ? N[k] : M[k]));
    const byDom = D.map(d => ({ d, items: d.sections.map((s, i) => ({ s, i, k: d.id + ":" + s.id })).filter(x => shown.includes(x.k)) })).filter(g => g.items.length);
    return `<div class="page-narrow">
      <div class="kicker">My notes</div>${App.branchTabs("cissp", "#/notes", "#/grc/notes")}
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
      const N = S.notes || {}; let out = "LearNtime - my notes\n" + new Date().toLocaleDateString("en-GB") + "\n";
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
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LearNtime//Study times//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
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
      <div class="kicker">Tracker</div>${App.branchTabs("cissp", "#/tracker", "#/grc/log")}
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
      <section class="mybooks" id="myBooks" aria-label="Your own PDFs">
        <div class="kicker">Your shelf · private</div><h2 class="h-section" style="margin:4px 0 4px">Your own books and PDFs</h2>
        <p class="sub" style="margin:0">PDFs you own, such as your copy of the Sybex Official Study Guide, read right here beside the ISC2 guide. They are stored in your private space: only your account can open them.</p>
        <div class="mybooks-list" id="myBooksList"><p class="hint">${db.mode === "cloud" ? "Loading your shelf…" : "Sign in to keep your own PDFs here."}</p></div>
        ${db.mode === "cloud" ? `<label class="mybooks-add"><input type="file" id="myBookFile" accept="application/pdf,.pdf" hidden><span class="btn small primary">+ Add a PDF you own</span><small>Up to 20 MB each. Upload only files you have the right to use.</small></label>` : ""}
      </section>
      ${P.resources.map(g => `<h2 class="h-section">${esc(g.group)}</h2>${g.items.map(r => `<div class="res"><div class="res-ico">${r.ico}</div><div><h4><a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t)} ↗</a></h4><p>${esc(r.d)}</p><div class="tags">${r.tags.map(t => `<span class="tag plain">${esc(t)}</span>`).join("")}</div></div></div>`).join("")}`).join("")}
      <div id="privateBlock"></div>
    </div>`;
  }

  /* ---------------- plans: banner, locked, landing ---------------- */
  function planBanner() {
    const p = App.profile; if (db.mode !== "cloud" || !p || !p.plan_expires_at || App.isAdmin() || App.isPrivileged()) return "";
    const left = Math.ceil((new Date(p.plan_expires_at) - new Date()) / 864e5), pl = App.planById(p.plan);
    if (left < 0) return `<a class="warnbox banner" href="#/plans">Your free access ended on ${fmtDY(p.plan_expires_at)}. Chapters and the glossary stay open. Continue ${esc(pl.name)}${+pl.price ? " for " + App.money(+pl.price, pl.currency) + " a year" : ""}: ask your administrator →</a>`;
    if (left <= 30) return `<a class="okbox banner" href="#/">${left} day${left === 1 ? "" : "s"} left to finish the challenge and keep ${esc(pl.name)} free →</a>`;
    return "";
  }
  function lockedView(feat) {
    const name = (P.modules || {})[feat] || feat;
    const which = App.plans.filter(p => (p.modules || []).includes(feat)).map(p => p.name);
    const expired = App.planExpired();
    return `<div class="page">
      <div class="kicker">${expired ? "Free access ended" : "Upgrade"}</div>
      <h1 class="h-display">${esc(name)} is <em>${expired ? "paused" : "waiting for you"}</em></h1>
      <p class="lede">${expired ? `Your free ${esc(App.planById(App.profile.plan).name)} access has ended. Chapters and the glossary stay open; ask your administrator to continue your plan.` : `${esc(name)} is part of ${which.join(" and ")}. Your current plan is ${esc(App.planById(App.profile.plan).name)}. Every plan is free when you finish the course in 90 days.`}</p>
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
      <h1 class="h-display">Finish in 90 days. <em>Pay nothing.</em></h1>
      ${db.mode === "cloud" && p.plan ? `<p class="lede">You’re on <b>${esc(pl.name)}</b>${p.plan_expires_at ? `, free until <b>${fmtDY(p.plan_expires_at)}</b>. Finish the 90-day challenge and it stays free` : ""}.</p>` : `<p class="lede">Pick the depth that suits you. You can move up at any time.</p>`}
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
      <section class="trust-strip"><span>✓ Written to the official 2024 exam outline</span><span>✓ Free when you finish in 90 days</span><span>✓ Works on phone, tablet and laptop</span><span>✓ Your data, your control</span></section>
      <section class="facts">${P.exam.facts.map(f => `<div class="fact"><b>${esc(f.big)}</b><span>${esc(f.label)}</span></div>`).join("")}</section>
      ${App.challengeBlock()}
      <h2 class="h-section">Inside: the eight chapters</h2>
      <p class="sub">Every objective of the official exam outline, explained in plain language with the manager’s lens the exam rewards.</p>
      <div class="shelf">${order.map(d => `<a class="book" href="#/signup/silver" style="${dc(d)}"><div style="display:flex;justify-content:space-between"><span class="book-num">${roman[d.n]}</span><span class="tag plain">🔒 sign in</span></div><div class="book-title">${esc(d.title)}</div><div class="book-meta">${d.weight}% of exam · ${d.sections.length} sections</div><p class="land-lede">${esc(d.lede)}</p></a>`).join("")}</div>
      <h2 class="h-section">What you get</h2>
      <p class="sub">Three plans. Each is free when you finish the course in 90 days. Sign in to see your plan, your path and your progress.</p>
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
    if (r.a === "q" && r.b) { gq = decodeURIComponent(r.b); history.replaceState(null, "", "#/glossary"); }
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
      <p class="lede">Pick a course, or manage the site.</p>
      <div class="grid-2" style="margin-top:26px">
        <button class="card focus choose" data-mode="study"><span class="kicker">Course</span><h3>CISSP</h3><p>Prepare for the CISSP exam: your plan, eight chapters, quizzes, flashcards and mock exams.</p></button>
        ${App.isPrivileged() ? `<button class="card focus choose" data-mode="grc" style="--dc:var(--gold-ink)"><span class="kicker" style="--kc:var(--gold-ink)">Course</span><h3>Learn GRC</h3><p>Governance, risk and compliance for a GRC Manager role: ten modules, scenario rooms, tools and the field guide.</p></button>` : ""}
        <button class="card focus choose" data-mode="admin" style="--dc:var(--d7)"><span class="kicker" style="--kc:var(--d7)">Site</span><h3>Admin console</h3><p>Learner analytics, audit trail, privacy requests and accounts.</p></button>
      </div>
      <p class="hint" style="text-align:center;margin-top:18px">You can switch any time from the menu under your initial.</p></div>`;
  }
  function bindChoose() {
    $$(".choose").forEach(b => b.addEventListener("click", () => {
      App.sessionSet("cissp.mode", b.dataset.mode);
      location.hash = b.dataset.mode === "admin" ? "#/admin" : b.dataset.mode === "grc" ? "#/grc" : "#/";
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

  async function loadMyBooks() {
    const box = $("#myBooksList"); if (!box || db.mode !== "cloud") return;
    let list = []; try { list = (await db.resources()).filter(r => r.kind === "file" && /\.pdf$/i.test(r.storage_path || "")); } catch (e) { box.innerHTML = `<p class="hint">${esc(App.errMsg ? App.errMsg(e) : "Couldn’t load your shelf.")}</p>`; return; }
    if (!list.length) { box.innerHTML = `<div class="mybooks-empty"><b>Your shelf is empty.</b> Add the PDFs you own, for example the three parts of the Official Study Guide, and they will appear here.</div>`; return; }
    box.innerHTML = list.map(r => `<div class="mybook" data-path="${esc(r.storage_path)}">
        <div class="pdf-cover small"><small>PDF</small><b>${esc(r.title)}</b></div>
        <div class="mybook-body"><h4>${esc(r.title)}</h4><p class="hint" style="margin:2px 0 10px">Added ${fmtDY(r.created_at)}</p>
          <div class="btn-row"><button class="btn small primary" data-read>Read here</button><button class="btn small" data-open>Open in a new tab</button></div></div>
        <div class="mybook-view" hidden></div></div>`).join("");
    $$(".mybook", box).forEach(el => {
      const path = el.dataset.path, view = el.querySelector(".mybook-view");
      el.querySelector("[data-open]").addEventListener("click", async () => { const w = window.open("", "_blank"); try { const u = await db.fileUrl(path, 3600); if (w) w.location = u; else location.href = u; } catch (e) { if (w) w.close(); toast(App.errMsg(e)); } });
      el.querySelector("[data-read]").addEventListener("click", async (e) => {
        if (!view.hidden) { view.hidden = true; view.innerHTML = ""; e.target.textContent = "Read here"; return; }
        if (matchMedia("(pointer: coarse)").matches) { el.querySelector("[data-open]").click(); return; }   // phones show PDFs in their own viewer
        try { const u = await db.fileUrl(path, 3600); view.innerHTML = `<iframe src="${esc(u)}#view=FitH" title="${esc(el.querySelector("h4").textContent)}"></iframe>`; view.hidden = false; e.target.textContent = "Close the reader"; view.scrollIntoView({ block: "start", behavior: "smooth" }); db.logEvent("user.book_opened", {}); }
        catch (err) { toast(App.errMsg(err)); }
      });
    });
  }
  async function bindResources() {
    loadMyBooks();
    const f = $("#myBookFile"); if (f) f.addEventListener("change", async () => {
      const file = f.files[0]; if (!file) return;
      if (!/\.pdf$/i.test(file.name)) { toast("Choose a PDF file"); f.value = ""; return; }
      if (file.size > 20 * 1024 * 1024) { toast("That file is over 20 MB"); f.value = ""; return; }
      const title = file.name.replace(/\.pdf$/i, "").replace(/\s*\(Z-Library\)/i, "").replace(/_+/g, " ").slice(0, 120);
      const lbl = $(".mybooks-add .btn"); lbl.textContent = "Uploading…";
      try { await db.addResource({ title, kind: "file", domain: null, note: "Added from the Resources shelf" }, file); toast("Added to your shelf"); await loadMyBooks(); }
      catch (e) { toast(App.errMsg(e)); }
      lbl.textContent = "+ Add a PDF you own"; f.value = "";
    });
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

  App.register("home", { render: viewHome, bind: bindChallenge, area: "other", nav: "home" });
  App.register("read", { render: viewChapters, title: "Chapters", nav: "read", area: "read" });
  App.register("domain", { render: viewDomain, bind: bindDomain, nav: "read", area: "read", title: r => byId[r.a] ? `D${byId[r.a].n} ${byId[r.a].title}` : "Chapter" });
  App.register("plan", { render: viewPlan, title: "Study plan", nav: "plan", area: "plan", bind: (r) => {
    $("#restartPlan").addEventListener("click", () => { if (confirm("Redraw the plan starting today? Ticked tasks stay ticked.")) { S.planStart = ymd(today()); save(); App.rerender(); } });
    bindPlanSettings();
    bindSchedule();
    if (r.a === "schedule") { const el = $("#schedule"); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); }
  } });
  /* ===== Common control framework: workbench, framework map, evidence calendar ===== */
  const FWS = [["iso", "ISO 27001:2022"], ["soc", "SOC 2"], ["csf", "NIST CSF 2.0"], ["india", "India: DPDP & CERT-In"], ["iec", "IEC 62443 (OT)"]];
  const fwList = fw => fw === "iso" ? (window.ISO_2022 || []).map(x => [x.id, x.name]) : ((window.GRC_FW || {})[fw === "soc" ? "soc2" : fw] || []);
  const isoById = () => { const m = {}; (window.ISO_2022 || []).forEach(x => { m[x.id] = x; }); return m; };
  const ctrls = () => window.GRC_CONTROLS || [];
  const ctrlNew = c => { const I = isoById(); return c.iso.some(i => I[i] && I[i].new); };
  const GT = () => (S.grcTests = S.grcTests || {});
  const RATE = { pass: "Pass", partial: "Partial", fail: "Fail", na: "Not applicable" };
  const overall = c => { const t = GT()[c.id]; if (!t || !t.s) return "Not tested";
    const v = c.risks.map((_, i) => t.s[i]).filter(x => x && x !== "na");
    if (!v.length) return "Not tested"; if (v.includes("fail")) return "Ineffective";
    if (v.includes("partial")) return "Partially effective";
    return v.length === c.risks.filter((_, i) => t.s[i] !== "na").length ? "Effective" : "In progress"; };
  const rateCls = r => ({ "Effective": "strong", "Partially effective": "medium", "Ineffective": "weak", "In progress": "plain", "Not tested": "plain" })[r];
  let CF = { dom: "", owner: "", scope: "", freq: "", fw: "", rating: "", q: "", newOnly: false };
  function grcControls(id) {
    const C = ctrls(); if (!C.length) return "";
    const c = id && C.find(x => x.id === decodeURIComponent(id)); if (c) return grcControl(c);
    const doms = [...new Set(C.map(x => x.dom))], owners = [...new Set(C.map(x => x.owner))].sort(), scopes = [...new Set(C.flatMap(x => x.scope.split(", ")))], freqs = [...new Set(C.map(x => x.freq))];
    const ratings = C.map(overall), count = r => ratings.filter(x => x === r).length;
    const list = C.filter(x => (!CF.dom || x.dom === CF.dom) && (!CF.owner || x.owner === CF.owner) && (!CF.scope || x.scope.includes(CF.scope)) && (!CF.freq || x.freq === CF.freq)
      && (!CF.fw || x[CF.fw].length) && (!CF.newOnly || ctrlNew(x)) && (!CF.rating || overall(x) === CF.rating)
      && (!CF.q || (x.id + " " + x.title + " " + x.desc + " " + x.iso.join(" ") + " " + x.soc.join(" ") + " " + x.csf.join(" ")).toLowerCase().includes(CF.q.toLowerCase())));
    const sel = (k, label, opts) => `<label class="cf-sel">${label}<select data-cf="${k}"><option value="">All</option>${opts.map(o => `<option value="${esc(o[0])}" ${CF[k] === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select></label>`;
    return `<div class="page grc-ccf">
      <a class="kicker" href="#/grc">← Learn GRC · Controls</a>
      <h1 class="h-display">Control <em>workbench</em></h1>
      <p class="what-is"><b>In plain words:</b> the list of controls the company runs, who owns each, what evidence it leaves and whether it passed its test. It answers "are our controls actually working?" <a href="#/grc/spend">More for leaders</a></p>
      <p class="lede">One common set of controls for a managed SOC and critical-infrastructure provider. Each control meets requirements in several frameworks at once. Open a control to see what can go wrong, test each scenario and give it a rating. Your ratings are saved.</p>
      <div class="cf-stats">
        <div><b>${doms.length}</b><span>categories</span></div><div><b>${owners.length}</b><span>departments</span></div><div><b>${scopes.length}</b><span>scopes</span></div>
        <div><b>${C.length}</b><span>controls</span></div><div><b>${C.reduce((n, x) => n + x.risks.length, 0)}</b><span>test scenarios</span></div>
        <div class="cf-rated"><b>${C.length - count("Not tested")}</b><span>tested · <i class="ok">${count("Effective")} effective</i> · <i class="mid">${count("Partially effective")} partial</i> · <i class="bad">${count("Ineffective")} ineffective</i></span></div>
      </div>
      <div class="btn-row"><a class="btn small" href="#/grc/map/iso">Framework map</a><a class="btn small" href="#/grc/calendar">Evidence calendar</a><button class="btn small ghost" id="cfExport">Download test workpaper</button></div>
      <div class="filters cf-chips"><button class="chip ${!CF.dom ? "on" : ""}" data-cfdom="">All categories</button>${doms.map(d => `<button class="chip ${CF.dom === d ? "on" : ""}" data-cfdom="${esc(d)}">${esc(d)}</button>`).join("")}</div>
      <div class="cf-bar">
        ${sel("owner", "Department", owners.map(o => [o, o]))}${sel("scope", "Scope", scopes.map(o => [o, o]))}${sel("freq", "Frequency", freqs.map(o => [o, o]))}
        ${sel("fw", "Framework", FWS)}${sel("rating", "Rating", ["Not tested", "In progress", "Effective", "Partially effective", "Ineffective"].map(o => [o, o]))}
        <label class="check cf-new"><input type="checkbox" id="cfNew" ${CF.newOnly ? "checked" : ""}><span>Only controls using <b>new ISO 2022</b> controls</span></label>
        <input class="grc-libq" id="cfQ" type="search" placeholder="Search controls, e.g. backup, CC6.3, 5.23" value="${esc(CF.q)}" aria-label="Search controls">
      </div>
      <p class="sub">${list.length} of ${C.length} controls</p>
      <div class="cf-grid">${list.map(x => { const r = overall(x); return `<a class="cf-card" href="#/grc/controls/${x.id}">
        <div class="cf-top"><span class="cf-id">${x.id}</span>${ctrlNew(x) ? `<span class="tag new">New control</span>` : ""}<span class="tag ${rateCls(r)}">${r}</span></div>
        <b>${esc(x.title)}</b>
        <small>${esc(x.dom)} · ${esc(x.owner)} · ${esc(x.freq)} · ${esc(x.type)}</small>
        <span class="cf-maps">${x.iso.length ? `ISO ${x.iso.length}` : ""}${x.soc.length ? ` · SOC 2 ${x.soc.length}` : ""}${x.csf.length ? ` · CSF ${x.csf.length}` : ""}${x.india.length ? ` · India ${x.india.length}` : ""}${x.iec.length ? ` · IEC ${x.iec.length}` : ""}</span></a>`; }).join("") || `<p class="sub">No controls match these filters.</p>`}</div>
    </div>`;
  }
  function grcControl(c) {
    const t = GT()[c.id] || { s: {} }, r = overall(c), I = isoById(), C = ctrls(), at = C.indexOf(c);
    const names = fw => { const m = {}; fwList(fw).forEach(x => { m[x[0]] = x[1]; }); return m; };
    const maps = FWS.map(([k, label]) => { const ids = c[k]; if (!ids.length) return ""; const n = names(k);
      return `<div class="cc-fw"><h4>${label}</h4><ul>${ids.map(i => `<li><a href="#/grc/map/${k}/${encodeURIComponent(i)}"><b>${esc(i)}</b> ${esc(k === "iso" && I[i] ? I[i].name : n[i] || "")}</a>${k === "iso" && I[i] && I[i].new ? ` <span class="tag new">New control</span>` : ""}</li>`).join("")}</ul></div>`; }).join("");
    return `<article class="page-narrow grc-cc">
      <a class="kicker" href="#/grc/controls">← Control workbench</a>
      <div class="cc-head"><span class="cf-id big">${c.id}</span>${ctrlNew(c) ? `<span class="tag new">New control</span>` : ""}<span class="tag ${rateCls(r)}" id="ccRating">${r}</span></div>
      <h1 class="h-display" style="margin-top:6px">${esc(c.title)}</h1>
      <dl class="cc-card">
        <div><dt>Control ID</dt><dd>${c.id}</dd></div><div><dt>Category</dt><dd>${esc(c.dom)}</dd></div><div><dt>Type</dt><dd>${esc(c.type)}</dd></div>
        <div><dt>Owner</dt><dd>${esc(c.owner)}</dd></div><div><dt>Frequency</dt><dd>${esc(c.freq)}</dd></div><div><dt>Scope</dt><dd>${esc(c.scope)}</dd></div>
        <div class="wide"><dt>Description</dt><dd>${esc(c.desc)}</dd></div>
        <div class="wide"><dt>Evidence</dt><dd>${esc(c.evidence)}</dd></div>
        <div class="wide"><dt>Test of design</dt><dd>${esc(c.tod)}</dd></div>
        <div class="wide"><dt>Test of operating effectiveness</dt><dd>${esc(c.toe)}</dd></div>
      </dl>
      <h2 class="h-section">What can go wrong, and how to test it</h2>
      <p class="sub">Run each test, then rate it. The control's overall rating follows: any fail makes it Ineffective; any partial makes it Partially effective; all passes make it Effective.</p>
      <div class="cc-tests">${c.risks.map(([w, how], i) => `<div class="cc-test"><div class="cc-test-n">${i + 1}</div><div>
        <p class="cc-wrong"><b>What can go wrong:</b> ${esc(w)}</p><p class="cc-how"><b>Test:</b> ${esc(how)}</p>
        <div class="cc-rate" role="radiogroup" aria-label="Result for scenario ${i + 1}">${Object.entries(RATE).map(([k, l]) => `<button type="button" class="chip ${t.s[i] === k ? "on r-" + k : ""}" data-rate="${i}:${k}" role="radio" aria-checked="${t.s[i] === k}">${l}</button>`).join("")}</div></div></div>`).join("")}</div>
      <label class="cc-note">Test notes, sample used and evidence references<textarea id="ccNote" maxlength="2000" placeholder="e.g. Sampled 25 leavers from HR export dated 30 Sep; 2 removed after 3 days (tickets 4412, 4419).">${esc(t.note || "")}</textarea></label>
      <p class="hint" id="ccSaved">${t.at ? "Last rated " + fmtDY(t.at) : "Not rated yet"}</p>
      <h2 class="h-section">Meets these requirements</h2>
      <p class="sub">One control, tested once, gives evidence for all of these.</p>
      <div class="cc-maps">${maps}</div>
      <div class="sec-pager">${at > 0 ? `<a href="#/grc/controls/${C[at - 1].id}">← ${C[at - 1].id} ${esc(C[at - 1].title)}</a>` : `<a href="#/grc/controls">← All controls</a>`}${C[at + 1] ? `<a class="skip" href="#/grc/controls/${C[at + 1].id}">${C[at + 1].id} ${esc(C[at + 1].title)} →</a>` : ""}</div>
    </article>`;
  }
  let MF = { theme: "", newOnly: false, q: "" };
  function grcMap(fw, focus) {
    fw = FWS.some(x => x[0] === fw) ? fw : "iso"; const C = ctrls(), I = isoById(), f = focus ? decodeURIComponent(focus) : "";
    let reqs = fwList(fw).map(([id, name]) => ({ id, name, x: fw === "iso" ? I[id] : null, by: C.filter(c => c[fw].includes(id)) }));
    const total = reqs.length, covered = reqs.filter(r => r.by.length).length;
    if (fw === "iso") reqs = reqs.filter(r => (!MF.theme || r.x.theme === MF.theme) && (!MF.newOnly || r.x.new));
    if (MF.q) reqs = reqs.filter(r => (r.id + " " + r.name + " " + (r.x ? r.x.desc + " " + r.x.old : "")).toLowerCase().includes(MF.q.toLowerCase()));
    return `<div class="page grc-map">
      <a class="kicker" href="#/grc/controls">← Control workbench</a>
      <h1 class="h-display">Framework <em>map</em></h1>
      <p class="what-is"><b>In plain words:</b> one control usually satisfies several standards and regulators at once. The map shows which, so you build a control once and reuse it for ISO 27001, SOC 2, NIST, Indian rules and IEC 62443. <a href="#/grc/landscape">Which are mandatory?</a></p>
      <p class="lede">See any framework through the common controls. Pick a requirement to find the controls that meet it; open a control to see everything else it covers.</p>
      <div class="filters">${FWS.map(([k, l]) => `<a class="chip ${fw === k ? "on" : ""}" href="#/grc/map/${k}">${l}</a>`).join("")}</div>
      <p class="sub"><b>${covered} of ${total}</b> ${fw === "iso" ? "Annex A controls" : "requirements"} covered by at least one common control.</p>
      ${fw === "iso" ? `<div class="filters cf-chips">${["", "Organisational", "People", "Physical", "Technological"].map(th => `<button class="chip ${MF.theme === th && !MF.newOnly ? "on" : ""}" data-mft="${th}">${th || "All 93"}</button>`).join("")}
        <button class="chip ${MF.newOnly ? "on" : ""}" data-mfnew="1">★ New in 2022 (11)</button></div>` : ""}
      <input class="grc-libq" id="mfQ" type="search" placeholder="Search requirements" value="${esc(MF.q)}" aria-label="Search requirements">
      <div class="mf-list">${reqs.map(r => `<div class="mf-row ${r.id === f ? "focus" : ""} ${r.by.length ? "" : "gap"}" id="mf-${esc(r.id).replace(/[^\w-]/g, "_")}">
        <div class="mf-req"><span class="cf-id">${esc(r.id)}</span>${r.x && r.x.new ? `<span class="tag new">New control</span>` : ""}${r.x ? `<span class="tag plain">${r.x.theme}</span>` : ""}<b>${esc(r.name)}</b>
          ${r.x ? `<small>${esc(r.x.desc)}${r.x.old ? ` · 2013: ${esc(r.x.old)}` : " · new in 2022, no 2013 equivalent"}</small>` : ""}</div>
        <div class="mf-by">${r.by.length ? r.by.map(c => `<a class="mf-c" href="#/grc/controls/${c.id}" title="${esc(c.title)}">${c.id} <span>${esc(c.title)}</span></a>`).join("") : `<span class="mf-gap">Not covered yet</span>`}</div></div>`).join("") || `<p class="sub">Nothing matches.</p>`}</div>
    </div>`;
  }
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let EF = { owner: "", dom: "", scope: "", ev: "" };
  const calItems = () => { const out = [], now = today(), y0 = now.getFullYear(), m0 = now.getMonth() + (now.getDate() > 10 ? 1 : 0);  // after the 10th, this month's evidence is already due
    for (let k = 0; k < 12; k++) { const y = y0 + Math.floor((m0 + k) / 12), m = (m0 + k) % 12, mm = m + 1;
      ctrls().forEach(c => { const due = c.ev === "M" || (c.ev === "Q" && mm % 3 === 0) || (c.ev === "H" && (mm === c.mon || mm === ((c.mon + 5) % 12) + 1)) || (c.ev === "A" && mm === c.mon);
        if (due) out.push({ c, y, m, due: new Date(y, m, 10), chase: new Date(y, m, 3) }); }); }
    return out; };
  function grcCalendar() {
    const C = ctrls(); const owners = [...new Set(C.map(x => x.owner))].sort(), doms = [...new Set(C.map(x => x.dom))], scopes = [...new Set(C.flatMap(x => x.scope.split(", ")))];
    const items = calItems().filter(i => (!EF.owner || i.c.owner === EF.owner) && (!EF.dom || i.c.dom === EF.dom) && (!EF.scope || i.c.scope.includes(EF.scope)) && (!EF.ev || i.c.ev === EF.ev));
    const byMonth = {}; items.forEach(i => { const k = i.y + "-" + i.m; (byMonth[k] = byMonth[k] || []).push(i); });
    const sel = (k, label, opts) => `<label class="cf-sel">${label}<select data-ef="${k}"><option value="">All</option>${opts.map(o => `<option value="${esc(o[0])}" ${EF[k] === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select></label>`;
    const perOwner = owners.map(o => [o, items.filter(i => i.c.owner === o).length]).filter(x => x[1]);
    const fd = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `<div class="page grc-cal">
      <a class="kicker" href="#/grc/controls">← Control workbench</a>
      <h1 class="h-display">Evidence <em>calendar</em></h1>
      <p class="what-is"><b>In plain words:</b> the evidence each department owes, month by month, so the audit isn't a last-minute scramble. Calm audits are shorter and cheaper. <a href="#/grc/spend">More for leaders</a></p>
      <p class="lede">Every control's evidence, planned for the next 12 months: monthly reports, quarterly reviews (March, June, September, December), half-yearly tests and annual reviews. Evidence is due on the 10th; chase the owner on the 3rd, a week before, not a month after.</p>
      <div class="cf-bar">${sel("owner", "Department", owners.map(o => [o, o]))}${sel("dom", "Category", doms.map(o => [o, o]))}${sel("scope", "Scope", scopes.map(o => [o, o]))}${sel("ev", "Cadence", [["M", "Monthly"], ["Q", "Quarterly"], ["H", "Half-yearly"], ["A", "Annual"]])}
        <button class="btn small" id="efCsv">Download the year plan</button></div>
      <div class="cal-owners">${perOwner.map(([o, n]) => `<span class="tag plain">${esc(o)}: ${n}</span>`).join("")}</div>
      <div class="cal-grid">${Object.entries(byMonth).map(([k, list], idx) => { const [y, m] = k.split("-").map(Number);
        return `<section class="cal-month ${idx === 0 ? "now" : ""}"><h3>${MONTHS[m]} ${y}<small>${list.length} items · chase ${fd(list[0].chase)} · due ${fd(list[0].due)}</small></h3>
          <ul>${list.map(i => `<li><a href="#/grc/controls/${i.c.id}"><span class="cf-id">${i.c.id}</span> ${esc(i.c.title)}</a><small>${esc(i.c.owner)} · ${({ M: "monthly", Q: "quarterly", H: "half-yearly", A: "annual" })[i.c.ev]} · ${esc(i.c.evidence.split(",")[0])}</small></li>`).join("")}</ul></section>`; }).join("") || `<p class="sub">Nothing matches these filters.</p>`}</div>
    </div>`;
  }
  function bindCcf(r) {
    $$("[data-cfdom]").forEach(b => b.addEventListener("click", () => { CF.dom = b.dataset.cfdom; App.rerender(); }));
    $$("[data-cf]").forEach(s => s.addEventListener("change", () => { CF[s.dataset.cf] = s.value; App.rerender(); }));
    const n = $("#cfNew"); if (n) n.addEventListener("change", () => { CF.newOnly = n.checked; App.rerender(); });
    const q = $("#cfQ"); if (q) q.addEventListener("input", () => { CF.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { App.rerender(); setTimeout(() => { const x = $("#cfQ"); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 30); }, 250); });
    const mq = $("#mfQ"); if (mq) mq.addEventListener("input", () => { MF.q = mq.value; clearTimeout(mq._t); mq._t = setTimeout(() => { App.rerender(); setTimeout(() => { const x = $("#mfQ"); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 30); }, 250); });
    $$("[data-mft]").forEach(b => b.addEventListener("click", () => { MF.theme = b.dataset.mft; MF.newOnly = false; App.rerender(); }));
    $$("[data-mfnew]").forEach(b => b.addEventListener("click", () => { MF.newOnly = !MF.newOnly; MF.theme = ""; App.rerender(); }));
    $$("[data-ef]").forEach(s => s.addEventListener("change", () => { EF[s.dataset.ef] = s.value; App.rerender(); }));
    if (r.a === "map" && r.b && r.c) { const el = document.getElementById("mf-" + decodeURIComponent(r.c).replace(/[^\w-]/g, "_")); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "center" })); }
    // rating a control
    const id = r.a === "controls" && r.b ? decodeURIComponent(r.b) : null, c = id && ctrls().find(x => x.id === id);
    if (c) {
      const rec = () => (GT()[c.id] = GT()[c.id] || { s: {} });
      $$("[data-rate]").forEach(b => b.addEventListener("click", () => {
        const [i, k] = b.dataset.rate.split(":"); const t = rec(); t.s[i] = t.s[i] === k ? undefined : k; t.at = new Date().toISOString(); save();
        $$(`[data-rate^="${i}:"]`).forEach(x => { const on = x.dataset.rate === i + ":" + t.s[i]; x.className = "chip" + (on ? " on r-" + t.s[i] : ""); x.setAttribute("aria-checked", on); });
        const o = overall(c), el = $("#ccRating"); el.textContent = o; el.className = "tag " + rateCls(o); $("#ccSaved").textContent = "Saved · last rated " + fmtDY(t.at);
      }));
      const note = $("#ccNote"); let tm = null; note.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { const t = rec(); t.note = note.value.trim(); t.at = new Date().toISOString(); save(); $("#ccSaved").textContent = "Saved"; }, 600); });
      note.addEventListener("keydown", e => e.stopPropagation());
      const ids = ctrls().map(x => x.id), at = ids.indexOf(c.id); pageKeys = { prev: at > 0 ? "#/grc/controls/" + ids[at - 1] : null, next: ids[at + 1] ? "#/grc/controls/" + ids[at + 1] : null };
    }
    const dl = (rows, name) => { const csv = rows.map(r => r.map(x => { x = String(x == null ? "" : x); return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; }).join(",")).join("\r\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
    const ex = $("#cfExport"); if (ex) ex.addEventListener("click", () => { dl([["Control ID", "Title", "Category", "Owner", "Frequency", "Scope", "Overall rating", "Scenario 1", "Scenario 2", "Scenario 3", "Notes", "Last rated", "ISO 27001:2022", "SOC 2", "NIST CSF 2.0", "India", "IEC 62443"]].concat(ctrls().map(c => { const t = GT()[c.id] || { s: {} };
      return [c.id, c.title, c.dom, c.owner, c.freq, c.scope, overall(c)].concat(c.risks.map((_, i) => RATE[t.s[i]] || "Not tested")).concat([t.note || "", t.at ? ymd(new Date(t.at)) : "", c.iso.join("; "), c.soc.join("; "), c.csf.join("; "), c.india.join("; "), c.iec.join("; ")]); })), "control-test-workpaper.csv"); db.logEvent("user.workpaper_download", {}); });
    const ec = $("#efCsv"); if (ec) ec.addEventListener("click", () => { dl([["Month", "Chase on", "Due", "Control ID", "Control", "Department", "Category", "Scope", "Cadence", "Evidence"]].concat(calItems().map(i => [MONTHS[i.m] + " " + i.y, ymd(i.chase), ymd(i.due), i.c.id, i.c.title, i.c.owner, i.c.dom, i.c.scope, ({ M: "Monthly", Q: "Quarterly", H: "Half-yearly", A: "Annual" })[i.c.ev], i.c.evidence])), "evidence-calendar.csv"); });
  }
  /* the Learn GRC course and the GRC Manager field guide, private to the owner's account */
  let grcLoading = null;
  App.loadGrc = () => loadGrc();
  const loadGrc = () => window.GRC_COURSE && window.GRC_COURSE.length >= 10 && window.GRC_CONTROLS && window.ISO_2022 ? Promise.resolve() : (grcLoading = grcLoading || Promise.all(["grc-course-1", "grc-course-2", "grc-iso", "grc-controls-1", "grc-controls-2", "grc-oracle", "grc-visuals", "grc-briefings", "grc-landscape", "grc-budget", "grc-rooms", "grc-rooms-2", "grc-rooms-3", "grc-rooms-4"].map(f => new Promise((ok, no) => {
    const sc = document.createElement("script"); sc.src = `assets/js/${f}.js?v=${(document.querySelector('script[src*="app.js"]').src.split("v=")[1] || "dev")}`; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc);
  }))).then(() => { (window.GRC_COURSE || []).sort((a, b) => a.n - b.n); }));   // the two course files can arrive in either order
  let libLoading = null;
  const loadLib = () => window.GRC_LIBRARY ? Promise.resolve() : (libLoading = libLoading || new Promise((ok, no) => {
    const sc = document.createElement("script"); sc.src = `assets/js/grc-library.js?v=${(document.querySelector('script[src*="app.js"]').src.split("v=")[1] || "dev")}`; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc);
  }));
  const LIB_SRC = {
    cc0: `From the public-domain (CC0) lists <a href="https://github.com/grcengineering/awesome-grcengineering" target="_blank" rel="noopener">awesome-grcengineering</a> and <a href="https://github.com/getprobo/awesome-compliance" target="_blank" rel="noopener">awesome-compliance</a>. Tools named here are third-party projects with their own licences.`,
    sushegaad: `From <a href="https://github.com/Sushegaad/Claude-Skills-Governance-Risk-and-Compliance" target="_blank" rel="noopener">Claude Skills for GRC</a> by Hemant Naik, MIT licence. Check legal points against the official text before relying on them.`,
    comply: `Template from <a href="https://github.com/strongdm/comply" target="_blank" rel="noopener">Comply</a> by strongDM, Apache License 2.0. A starting point to adapt, not a finished policy.`
  };
  const LIB_MOD = { "ISO 27001:2022": "m3", "SOC 2": "m4", "India: DPDP Act and Rules": "m7", "Third-party risk": "m6", "SOC 2 policy templates": "m1", "SOC 2 procedure templates": "m5" };
  let libQ = "";
  async function grcLibrary(id) {
    try { await loadLib(); } catch (e) { return `<div class="page-narrow"><h1 class="h-display">Couldn’t load the library</h1><p class="lede">Check your connection and try again.</p></div>`; }
    const L = window.GRC_LIBRARY, mins = d => Math.max(2, Math.round(d.words / 200));
    const doc = id && L.find(d => d.id === id);
    if (doc) {
      const same = L.filter(d => d.group === doc.group), at = same.indexOf(doc), nx = same[at + 1], mod = LIB_MOD[doc.group] && grcMod(LIB_MOD[doc.group]);
      return `<article class="page-narrow grc-doc">
        <a class="kicker" href="#/grc/library">← GRC library · ${esc(doc.group)}</a>
        <h1 class="h-display">${esc(doc.title)}</h1>
        <p class="sub">◷ ${mins(doc)} min read${doc.tsc && doc.tsc.length ? ` · satisfies SOC 2 ${doc.tsc.map(esc).join(", ")}` : ""}${mod ? ` · goes with <a href="#/grc/${mod.id}">Module ${mod.n}: ${esc(mod.title)}</a>` : ""}</p>
        ${doc.id.startsWith("iso-") ? `<a class="okbox" style="display:block;margin:14px 0" href="#/grc/map/iso">Filter by theme, show only the 11 new 2022 controls, see 2013 equivalents and which common controls meet each one: open the framework map →</a>` : ""}
        <div class="prose">${doc.html}</div>
        <p class="grc-src">${LIB_SRC[doc.src] || ""}</p>
        <div class="sec-pager">${at > 0 ? `<a href="#/grc/library/${same[at - 1].id}">← ${esc(same[at - 1].title)}</a>` : `<a href="#/grc/library">← Library</a>`}${nx ? `<a href="#/grc/library/${nx.id}" class="skip">${esc(nx.title)} →</a>` : ""}</div>
      </article>`;
    }
    const groups = [...new Set(L.map(d => d.group))];
    const match = d => !libQ || (d._t = d._t || (d.title + " " + d.group + " " + (d.tsc || []).join(" ") + " " + d.html.replace(/<[^>]+>/g, " ")).toLowerCase()).includes(libQ.toLowerCase());
    return `<div class="page grc-libpage">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">GRC <em>library</em></h1>
      <p class="lede">${L.length} reference documents and templates, about ${Math.round(L.reduce((n, d) => n + d.words, 0) / 1000)},000 words: all 93 ISO 27001 controls, SOC 2 controls and evidence, the DPDP Act and Rules section by section, third-party risk, and 29 SOC 2 policy and procedure templates you can adapt.</p>
      <input class="grc-libq" id="libQ" type="search" placeholder="Search the library, e.g. access, breach, CC6.1" value="${esc(libQ)}" aria-label="Search the library">
      ${groups.map(g => { const ds = L.filter(d => d.group === g && match(d)); if (!ds.length) return "";
        return `<h2 class="h-section">${esc(g)}</h2><div class="grc-libgrid">${ds.map(d => `<a class="grc-libcard" href="#/grc/library/${d.id}"><b>${esc(d.title)}</b><small>◷ ${mins(d)} min${d.tsc && d.tsc.length ? " · " + d.tsc.slice(0, 4).map(esc).join(" ") : ""}</small></a>`).join("")}</div>`; }).join("")}
      <p class="grc-src" style="margin-top:30px">Reference notes: ${LIB_SRC.sushegaad} Templates: ${LIB_SRC.comply}</p>
    </div>`;
  }
  function grcPbc() {
    const P = window.GRC_PBC; if (!P) return "";
    return `<div class="page grc-pbc">
      <a class="kicker" href="#/grc">← Learn GRC · Audit toolkit</a>
      <h1 class="h-display">PBC <em>list</em></h1>
      <p class="lede">The "provided by client" list: every piece of evidence an auditor will ask for, with the SOC 2 criteria and ISO 27001:2022 controls it supports, the period or sample, the owner and the format. Written for a SOC 2 Type II and ISO 27001 audit of a managed SOC service. Illustrative: adapt it to the real scope.</p>
      <div class="btn-row"><button class="btn primary small" id="pbcCsv">Download for Excel</button><button class="btn small" id="pbcCopy">Copy for Excel</button><a class="btn small ghost" href="#/grc/m4/runaudit">Lesson: running an audit</a></div>
      <div class="card grc-pbc-how"><h3>How to use it</h3><ol>${P.how.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
      <div class="tbl-wrap"><table class="tbl grc-pbc-tbl"><thead><tr>${P.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${P.rows.map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? "num" : i === 1 ? "area" : ""}">${esc(String(c))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="sub" style="margin-top:12px">${P.rows.length} requests. When you track it, add three columns: Due date, Status and Auditor comments.</p>
    </div>`;
  }
  const pbcRows = () => { const P = window.GRC_PBC; return [P.cols.concat(["Due date", "Status", "Auditor comments"])].concat(P.rows.map(r => r.map(String).concat(["", "Not started", ""]))); };
  let grcGq = "";
  let grcGview = "az";
  function grcGlossary(focus) {
    const topicOf = {}; Object.entries(window.GRC_ABBR_TOPIC || {}).forEach(([t, ks]) => ks.forEach(k => { topicOf[k] = t; }));
    const seen = new Set();
    const ab = (window.ABBR_EXTRA || []).filter(x => x[3] !== "cissp" && !seen.has(x[0]) && seen.add(x[0])).map(x => ({ k: x[0], full: x[1], mean: x[2], topic: topicOf[x[0]] || "Other", abbr: true }));
    const terms = (window.GRC_TERMS || []).map(x => ({ k: x[0], full: "", mean: x[1], topic: x[2], abbr: false }));
    const all = ab.concat(terms).sort((a, b) => a.k.localeCompare(b.k, "en", { sensitivity: "base" }));
    const f = focus ? decodeURIComponent(focus) : "";
    const q = grcGq.toLowerCase(), rows = all.filter(x => !q || [x.k, x.full, x.mean, x.topic].join(" ").toLowerCase().includes(q));
    const row = x => `<div class="grc-gl-row ${x.k === f ? "focus" : ""} ${x.abbr ? "" : "concept"}" id="gg-${esc(x.k.replace(/\s+/g, "-"))}"><dt><b>${esc(x.k)}</b>${x.full ? `<span>${esc(x.full)}</span>` : ""}</dt><dd>${esc(x.mean)}${grcGview === "az" ? `<small class="gl-topic">${esc(x.topic)}</small>` : ""}</dd></div>`;
    let body;
    if (!rows.length) body = `<p class="sub">No match.</p>`;
    else if (grcGview === "topic") {
      const topics = [...new Set(rows.map(x => x.topic))].sort((a, b) => (a === "Other") - (b === "Other") || a.localeCompare(b));
      body = `<nav class="gl-jump" aria-label="Topics">${topics.map(t => `<a href="#/grc/glossary" data-jump="gt-${t.replace(/\W+/g, "-")}">${esc(t)} <small>${rows.filter(x => x.topic === t).length}</small></a>`).join("")}</nav>` +
        topics.map(t => `<h2 class="h-section gl-head" id="gt-${t.replace(/\W+/g, "-")}">${esc(t)}</h2><dl class="grc-gl">${rows.filter(x => x.topic === t).map(row).join("")}</dl>`).join("");
    } else {
      const letters = [...new Set(rows.map(x => x.k[0].toUpperCase()))];
      body = `<nav class="gl-jump az" aria-label="Letters">${letters.map(l => `<a href="#/grc/glossary" data-jump="gl-${l}">${l}</a>`).join("")}</nav>` +
        letters.map(l => `<h2 class="gl-letter" id="gl-${l}">${l}</h2><dl class="grc-gl">${rows.filter(x => x.k[0].toUpperCase() === l).map(row).join("")}</dl>`).join("");
    }
    return `<div class="page-narrow grc-gloss">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">GRC <em>glossary</em></h1>
      <p class="lede">${ab.length} short forms and ${terms.length} key ideas from the GRC course, library and labs. Tap any underlined short form on a page to see it in place. Pictures of how they fit together are on the <a href="#/grc/visuals">Diagrams</a> page; CISSP terms are in the <a href="#/glossary">CISSP glossary</a>.</p>
      <div class="gl-tools"><input class="grc-libq" id="grcGq" type="search" placeholder="Search, e.g. SoA, RFP or residual" value="${esc(grcGq)}" aria-label="Search the GRC glossary">
        <div class="seg-tabs" role="group" aria-label="Sort"><button class="${grcGview === "az" ? "on" : ""}" aria-pressed="${grcGview === "az"}" data-glview="az">A to Z</button><button class="${grcGview === "topic" ? "on" : ""}" aria-pressed="${grcGview === "topic"}" data-glview="topic">By standard or topic</button></div></div>
      ${body}
    </div>`;
  }

  /* ---------- Vendor register: who gets which data, what they give us, risks and controls ---------- */
  const VDATA = [["hr", "HR personal data", 4], ["cust", "Customer personal data", 4], ["client", "Client log data", 4], ["ot", "OT and engineering data", 4], ["fin", "Finance and payment", 3], ["code", "Source code", 3], ["internal", "Internal documents", 2]];
  const VACC = [["none", "No access to our systems", 0], ["read", "Read only", 1], ["write", "Read and write", 2], ["exec", "Admin or execute", 3], ["script", "Runs code on our website", 3], ["ot", "Remote access into OT", 4]];
  const VFLOW = { out: "We send data to them", in: "They send data to us", both: "Both ways", none: "No data exchanged" };
  const VCHK = [["soc", "SOC 2 or ISO 27001 evidence reviewed"], ["dpa", "DPA signed (personal data)"], ["audit", "Right to audit"], ["notice", "Breach notice within 6 hours"], ["exit", "Exit plan and data export"], ["local", "Indian law and courts"], ["fallback", "Tested fallback or second provider"]];
  const VEX = [
    { name: "Payroll provider", service: "Monthly payroll and payslips", owner: "CHRO", parent: "India", data: ["hr", "fin"], flow: "out", access: "none", crit: 2, ck: { soc: 1, dpa: 1, exit: 1, local: 1 }, sanct: 0, give: "Payslips, bank transfer files, tax filings", rev: "2026-03-10" },
    { name: "Cloud email and collaboration suite", service: "Email, chat, documents", owner: "CIO", parent: "United States", data: ["internal", "cust", "hr"], flow: "both", access: "exec", crit: 3, ck: { soc: 1, dpa: 1 }, sanct: 1, give: "Email, file storage, video meetings", rev: "2025-08-20" },
    { name: "Hyperscale cloud (SIEM hosting)", service: "Hosts the SOC's SIEM and log storage", owner: "Head of SOC", parent: "United States", data: ["client"], flow: "out", access: "exec", crit: 3, ck: { soc: 1, dpa: 1, audit: 1, notice: 1 }, sanct: 1, give: "Compute, storage, the SIEM platform", rev: "2026-01-15" },
    { name: "Baggage system OEM", service: "Maintains airport baggage PLCs", owner: "Head of OT engineering", parent: "Germany", data: ["ot"], flow: "both", access: "ot", crit: 3, ck: { audit: 1, local: 1 }, sanct: 0, give: "Firmware updates, remote fault fixing", rev: "" },
    { name: "Website experimentation script", service: "A/B tests on the public website", owner: "Head of marketing", parent: "United States", data: ["cust"], flow: "in", access: "script", crit: 1, ck: { soc: 1 }, sanct: 0, give: "JavaScript that runs in visitors' browsers", rev: "" },
    { name: "Background verification agency", service: "Pre-joining checks", owner: "CHRO", parent: "India", data: ["hr"], flow: "out", access: "none", crit: 1, ck: { dpa: 1, local: 1 }, sanct: 0, give: "Verification reports", rev: "2025-06-01" }
  ];
  const vList = () => (S.grcVendors = S.grcVendors || []);
  const vScore = v => {
    const d = Math.max(0, ...v.data.map(k => (VDATA.find(x => x[0] === k) || [0, 0, 0])[2])), a = (VACC.find(x => x[0] === v.access) || [0, 0, 0])[2];
    const s = d + a + v.crit * 2; return { s, tier: s >= 9 || (v.crit === 3 && d >= 3) ? 1 : s >= 6 ? 2 : 3, d, a };
  };
  const vRisks = v => {
    const sc = vScore(v), ck = v.ck || {}, R = [], has = k => v.data.includes(k), pers = has("hr") || has("cust");
    const add = (sev, t, c, cat, act) => R.push({ sev, t, c, cat, act });
    if (pers && !ck.dpa) add("high", "Processes personal data without a DPA: you stay liable under DPDP for what they do", ["PRV-01", "TPR-03"], "Privacy", "Sign a DPA");
    if (sc.d >= 3 && !ck.soc) add("high", "No independent evidence that their controls work", ["TPR-02"], "Assurance", "Get their SOC 2 Type II report or ISO 27001 certificate");
    if (v.access === "exec" || v.access === "write") add(v.access === "exec" ? "high" : "med", "Their admin or write access could be misused or stolen", ["IAM-04", "IAM-03"], "Access", "Put their admin accounts under PAM and the quarterly access review");
    if (v.access === "ot") add("high", "Remote access into OT can stop a physical process", ["OT-02", "IAM-05"], "Access", "Route their OT access through a recorded jump host with MFA and approval");
    if (v.access === "script") add("high", "Their code runs on our website; if they are hacked, our visitors are attacked (as in OPTIMJACK)", ["TPR-02", "CHG-01"], "Access", "Add their script to the CSP allow-list with integrity checks and change monitoring");
    if (sc.d >= 3 && !ck.notice) add("med", "Slow breach notice could make us miss CERT-In's 6-hour reporting", ["INC-02", "TPR-03"], "Contract", "Add a breach notice clause of 6 hours or less");
    if (v.crit === 3 && !ck.fallback) add("high", "Single point of failure: no tested fallback for a critical service", ["BCM-01", "TPR-04"], "Continuity", "Set up and test a fallback");
    if (v.sanct && v.crit >= 2) add("high", `Sanctions shadow: a ${esc(v.parent || "foreign")} parent could be forced to suspend service`, ["TPR-04", "BCM-01"], "Geopolitics", "Run a sanctions shadow assessment and automate data export");
    if (v.crit >= 2 && !ck.exit) add("med", "Lock-in: no exit plan or routine data export", ["TPR-04"], "Continuity", "Write an exit plan and schedule data exports");
    if (sc.tier === 1 && !ck.audit) add("med", "No right to audit a Tier 1 vendor", ["TPR-03"], "Contract", "Add a right-to-audit clause at renewal");
    if (v.sanct && !ck.local) add("med", "Disputes would be fought under foreign law and courts", ["TPR-03"], "Contract", "Negotiate Indian law and courts, or arbitration seated in India");
    return R;
  };
  const vDue = (v, tier) => v.rev ? ymd(addDays(parseD(v.rev), [0, 365, 730, 1095][tier])) : null;
  const vRev = (v, tier) => { const d = vDue(v, tier), t = ymd(today()); return !d ? "never" : d < t ? "overdue" : d <= ymd(addDays(today(), 90)) ? "soon" : "ok"; };
  let vEdit = null, vFilter = "all";
  function vForm(v) {
    v = v || { name: "", service: "", owner: "", parent: "India", data: [], flow: "out", access: "none", crit: 2, ck: {}, sanct: 0, give: "" };
    return `<form class="card vd-form" id="vdForm" data-id="${esc(v.id || "")}"><h3>${v.id ? "Edit vendor" : "Add a vendor"}</h3>
      <div class="form-row"><label style="flex:2;min-width:200px">Vendor<input name="name" required maxlength="80" value="${esc(v.name)}" placeholder="e.g. Payroll provider"></label>
        <label style="flex:2;min-width:200px">Service they provide<input name="service" maxlength="120" value="${esc(v.service)}" placeholder="e.g. Monthly payroll"></label></div>
      <div class="form-row"><label style="flex:1;min-width:160px">Business owner<input name="owner" maxlength="60" value="${esc(v.owner)}" placeholder="e.g. CHRO"></label>
        <label style="flex:1;min-width:160px">Parent company is in<input name="parent" maxlength="60" value="${esc(v.parent)}" placeholder="e.g. United States"></label>
        <label style="flex:1;min-width:160px">How critical?<select name="crit">${[[1, "Low: we can manage without it for a week"], [2, "Medium: we can manage for a day"], [3, "High: we stop within hours"]].map(([k, t]) => `<option value="${k}" ${v.crit === k ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
      <fieldset class="vd-set"><legend>Data they get or hold</legend>${VDATA.map(([k, t]) => `<label class="check"><input type="checkbox" name="data" value="${k}" ${v.data.includes(k) ? "checked" : ""}><span>${t}</span></label>`).join("")}</fieldset>
      <div class="form-row"><label style="flex:1;min-width:180px">Direction<select name="flow">${Object.entries(VFLOW).map(([k, t]) => `<option value="${k}" ${v.flow === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label style="flex:1;min-width:180px">Access to our systems<select name="access">${VACC.map(([k, t]) => `<option value="${k}" ${v.access === k ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
      <div class="form-row"><label style="flex:1;min-width:160px">Last reviewed<input type="date" name="rev" value="${esc(v.rev || "")}"></label></div>
      <label style="display:block">What they give us<input name="give" maxlength="160" value="${esc(v.give)}" placeholder="e.g. Payslips, tax filings"></label>
      <fieldset class="vd-set"><legend>What is in place</legend>${VCHK.map(([k, t]) => `<label class="check"><input type="checkbox" name="ck" value="${k}" ${(v.ck || {})[k] ? "checked" : ""}><span>${t}</span></label>`).join("")}
        <label class="check"><input type="checkbox" name="sanct" value="1" ${v.sanct ? "checked" : ""}><span>Parent could be bound by foreign sanctions (US, EU, UK) that India doesn't apply</span></label></fieldset>
      <div class="btn-row"><button class="btn primary small" type="submit">Save vendor</button><button class="btn small ghost" type="button" id="vdCancel">Cancel</button></div></form>`;
  }
  function vDash(rows) {
    const n = rows.length, tc = [1, 2, 3].map(t => rows.filter(x => x.sc.tier === t).length);
    const allR = rows.flatMap(x => x.R.map(r => Object.assign({ v: x.v, tier: x.sc.tier }, r)));
    const cats = ["Privacy", "Assurance", "Access", "Contract", "Continuity", "Geopolitics"].map(c => ({ c, h: allR.filter(r => r.cat === c && r.sev === "high").length, m: allR.filter(r => r.cat === c && r.sev !== "high").length })).filter(x => x.h + x.m);
    const maxC = Math.max(1, ...cats.map(x => x.h + x.m));
    const appl = { dpa: x => x.v.data.includes("hr") || x.v.data.includes("cust"), soc: x => x.sc.d >= 3, notice: x => x.sc.d >= 3, audit: x => x.sc.tier === 1, exit: x => x.v.crit >= 2, fallback: x => x.v.crit === 3, local: () => true };
    const cov = VCHK.map(([k, t]) => { const a = rows.filter(appl[k]), h = a.filter(x => (x.v.ck || {})[k]).length; return { k, t, a: a.length, h, p: a.length ? Math.round(h / a.length * 100) : null }; }).filter(x => x.a);
    const covAll = cov.reduce((s, x) => s + x.h, 0), covN = cov.reduce((s, x) => s + x.a, 0);
    const rv = rows.map(x => ({ x, st: vRev(x.v, x.sc.tier), due: vDue(x.v, x.sc.tier) }));
    const late = rv.filter(r => r.st === "overdue" || r.st === "never").sort((a, b) => a.x.sc.tier - b.x.sc.tier);
    const todo = allR.slice().sort((a, b) => (a.sev === "high" ? 0 : 1) - (b.sev === "high" ? 0 : 1) || a.tier - b.tier).slice(0, 5);
    const TL = ["", "Tier 1 · critical", "Tier 2 · important", "Tier 3 · low"];
    return `<section class="facts vd-kpi" style="border-top:1px solid var(--rule)">
        <div class="fact"><b>${n}</b><span>vendors · ${tc[0]} Tier 1</span></div>
        <div class="fact"><b>${allR.length}</b><span>open risks · ${allR.filter(r => r.sev === "high").length} high</span></div>
        <div class="fact"><b>${covN ? Math.round(covAll / covN * 100) : 0}%</b><span>of needed controls in place</span></div>
        <div class="fact"><b>${late.length}</b><span>reviews overdue</span></div>
      </section>
      <div class="vd-dash">
        <div class="card vd-panel"><h3>Vendors by tier</h3>
          <div class="vd-stack" role="img" aria-label="${tc.map((c, i) => `${TL[i + 1]}: ${c}`).join(", ")}">${tc.map((c, i) => c ? `<span class="t${i + 1}" style="flex:${c}" title="${TL[i + 1]}: ${c} vendor${c > 1 ? "s" : ""}"></span>` : "").join("")}</div>
          <ul class="vd-legend">${tc.map((c, i) => `<li><i class="t${i + 1}"></i>${TL[i + 1]}<b>${c}</b></li>`).join("")}</ul>
          <p class="hint">Tier 1 vendors get the deepest due diligence and a yearly review.</p></div>
        <div class="card vd-panel"><h3>Open risks by type</h3>
          ${cats.length ? `<div class="vd-bars">${cats.map(x => `<div class="vd-bar" title="${x.c}: ${x.h} high, ${x.m} medium"><span class="vd-bl">${x.c}</span><span class="vd-track"><i class="hi" style="width:${x.h / maxC * 100}%"></i><i class="me" style="width:${x.m / maxC * 100}%"></i></span><b>${x.h + x.m}</b></div>`).join("")}</div>
          <ul class="vd-legend inline"><li><i class="hi"></i>High</li><li><i class="me"></i>Medium</li></ul>` : `<p class="okbox">No open risks.</p>`}</div>
        <div class="card vd-panel"><h3>Controls in place</h3><p class="hint" style="margin-top:0">Share of the vendors that need each control and have it.</p>
          <div class="vd-bars">${cov.map(x => `<div class="vd-bar" title="${x.t}: ${x.h} of ${x.a}"><span class="vd-bl">${x.t}</span><span class="vd-track"><i class="cv ${x.p < 50 ? "lo" : ""}" style="width:${x.p}%"></i></span><b>${x.h}/${x.a}</b></div>`).join("")}</div></div>
        <div class="card vd-panel"><h3>Reviews</h3>
          <div class="vd-rev"><div><b>${rv.filter(r => r.st === "overdue" || r.st === "never").length}</b><span>overdue or never done</span></div><div><b>${rv.filter(r => r.st === "soon").length}</b><span>due in 90 days</span></div><div><b>${rv.filter(r => r.st === "ok").length}</b><span>up to date</span></div></div>
          ${late.length ? `<ul class="vd-late">${late.map(r => `<li><span>${esc(r.x.v.name)}</span><small>${r.st === "never" ? "never reviewed" : "due " + fmtD(r.due)} · Tier ${r.x.sc.tier}</small></li>`).join("")}</ul>` : ""}
          <p class="hint">Tier 1 yearly, Tier 2 every two years, Tier 3 every three.</p></div>
      </div>
      ${todo.length ? `<div class="card vd-todo"><h3>Do next</h3><ol>${todo.map(r => `<li><span class="vd-sev ${r.sev}">${r.sev === "high" ? "High" : "Medium"}</span><span><b>${esc(r.act || r.t)}</b> · ${esc(r.v.name)} <small>(Tier ${r.tier})</small></span></li>`).join("")}</ol></div>` : ""}`;
  }
  function grcVendors() {
    const V = vList(), rows = V.map(v => ({ v, sc: vScore(v), R: vRisks(v) }));
    const shown = rows.filter(x => vFilter === "all" || (vFilter === "t1" && x.sc.tier === 1) || (vFilter === "gaps" && x.R.length) || (vFilter === "sanct" && x.v.sanct));
    const openR = rows.reduce((n, x) => n + x.R.length, 0), highR = rows.reduce((n, x) => n + x.R.filter(r => r.sev === "high").length, 0);
    const cName = id => { const c = (window.GRC_CONTROLS ? ctrls() : []).find(x => x.id === id); return c ? c.title : id; };
    const dataCols = VDATA.filter(([k]) => V.some(v => v.data.includes(k)));
    return `<div class="page grc-vendors">
      <a class="kicker" href="#/grc">← Learn GRC · Third-party risk</a>
      <h1 class="h-display">Vendor <em>register</em></h1>
      <p class="lede">Every vendor, the data they get, what they give you, how far into your systems they reach, and the risks and controls that follow. The tier and the risks are worked out for you from your answers. Saved on this device${db.mode === "cloud" ? " and to your account" : ""}.</p>
      <div class="btn-row">${vEdit === null ? `<button class="btn primary small" id="vdAdd">Add a vendor</button>` : ""}${V.length ? "" : `<button class="btn small" id="vdEx">Load 6 example vendors</button>`}
        ${V.length ? `<button class="btn small" id="vdCsv">Download register (Excel)</button>` : ""}<button class="btn small ghost" id="vdTpl">Download blank template</button></div>
      ${vEdit !== null ? vForm(V.find(v => v.id === vEdit)) : ""}
      ${V.length ? vDash(rows) : ""}
      ${V.length ? `
      <h2 class="h-section">Who holds which data</h2>
      <div class="tbl-wrap"><table class="tbl vd-matrix"><thead><tr><th>Vendor</th><th>Tier</th>${dataCols.map(([k, t]) => `<th title="${t}">${({ hr: "HR", cust: "Customer", client: "Client logs", ot: "OT", fin: "Finance", code: "Code", internal: "Internal" })[k]}</th>`).join("")}<th>Direction</th><th>Access</th></tr></thead>
        <tbody>${rows.map(x => `<tr><td>${esc(x.v.name)}</td><td><span class="vz-tag c${5 - x.sc.tier}">Tier ${x.sc.tier}</span></td>${dataCols.map(([k]) => `<td class="dot">${x.v.data.includes(k) ? "●" : ""}</td>`).join("")}<td>${{ out: "→ out", in: "← in", both: "⇄ both", none: "-" }[x.v.flow]}</td><td>${esc((VACC.find(a => a[0] === x.v.access) || [, ""])[1])}</td></tr>`).join("")}</tbody></table></div>
      <div class="filters" style="margin-top:26px">${[["all", `All (${V.length})`], ["t1", "Tier 1"], ["gaps", "With open risks"], ["sanct", "Sanctions shadow"]].map(([k, t]) => `<button class="chip ${vFilter === k ? "on" : ""}" data-vf="${k}">${t}</button>`).join("")}</div>
      <div class="vd-list">${shown.map(x => `<article class="card vd-card">
        <div class="vd-head"><div><h3>${esc(x.v.name)}</h3><p class="sub">${esc(x.v.service || "")}${x.v.owner ? ` · owner: ${esc(x.v.owner)}` : ""}${x.v.parent ? ` · parent in ${esc(x.v.parent)}` : ""}</p></div><span class="vz-tag c${5 - x.sc.tier}">Tier ${x.sc.tier}</span></div>
        <div class="vd-io"><div><span class="kicker">They get</span><p>${x.v.data.length ? x.v.data.map(k => esc((VDATA.find(d => d[0] === k) || [, k])[1])).join(", ") : "No data"} <small>(${VFLOW[x.v.flow]})</small></p></div>
          <div><span class="kicker">They give us</span><p>${esc(x.v.give || "-")}</p></div>
          <div><span class="kicker">Access</span><p>${esc((VACC.find(a => a[0] === x.v.access) || [, ""])[1])}</p></div></div>
        <p class="vd-revline">${(() => { const st = vRev(x.v, x.sc.tier), d = vDue(x.v, x.sc.tier); return st === "never" ? `<span class="vd-sev high">Review</span> never reviewed` : `Last reviewed ${fmtD(x.v.rev)} · next ${st === "overdue" ? `<span class="vd-sev high">overdue</span> since ` : ""}${fmtD(d)}`; })()}</p>
        <div class="vd-cks">${VCHK.map(([k, t]) => `<span class="vd-ck ${(x.v.ck || {})[k] ? "ok" : "no"}">${(x.v.ck || {})[k] ? "✓" : "✗"} ${t}</span>`).join("")}</div>
        ${x.R.length ? `<h4>Risks and the controls that treat them</h4><ul class="vd-risks">${x.R.map(r => `<li class="${r.sev}"><span class="vd-sev">${r.sev === "high" ? "High" : "Medium"}</span><span>${r.t}<small>${r.c.map(id => `<a href="#/grc/controls/${id}">${id} ${esc(cName(id))}</a>`).join(" · ")}</small></span></li>`).join("")}</ul>` : `<p class="okbox">No open risks from these answers. Review it again in a year.</p>`}
        <div class="btn-row"><button class="btn small" data-vedit="${esc(x.v.id)}">Edit</button><button class="btn small ghost" data-vdel="${esc(x.v.id)}">Remove</button></div>
      </article>`).join("") || `<p class="sub">No vendors match this filter.</p>`}</div>`
      : `<div class="card" style="margin-top:22px"><h3>Start your register</h3><p>Add your vendors one by one, or load six worked examples (payroll, cloud email, cloud hosting, an OT equipment maker, a website script and a background check agency) to see how the dashboard works.</p></div>`}
      <p class="hint" style="margin-top:22px">How the tier is worked out: data sensitivity (0 to 4) + access (0 to 4) + criticality × 2. Tier 1 is 9 or more, or a high-criticality vendor with sensitive data. See the <a href="#/grc/visuals/tprm">TPRM lifecycle</a> and the briefing <a href="#/grc/briefings/geopolitics">What if your cloud vendor gets political?</a></p>
    </div>`;
  }
  const vCsv = (rows) => rows.map(r => r.map(c => { c = String(c ?? ""); return /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c; }).join(",")).join("\r\n");
  const vDl = (name, text) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
  const VHEAD = ["Vendor", "Service", "Business owner", "Parent country", "Criticality (1-3)", "Data they get", "Direction", "Access", "What they give us"].concat(VCHK.map(c => c[1])).concat(["Foreign sanctions exposure", "Tier", "Open risks", "Controls"]);
  function bindVendors() {
    const rr = () => App.rerender();
    const add = $("#vdAdd"); if (add) add.addEventListener("click", () => { vEdit = ""; rr(); });
    const ex = $("#vdEx"); if (ex) ex.addEventListener("click", () => { S.grcVendors = VEX.map((v, i) => Object.assign({ id: "v" + Date.now() + i }, JSON.parse(JSON.stringify(v)))); save(); toast("Six example vendors loaded. Edit or remove them any time."); rr(); });
    const cs = $("#vdCsv"); if (cs) cs.addEventListener("click", () => vDl("vendor-register.csv", vCsv([VHEAD].concat(vList().map(v => { const sc = vScore(v), R = vRisks(v);
      return [v.name, v.service, v.owner, v.parent, v.crit, v.data.map(k => (VDATA.find(d => d[0] === k) || [, k])[1]).join("; "), VFLOW[v.flow], (VACC.find(a => a[0] === v.access) || [, ""])[1], v.give]
        .concat(VCHK.map(([k]) => (v.ck || {})[k] ? "Yes" : "No")).concat([v.sanct ? "Yes" : "No", "Tier " + sc.tier, R.map(r => r.t.replace(/<[^>]+>/g, "")).join("; "), [...new Set(R.flatMap(r => r.c))].join(", ")]); })))));
    const tp = $("#vdTpl"); if (tp) tp.addEventListener("click", () => vDl("vendor-register-template.csv", vCsv([VHEAD.slice(0, 9 + VCHK.length + 1), ["Payroll provider", "Monthly payroll", "CHRO", "India", "2", "HR personal data; Finance and payment", "We send data to them", "No access to our systems", "Payslips, tax filings"].concat(VCHK.map(() => "Yes/No")).concat(["No"])])));
    const f = $("#vdForm"); if (f) {
      f.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(f), id = f.dataset.id;
        const v = { id: id || "v" + Date.now(), name: String(fd.get("name") || "").trim(), service: String(fd.get("service") || "").trim(), owner: String(fd.get("owner") || "").trim(), parent: String(fd.get("parent") || "").trim(),
          crit: +fd.get("crit") || 2, data: fd.getAll("data"), flow: fd.get("flow"), access: fd.get("access"), give: String(fd.get("give") || "").trim(), rev: String(fd.get("rev") || ""), ck: {}, sanct: fd.get("sanct") ? 1 : 0 };
        fd.getAll("ck").forEach(k => { v.ck[k] = 1; }); if (!v.name) return toast("Give the vendor a name");
        const L = vList(), at = L.findIndex(x => x.id === v.id); if (at >= 0) L[at] = v; else L.push(v); save(); vEdit = null; toast("Vendor saved"); rr(); });
      $("#vdCancel").addEventListener("click", () => { vEdit = null; rr(); });
      f.querySelector("input[name=name]").focus();
    }
    $$("[data-vf]").forEach(b => b.addEventListener("click", () => { vFilter = b.dataset.vf; rr(); }));
    $$("[data-vedit]").forEach(b => b.addEventListener("click", () => { vEdit = b.dataset.vedit; rr(); scrollTo(0, 0); }));
    $$("[data-vdel]").forEach(b => b.addEventListener("click", () => { const v = vList().find(x => x.id === b.dataset.vdel); if (v && confirm(`Remove ${v.name}?`)) { S.grcVendors = vList().filter(x => x !== v); save(); rr(); } }));
  }
  function grcBriefings(id) {
    const B = window.GRC_BRIEFINGS || [], b = id && B.find(x => x.id === id);
    if (b) return `<article class="page-narrow grc-brief"><a class="kicker" href="#/grc/briefings">← Briefings</a>
      <span class="kicker" style="display:block;margin-top:14px">${esc(b.kicker)}</span><h1 class="h-display">${esc(b.t)}</h1>
      <p class="sub">◷ ${b.mins} min read · ${fmtD(b.date)}</p><div class="prose bf-body">${b.html}</div>
      ${App.diffBar ? App.diffBar("grcb:" + b.id) : ""}
      <div class="bf-more"><h2 class="h-section">More briefings</h2>${B.filter(x => x !== b).map(x => `<a class="card bf-card" href="#/grc/briefings/${x.id}"><span class="kicker">${esc(x.kicker)}</span><h3>${esc(x.t)}</h3><p>${esc(x.sum)}</p></a>`).join("")}</div></article>`;
    return `<div class="page-narrow grc-briefs"><a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">GRC <em>briefings</em></h1>
      <p class="lede">Short, practical reads on what is happening now and how a GRC Manager should respond: the news, the risk, the controls, and what to tell the Board.</p>
      <div class="bf-list">${B.map(x => `<a class="card bf-card" href="#/grc/briefings/${x.id}"><span class="kicker">${esc(x.kicker)}</span><h3>${esc(x.t)}</h3><p>${esc(x.sum)}</p><small>◷ ${x.mins} min</small></a>`).join("")}</div></div>`;
  }

  let landF = "all";
  function grcLandscape() {
    const L = window.GRC_LANDSCAPE || [], ST = window.GRC_STATUS || {};
    const all = L.flatMap(g => g.items.map(x => x.concat(g.id)));
    const count = k => all.filter(x => x[2] === k).length;
    return `<div class="page grc-land">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">Regulators and <em>standards</em></h1>
      <p class="lede">Who regulates what in India, the laws that apply to everyone, the sector rule books, the standards clients ask for, and the foreign laws that can still reach an Indian company. Each one is tagged: mandatory by law, mandatory in a sector, required by clients, or voluntary.</p>
      <div class="land-key">${Object.entries(ST).map(([k, [t, d]]) => `<button class="land-st ${k} ${landF === k ? "on" : ""}" data-landf="${k}" aria-pressed="${landF === k}"><b>${t}</b><span>${d}</span><small>${count(k)}</small></button>`).join("")}</div>
      ${landF !== "all" ? `<p><button class="btn small ghost" data-landf="all">Show everything</button></p>` : ""}
      <nav class="chips vz-chips" aria-label="Sections">${L.map(g => `<a class="chip" href="#/grc/landscape" data-jump="ld-${g.id}">${esc(g.t)}</a>`).join("")}</nav>
      ${L.map(g => { const its = g.items.filter(x => landF === "all" || x[2] === landF); if (!its.length) return "";
        return `<section class="land-sec" id="ld-${g.id}"><h2 class="h-section">${esc(g.t)}</h2><p class="sub">${esc(g.sub)}</p>
        <div class="land-list">${its.map(([n, by, st, who, what, u]) => `<article class="card land-item"><div class="land-top"><h3>${esc(n)}</h3><span class="land-tag ${st}">${esc((ST[st] || [st])[0])}</span></div>
          <p class="land-by">${esc(by)}</p><dl><dt>Applies to</dt><dd>${esc(who)}</dd><dt>What it asks</dt><dd>${esc(what)}</dd></dl>
          ${u ? `<a class="rr-link" href="${esc(u)}" target="_blank" rel="noopener">Official site ↗</a>` : ""}</article>`).join("")}</div></section>`; }).join("")}
      <p class="hint">A summary for learning, checked against public sources in November 2026. Rules change: confirm the current text with the regulator before relying on it. For what to spend on first, see <a href="#/grc/spend">the guide for the CEO and CFO</a>.</p>
    </div>`;
  }
  function grcSpend() {
    const P = window.GRC_SPEND; if (!P) return "";
    return `<div class="page-narrow grc-spend">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">Where to spend: a guide for the <em>CEO and CFO</em></h1>
      <p class="lede">What the GRC tools on this site are for, in business terms, and how to rank security and compliance spending: what is mandatory, what is essential, and what can wait.</p>
      <a class="card grc-guide" href="#/grc/budget" style="margin:16px 0"><div><span class="kicker">Tool</span><h3>Security budget planner</h3><p>Describe your company and score the risks; see the spending range for a minimum, recommended or full programme, the loss it avoids, and the risk matrix before and after.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
      <h2 class="h-section">The tools, in one line each</h2>
      <div class="spend-tools">${P.tools.map(([t, h, what, q]) => `<a class="card spend-tool" href="${h}"><h3>${esc(t)} →</h3><p>${esc(what)}</p><p class="spend-q"><b>Answers:</b> ${esc(q)}</p></a>`).join("")}</div>
      <h2 class="h-section">Three levels of spending</h2>
      ${P.tiers.map((t, i) => `<section class="card spend-tier ${t.id}"><div class="spend-head"><span class="spend-n">${i + 1}</span><div><h3>${esc(t.t)}</h3><p class="sub">${esc(t.sub)}</p></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>What</th><th>What it involves</th><th>Why it matters</th></tr></thead><tbody>${t.items.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join("")}</tbody></table></div></section>`).join("")}
      <h2 class="h-section">How much: rough planning ranges</h2>
      <p class="sub">For a mid-sized Indian company of a few hundred people. These are rough ranges for planning only; real prices vary with scope, size and supplier, so get at least three quotes.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Typical range</th></tr></thead><tbody>${P.costs.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="nowrap">${esc(b)}</td></tr>`).join("")}</tbody></table></div>
      <h2 class="h-section">How to decide: a worked example</h2>
      <div class="card spend-eg">
        <p><b>Risk:</b> ransomware stops the SOC platform and client services.</p>
        <p><b>Today:</b> likely about once in five years (20% a year). Impact about ₹5 crore (lost revenue, penalties, recovery). Expected loss: 20% × ₹5 crore = <b>₹1 crore a year</b>.</p>
        <p><b>Proposal:</b> immutable backups, restore tests and EDR for ₹30 lakh a year cuts the likelihood to about 5%: expected loss ₹25 lakh a year.</p>
        <p><b>Result:</b> ₹75 lakh of expected loss avoided for ₹30 lakh spent. Worth doing. A control that costs more than the loss it avoids usually isn't, unless a law requires it.</p>
      </div>
      <h2 class="h-section">The order to spend in</h2>
      <ol class="spend-order"><li>Close gaps in anything <b>mandatory</b>.</li><li>Fund the <b>essential</b> basics that treat your top 5 risks.</li><li>Buy the certifications your clients and tenders actually ask for.</li><li>Then the good-to-haves, starting with whatever saves staff time.</li></ol>
      <h2 class="h-section">Questions to ask your CISO or GRC Manager</h2>
      <ul class="spend-qs"><li>Which mandatory requirements are we not meeting today, and what is the deadline?</li><li>What are our top five risks in rupees, before and after the controls we pay for?</li><li>Which controls have been tested this quarter, and which failed?</li><li>Which vendors could stop our business, and do we have a way out?</li><li>If we were breached tonight, could we report to CERT-In within 6 hours?</li><li>Which spending would you cut first if the budget fell by 20%, and what risk would that leave?</li></ul>
      <p class="hint">See also: <a href="#/grc/landscape">Regulators and standards</a> · <a href="#/grc/visuals/matrix">Risk matrix before and after</a> · <a href="#/grc/vendors">Vendor register</a>. Penalty figures are from the DPDP Act schedule.</p>
    </div>`;
  }

  /* ---------- Scenario rooms ---------- */
  let run = null, roomTopic = "all";   // { id, i, picks: [], phase: "step" | "reply" | "done", chosen: [] }
  const roomRec = () => (S.grcRooms = S.grcRooms || {});
  const roomScore = (R, picks, chosen) => {
    const dec = picks.reduce((n, p, i) => n + R.steps[i].opts[p].s, 0), decMax = R.steps.length * 2;
    const goodN = R.reply.parts.filter(x => x.good).length, rep = Math.max(0, chosen.reduce((n, k) => n + (R.reply.parts[k].good ? 1 : -1), 0));
    return { pct: Math.round((dec + rep) / (decMax + goodN) * 100), dec, decMax, rep, goodN };
  };
  const mixOrder = (R) => R.reply.parts.map((_, i) => i).sort((a, b) => ((a * 7 + R.id.length) % 5) - ((b * 7 + R.id.length) % 5) || a - b);
  function grcRooms(id) {
    const RS = (window.GRC_ROOMS || []).slice().sort((a, b) => (a.order || 99) - (b.order || 99)), R = id && RS.find(x => x.id === id), rec = roomRec();
    const topics = [...new Set(RS.map(x => x.topic || "Other"))], shown = RS.filter(x => roomTopic === "all" || (roomTopic === "todo" ? !rec[x.id] : (x.topic || "Other") === roomTopic));
    if (!R) return `<div class="page-narrow grc-rooms"><a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">Scenario <em>rooms</em></h1>
      <p class="lede">Real GRC situations against the clock. Read the inbox, check what is on your desk, make the call, then write the reply. Every choice gets feedback, and your best score is kept. The companies and people are made up; the rules are real.</p>
      <div class="rm-stats mono">${RS.length} rooms · ${Object.keys(rec).filter(k => RS.some(x => x.id === k)).length} played · average best ${(() => { const b = RS.map(x => rec[x.id]).filter(Boolean); return b.length ? Math.round(b.reduce((n, r) => n + r.best, 0) / b.length) + "%" : "-"; })()}</div>
      <div class="filters rm-filt">${[["all", `All (${RS.length})`], ["todo", "Not played yet"]].concat(topics.map(t => [t, `${t} (${RS.filter(x => (x.topic || "Other") === t).length})`])).map(([k, t]) => `<button class="chip ${roomTopic === k ? "on" : ""}" data-rmt="${esc(k)}">${esc(t)}</button>`).join("")}</div>
      <div class="rm-list">${shown.map(x => { const r = rec[x.id]; return `<a class="card rm-card" href="#/grc/rooms/${x.id}"><div class="rm-top"><span><span class="vz-tag ${x.level === "Beginner" ? "c1" : x.level === "Advanced" ? "c3" : "c2"}">${x.level}</span> <span class="rm-topic mono">${esc(x.topic || "")}</span></span><small>◷ ${x.mins} min · ${x.steps.length} decisions</small></div>
        <h3>${esc(x.t)}</h3><p>${esc(x.brief)}</p><div class="rm-foot">${r ? `<span>Best: <b>${r.best}%</b> · played ${r.runs}×</span><span class="btn small">Play again →</span>` : `<span></span><span class="btn small primary">Start →</span>`}</div></a>`; }).join("")}</div>
      <p class="hint">Inspired by scenario practice sites such as <a href="https://grcplayground.com/" target="_blank" rel="noopener">GRC Playground</a>; these rooms are written for this course and India's rules.</p></div>`;
    if (!run || run.id !== R.id) run = { id: R.id, i: 0, picks: [], phase: "step", chosen: [], started: false };
    const st = R.steps[Math.min(run.i, R.steps.length - 1)], answered = run.picks.length > run.i, N = R.steps.length + 1;
    const nowN = run.phase === "done" ? N : run.phase === "reply" ? N : run.i + 1, doneN = run.phase === "done" ? N : run.picks.length;
    const pad = n => String(n).padStart(2, "0");
    const slots = `<div class="rm-slots" aria-label="Progress: ${doneN} of ${N} done">${Array.from({ length: N }, (_, i) => `<span class="${i < doneN ? "done" : i + 1 === nowN && run.started ? "now" : ""}">${i + 1 === N ? "✉" : pad(i + 1)}</span>`).join("")}<em>${doneN} of ${N}</em></div>`;
    const bar = `<div class="rm-bar"><a href="#/grc/rooms" class="rm-back" aria-label="All scenario rooms">←</a>${run.started ? `<h1 class="rm-bar-t">${esc(R.t)}</h1>` : `<b class="rm-bar-t">${esc(R.t)}</b>`}${slots}</div>`;
    const goalsCard = () => `<div class="rm-ticket"><div class="rm-tk-top"><span class="mono">${esc(R.ticket.ref)}</span><span class="rm-pill ${run.phase === "done" ? "closed" : "open"}">${run.phase === "done" ? "closed" : "open"}</span></div>
      <div class="rm-tk-body"><div><p class="rm-tk-text">${esc(R.ticket.text)}</p><p class="mono rm-tk-own">Owner: ${esc(R.ticket.owner)}.</p>
        <div class="rm-tk-slots">${Array.from({ length: N }, (_, i) => `<span class="${i < doneN ? "done" : ""}">${i + 1 === N ? "✉" : pad(i + 1)}</span>`).join("")}</div></div>
        <ul class="rm-goals">${(R.goals.length > R.steps.length ? R.goals : R.goals.concat(["A reply you'd be happy to see quoted"])).map((g, i) => { const ok = i < run.picks.length ? R.steps[i].opts[run.picks[i]].s === 2 : i === R.steps.length && run.phase === "done";
          const st2 = i < run.picks.length || (i === R.steps.length && run.phase === "done") ? (ok ? "done" : "partly") : "not yet"; return `<li><span>${esc(g)}</span><span class="rm-pill ${st2.replace(" ", "")}">${st2}</span></li>`; }).join("")}</ul></div></div>`;
    if (!run.started) return `<div class="page grc-room">${bar}
      <section class="rm-hero"><span class="mono rm-meta">Scenario · ${esc(R.level)} · about ${R.mins} min · ${R.steps.length} decisions and a written reply</span>
        <h1 class="rm-h1">${esc(R.t)}</h1><p class="rm-lede">${esc(R.brief)}</p>
        <p class="mono rm-meta">You: ${esc(R.you || "GRC Manager, Kavach SOC")} · ${esc(R.client)}</p>
        <div class="btn-row"><button class="btn primary" id="rmStart">Start the clock</button><a class="rm-skip" href="#/grc/rooms">Pick another room</a></div></section>
      ${goalsCard()}
      <figure class="rm-quote"><blockquote>“${esc(R.quote[0])}”</blockquote><figcaption class="mono">${esc(R.quote[1])}</figcaption></figure></div>`;
    if (run.phase === "step") {
      const pick = run.picks[run.i], lb = R.labels[run.i] || [st.at, ""];
      return `<div class="page grc-room">${bar}
        <div class="rm-chapter"><aside class="rm-side"><b class="mono">${esc(lb[0])}</b><small class="mono">${esc(lb[1])}</small></aside>
          <div class="rm-main"><span class="mono rm-count">${run.i + 1} of ${R.steps.length}</span>
            <section class="rm-inbox" aria-label="Inbox">${st.inbox.map(m => `<article class="rm-msg"><div class="rm-from"><b>${esc(m.from)}</b><small class="mono">${esc(st.at)}</small></div><p class="rm-subj">${esc(m.subj)}</p><p>${esc(m.body)}</p></article>`).join("")}</section>
            <section class="rm-term" aria-label="On your desk"><div class="rm-term-h mono">on your desk</div>${st.desk.map(d => `<div class="rm-term-row ${d.flag ? "flag" : ""}"><span class="mono">${esc(d.t)}</span><span>${esc(d.d)}</span>${d.flag ? `<em class="mono">CHECK</em>` : ""}</div>`).join("")}</section>
            <section class="rm-q"><h2>${esc(st.q)}</h2>
              <div class="rm-opts">${st.opts.map((o, k) => `<button class="rm-opt ${answered ? (k === pick ? "picked s" + o.s : o.s === 2 ? "best" : "") : ""}" data-rmo="${k}" ${answered ? "disabled" : ""}><span class="mono rm-ok">${"ABC"[k]}</span><span>${esc(o.t)}</span></button>`).join("")}</div>
              ${answered ? `<div class="rm-fb s${st.opts[pick].s}" role="status"><b>${["Poor call", "Partly right", "Good call"][st.opts[pick].s]}.</b> ${esc(st.opts[pick].fb)}${st.opts[pick].s < 2 ? `<p class="rm-better"><b>Better:</b> ${esc(st.opts.find(o => o.s === 2).t)}</p>` : ""}</div>
                <button class="btn primary" id="rmNext">${run.i + 1 < R.steps.length ? "Next →" : "Write the reply →"}</button>` : ""}</section></div></div></div>`;
    }
    const order = mixOrder(R);
    if (run.phase === "reply") return `<div class="page grc-room">${bar}
      <section class="card rm-reply"><span class="kicker">Last step</span><h2>Write the reply</h2><p class="sub">${esc(R.reply.prompt)}</p>
        <div class="rm-parts">${order.map(k => `<label class="check rm-part"><input type="checkbox" data-rmp="${k}" ${run.chosen.includes(k) ? "checked" : ""}><span>${esc(R.reply.parts[k].t)}</span></label>`).join("")}</div>
        <div class="rm-mail"><div class="rm-mail-h"><span>To: ${esc(R.reply.to)}</span><span>Subject: ${esc(R.reply.subj)}</span></div><div class="rm-mail-b" id="rmMail">${run.chosen.length ? order.filter(k => run.chosen.includes(k)).map(k => esc(R.reply.parts[k].t)).join(" ") : "<i>Tick sentences to build your reply.</i>"}</div></div>
        <button class="btn primary" id="rmSend" ${run.chosen.length ? "" : "disabled"}>Send reply</button></section></div>`;
    const sc = roomScore(R, run.picks, run.chosen), r = roomRec()[R.id];
    return `<div class="page grc-room">${bar}
      <section class="card rm-done"><div class="rm-score"><b>${sc.pct}%</b><span>${sc.pct >= 85 ? "Excellent: you'd handle this well for real." : sc.pct >= 60 ? "Solid, with a few calls to sharpen." : "Worth another go: read the feedback below first."}</span><small>Decisions ${sc.dec}/${sc.decMax} · reply ${sc.rep}/${sc.goodN}${r ? ` · your best ${r.best}%` : ""}</small></div>
        <h2>Your reply, checked</h2><ul class="rm-check">${order.map(k => { const p = R.reply.parts[k], on = run.chosen.includes(k);
          if (on && p.good) return `<li class="ok">✓ ${esc(p.t)}</li>`; if (on && !p.good) return `<li class="no">✗ ${esc(p.t)} <small>${esc(p.why || "")}</small></li>`; if (!on && p.good) return `<li class="miss">○ Missed: ${esc(p.t)}</li>`; return ""; }).join("")}</ul>
        ${goalsCard()}
        <h2>What to take away</h2><ul class="rm-take">${R.debrief.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <h2>Go deeper</h2><div class="rm-links">${R.links.map(([t, h]) => `<a class="chip" href="${h}">${esc(t)}</a>`).join("")}</div>
        <div class="btn-row" style="margin-top:18px"><button class="btn primary" id="rmAgain">Play again</button><a class="btn" href="#/grc/rooms">Other rooms</a></div></section></div>`;
  }
  function bindRooms(r) {
    $$("[data-rmt]").forEach(b => b.addEventListener("click", () => { roomTopic = b.dataset.rmt; App.rerender(); }));
    const R = (window.GRC_ROOMS || []).find(x => x.id === r.b); if (!R || !run) return;
    const go = () => { App.rerender(); };
    const s0 = $("#rmStart"); if (s0) s0.addEventListener("click", () => { run.started = true; go(); });
    $$("[data-rmo]").forEach(b => b.addEventListener("click", () => { run.picks[run.i] = +b.dataset.rmo; go(); }));
    const nx = $("#rmNext"); if (nx) nx.addEventListener("click", () => { if (run.i + 1 < R.steps.length) run.i++; else run.phase = "reply"; App.rerender(); scrollTo(0, 0); });
    $$("[data-rmp]").forEach(b => b.addEventListener("change", () => { const k = +b.dataset.rmp; run.chosen = b.checked ? run.chosen.concat(k) : run.chosen.filter(x => x !== k);
      const order = mixOrder(R), m = $("#rmMail"); m.innerHTML = run.chosen.length ? order.filter(x => run.chosen.includes(x)).map(x => esc(R.reply.parts[x].t)).join(" ") : "<i>Tick sentences to build your reply.</i>"; $("#rmSend").disabled = !run.chosen.length; }));
    const sd = $("#rmSend"); if (sd) sd.addEventListener("click", () => { run.phase = "done"; const sc = roomScore(R, run.picks, run.chosen), rec = roomRec(), o = rec[R.id] || { best: 0, runs: 0 };
      rec[R.id] = { best: Math.max(o.best, sc.pct), runs: o.runs + 1, last: sc.pct, at: ymd(today()) }; save(); App.rerender(); scrollTo(0, 0); });
    const ag = $("#rmAgain"); if (ag) ag.addEventListener("click", () => { run = { id: R.id, i: 0, picks: [], phase: "step", chosen: [], started: true }; App.rerender(); scrollTo(0, 0); });
  }
  /* ---------- Favourites ---------- */
  const favs = () => { if (!S.grcFavs) { S.grcFavs = (window.GRC_FAVS_SEED || []).map((x, i) => Object.assign({ id: "f" + i }, x)); save(); } return S.grcFavs; };
  function grcFavourites() {
    const F = favs();
    return `<div class="page-narrow grc-favs"><a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">My <em>favourites</em></h1>
      <p class="lede">Sites and articles you like, kept in one place. They open in a new tab.</p>
      <div class="fav-list">${F.map(f => `<article class="card fav-card"><div class="fav-top"><h3><a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)} ↗</a></h3><button class="btn small ghost" data-favdel="${esc(f.id)}" aria-label="Remove ${esc(f.t)}">Remove</button></div>
        <p class="fav-url">${esc(f.u.replace(/^https:\/\//, "").replace(/\/$/, ""))}</p>${f.n ? `<p>${esc(f.n)}</p>` : ""}${f.a ? `<a class="rr-link" href="${esc(f.a)}" target="_blank" rel="noopener">The article you liked ↗</a>` : ""}</article>`).join("") || `<p class="sub">Nothing saved yet.</p>`}</div>
      <form class="card fav-form" id="favForm"><h3>Add a favourite</h3>
        <div class="form-row"><label style="flex:1;min-width:180px">Name<input name="t" required maxlength="80" placeholder="e.g. GRC Playground"></label><label style="flex:2;min-width:220px">Address<input name="u" type="url" required placeholder="https://…"></label></div>
        <label style="display:block">Why you like it (optional)<input name="n" maxlength="200"></label>
        <button class="btn primary small" type="submit">Add</button></form></div>`;
  }
  function bindFavourites() {
    const f = $("#favForm"); if (!f) return;
    f.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(f), u = String(fd.get("u") || "").trim();
      if (!/^https:\/\//i.test(u)) return toast("Addresses must start with https://");
      favs().push({ id: "f" + Date.now(), t: String(fd.get("t") || "").trim(), u, n: String(fd.get("n") || "").trim() }); save(); toast("Added to favourites"); App.rerender(); });
    $$("[data-favdel]").forEach(b => b.addEventListener("click", () => { const x = favs().find(y => y.id === b.dataset.favdel); if (x && confirm(`Remove ${x.t}?`)) { S.grcFavs = favs().filter(y => y !== x); save(); App.rerender(); } }));
  }
  function grcVisuals(sec) {
    const V = window.GRC_VISUALS || [];
    return `<div class="page grc-visuals">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">GRC in <em>diagrams</em></h1>
      <p class="lede">Where the GRC Manager sits, how a vendor goes from request to exit, how sensitive each department's data is, where data flows and who may read, write or execute, and one risk scored before and after controls.</p>
      <nav class="chips vz-chips" aria-label="Diagrams">${V.map(v => `<a class="chip" href="#/grc/visuals" data-jump="vz-${v.id}">${esc(v.t)}</a>`).join("")}</nav>
      ${V.map(v => `<section class="vz-sec" id="vz-${v.id}"><h2 class="h-section">${esc(v.t)}</h2><p class="sub">${esc(v.lede)}</p>${v.html}</section>`).join("")}
      <p class="hint">Organisation names, roles and numbers are illustrative. Terms are explained in the <a href="#/grc/glossary">GRC glossary</a>.</p>
    </div>`;
  }
  function grcLabs() {
    const labs = window.GRC_LABS || [];
    return `<div class="page-narrow grc-labs">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">Hands-on <em>labs</em></h1>
      <p class="lede">Reading builds understanding; doing builds confidence. Each lab uses a real open-source GRC tool, takes an evening or a weekend, and ends with something you can show.</p>
      ${labs.map((x, i) => `<section class="card grc-lab" id="lab-${x.id}">
        <div class="grc-lab-head"><span class="grc-n">${String(i + 1).padStart(2, "0")}</span><div><h2>${esc(x.title)}</h2><p class="sub" style="margin:0">◷ ${esc(x.time)} · practises ${x.mods.map(m => { const mm = grcMod(m); return mm ? `<a href="#/grc/${m}">Module ${mm.n}</a>` : ""; }).join(", ")}</p></div></div>
        <p>${esc(x.why)}</p>
        <p class="grc-lab-tool">Tool: <a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.tool)} ↗</a></p>
        <ol class="grc-lab-steps">${x.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="grc-lab-out"><b>You finish with:</b> ${esc(x.deliver)}</p>
      </section>`).join("")}
    </div>`;
  }
  const grcKey = (m, l) => m + ":" + l;
  const grcDone = () => (S.grc = S.grc || {});
  const grcMod = id => (window.GRC_COURSE || []).find(m => m.id === id);
  const grcProg = m => { const d = m.lessons.filter(l => grcDone()[grcKey(m.id, l.id)]).length; return { d, t: m.lessons.length, pct: Math.round(d / m.lessons.length * 100) }; };
  // Lesson times are scaled so the whole course comes to 2h 30m, the measured reading time of the course.
  const GRC_COURSE_MIN = 150;
  let grcScale = null;
  const grcMins = l => { if (grcScale == null && (window.GRC_COURSE || []).length >= 10) { const raw = window.GRC_COURSE.reduce((n, m) => n + m.lessons.reduce((k, x) => k + grcRaw(x), 0), 0); grcScale = GRC_COURSE_MIN / raw; } return Math.max(1, Math.round(grcRaw(l) * (grcScale || 1))); };
  const grcRaw = l => Math.max(3, String(l.body).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 180 + (l.body.match(/<table/g) || []).length + l.checks.length * 0.5);
  const grcNext = () => { for (const m of window.GRC_COURSE || []) for (const l of m.lessons) if (!grcDone()[grcKey(m.id, l.id)]) return { m, l }; return null; };
  const notAllowed = () => `<div class="page-narrow"><div class="kicker">Private</div><h1 class="h-display">Not available</h1><p class="lede">This section is only for the site owner.</p><a class="btn" href="#/">Back to your study desk</a></div>`;

  async function viewGrc(r) {
    if (!App.isPrivileged()) return notAllowed();
    if (r.a === "guide") return `<div class="grc-inpage">
      <div class="grc-bar"><div><a class="kicker" href="#/grc">← Learn GRC</a><h1>GRC Manager <em>field guide</em></h1>
        <p class="sub" style="margin:2px 0 0">The role, a skill ladder, 50-term glossary, daily situations, a 20-day plan, your first 90 days and 18 templates. Your checklist is saved on this device.</p></div>
        <a class="btn small ghost" href="grc.html" target="_blank" rel="noopener">Open on its own ↗</a></div>
      <div id="grc-guide"><p class="sub" style="padding:40px 0;text-align:center">Loading the field guide…</p></div></div>`;
    try { await loadGrc(); } catch (e) { return `<div class="page-narrow"><h1 class="h-display">Couldn’t load the course</h1><p class="lede">Check your connection and try again.</p></div>`; }
    const C = window.GRC_COURSE;
    if (r.a === "library") return grcLibrary(r.b);
    if (r.a === "labs") return grcLabs();
    if (r.a === "insights") return App.viewGrcInsights();
    if (r.a === "notes") return grcNotes();
    if (r.a === "setup") return grcSetup();
    if (r.a === "visuals") return grcVisuals(r.b);
    if (r.a === "vendors") return grcVendors();
    if (r.a === "landscape") return grcLandscape();
    if (r.a === "spend") return grcSpend();
    if (r.a === "rooms") return grcRooms(r.b);
    if (r.a === "favourites") return grcFavourites();
    if (r.a === "budget") return window.GRC_BUDGET ? window.GRC_BUDGET.view() : "";
    if (r.a === "briefings") return grcBriefings(r.b);
    if (r.a === "log") return grcLog();
    if (r.a === "shelf") return App.viewLibrary(true);
    if (r.a === "reading") { try { await loadLib(); } catch (e) {} return grcReading(r.b); }
    if (r.a === "glossary") return grcGlossary(r.b);
    if (r.a === "pbc") return grcPbc();
    if (r.a === "controls") return grcControls(r.b);
    if (r.a === "map") return grcMap(r.b, r.c);
    if (r.a === "calendar") return grcCalendar();
    const m = r.a && grcMod(r.a);
    if (m && r.b) { const l = m.lessons.find(x => x.id === r.b); if (l) return grcLesson(m, l); }
    if (m) return grcModule(m);
    // hub
    const all = C.reduce((n, x) => n + x.lessons.length, 0), done = C.reduce((n, x) => n + grcProg(x).d, 0), nx = grcNext();
    const desk = await grcDesk();
    return `<div class="page grc-hub">${desk}
      <h2 class="h-section" id="course">The course</h2>
      <header class="grc-head" hidden><div><span class="kicker">Course · Learn GRC</span>
        <h1 class="h-display">Learn <em>GRC</em></h1>
        <p class="lede">Governance, risk and compliance from zero to ready for a GRC Manager role. Ten modules, ${all} lessons with worked examples, a "remember" box and check questions on every page.</p></div>
        <div class="grc-ring"><b>${Math.round(done / all * 100)}%</b><small>${done} of ${all} lessons</small></div></header>
      ${nx && false ? `<a class="start-btn" href="#/grc/${nx.m.id}/${nx.l.id}" style="margin:6px 0 30px"><span><small>${done ? "Continue" : "Start"} · Module ${nx.m.n}</small><b>${esc(nx.l.title)}</b></span><span class="start-arrow" aria-hidden="true">→</span></a>` : `<div class="okbox" style="margin:6px 0 30px">Every lesson done. Use the field guide's 20-day plan and templates to practise.</div>`}
      <div class="grc-mods">${C.map(x => { const p = grcProg(x); return `<a class="grc-mod ${p.pct === 100 ? "done" : ""}" href="#/grc/${x.id}"><span class="grc-n">${String(x.n).padStart(2, "0")}</span><div><b>${esc(x.title)}</b><small>${esc(x.lede)}</small><span class="meter"><i style="width:${p.pct}%"></i></span><em>${p.d} of ${p.t} lessons</em></div></a>`; }).join("")}</div>
      <h2 class="h-section">Go deeper and practise</h2>
      <div class="grc-more">
        <a class="card grc-guide" href="#/grc/library"><div><span class="kicker">46 documents · ~42,000 words</span><h3>GRC library</h3><p>All 93 ISO 27001 controls, SOC 2 controls and evidence, the DPDP Act and Rules section by section, third-party risk, and 29 SOC 2 policy and procedure templates.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
        <a class="card grc-guide" href="#/grc/controls"><div><span class="kicker">53 controls · 159 test scenarios</span><h3>Control workbench</h3><p>A common control set mapped to ISO 27001, SOC 2, NIST CSF, DPDP, CERT-In and IEC 62443. Filter by department, scope and frequency; test what can go wrong and rate each control.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
        <a class="card grc-guide" href="#/grc/map/iso"><div><span class="kicker">ISO · SOC 2 · NIST · India · IEC</span><h3>Framework map</h3><p>All 93 ISO controls with theme and "new in 2022" filters and their 2013 equivalents; see which common controls meet each requirement.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
        <a class="card grc-guide" href="#/grc/calendar"><div><span class="kicker">12-month plan</span><h3>Evidence calendar</h3><p>What evidence is due each month, by department, with chase dates a week before. Download the year plan.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
        <a class="card grc-guide" href="#/grc/labs"><div><span class="kicker">7 labs</span><h3>Hands-on labs</h3><p>Use real open-source tools: an assessment in CISO Assistant, a SOC 2 gap scan of GitHub, policies as code, a vendor register, and quantifying risk in rupees.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
      </div>
      <a class="card grc-guide" href="#/grc/guide" style="margin-top:12px"><div><span class="kicker">13 tabs</span><h3>GRC Manager field guide</h3><p>A day in the life, meetings, tools, a 50-term glossary with quiz mode, a drill for questions you can’t answer, 18 daily situations, a 20-day plan, your first 90 days and 18 filled-in templates.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
      <a class="card grc-guide" href="#/grc/vendors" style="margin-top:12px"><div><span class="kicker">Tool</span><h3>Vendor register</h3><p>Which vendors get which data, what they give you, their access, tier, risks and the controls that treat them. Download it for Excel.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
      <a class="card grc-guide" href="#/grc/briefings" style="margin-top:12px"><div><span class="kicker">New</span><h3>Briefings</h3><p>Sanctions and your cloud vendors, MITRE ATT&amp;CK for GRC, and the OPTIMJACK supply-chain attack: what happened and what to do.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
      <a class="card grc-guide" href="#/grc/reading" style="margin-top:12px"><div><span class="kicker">On this site</span><h3>Reading room</h3><p>A 30-day reading plan, the risk frameworks, free tools, books, people to follow and certifications, each summarised in plain words.</p></div><span class="start-arrow" aria-hidden="true">→</span></a>
      <h2 class="h-section">Further reading</h2>
      <p class="sub">Free, openly licensed lists and official sources. The lessons above are written for this site; these help you go deeper.</p>
      <div>${(window.GRC_READING || []).map(x => `<div class="res"><div class="res-ico">↗</div><div><h3><a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)} ↗</a></h3><p>${esc(x.d)}</p></div></div>`).join("")}</div>
    </div>`;
  }
  /* time for lessons finished before time tracking started: estimated from each lesson's reading time */
  App.grcTime = async () => {
    try { await loadGrc(); } catch (e) {}
    const rows = (await App.loadTime()).filter(r => /^grc/.test(r.domain || ""));
    const seen = new Set(rows.filter(r => r.topic).map(r => r.domain.slice(4) + ":" + r.topic));
    const est = { total: 0, n: 0, byMod: {}, byLesson: {} };
    (window.GRC_COURSE || []).forEach(m => m.lessons.forEach(l => { const k = m.id + ":" + l.id;
      if (grcDone()[k] && !seen.has(k)) { grcMins(l); const s = Math.round(grcRaw(l) * (grcScale || 1) * 60); est.total += s; est.n++; est.byMod[m.id] = (est.byMod[m.id] || 0) + s; est.byLesson[k] = s; } }));
    return { rows, est, tracked: rows.reduce((n, r) => n + r.seconds, 0) };
  };
  App.grcStats = () => {
    const C = window.GRC_COURSE || [], ans = S.grcAns || {}, all = C.reduce((n, m) => n + m.lessons.length, 0), done = C.reduce((n, m) => n + grcProg(m).d, 0);
    const aN = Object.keys(ans).length, aOk = Object.values(ans).filter(Boolean).length;
    const tested = (window.GRC_CONTROLS ? ctrls() : []).filter(c => overall(c) !== "Not tested");
    const wrong = Object.keys(ans).filter(k => !ans[k] && !(S.grcAnsSeen || {})[k]);
    const byMod = C.map(m => { const ks = Object.keys(ans).filter(k => k.startsWith(m.id + ":")); return { m, p: grcProg(m), n: ks.length, v: ks.length ? Math.round(ks.filter(k => ans[k]).length / ks.length * 100) : null }; });
    const lessonsPct = all ? Math.round(done / all * 100) : 0, acc = aN ? Math.round(aOk / aN * 100) : null, prac = Math.min(100, tested.length * 10);
    const score = Math.round(lessonsPct * .5 + (acc || 0) * .3 * Math.min(1, aN / 20) + prac * .2);
    return { C, all, done, lessonsPct, aN, aOk, acc, tested, prac, wrong, byMod, score };
  };
  function grcDeskMore(st, T0) {
    const C = st.C, ans = S.grcAns || {};
    // module progress
    const mods = C.map(m => { const p = grcProg(m), b = st.byMod.find(x => x.m === m); return { m, p, v: b ? b.v : null, n: b ? b.n : 0 }; });
    // last 14 days of GRC time
    const byDay = {}; T0.rows.forEach(r => { byDay[r.day] = (byDay[r.day] || 0) + r.seconds; });
    const days = Array.from({ length: 14 }, (_, i) => { const d = ymd(addDays(today(), i - 13)); return [d, byDay[d] || 0]; });
    const maxD = Math.max(600, ...days.map(x => x[1])), tot14 = days.reduce((n, x) => n + x[1], 0), act = days.filter(x => x[1] >= 300).length;
    // control test results
    const CC = window.GRC_CONTROLS ? ctrls() : [], res = ["Effective", "Partially effective", "Ineffective", "In progress", "Not tested"].map(k => [k, CC.filter(c => overall(c) === k).length]);
    const cls = { "Effective": "ef", "Partially effective": "pa", "Ineffective": "in", "In progress": "ip", "Not tested": "nt" };
    // vendors and evidence
    const V = S.grcVendors || [], vRows = V.map(v => ({ v, sc: vScore(v), R: vRisks(v) })), vHigh = vRows.reduce((n, x) => n + x.R.filter(r => r.sev === "high").length, 0), vLate = vRows.filter(x => ["overdue", "never"].includes(vRev(x.v, x.sc.tier))).length;
    const cal = CC.length ? calItems() : [], nx = cal[0], thisMonth = nx ? cal.filter(x => x.y === nx.y && x.m === nx.m) : [];
    const B = (window.GRC_BRIEFINGS || [])[0];
    return `<div class="gd-grid">
      <section class="card gd-panel gd-mods" aria-label="Progress by module"><div class="gd-head"><h3>Course by module</h3><a href="#course">All modules →</a></div>
        ${mods.map(x => `<a class="gd-mod" href="#/grc/${x.m.id}" title="${esc(x.m.title)}: ${x.p.d} of ${x.p.t} lessons${x.v != null ? `, ${x.v}% right first time` : ""}"><span class="gd-mn">${x.m.n}</span><span class="gd-ml">${esc(x.m.short || x.m.title)}</span><span class="gd-mt"><i style="width:${x.p.pct}%"></i></span><span class="gd-mv">${x.p.d}/${x.p.t}</span><span class="gd-ma ${x.v == null ? "" : x.v >= 80 ? "hi" : x.v >= 60 ? "mid" : "lo"}">${x.v == null ? "-" : x.v + "%"}</span></a>`).join("")}
        <p class="hint">Bar: lessons done. Right: questions right first time.</p></section>
      <section class="card gd-panel" aria-label="Last 14 days"><div class="gd-head"><h3>Last 14 days</h3><a href="#/grc/insights">Insights →</a></div>
        <div class="gd-spark" role="img" aria-label="GRC study time per day for the last 14 days, ${fmtDur(tot14)} in total">${days.map(([d, v]) => `<span title="${fmtD(d)}: ${fmtDur(v)}"><i style="height:${v ? Math.max(6, Math.round(v / maxD * 100)) : 0}%"></i></span>`).join("")}</div>
        <div class="gd-axis"><span>${fmtD(days[0][0])}</span><span>today</span></div>
        <div class="gd-nums"><div><b>${fmtDur(tot14)}</b><span>studied</span></div><div><b>${act}</b><span>days with 5+ min</span></div><div><b>${App.streak()}</b><span>day streak</span></div></div></section>
      <section class="card gd-panel" aria-label="Controls tested"><div class="gd-head"><h3>Controls tested</h3><a href="#/grc/controls">Workbench →</a></div>
        <div class="gd-split" role="img" aria-label="${res.map(([k, n]) => `${k}: ${n}`).join(", ")}">${res.filter(([, n]) => n).map(([k, n]) => `<span class="${cls[k]}" style="flex:${n}" title="${k}: ${n}"></span>`).join("")}</div>
        <ul class="gd-legend">${res.map(([k, n]) => `<li><i class="${cls[k]}"></i>${k}<b>${n}</b></li>`).join("")}</ul>
        ${thisMonth.length ? `<p class="gd-note"><b>${thisMonth.length}</b> evidence items due by ${fmtD(ymd(thisMonth[0].due))}. <a href="#/grc/calendar">Calendar →</a></p>` : ""}</section>
      <section class="card gd-panel" aria-label="Vendors"><div class="gd-head"><h3>Vendors</h3><a href="#/grc/vendors">Register →</a></div>
        ${V.length ? `<div class="gd-nums"><div><b>${V.length}</b><span>vendors</span></div><div><b>${vRows.filter(x => x.sc.tier === 1).length}</b><span>Tier 1</span></div><div><b class="${vHigh ? "warn" : ""}">${vHigh}</b><span>high risks</span></div><div><b class="${vLate ? "warn" : ""}">${vLate}</b><span>reviews overdue</span></div></div>`
          : `<p class="hint" style="margin-top:0">No vendors yet. Add your own, or load six examples to practise tiering and spotting gaps.</p><a class="btn small" href="#/grc/vendors">Open the vendor register</a>`}
        ${B ? `<a class="gd-brief" href="#/grc/briefings/${B.id}"><span class="kicker">Latest briefing</span><b>${esc(B.t)}</b></a>` : ""}</section>
    </div>
    <nav class="gd-quick" aria-label="Quick links">${[["#/grc/rooms", "⏱", "Scenario rooms"], ["#/grc/controls", "◇", "Workbench"], ["#/grc/map/iso", "⊞", "Framework map"], ["#/grc/calendar", "▦", "Evidence calendar"], ["#/grc/vendors", "⇄", "Vendors"], ["#/grc/landscape", "⚖", "Regulators"], ["#/grc/budget", "₹", "Budget planner"], ["#/grc/spend", "❖", "CEO and CFO guide"], ["#/grc/labs", "◎", "Labs"], ["#/grc/glossary", "Aa", "Glossary"]].map(([h, i, t]) => `<a href="${h}"><span aria-hidden="true">${i}</span>${t}</a>`).join("")}</nav>`;
  }
  async function grcDesk() {
    const st = App.grcStats(), T0 = await App.grcTime(), C = st.C;
    const wk = T0.rows.filter(r => r.day >= ymd(addDays(today(), -6))).reduce((n, r) => n + r.seconds, 0), allTime = T0.tracked + T0.est.total;
    const hr = new Date().getHours(), greet = hr < 5 ? "Up late" : hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const lastM = S.grcLast && grcMod(S.grcLast.m), lastL = lastM && lastM.lessons.find(x => x.id === S.grcLast.l);
    const nx = grcNext(), cur = lastL && !grcDone()[grcKey(lastM.id, lastL.id)] ? { m: lastM, l: lastL } : nx;
    const untested = (window.GRC_CONTROLS ? ctrls() : []).find(c => overall(c) === "Not tested");
    const notes = Object.keys(S.notes || {}).filter(k => k.startsWith("grc:")).length;
    const band = st.score >= 75 ? "good" : st.score >= 50 ? "ok" : "low", label = st.score >= 75 ? "Interview ready" : st.score >= 50 ? "Getting there" : st.score >= 20 ? "Building up" : "Early days";
    const R = 2 * Math.PI * 42;
    const weakMod = st.byMod.filter(x => x.n >= 3).sort((a, b) => a.v - b.v)[0];
    const tips = [cur && { t: `Read ${cur.m.n}.${cur.m.lessons.indexOf(cur.l) + 1} ${cur.l.title}`, h: `#/grc/${cur.m.id}/${cur.l.id}` },
      weakMod && weakMod.v < 80 && { t: `Revisit module ${weakMod.m.n}: ${weakMod.v}% right first time`, h: `#/grc/${weakMod.m.id}` },
      st.wrong.length && { t: `Review ${st.wrong.length} question${st.wrong.length > 1 ? "s" : ""} you got wrong`, h: "#/grc/log" },
      untested && st.tested.length < 10 && { t: `Test a control: ${untested.id} ${untested.title}`, h: `#/grc/controls/${untested.id}` }].filter(Boolean).slice(0, 3);
    const part = (k, v, w) => `<div class="rd-part"><span>${k} <small>${w}</small></span><span class="meter"><i style="width:${v == null ? 0 : v}%"></i></span><b>${v == null ? "-" : v + "%"}</b></div>`;
    const tile = (o) => `<a class="tile" href="${o.href}"><span class="tile-k">${o.k}</span><b class="tile-v">${o.v}</b><span class="tile-s">${o.s}</span>${o.pct != null ? `<span class="meter"><i style="width:${Math.max(0, Math.min(100, o.pct))}%"></i></span>` : ""}<span class="tile-go">${o.go} →</span></a>`;
    const todo = [cur && { t: `Read lesson ${cur.m.n}.${cur.m.lessons.indexOf(cur.l) + 1}: ${cur.l.title}`, h: `#/grc/${cur.m.id}/${cur.l.id}` },
      untested && { t: `Rate one control: ${untested.id} ${untested.title}`, h: `#/grc/controls/${untested.id}` },
      st.wrong.length ? { t: `Go over ${Math.min(3, st.wrong.length)} questions from your mistakes log`, h: "#/grc/log" } : { t: "Learn five terms in the GRC glossary", h: "#/grc/glossary" }].filter(Boolean);
    const order = C.map(m => ({ m, p: grcProg(m) })).filter(x => x.p.pct < 100).sort((a, b) => (b.p.d > 0) - (a.p.d > 0) || a.m.n - b.m.n).slice(0, 4);
    return `<header class="dash-head">
        <div><div class="kicker">${greet}, ${esc(App.firstName())}</div><h1 class="dash-title">Your GRC desk</h1>
          <p class="sub" style="margin:4px 0 0">Governance, risk and compliance, one lesson at a time.</p></div>
        <div class="dash-chips"><span><b>${st.lessonsPct}%</b> of the course</span><span><b>${App.streak()}</b> day streak</span><span><b>${fmtDur(wk)}</b> this week</span></div>
      </header>
      <section class="dash-main">
        ${cur ? `<a class="card dash-continue" href="#/grc/${cur.m.id}/${cur.l.id}" style="--dc:var(--gold-ink)">
          <span class="kicker" style="--kc:var(--gold-ink)">${lastL ? "Pick up where you left off" : "Start here"}</span>
          <h2>${cur.m.n}.${cur.m.lessons.indexOf(cur.l) + 1} ${esc(cur.l.title)}</h2>
          <p>Module ${cur.m.n} ${esc(cur.m.title)} · ${grcProg(cur.m).d} of ${grcProg(cur.m).t} lessons done</p>
          <span class="meter"><i style="width:${grcProg(cur.m).pct}%"></i></span>
          ${(() => { const at = cur.m.lessons.indexOf(cur.l), up = cur.m.lessons.slice(at + 1).filter(x => !grcDone()[grcKey(cur.m.id, x.id)]).slice(0, 3);
            return up.length ? `<div class="dc-next"><span class="dc-next-k">Then</span>${up.map(x => `<span class="dc-next-i"><b>${cur.m.n}.${cur.m.lessons.indexOf(x) + 1}</b> ${esc(x.title)}</span>`).join("")}</div>` : ""; })()}
          <span class="btn primary">${lastL ? "Continue" : "Start"} →</span></a>`
          : `<a class="card dash-continue" href="#/grc/controls"><span class="kicker">Every lesson done</span><h2>Now practise like an auditor</h2><p>Rate controls in the workbench and run the labs.</p><span class="btn primary">Open the workbench →</span></a>`}
        <div class="card dash-today"><h3>Today</h3><p class="today-line">Three things worth twenty minutes:</p>
          <ul class="grc-todo">${todo.map(x => `<li><a href="${x.h}">${esc(x.t)} →</a></li>`).join("")}</ul>
          <a class="btn small ghost" href="#/grc/guide">20-day plan in the field guide →</a></div>
      </section>
      ${App.reviewCard(true)}
      <section class="card rd" aria-label="GRC readiness">
        <div class="rd-ring ${band}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" class="trk"/><circle cx="50" cy="50" r="42" class="val" stroke-dasharray="${(st.score / 100 * R).toFixed(1)} ${R.toFixed(1)}"/></svg><div><b>${st.score}</b><small>of 100</small></div></div>
        <div class="rd-body"><span class="kicker">GRC readiness</span><h3>${label}</h3>
          ${part("Lessons done", st.lessonsPct, "50%")}${part("Questions right first time", st.acc, "30%")}${part("Controls tested (10 = full)", st.prac, "20%")}
          ${tips.length ? `<p class="rd-next"><b>Biggest gains next:</b></p><ul class="rd-tips">${tips.map(t => `<li><a href="${t.h}">${esc(t.t)} →</a></li>`).join("")}</ul>` : ""}
          <p class="hint">An estimate from your own activity. Around 75, with ten controls tested, you can talk through a GRC Manager interview with confidence.</p></div>
      </section>
      <h2 class="h-section">Where you are</h2>
      <div class="dash-grid">
        ${tile({ k: "Lessons", v: `${st.done}<small>/${st.all}</small>`, s: `${C.filter(m => grcProg(m).pct === 100).length} of ${C.length} modules finished`, pct: st.lessonsPct, go: cur ? "Continue" : "Course", href: cur ? `#/grc/${cur.m.id}/${cur.l.id}` : "#course" })}
        ${tile({ k: "Lesson questions", v: st.acc == null ? "-" : st.acc + "%", s: st.aN ? `${st.aN} answered · right first time` : "answer the checks in each lesson", pct: st.acc, go: st.wrong.length ? "Mistakes log" : "Insights", href: st.wrong.length ? "#/grc/log" : "#/grc/insights" })}
        ${tile({ k: "Controls tested", v: `${st.tested.length}<small>/${window.GRC_CONTROLS ? ctrls().length : 53}</small>`, s: "design and operation rated", pct: st.prac, go: "Workbench", href: "#/grc/controls" })}
        ${tile({ k: "Study time", v: fmtDur(allTime), s: T0.est.n ? `in all, incl. about ${fmtDur(T0.est.total)} estimated` : `${fmtDur(wk)} this week`, pct: null, go: "GRC insights", href: "#/grc/insights" })}
        ${tile({ k: "Mistakes to review", v: `${st.wrong.length}`, s: "questions you got wrong", pct: null, go: "Mistakes log", href: "#/grc/log" })}
        ${tile({ k: "Notes", v: `${notes}`, s: "lessons with your own note", pct: null, go: "GRC notes", href: "#/grc/notes" })}
      </div>
      ${grcDeskMore(st, T0)}
      ${order.length ? `<h2 class="h-section">What to work on next</h2><p class="sub">Modules you have started come first, then the rest in course order.</p>
      <div class="card grc-order">${order.map(x => `<a class="grc-order-row" href="#/grc/${x.m.id}"><span class="grc-n">${String(x.m.n).padStart(2, "0")}</span><span><b>${esc(x.m.title)}</b><small>${x.p.d} of ${x.p.t} lessons${(() => { const b = st.byMod.find(y => y.m === x.m); return b && b.v != null ? ` · ${b.v}% right first time` : ""; })()}</small></span><span class="meter"><i style="width:${x.p.pct}%"></i></span><span class="tile-go">${x.p.d ? "Continue" : "Start"} →</span></a>`).join("")}</div>` : ""}`;
  }
  function grcSetup() {
    const G = window.GRC_ORACLE; if (!G) return "";
    return `<div class="page-narrow grc-setup">
      <a class="kicker" href="#/grc/labs">← Hands-on labs</a>
      <h1 class="h-display">Run CISO Assistant <em>free</em></h1>
      <p class="lede">${esc(G.intro)}</p>
      <div class="card"><h3>You need</h3><ul>${G.need.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <h3 style="margin-top:14px">Useful links</h3><ul>${G.links.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join("")}</ul></div>
      <nav class="setup-toc" aria-label="Steps"><ol>${G.steps.map(s => `<li><a href="#/grc/setup" data-jump="st-${s.id}">${esc(s.t)}</a></li>`).join("")}</ol></nav>
      ${G.steps.map((s, i) => `<section class="setup-step prose" id="st-${s.id}"><h2><span class="setup-n">${i + 1}</span>${esc(s.t)}</h2>${s.body}</section>`).join("")}
      <p class="hint">Written from CISO Assistant’s own install files. Oracle’s console changes from time to time; if a button has moved, search for its name in the console’s search box.</p>
    </div>`;
  }
  function grcNotes() {
    const C = window.GRC_COURSE || [], N = S.notes || {};
    const groups = C.map(m => ({ m, items: m.lessons.map((l, i) => ({ l, i, n: N["grc:" + m.id + ":" + l.id] })).filter(x => x.n) })).filter(g => g.items.length);
    return `<div class="page-narrow">
      <div class="kicker">GRC notes</div>${App.branchTabs("grc", "#/notes", "#/grc/notes")}
      <h1 class="h-display">In your <em>own words</em></h1>
      <p class="lede">Notes you write on GRC lessons, collected by module. Use <b>✎ Add a note</b> under any lesson title.</p>
      ${groups.length ? `<div class="filters"><button class="btn small" id="grcNotesExport">Download as a text file</button></div>` + groups.map(g => `<h2 class="h-section">${g.m.n}. ${esc(g.m.title)}</h2>
        ${g.items.map(x => `<div class="card note-card"><div class="note-top"><a href="#/grc/${g.m.id}/${x.l.id}"><b>${g.m.n}.${x.i + 1} ${esc(x.l.title)}</b></a><small class="hint">${fmtD(x.n.at)}</small></div><p class="note-text">${esc(x.n.t).replace(/\n/g, "<br>")}</p></div>`).join("")}`).join("")
        : `<div class="card" style="margin-top:24px"><h3>Nothing here yet</h3><p>Open a lesson and tap <b>✎ Add a note</b> under the title.</p><a class="btn small primary" href="#/grc#course">Open the course</a></div>`}
    </div>`;
  }
  function grcLog() {
    const st = App.grcStats(), C = st.C, ans = S.grcAns || {};
    const items = st.wrong.map(k => { const [mi, li, qi] = k.split(":"), m = grcMod(mi), l = m && m.lessons.find(x => x.id === li), q = l && l.checks[+qi]; return q ? { k, m, l, q } : null; }).filter(Boolean);
    const weak = st.tested.filter(c => /Ineffective|Partially/.test(overall(c)));
    return `<div class="page-narrow">
      <div class="kicker">Mistakes log · GRC</div>${App.branchTabs("grc", "#/tracker", "#/grc/log")}
      <h1 class="h-display">Learn from <em>misses</em></h1>
      <p class="lede">Every lesson question you got wrong the first time, with the right answer and why, plus controls you rated as not working. Mark a question as reviewed once it makes sense.</p>
      <section class="facts" style="border-top:1px solid var(--rule)">
        <div class="fact"><b>${st.aN}</b><span>questions answered</span></div>
        <div class="fact"><b>${st.acc == null ? "-" : st.acc + "%"}</b><span>right first time</span></div>
        <div class="fact"><b>${items.length}</b><span>to review</span></div>
        <div class="fact"><b>${weak.length}</b><span>weak controls</span></div>
      </section>
      <h2 class="h-section">Questions to review</h2>
      ${items.length ? items.map(x => `<div class="card grc-miss"><div class="kicker">${x.m.n}.${x.m.lessons.indexOf(x.l) + 1} ${esc(x.l.title)}</div><p class="qc-q">${esc(x.q.q)}</p>
        <p><b style="color:var(--good)">Right answer:</b> ${esc(x.q.o[x.q.a])}</p><div class="why">${esc(x.q.w)}</div>
        <div class="btn-row"><a class="btn small" href="#/grc/${x.m.id}/${x.l.id}">Open the lesson</a><button class="btn small ghost" data-logdone="${esc(x.k)}">Mark as reviewed</button></div></div>`).join("")
        : `<p class="sub">${st.aN ? "Nothing to review. Every question you answered was right, or you have reviewed it." : "Answer the questions at the end of each lesson and any you miss will show here."}</p>`}
      <h2 class="h-section">Controls that need work</h2>
      ${weak.length ? `<div class="card">${weak.map(c => `<div class="kv"><a href="#/grc/controls/${c.id}">${esc(c.id)} ${esc(c.title)}</a><b>${overall(c)}</b></div>`).join("")}</div>`
        : `<p class="sub">No control is rated ineffective or partly effective. <a href="#/grc/controls">Open the workbench</a> to test more.</p>`}
    </div>`;
  }
  function grcReading(sec) {
    const R = window.GRC_READING_ROOM || [];
    const cc0 = (window.GRC_LIBRARY || []).filter(d => /^cc0-/.test(d.id));
    const list = sec ? R.filter(x => x.id === sec) : R;
    return `<div class="page grc-reading">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">Reading <em>room</em></h1>
      <p class="lede">What to read, which tools to try, whose work to follow and which certifications matter, summarised here so you don’t have to leave the site. Names of standards and books are given so you can find them later.</p>
      <nav class="chips" aria-label="Sections">${R.map(x => `<a class="chip${x.id === sec ? " on" : ""}" href="#/grc/reading/${x.id}">${esc(x.title)}</a>`).join("")}${sec ? `<a class="chip" href="#/grc/reading">Show all</a>` : ""}</nav>
      ${list.map(x => `<section class="grc-rr" id="rr-${x.id}"><h2 class="h-section">${esc(x.title)}</h2>
        <div class="grc-rr-list">${x.items.map(([t, d, u]) => `<div class="card grc-rr-item"><h3>${esc(t)}</h3><p>${esc(d)}</p>${u ? `<a class="rr-link" href="${esc(u)}" target="_blank" rel="noopener">Read the original ↗</a>` : ""}</div>`).join("")}</div></section>`).join("")}
      ${!sec && cc0.length ? `<section class="grc-rr"><h2 class="h-section">Curated lists, in full</h2><p class="sub">Public-domain (CC0) lists, copied into the library so you can read them here.</p>
        <div class="grc-rr-list">${cc0.map(d => `<a class="card grc-rr-item" href="#/grc/library/${d.id}"><h3>${esc(d.title)} →</h3><p>Open in the library</p></a>`).join("")}</div></section>` : ""}
    </div>`;
  }
  function grcModule(m) {
    const p = grcProg(m);
    return `<div class="page-narrow grc-module">
      <a class="kicker" href="#/grc">← Learn GRC</a>
      <h1 class="h-display">${esc(m.title)}</h1>
      <p class="lede">${esc(m.lede)}</p>
      <div class="meter" style="margin:10px 0 24px"><i style="width:${p.pct}%;background:var(--accent)"></i></div>
      <ol class="grc-lessons">${m.lessons.map((l, i) => `<li><a href="#/grc/${m.id}/${l.id}" class="${grcDone()[grcKey(m.id, l.id)] ? "done" : ""}"><span class="grc-ln">${m.n}.${i + 1}</span><span><b>${esc(l.title)}</b><small>◷ ${grcMins(l)} min · ${l.checks.length} questions</small></span><span class="grc-tick">${grcDone()[grcKey(m.id, l.id)] ? "✓" : "→"}</span></a></li>`).join("")}</ol>
    </div>`;
  }
  function grcLesson(m, l) {
    const C = window.GRC_COURSE, i = m.lessons.indexOf(l), flat = C.flatMap(x => x.lessons.map(y => ({ m: x, l: y })));
    const at = flat.findIndex(x => x.m === m && x.l === l), nx = flat[at + 1], pv = flat[at - 1];
    const L = ["A", "B", "C", "D"];
    return `<article class="chapter sec-page grc-lesson">
      <div class="ch-bar"><a class="ch-bar-title" href="#/grc/${m.id}"><span class="kicker">Module ${String(m.n).padStart(2, "0")} · Learn GRC</span><b>${esc(m.title)}</b></a>
        <div class="ch-bar-prog"><span class="meter"><i style="width:${grcProg(m).pct}%"></i></span><span>${grcProg(m).pct}%</span></div></div>
      <nav class="steps" aria-label="Lessons in this module">${m.lessons.map((x, j) => `<a href="#/grc/${m.id}/${x.id}" class="${x === l ? "on" : ""} ${grcDone()[grcKey(m.id, x.id)] ? "done" : ""}" title="${esc(x.title)}">${m.n}.${j + 1}</a>`).join("")}</nav>
      <div class="prose">
        <div class="sec-head"><span class="sec-num">${m.n}.${i + 1}</span><h2>${esc(l.title)}</h2></div>
        <div class="sec-tools"><span class="sec-time">◷ ${grcMins(l)} min</span>
          <button class="chip-btn ${((S.notes || {})["grc:" + m.id + ":" + l.id] || {}).t ? "on" : ""}" id="secNoteBtn" aria-expanded="false">✎ ${((S.notes || {})["grc:" + m.id + ":" + l.id] || {}).t ? "My note" : "Add a note"}</button></div>
        <div class="sec-note" id="secNote" hidden><textarea id="secNoteText" maxlength="4000" placeholder="In your own words: what would you tell a colleague about this?">${esc(((S.notes || {})["grc:" + m.id + ":" + l.id] || {}).t || "")}</textarea><small class="hint" id="secNoteState">Saved automatically. All GRC notes are in <a href="#/grc/notes">GRC notes</a>.</small></div>
        ${l.body}
        <div class="memorise grc-remember"><div class="kicker">Remember</div><ul>${l.remember.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>
      <div class="grc-checks"><h3>Check yourself</h3>
        ${l.checks.map((q, k) => { const sq = App.shuffleQ(q, m.id + l.id + k); return `<div class="qc grc-q" data-k="${m.id}:${l.id}:${k}" data-a="${sq.a}" data-w="${esc(q.w)}"><p class="qc-q">${esc(q.q)}</p><div class="qc-opts">${sq.o.map((o, j) => `<button class="opt" data-gq="${j}"><span class="l">${L[j]}</span><span>${esc(o)}</span></button>`).join("")}</div><div class="grc-why"></div></div>`; }).join("")}
      </div>
      ${App.diffBar("grc:" + m.id + ":" + l.id)}
      <div class="sec-finish">
        ${nx ? `<a class="start-btn" id="grcNext" href="#/grc/${nx.m.id}/${nx.l.id}" data-key="${grcKey(m.id, l.id)}"><span><small>${grcDone()[grcKey(m.id, l.id)] ? "Next" : "Got it · next"}${nx.m !== m ? " module" : ""}</small><b>${nx.m.n}.${nx.m.lessons.indexOf(nx.l) + 1} ${esc(nx.l.title)}</b></span><span class="start-arrow" aria-hidden="true">→</span></a>`
          : `<a class="start-btn" id="grcNext" href="#/grc" data-key="${grcKey(m.id, l.id)}"><span><small>Last lesson</small><b>Finish the course</b></span><span class="start-arrow" aria-hidden="true">✓</span></a>`}
        <div class="sec-pager">${pv ? `<a href="#/grc/${pv.m.id}/${pv.l.id}">← ${pv.m.n}.${pv.m.lessons.indexOf(pv.l) + 1} ${esc(pv.l.title)}</a>` : `<a href="#/grc">← Learn GRC</a>`}<a href="#/grc/${m.id}" class="skip">All lessons in this module</a></div>
      </div>
    </article>`;
  }
  // The field guide is a small React bundle; load it once, then mount it inside this page.
  const grcVer = () => { const t = document.querySelector('script[src*="assets/js/app.js"]'); const m = t && t.src.match(/[?&]v=([^&]+)/); return m ? m[1] : "dev"; };
  let guideLoad = null;
  function loadGuide() {
    if (window.mountGrcGuide) return Promise.resolve();
    if (guideLoad) return guideLoad;
    const v = grcVer();
    if (!document.querySelector('link[href*="assets/grc/grc.css"]')) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "assets/grc/grc.css?v=" + v; document.head.appendChild(l); }
    guideLoad = new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "assets/grc/grc.js?v=" + v; sc.onload = ok; sc.onerror = () => { guideLoad = null; no(); }; document.head.appendChild(sc); });
    return guideLoad;
  }
  function bindGrc(r) {
    if (r.a === "insights" && App.bindInsights) App.bindInsights();
    $$("pre[data-copy]").forEach(pre => { const b = document.createElement("button"); b.className = "copy-btn"; b.type = "button"; b.textContent = "Copy";
      b.addEventListener("click", async () => { try { await navigator.clipboard.writeText(pre.firstChild.textContent); b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy"; }, 1500); } catch (e) { toast("Copy didn’t work here. Select the text instead."); } });
      pre.appendChild(b); });
    $$("[data-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const el = document.getElementById(a.dataset.jump); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    if (r.a === "shelf" && App.bindLibrary) App.bindLibrary(true);
    if (grcMod(r.a) && r.b) {
      S.grcLast = { m: r.a, l: r.b }; save();
      const k = "grc:" + r.a + ":" + r.b, nb = $("#secNoteBtn"), box = $("#secNote"), ta = $("#secNoteText");
      if (nb && box && ta) {
        nb.addEventListener("click", () => { box.hidden = !box.hidden; nb.setAttribute("aria-expanded", String(!box.hidden)); if (!box.hidden) ta.focus(); });
        let t = null;
        ta.addEventListener("input", () => { clearTimeout(t); $("#secNoteState").textContent = "Saving…";
          t = setTimeout(() => { S.notes = S.notes || {}; const v = ta.value.trim();
            if (v) S.notes[k] = { t: v, at: new Date().toISOString() }; else delete S.notes[k];
            save(); nb.classList.toggle("on", !!v); nb.textContent = "✎ " + (v ? "My note" : "Add a note");
            $("#secNoteState").innerHTML = 'Saved. All GRC notes are in <a href="#/grc/notes">GRC notes</a>.'; }, 600); });
        ta.addEventListener("keydown", e => e.stopPropagation());
      }
    }
    if (r.a === "vendors") bindVendors();
    if (r.a === "budget" && window.GRC_BUDGET) window.GRC_BUDGET.bind();
    if (r.a === "rooms") bindRooms(r);
    if (r.a === "favourites") bindFavourites();
    $$("[data-landf]").forEach(b => b.addEventListener("click", () => { landF = landF === b.dataset.landf ? "all" : b.dataset.landf; App.rerender(); }));
    $$("[data-glview]").forEach(b => b.addEventListener("click", () => { grcGview = b.dataset.glview; App.rerender(); }));
    $$(".vz-mat[data-l]").forEach(fig => { const L = +fig.dataset.l, I = +fig.dataset.i, g = fig.querySelector(".vz-grid"); let h = "";
      for (let l = 5; l >= 1; l--) { h += `<span class="vz-yl">${l}</span>`; for (let i = 1; i <= 5; i++) { const s = l * i, c = s >= 15 ? "c4" : s >= 10 ? "c3" : s >= 5 ? "c2" : "c1"; h += `<span class="vz-cell ${c} ${l === L && i === I ? "hit" : ""}">${l === L && i === I ? s : ""}</span>`; } }
      h += `<span></span>` + [1, 2, 3, 4, 5].map(i => `<span class="vz-xl">${i}</span>`).join(""); g.innerHTML = h; g.setAttribute("role", "img"); g.setAttribute("aria-label", `5 by 5 risk matrix, risk plotted at likelihood ${L}, impact ${I}, score ${L * I}`); });
    $$(".vz-sec").forEach(sec => { const t = sec.querySelector("h2").textContent; sec.querySelectorAll(".tbl-wrap").forEach((w, i) => w.setAttribute("aria-label", `${t}: table ${i + 1}`)); });
    if (r.a === "visuals" && r.b) { const el = document.getElementById("vz-" + r.b); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); }
    $$("[data-logdone]").forEach(b => b.addEventListener("click", () => { S.grcAnsSeen = S.grcAnsSeen || {}; S.grcAnsSeen[b.dataset.logdone] = 1; save(); App.rerender(); }));
    const ne = $("#grcNotesExport"); if (ne) ne.addEventListener("click", () => {
      let out = "LearNtime - my GRC notes\n" + new Date().toLocaleDateString("en-GB") + "\n";
      (window.GRC_COURSE || []).forEach(m => { const items = m.lessons.map((l, i) => ({ l, i, n: (S.notes || {})["grc:" + m.id + ":" + l.id] })).filter(x => x.n);
        if (items.length) { out += `\n# ${m.n}. ${m.title}\n`; items.forEach(x => { out += `\n## ${m.n}.${x.i + 1} ${x.l.title}\n${x.n.t}\n`; }); } });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out], { type: "text/markdown" })); a.download = `grc-notes-${ymd(today())}.md`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
    if (r.a === "guide") { const el = $("#grc-guide"); if (el) loadGuide().then(() => { if (el.isConnected) { el.innerHTML = ""; window.mountGrcGuide(el); } }).catch(() => { el.innerHTML = '<p class="sub" style="padding:40px 0;text-align:center">Couldn’t load the field guide. Check your connection and try again.</p>'; }); }
    if (["controls", "map", "calendar"].includes(r.a)) bindCcf(r);
    const pc = $("#pbcCsv"); if (pc) pc.addEventListener("click", () => {
      const csv = pbcRows().map(r => r.map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(",")).join("\r\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); a.download = "pbc-list-soc2-iso27001.csv"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500); db.logEvent("user.pbc_download", {});
    });
    const pcp = $("#pbcCopy"); if (pcp) pcp.addEventListener("click", async () => {
      const tsv = pbcRows().map(r => r.join("\t")).join("\n");
      try { await navigator.clipboard.writeText(tsv); toast("Copied. Paste into Excel or Google Sheets."); } catch (e) { toast("Copy didn’t work here. Use Download for Excel."); }
    });
    const gg = $("#grcGq"); if (gg) gg.addEventListener("input", () => { grcGq = gg.value; clearTimeout(gg._t); gg._t = setTimeout(() => { App.rerender(); setTimeout(() => { const n = $("#grcGq"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 250); });
    if (r.a === "glossary" && r.b) { const el = document.getElementById("gg-" + decodeURIComponent(r.b)); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "center" })); }
    const q = $("#libQ"); if (q) q.addEventListener("input", () => { libQ = q.value; clearTimeout(q._t); q._t = setTimeout(() => { App.rerender(); setTimeout(() => { const n = $("#libQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 250); });
    const n = $("#grcNext"); if (n) n.addEventListener("click", () => { grcDone()[n.dataset.key] = ymd(today()); save(); });
    $$(".grc-q").forEach(box => $$("[data-gq]", box).forEach(b => b.addEventListener("click", () => {
      const j = +b.dataset.gq, a = +box.dataset.a, ok = j === a;
      S.grcAns = S.grcAns || {}; if (box.dataset.k && !(box.dataset.k in S.grcAns)) { S.grcAns[box.dataset.k] = ok ? 1 : 0; save(); }
      $$("[data-gq]", box).forEach((x, k) => { x.disabled = true; if (k === a) x.classList.add("correct"); else if (k === j) x.classList.add("wrong"); });
      box.querySelector(".grc-why").innerHTML = `<div class="why"><b style="color:${ok ? "var(--good)" : "var(--bad)"}">${ok ? "Correct." : "Not quite."}</b> ${box.dataset.w}</div>`;
      App.linkAbbr(box.querySelector(".grc-why"), "grc");
    })));
    if (r.a && r.b) {
      const ids = (grcMod(r.a) || { lessons: [] }).lessons.map(x => x.id), at = ids.indexOf(r.b);
      pageKeys = { prev: at > 0 ? `#/grc/${r.a}/${ids[at - 1]}` : null, next: n ? n.getAttribute("href") : null };
    }
  }
  App.register("grc", { render: viewGrc, bind: bindGrc, title: "Learn GRC", nav: "grc", area: "other" });
  App.register("revision", { render: viewRevision, bind: bindRevision, title: "Revision sheets", nav: "revision", area: "read" });
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
      ${(() => { const cis = `<div class="um-group" role="group" aria-label="CISSP"><span class="um-h">CISSP</span><a href="#/">Study desk</a><a href="#/insights">Insights</a><a href="#/notes">My notes</a><a href="#/library">My library</a><a href="#/tracker">Scores &amp; error log</a></div>`;
        if (!App.isPrivileged()) return cis;
        const grc = `<div class="um-group" role="group" aria-label="GRC"><span class="um-h">GRC</span><a href="#/grc">GRC desk</a><a href="#/grc/insights">Insights</a><a href="#/grc/notes">Notes</a><a href="#/grc/shelf">My shelf</a><a href="#/grc/favourites">Favourites</a><a href="#/grc/log">Mistakes log</a></div>`;
        return document.body.classList.contains("grc-mode") ? grc + cis : cis + grc; })()}
      <div class="um-group" role="group" aria-label="Account"><span class="um-h">Account</span><a href="#/profile">Profile &amp; exam dates</a><a href="#/privacy">Privacy &amp; my data</a>
      ${App.isAdmin() ? `<a href="#/admin">Admin console</a><a href="#/choose">Switch: study or admin</a>` : ""}</div>
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
  addEventListener("online", async () => { if (db.mode === "cloud" && db.user) { save(); const n = await db.flushQueue().catch(() => 0); toast(n ? `Back online. ${n} saved answers sent.` : "Back online"); } else toast("Back online"); });
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
  App.loadPlans = async () => { try { const pl = await db.plans(); if (pl && pl.length) App.plans = pl.map(p => Object.assign({}, (P.plans || []).find(x => x.id === p.id) || {}, p, { tagline: App.plainDashes(p.tagline), perks: (p.perks || []).map(App.plainDashes) })); } catch (e) {} };
  App.afterLogin = async function () {
    const uidv = db.mode === "cloud" ? db.user.id : "local";
    stateKey = "cissp.v1:" + uidv;
    const cloud = db.mode === "cloud";
    if (cloud) await db.flushQueue().catch(() => 0);  // answers saved while offline go first, so the totals below include them
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

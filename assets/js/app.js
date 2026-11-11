/* The CISSP Reader — application */
(function () {
  "use strict";

  const D = window.DOMAINS.slice().sort((a, b) => a.n - b.n);
  const P = window.PAGES;
  const byId = Object.fromEntries(D.map(d => [d.id, d]));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const view = $("#view");
  const toc = $("#toc");

  /* ---------------- storage ---------------- */
  const KEY = "cissp.v1";
  const blank = () => ({ read: {}, quiz: {}, scores: {}, mocks: [], errors: [], tasks: {}, hours: {}, last: null });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  let settings;
  try { settings = JSON.parse(localStorage.getItem("cissp.settings") || "{}"); } catch (e) { settings = {}; }
  const saveSettings = () => { try { localStorage.setItem("cissp.settings", JSON.stringify(settings)); } catch (e) {} };

  /* ---------------- helpers ---------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  const pad = n => String(n).padStart(2, "0");
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const parseD = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const daysTo = s => Math.round((parseD(s) - today()) / 864e5);
  const fmtD = s => parseD(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const fmtDY = s => parseD(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const prioLabel = { weak: "Priority · weak", medium: "Medium", strong: "Strength" };
  const words = d => d.sections.reduce((n, s) => n + strip(s.body).split(" ").length, strip(d.intro).split(" ").length);
  const readMins = d => Math.max(1, Math.round(words(d) / 220));
  const domProgress = d => { const r = d.sections.filter(s => S.read[d.id + ":" + s.id]).length; return { r, t: d.sections.length, pct: Math.round(r / d.sections.length * 100) }; };
  const allProgress = () => { let r = 0, t = 0; D.forEach(d => { const p = domProgress(d); r += p.r; t += p.t; }); return { r, t, pct: Math.round(r / t * 100) }; };
  const band = v => (v == null || v === "" || isNaN(v)) ? "none" : v >= 85 ? "green" : v >= 65 ? "orange" : "red";
  const bandLabel = { green: "Green", orange: "Orange", red: "Red", none: "—" };
  const dc = d => `--dc: var(--${d.id})`;

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2000);
  }

  /* ---------------- router ---------------- */
  function parse() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b, c] = h.split("/");
    return { page: a || "home", a: b, b: c };
  }

  let observer = null;
  let rendered = null;
  function route() {
    const r = parse();
    // same chapter: just scroll to the section, no re-render
    if (r.page === "domain" && rendered === "domain:" + r.a && byId[r.a]) {
      const el = document.getElementById(r.b || "") ;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); else window.scrollTo({ top: 0, behavior: "smooth" });
      S.last = { d: r.a, s: r.b || null }; save(); closeToc();
      return;
    }
    rendered = r.page === "domain" ? "domain:" + r.a : r.page;
    if (observer) { observer.disconnect(); observer = null; }
    closeToc();
    let html = "";
    switch (r.page) {
      case "home": html = viewHome(); break;
      case "read": html = viewChapters(); break;
      case "domain": html = byId[r.a] ? viewDomain(byId[r.a]) : viewChapters(); break;
      case "plan": html = viewPlan(); break;
      case "practice": html = viewPractice(r.a); break;
      case "tracker": html = viewTracker(); break;
      case "latest": html = viewLatest(); break;
      case "tactics": html = viewTactics(); break;
      case "resources": html = viewResources(); break;
      default: html = viewHome();
    }
    view.innerHTML = html + footer();
    view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter");
    renderToc(r);
    $$(".mainnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === (r.page === "domain" ? "read" : r.page)));
    document.documentElement.style.setProperty("--pc", r.page === "domain" && byId[r.a] ? `var(--${r.a})` : "var(--accent)");
    bind(r);
    if (r.page === "domain" && r.b) {
      const el = document.getElementById(r.b);
      if (el) { requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); } else window.scrollTo(0, 0);
    } else window.scrollTo(0, 0);
    if (r.page === "domain") { S.last = { d: r.a, s: r.b || null }; save(); }
    document.title = titleFor(r);
    onScroll();
  }
  function titleFor(r) {
    const base = "The CISSP Reader";
    if (r.page === "domain" && byId[r.a]) return `D${byId[r.a].n} ${byId[r.a].title} · ${base}`;
    const m = { read: "Chapters", plan: "Study plan", practice: "Practice", tracker: "Tracker", latest: "What’s new", tactics: "Exam tactics", resources: "Resources" };
    return m[r.page] ? `${m[r.page]} · ${base}` : base;
  }

  /* ---------------- TOC ---------------- */
  function renderToc(r) {
    const all = allProgress();
    let h = `<div class="mob-nav" style="display:none;gap:2px;margin-bottom:18px">
      ${[["home","Home"],["read","Chapters"],["plan","Plan"],["practice","Practice"],["tracker","Tracker"],["latest","What’s new"],["tactics","Exam tactics"],["resources","Resources"]].map(([k,v]) => `<a class="btn small ghost" style="border:0;justify-content:flex-start" href="#/${k === "home" ? "" : k}">${v}</a>`).join("")}
    </div>`;
    h += `<div class="toc-head">The eight chapters</div><ol class="toc-list">`;
    D.forEach(d => {
      const p = domProgress(d);
      const active = r.page === "domain" && r.a === d.id;
      h += `<li><a href="#/domain/${d.id}" class="${active ? "active" : ""}" style="${dc(d)};--dc:var(--${d.id})">
        <span class="toc-dot" style="background:var(--${d.id})"></span><span>${esc(d.short)}</span><span class="toc-pct">${p.pct}%</span></a>`;
      if (active) {
        h += `<ol class="toc-sub">` + d.sections.map((s, i) =>
          `<li><a href="#/domain/${d.id}/${s.id}" data-sec="${s.id}" class="${S.read[d.id + ":" + s.id] ? "read" : ""}">${d.n}.${i + 1} ${esc(s.title)}</a></li>`).join("") + `</ol>`;
      }
      h += `</li>`;
    });
    h += `</ol><div class="toc-head">Companion</div><ol class="toc-list">
      <li><a href="#/plan" class="${r.page === "plan" ? "active" : ""}"><span class="toc-num">◷</span>Study plan to Feb 2027</a></li>
      <li><a href="#/practice" class="${r.page === "practice" ? "active" : ""}"><span class="toc-num">?</span>Practice questions</a></li>
      <li><a href="#/tracker" class="${r.page === "tracker" ? "active" : ""}"><span class="toc-num">▦</span>Score tracker & error log</a></li>
      <li><a href="#/tactics" class="${r.page === "tactics" ? "active" : ""}"><span class="toc-num">◎</span>Exam tactics</a></li>
      <li><a href="#/latest" class="${r.page === "latest" ? "active" : ""}"><span class="toc-num">✦</span>What’s new, 2024–2026</a></li>
      <li><a href="#/resources" class="${r.page === "resources" ? "active" : ""}"><span class="toc-num">❏</span>Resources & the ISC2 guide</a></li>
    </ol>
    <div class="toc-card"><b>${all.pct}%</b>read · ${all.r} of ${all.t} sections<div class="meter" style="margin-top:10px"><i style="width:${all.pct}%;background:var(--accent)"></i></div></div>`;
    toc.innerHTML = h;
  }
  const closeToc = () => { toc.classList.remove("open"); $("#scrim").classList.remove("on"); };

  /* ---------------- views ---------------- */
  function countdown() {
    const t = daysTo(P.exam.target), dl = daysTo(P.exam.deadline);
    const tLbl = t > 0 ? "days to your target sit" : t === 0 ? "exam window opens today" : "target window reached";
    return `
      <div class="count target"><div class="count-num">${Math.max(t, 0)}</div><div class="count-lbl">${tLbl}<small>Target window 9–12 Feb 2027</small></div></div>
      <div class="count deadline"><div class="count-num">${Math.max(dl, 0)}</div><div class="count-lbl">days to the last possible date<small>Must sit on or before 18 Feb 2027</small></div></div>`;
  }

  function currentPhase() {
    const now = today();
    return P.phases.find(p => parseD(p.start) <= now && now <= parseD(p.end)) || (now < parseD(P.phases[0].start) ? P.phases[0] : null);
  }

  function viewHome() {
    const all = allProgress();
    const ph = currentPhase();
    const last = S.last && byId[S.last.d] ? byId[S.last.d] : null;
    const cont = last
      ? `<a class="btn primary" href="#/domain/${last.id}${S.last.s ? "/" + S.last.s : ""}">Continue reading · D${last.n} ${esc(last.short)} →</a>`
      : `<a class="btn primary" href="#/domain/d4">Start with Domain 4 →</a>`;
    const scored = D.filter(d => S.scores[d.id] && S.scores[d.id].latest !== "" && S.scores[d.id].latest != null);
    return `<div class="page">
      <section class="hero">
        <div>
          <div class="kicker">A personal field manual · ISC2 CISSP · 2024 outline</div>
          <h1 class="h-display">Read slowly.<br><em>Pass once.</em></h1>
          <p class="lede">Eight chapters written to be read, not skimmed: every objective of the CISSP outline explained in plain language, with the manager’s lens the exam rewards. Paired with your dated plan to February 2027, practice questions and a tracker.</p>
          <div class="btn-row">${cont}<a class="btn" href="#/plan">See the plan</a></div>
        </div>
        <div class="hero-aside">
          ${countdown()}
          ${ph ? `<a class="count" href="#/plan" style="text-decoration:none;--pc:var(--${ph.domain})"><div class="count-lbl" style="flex:1"><span class="kicker" style="--kc:var(--${ph.domain})">Now · ${esc(ph.iter)}</span><div style="font-family:var(--display);font-size:20px;margin-top:4px">${esc(ph.title)}</div><small>${fmtD(ph.start)} – ${fmtD(ph.end)} · exit: ${esc(ph.exit)}</small></div></a>` : ""}
        </div>
      </section>

      <section class="facts">
        ${P.exam.facts.map(f => `<div class="fact"><b>${esc(f.big)}</b><span>${esc(f.label)}</span></div>`).join("")}
      </section>

      <h2 class="h-section">The eight chapters</h2>
      <p class="sub">Ordered as the outline numbers them. Your plan reads them in a different order: weak domains first, then the strengths as a fast pass. Overall you have read <b>${all.r} of ${all.t}</b> sections.</p>
      <div class="shelf">${D.map(bookCard).join("")}</div>

      <h2 class="h-section">The exam, to scale</h2>
      <p class="sub">Each block’s width is the domain’s exam weight. The shaded height is your latest score from the Tracker${scored.length ? "" : " (enter scores to see it fill)"}.</p>
      <div class="wmap">${D.map(d => {
        const sc = S.scores[d.id] && +S.scores[d.id].latest || 0;
        return `<a href="#/domain/${d.id}" style="flex:${d.weight};${dc(d)}" title="D${d.n} ${esc(d.title)}: ${d.weight}%"><div class="fill" style="height:${sc}%"></div><b>${d.weight}%</b><span>D${d.n} ${esc(d.short)}</span></a>`;
      }).join("")}</div>
      <p class="legend">Bands used throughout: <span class="band green">85%+</span> <span class="band orange">65–84%</span> <span class="band red">&lt;65%</span></p>

      <h2 class="h-section">The pathway</h2>
      <p class="sub">From the ISC2 <a href="#/resources">Ultimate Guide to the CISSP</a>, the six steps from candidate to certified member.</p>
      <div class="path">${P.pathway.map((s, i) => `<div class="step"><b>${i + 1}</b><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join("")}</div>

      <p class="quote">“Think like a manager, act like an adviser, and never forget that people come first.”</p>
      <p class="quote-by">The one sentence that answers more CISSP questions than any fact.</p>
    </div>`;
  }

  function bookCard(d) {
    const p = domProgress(d);
    return `<a class="book" href="#/domain/${d.id}" style="${dc(d)}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="book-num">${roman[d.n]}</span><span class="tag ${d.priority}">${prioLabel[d.priority]}</span></div>
      <div class="book-title">${esc(d.title)}</div>
      <div class="book-meta">${d.weight}% of exam · ${d.sections.length} sections · ${readMins(d)} min read</div>
      <div class="book-foot"><div class="meter"><i style="width:${p.pct}%"></i></div><span class="book-pct">${p.pct}%</span></div>
    </a>`;
  }

  function viewChapters() {
    return `<div class="page">
      <div class="kicker">Contents</div>
      <h1 class="h-display">The eight <em>chapters</em></h1>
      <p class="lede">Each chapter opens with a short essay, then walks through every objective of its domain. Callouts mark what the exam tests, the manager’s view, memory hooks, common traps and what changed between 2024 and 2026. Tick each section when you understand it.</p>
      <div class="shelf" style="margin-top:34px">${D.map(bookCard).join("")}</div>
    </div>`;
  }

  function viewDomain(d) {
    const idx = D.indexOf(d), prev = D[idx - 1], next = D[idx + 1];
    const p = domProgress(d);
    const secs = d.sections.map((s, i) => {
      const k = d.id + ":" + s.id, on = !!S.read[k];
      return `<section class="sec" id="${s.id}" data-sec="${s.id}">
        <div class="sec-head"><span class="sec-num">${d.n}.${i + 1}</span><h2>${esc(s.title)}</h2></div>
        ${s.body}
        ${s.exam ? `<div class="note tests"><p>${esc(s.exam)}</p></div>` : ""}
        <button class="understood ${on ? "on" : ""}" data-read="${k}" aria-pressed="${on}"><span class="box"></span><span>${on ? "Understood. Marked as read." : "I understand this section. Mark as read."}</span></button>
      </section>`;
    }).join("");
    const qs = d.questions.map((q, i) => questionCard(d, q, i)).join("");
    return `<article class="chapter" style="${dc(d)}">
      <header class="ch-head">
        <span class="ch-numeral" aria-hidden="true">${roman[d.n]}</span>
        <div class="kicker">Domain ${pad(d.n)} · ${d.weight}% of the exam <span class="tag ${d.priority}">${prioLabel[d.priority]}</span></div>
        <h1 class="h-display">${esc(d.title)}</h1>
        <p class="lede"><em>${esc(d.lede)}</em></p>
        <div class="ch-meta">
          <span>◷ ${readMins(d)} min read</span><span>§ ${d.sections.length} sections</span><span>? ${d.questions.length} questions</span>
          <span><span class="meter"><i style="width:${p.pct}%"></i></span> <span id="chPct">${p.pct}%</span></span>
        </div>
      </header>
      <nav class="contents-box" aria-label="In this chapter"><h3>In this chapter</h3><ol>
        ${d.sections.map((s, i) => `<li><a href="#/domain/${d.id}/${s.id}" class="${S.read[d.id + ":" + s.id] ? "read" : ""}"><span class="n">${d.n}.${i + 1}</span>${esc(s.title)}</a></li>`).join("")}
        <li><a href="#/domain/${d.id}/memorise"><span class="n">★</span>Memorise &amp; practice</a></li>
      </ol></nav>
      <div class="prose" style="margin-top:44px">
        <p class="intro">${esc(d.intro)}</p>
        ${secs}
      </div>
      <div class="ch-end" id="memorise">
        <div class="memorise"><div class="kicker" style="--kc:var(--dc)">Before you move on</div><h3>Memorise</h3><ul>${d.memorise.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>
        <p class="chapters-src"><b>Read alongside:</b> Sybex Official Study Guide — ${esc(d.sybex)}. Chapter numbers follow the 9th/10th editions; match by title if yours differ.</p>
        <h2 class="h-section" style="margin-top:56px">Check yourself</h2>
        <p class="sub">CISSP-style questions. Answer, then read the reasoning. Misses can go straight into your error log.</p>
        <div class="quiz">${qs}</div>
        <div class="pager">
          ${prev ? `<a href="#/domain/${prev.id}" style="--pdc:var(--${prev.id})"><small>← Previous</small><b>D${prev.n} ${esc(prev.short)}</b></a>` : `<span></span>`}
          ${next ? `<a class="next" href="#/domain/${next.id}" style="--pdc:var(--${next.id})"><small>Next →</small><b>D${next.n} ${esc(next.short)}</b></a>` : `<a class="next" href="#/practice"><small>Next →</small><b>All practice questions</b></a>`}
        </div>
      </div>
    </article>`;
  }

  function questionCard(d, q, i, showDomain) {
    const k = d.id + ":" + i;
    const ans = S.quiz[k];
    const done = ans != null;
    const L = "ABCD";
    return `<div class="q" data-q="${k}" style="${dc(d)}">
      <div class="q-top"><span class="dot"></span>${showDomain ? `D${d.n} ${esc(d.short)} · ` : ""}Question ${i + 1}${done ? (ans === q.answer ? ` · <span style="color:var(--good)">correct</span>` : ` · <span style="color:var(--bad)">missed</span>`) : ""}</div>
      <p class="q-stem">${esc(q.q)}</p>
      <div class="q-opts">${q.options.map((o, j) => {
        let cls = "";
        if (done) { if (j === q.answer) cls = "correct"; else if (j === ans) cls = "wrong"; }
        return `<button class="opt ${cls}" data-opt="${j}" ${done ? "disabled" : ""}><span class="l">${L[j]}</span><span>${esc(o)}</span></button>`;
      }).join("")}</div>
      ${done ? whyBlock(d, q, i, ans) : ""}
    </div>`;
  }
  function whyBlock(d, q, i, ans) {
    const right = ans === q.answer;
    return `<div class="why"><b style="color:${right ? "var(--good)" : "var(--bad)"}">${right ? "Correct" : "Not quite. The answer is " + "ABCD"[q.answer]}</b>${esc(q.why)}
      <div class="actions">${right ? "" : `<button class="btn small" data-log="${d.id}:${i}">+ Add to error log</button>`}<button class="btn small ghost" data-reset="${d.id}:${i}">Try again</button></div></div>`;
  }

  function viewPractice(filter) {
    const f = filter && byId[filter] ? filter : "all";
    const list = D.filter(d => f === "all" || d.id === f);
    let tot = 0, ans = 0, ok = 0;
    D.forEach(d => d.questions.forEach((q, i) => { if (f !== "all" && d.id !== f) return; tot++; const a = S.quiz[d.id + ":" + i]; if (a != null) { ans++; if (a === q.answer) ok++; } }));
    return `<div class="page-narrow">
      <div class="kicker">Practice</div>
      <h1 class="h-display">Questions, <em>with reasons</em></h1>
      <p class="lede">The value is in the explanation, not the score. For every miss, ask why you chose what you chose, and log the reason.</p>
      <div class="filters">
        <a class="chip ${f === "all" ? "on" : ""}" href="#/practice">All domains</a>
        ${D.map(d => `<a class="chip ${f === d.id ? "on" : ""}" href="#/practice/${d.id}" style="${dc(d)}"><i></i>D${d.n}</a>`).join("")}
      </div>
      <div class="scorebar"><span><b>${ok}</b> / ${ans} correct</span><span style="color:var(--muted)">${ans} of ${tot} answered</span>
        <span class="band ${band(ans ? Math.round(ok / ans * 100) : null)}" style="margin-left:auto">${ans ? Math.round(ok / ans * 100) + "%" : "—"}</span>
        <button class="btn small ghost" data-reset-all="${f}">Reset</button></div>
      <div class="quiz">${list.map(d => d.questions.map((q, i) => questionCard(d, q, i, true)).join("")).join("")}</div>
      <p class="sub" style="margin-top:30px">These ${tot} questions check understanding of each chapter. For volume, use the Official Practice Tests and Boson as set out in your <a href="#/plan">plan</a>.</p>
    </div>`;
  }

  function viewPlan() {
    const now = today();
    const ph = currentPhase();
    const phases = P.phases.map(p => {
      const st = parseD(p.start), en = parseD(p.end);
      const state = now > en ? "done" : (now >= st && now <= en) || p === ph ? "now" : "";
      const tasks = p.tasks.map((t, i) => {
        const k = p.id + ":" + i;
        return `<li><label><input type="checkbox" data-task="${k}" ${S.tasks[k] ? "checked" : ""}><span>${esc(t)}</span></label></li>`;
      }).join("");
      const done = p.tasks.filter((t, i) => S.tasks[p.id + ":" + i]).length;
      return `<div class="phase ${state}" style="--pc:var(--${p.domain})">
        <div class="phase-card">
          <div class="phase-top"><span class="phase-date">${fmtD(p.start)} – ${fmtDY(p.end)}</span><span class="kicker" style="--kc:var(--${p.domain})">${esc(p.iter)}</span>${state === "now" ? `<span class="now-pill">You are here</span>` : ""}<span class="phase-date" style="margin-left:auto">${done}/${p.tasks.length}</span>
          <h3>${esc(p.title)}</h3></div>
          <p>${esc(p.text)}</p>
          <p class="exit"><b>Exit criterion:</b> ${esc(p.exit)}</p>
          <ul class="tasks">${tasks}</ul>
        </div>
      </div>`;
    }).join("");
    const cps = P.checkpoints.map(c => {
      const d = daysTo(c.date);
      const met = c.test(Object.fromEntries(Object.entries(S.scores).map(([k, v]) => [k, { latest: +v.latest }])), S.mocks);
      const st = met ? "met" : d < 0 ? "missed" : d <= 7 ? "due" : "later";
      const lbl = { met: "Met", missed: "Missed", due: "Due soon", later: `In ${d} days` }[st];
      return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="phase-date">${fmtDY(c.date)}</span><span class="status ${st}">${lbl}</span></div>
        <h3 style="margin-top:6px">${esc(c.check)}</h3><p style="color:var(--muted);font-size:14px">If missed: ${esc(c.ifMissed)}</p></div>`;
    }).join("");
    return `<div class="page-narrow">
      <div class="kicker">Study plan</div>
      <h1 class="h-display">Thirteen weeks, <em>one attempt</em></h1>
      <p class="lede">The hard deadline is 18 February 2027, with no room for a retake inside the window. So the plan targets 9–12 February, keeps a week of buffer, and uses three checkpoints to tell you early if you need it.</p>
      <div class="grid-2" style="margin-top:28px">${countdown()}</div>

      <h2 class="h-section">Checkpoints</h2>
      <p class="sub">They update automatically from the scores and mocks you enter in the <a href="#/tracker">Tracker</a>.</p>
      <div class="grid-3">${cps}</div>

      <h2 class="h-section">The calendar</h2>
      <p class="sub">Weak domains first while energy is high (D4, D3, D8, D5), strengths last as a fast pass. Aim for ${P.exam.weeklyHours} hours a week, measured weekly so that shift weeks can flex.</p>
      <div class="timeline">${phases}</div>

      <h2 class="h-section">Hours budget</h2>
      <p class="sub">About 150 hours at 11 a week. The popular video plans assume 18 a week; this one is sized for 24×7 duty.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Typical plan</th><th>Your plan</th></tr></thead><tbody>
        ${P.budget.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="note manager" style="font-family:var(--serif);font-size:17px"><p>Treat the last three days like a taper before a race. Fresh legs matter more than one extra workout.</p></div>
    </div>`;
  }

  function viewTracker() {
    const rows = D.map(d => {
      const s = S.scores[d.id] || {};
      const b = band(s.latest === "" ? null : s.latest);
      return `<tr style="${dc(d)}"><td><span class="toc-dot" style="display:inline-block;background:var(--${d.id});margin-right:8px"></span><b>D${d.n}</b> ${esc(d.short)}<div style="font-size:12px;color:var(--muted)">${d.weight}% weight</div></td>
        <td><input type="number" min="0" max="100" data-score="${d.id}:base" value="${s.base ?? ""}" aria-label="Baseline D${d.n}"></td>
        <td><input type="number" min="0" max="100" data-score="${d.id}:latest" value="${s.latest ?? ""}" aria-label="Latest D${d.n}"></td>
        <td><span class="band ${b}" data-band="${d.id}">${bandLabel[b]}</span></td></tr>`;
    }).join("");
    const reasons = P.errorReasons;
    const counts = reasons.map(r => S.errors.filter(e => e.reason === r).length);
    const totalE = S.errors.length;
    const top = totalE ? Math.max(...counts) : 0;
    const topReason = totalE && top / totalE > .5 ? reasons[counts.indexOf(top)] : null;
    return `<div class="page-narrow">
      <div class="kicker">Tracker</div>
      <h1 class="h-display">Scores, mocks <em>&amp; mistakes</em></h1>
      <p class="lede">Enter percentages from chapter tests and practice sets. Colour bands set your focus: <span class="band green">85%+</span> <span class="band orange">65–84%</span> <span class="band red">&lt;65%</span>.</p>

      <div class="card" style="margin-top:26px;display:flex;gap:26px;align-items:center;flex-wrap:wrap">
        <div><div class="kicker">Weighted readiness</div><div id="ready" style="font-family:var(--display);font-size:54px;line-height:1">—</div></div>
        <p style="flex:1;min-width:220px;margin:0">Your latest scores weighted by each domain’s share of the exam. Aim for 75% or more before the first mock.</p>
      </div>

      <h2 class="h-section">Domain scores</h2>
      <div class="tbl-wrap"><table class="tbl trk"><thead><tr><th>Domain</th><th>Baseline</th><th>Latest</th><th>Band</th></tr></thead><tbody>${rows}</tbody></table></div>

      <h2 class="h-section">Mock exams</h2>
      <div class="form-row">
        <label>Date<input type="date" id="mDate" value="${today().toISOString().slice(0, 10)}"></label>
        <label>Source<input type="text" id="mSrc" placeholder="Boson set A"></label>
        <label>Score %<input type="number" id="mScore" min="0" max="100" style="min-width:90px;width:90px"></label>
        <button class="btn small primary" id="mAdd">Add mock</button>
      </div>
      ${S.mocks.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Source</th><th>Score</th><th></th></tr></thead><tbody>
        ${S.mocks.map((m, i) => `<tr><td>${esc(m.date)}</td><td>${esc(m.src || "")}</td><td><span class="band ${band(m.score)}">${m.score}%</span></td><td><button class="del" data-mdel="${i}" aria-label="Delete">×</button></td></tr>`).join("")}
      </tbody></table></div>` : `<p class="sub">No mocks yet. Two at 75%+ by 5 February is the final checkpoint.</p>`}

      <h2 class="h-section">Error log</h2>
      <p class="sub">The most valuable habit in the plan. Every wrong answer, with the reason you got it wrong.</p>
      <div class="form-row">
        <label>Domain<select id="eDom">${D.map(d => `<option value="${d.id}">D${d.n} ${esc(d.short)}</option>`).join("")}</select></label>
        <label>Reason<select id="eReason">${reasons.map(r => `<option>${esc(r)}</option>`).join("")}</select></label>
        <label style="flex:1">Topic / note<textarea id="eNote" placeholder="e.g. Picked AH; needed confidentiality so ESP"></textarea></label>
        <button class="btn small primary" id="eAdd">Log it</button>
      </div>
      ${totalE ? `<div class="card"><h3>Why you miss</h3><div class="reason-bars">${reasons.map((r, i) => `<div class="rbar"><span>${esc(r)}</span><div class="meter"><i style="width:${totalE ? counts[i] / totalE * 100 : 0}%"></i></div><span style="font-family:var(--mono);font-size:12px">${counts[i]}</span></div>`).join("")}</div>
        ${topReason ? `<div class="warnbox">More than half your misses are “${esc(topReason)}”. Fix the habit, not just the facts.</div>` : ""}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Domain</th><th>Reason</th><th>Note</th><th></th></tr></thead><tbody>
        ${S.errors.slice().reverse().map((e, ri) => { const i = S.errors.length - 1 - ri; const d = byId[e.d]; return `<tr><td style="white-space:nowrap">${esc(e.date)}</td><td style="white-space:nowrap"><span class="toc-dot" style="display:inline-block;background:var(--${e.d});margin-right:6px"></span>D${d ? d.n : "?"}</td><td>${esc(e.reason)}</td><td>${esc(e.note || "")}</td><td><button class="del" data-edel="${i}" aria-label="Delete">×</button></td></tr>`; }).join("")}
        </tbody></table></div>` : `<p class="sub">Nothing logged yet.</p>`}

      <h2 class="h-section">Your data</h2>
      <p class="sub">Everything is saved in this browser only. Export to move it between your phone and laptop.</p>
      <div class="btn-row" style="margin-top:0"><button class="btn small" id="exp">Export backup</button><label class="btn small" style="cursor:pointer">Import backup<input type="file" id="imp" accept="application/json" hidden></label><button class="btn small ghost" id="wipe">Reset everything</button></div>
    </div>`;
  }

  function viewLatest() {
    return `<div class="page-narrow">
      <div class="kicker" style="--kc:var(--d3)">What’s new</div>
      <h1 class="h-display">The field, <em>2024–2026</em></h1>
      <p class="lede">The exam is written to the 2024 outline, but questions are framed in today’s practice. These are the developments worth recognising by name, each linked to the chapter where it matters.</p>
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
      <p class="lede">A short list on purpose. One core book, one practice bank, one mobile app, free video for review, and the primary sources.</p>
      <div class="featured">
        <div class="pdf-cover"><small>ISC2 · PDF · 15 pages</small><b>The Ultimate Guide to the CISSP</b></div>
        <div>
          <div class="kicker">In this site’s resources folder</div>
          <h3 style="font-family:var(--display);font-weight:500;font-size:26px;margin:6px 0 8px">The Ultimate Guide to the CISSP</h3>
          <p style="color:var(--ink-2);margin:0 0 6px">ISC2’s official overview: who the CISSP is for, the experience requirement, domain weights, exam format (100–150 CAT items, 3 hours, 700/1000), the six-step pathway, endorsement within nine months, and CPE rules (120 over three years, US$135 AMF). It also notes the new exam outline from 15 April 2027.</p>
          <div class="btn-row" style="margin-top:14px"><a class="btn primary small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" target="_blank" rel="noopener">Open the PDF</a><a class="btn small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" download>Download</a></div>
        </div>
      </div>
      ${P.resources.map(g => `<h2 class="h-section">${esc(g.group)}</h2>${g.items.map(r => `<div class="res"><div class="res-ico">${r.ico}</div><div><h4><a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t)} ↗</a></h4><p>${esc(r.d)}</p><div class="tags">${r.tags.map(t => `<span class="tag plain">${esc(t)}</span>`).join("")}</div></div></div>`).join("")}`).join("")}
      <h2 class="h-section">An AI tutor prompt</h2>
      <p class="sub">Useful for D3, D4 and D8 topics you haven’t worked with hands-on. Replace [TOPIC] and paste it into any assistant.</p>
      <div class="prompt-box" id="promptBox">${esc(P.aiPrompt)}</div>
      <button class="btn small" id="copyPrompt">Copy prompt</button>
    </div>`;
  }

  function footer() {
    return `<footer class="foot"><span>The CISSP Reader · a personal study companion, not affiliated with ISC2. CISSP is a registered mark of ISC2, Inc.</span><span>Written to the CISSP Exam Outline effective 15 Apr 2024 · <a href="#/tactics">Exam tactics</a></span></footer>
    <button class="back-top" id="backTop" aria-label="Back to top">↑</button>`;
  }

  /* ---------------- bindings ---------------- */
  function bind(r) {
    // mark-as-read
    $$("[data-read]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.read;
      if (S.read[k]) delete S.read[k]; else S.read[k] = Date.now();
      save();
      const on = !!S.read[k];
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
      b.lastElementChild.textContent = on ? "Understood. Marked as read." : "I understand this section. Mark as read.";
      const [did, sid] = k.split(":");
      $$(`.contents-box a[href="#/domain/${did}/${sid}"]`).forEach(a => a.classList.toggle("read", on));
      const p = domProgress(byId[did]);
      const pc = $("#chPct"); if (pc) { pc.textContent = p.pct + "%"; pc.previousElementSibling.firstElementChild.style.width = p.pct + "%"; }
      renderToc(parse()); markCurrent();
      if (on) toast(p.pct === 100 ? `Chapter ${roman[byId[did].n]} complete ✓` : "Marked as read");
    }));
    // quiz
    $$(".q").forEach(qel => {
      qel.addEventListener("click", e => {
        const opt = e.target.closest("[data-opt]");
        const [did, qi] = qel.dataset.q.split(":");
        const d = byId[did], q = d.questions[+qi];
        if (opt && !opt.disabled) {
          S.quiz[qel.dataset.q] = +opt.dataset.opt; save();
          qel.outerHTML = questionCard(d, q, +qi, r.page === "practice");
          rebindQuiz(r); updateScorebar(r);
        }
      });
    });
    rebindQuiz(r);
    $$("[data-reset-all]").forEach(b => b.addEventListener("click", () => {
      const f = b.dataset.resetAll;
      Object.keys(S.quiz).forEach(k => { if (f === "all" || k.startsWith(f + ":")) delete S.quiz[k]; });
      save(); route();
    }));
    // tasks
    $$("[data-task]").forEach(c => c.addEventListener("change", () => { if (c.checked) S.tasks[c.dataset.task] = 1; else delete S.tasks[c.dataset.task]; save(); }));
    // tracker
    $$("[data-score]").forEach(inp => inp.addEventListener("input", () => {
      const [id, f] = inp.dataset.score.split(":");
      S.scores[id] = S.scores[id] || {};
      const v = inp.value === "" ? "" : Math.max(0, Math.min(100, +inp.value));
      S.scores[id][f] = v; save();
      const b = $(`[data-band="${id}"]`); if (b && f === "latest") { const bb = band(v === "" ? null : v); b.className = "band " + bb; b.textContent = bandLabel[bb]; }
      readiness();
    }));
    readiness();
    const mAdd = $("#mAdd"); if (mAdd) mAdd.addEventListener("click", () => {
      const sc = +$("#mScore").value; if (!$("#mScore").value || sc < 0 || sc > 100) { toast("Enter a score between 0 and 100"); return; }
      S.mocks.push({ date: $("#mDate").value, src: $("#mSrc").value.trim(), score: sc }); save(); route(); toast("Mock added");
    });
    $$("[data-mdel]").forEach(b => b.addEventListener("click", () => { S.mocks.splice(+b.dataset.mdel, 1); save(); route(); }));
    const eAdd = $("#eAdd"); if (eAdd) eAdd.addEventListener("click", () => {
      S.errors.push({ date: today().toISOString().slice(0, 10), d: $("#eDom").value, reason: $("#eReason").value, note: $("#eNote").value.trim() }); save(); route(); toast("Logged");
    });
    $$("[data-edel]").forEach(b => b.addEventListener("click", () => { S.errors.splice(+b.dataset.edel, 1); save(); route(); }));
    const exp = $("#exp"); if (exp) exp.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `cissp-reader-backup-${today().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const imp = $("#imp"); if (imp) imp.addEventListener("change", () => {
      const f = imp.files[0]; if (!f) return;
      f.text().then(t => { S = Object.assign(blank(), JSON.parse(t)); save(); route(); toast("Backup restored"); }).catch(() => toast("That file could not be read"));
    });
    const wipe = $("#wipe"); if (wipe) wipe.addEventListener("click", () => { if (confirm("Erase all progress, scores and the error log on this device?")) { S = blank(); save(); route(); } });
    const cp = $("#copyPrompt"); if (cp) cp.addEventListener("click", () => {
      (navigator.clipboard ? navigator.clipboard.writeText(P.aiPrompt) : Promise.reject()).then(() => toast("Prompt copied")).catch(() => {
        const rng = document.createRange(); rng.selectNodeContents($("#promptBox")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rng); toast("Selected. Press Ctrl+C to copy");
      });
    });
    $("#backTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    // section observer
    if (r.page === "domain") {
      observer = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { currentSec = en.target.dataset.sec; markCurrent(); } });
      }, { rootMargin: "-20% 0px -70% 0px" });
      $$(".sec").forEach(s => observer.observe(s));
    }
  }
  let currentSec = null;
  function markCurrent() { $$(".toc-sub a").forEach(a => a.classList.toggle("current", a.dataset.sec === currentSec)); }

  function rebindQuiz(r) {
    $$("[data-log]").forEach(b => { if (b._b) return; b._b = 1; b.addEventListener("click", () => {
      const [did, qi] = b.dataset.log.split(":");
      const q = byId[did].questions[+qi];
      S.errors.push({ date: today().toISOString().slice(0, 10), d: did, reason: "Knowledge gap", note: q.q.slice(0, 90) + (q.q.length > 90 ? "…" : "") });
      save(); b.textContent = "✓ Logged"; b.disabled = true; toast("Added to error log. Change the reason in the Tracker if needed.");
    }); });
    $$("[data-reset]").forEach(b => { if (b._b) return; b._b = 1; b.addEventListener("click", () => {
      const k = b.dataset.reset; delete S.quiz[k]; save();
      const [did, qi] = k.split(":");
      const qel = b.closest(".q"); qel.outerHTML = questionCard(byId[did], byId[did].questions[+qi], +qi, r.page === "practice");
      rebindQuiz(r); updateScorebar(r);
    }); });
  }
  function updateScorebar(r) {
    if (r.page !== "practice") return;
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  function readiness() {
    const el = $("#ready"); if (!el) return;
    let w = 0, s = 0;
    D.forEach(d => { const v = S.scores[d.id] && S.scores[d.id].latest; if (v !== "" && v != null) { w += d.weight; s += d.weight * +v; } });
    if (!w) { el.textContent = "—"; el.style.color = ""; return; }
    const v = Math.round(s / w); el.textContent = v + "%";
    el.style.color = `var(--${{ green: "good", orange: "warn", red: "bad" }[band(v)]})`;
  }

  /* ---------------- scroll progress ---------------- */
  const bar = $("#readBar");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0) + "%";
    const bt = $("#backTop"); if (bt) bt.classList.toggle("show", h.scrollTop > 900);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- search ---------------- */
  const index = [];
  D.forEach(d => {
    index.push({ k: `Domain ${d.n}`, t: d.title, s: d.lede, u: `#/domain/${d.id}`, id: d.id, txt: (d.title + " " + d.lede + " " + d.intro).toLowerCase() });
    d.sections.forEach((s, i) => { const plain = strip(s.body); index.push({ k: `D${d.n}.${i + 1} · ${d.short}`, t: s.title, s: plain, u: `#/domain/${d.id}/${s.id}`, id: d.id, txt: (s.title + " " + plain).toLowerCase() }); });
    d.memorise.forEach(m => index.push({ k: `D${d.n} · Memorise`, t: m.slice(0, 70) + (m.length > 70 ? "…" : ""), s: m, u: `#/domain/${d.id}/memorise`, id: d.id, txt: m.toLowerCase() }));
  });
  [["Study plan", "#/plan", "calendar phases checkpoints iteration exam date deadline hours"], ["Exam tactics", "#/tactics", "method qualifier manager cat adaptive logistics rules"], ["Tracker", "#/tracker", "scores error log mock readiness"], ["What’s new 2024–2026", "#/latest", P.latest.map(x => x.title + " " + x.body).join(" ")], ["Resources", "#/resources", "books sybex boson pdf ultimate guide video nist owasp"]]
    .forEach(([t, u, x]) => index.push({ k: "Page", t, s: "", u, id: null, txt: (t + " " + x).toLowerCase() }));

  const modal = $("#searchModal"), sIn = $("#searchInput"), sRes = $("#searchResults");
  let sel = 0;
  function openSearch() { modal.hidden = false; sIn.value = ""; doSearch(); setTimeout(() => sIn.focus(), 20); }
  function closeSearch() { modal.hidden = true; }
  function hl(text, terms) {
    let out = esc(text);
    terms.forEach(t => { if (t.length < 2) return; out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); });
    return out;
  }
  function snippet(s, term) {
    const i = s.toLowerCase().indexOf(term);
    if (i < 0) return s.slice(0, 160);
    const st = Math.max(0, i - 60);
    return (st ? "…" : "") + s.slice(st, st + 170) + "…";
  }
  function doSearch() {
    const q = sIn.value.trim().toLowerCase();
    sel = 0;
    if (!q) {
      sRes.innerHTML = D.map(d => `<li><a href="#/domain/${d.id}" style="${dc(d)}"><div class="sr-k">Domain ${d.n}</div><div class="sr-t">${esc(d.title)}</div></a></li>`).join("");
    } else {
      const terms = q.split(/\s+/).filter(Boolean);
      const res = index.map(x => {
        let sc = 0;
        for (const t of terms) { if (!x.txt.includes(t)) return null; sc += (x.t.toLowerCase().includes(t) ? 5 : 0) + 1; }
        return [sc, x];
      }).filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 14).map(a => a[1]);
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
    else if (e.key === "Escape") { closeSearch(); hideSettings(); closeToc(); }
  });

  /* ---------------- settings ---------------- */
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
  sBtn.addEventListener("click", e => { e.stopPropagation(); pop.hidden = !pop.hidden; sBtn.setAttribute("aria-expanded", String(!pop.hidden)); paintSettings(); });
  document.addEventListener("click", e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== sBtn) hideSettings(); });
  $$("[data-theme-set]").forEach(b => b.addEventListener("click", () => { document.documentElement.dataset.theme = b.dataset.themeSet; settings.theme = b.dataset.themeSet; saveSettings(); paintSettings(); }));
  $$("[data-size]").forEach(b => b.addEventListener("click", () => {
    const d = +b.dataset.size; const cur = settings.size || (innerWidth <= 640 ? 18 : 19);
    settings.size = d === 0 ? undefined : Math.max(15, Math.min(25, cur + d));
    if (settings.size) document.documentElement.style.setProperty("--fs", settings.size + "px"); else document.documentElement.style.removeProperty("--fs");
    saveSettings();
  }));
  $$("[data-face]").forEach(b => b.addEventListener("click", () => { settings.face = b.dataset.face; document.documentElement.dataset.face = b.dataset.face; saveSettings(); paintSettings(); }));
  paintSettings();

  /* ---------------- mobile toc ---------------- */
  $("#tocToggle").addEventListener("click", () => { toc.classList.add("open"); $("#scrim").classList.add("on"); });
  $("#scrim").addEventListener("click", closeToc);

  window.addEventListener("hashchange", route);
  route();
})();

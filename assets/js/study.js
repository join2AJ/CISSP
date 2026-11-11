/* StudyCISSP — quiz, flashcards, mock exam, insights, personal library */
(function () {
  "use strict";
  const A = window.App, { D, byId, $, $$, esc, dc, ymd, today, addDays, fmtDur, fmtD, band, shuffle, pick, db } = A;
  const L = "ABCD";

  /* ======================= QUIZ ======================= */
  let Q = null; // running quiz

  function topicsOf(d) { return d.sections.map(s => ({ id: s.id, title: s.title, n: A.questions.filter(q => q.d === d.id && q.t === s.id).length })); }

  function viewQuiz() {
    Q = null;
    const acc = A.quizAccuracy();
    const order = A.pathOrder();
    return `<div class="page-narrow">
      <div class="kicker">Quiz</div>
      <h1 class="h-display">Ask, answer, <em>understand</em></h1>
      <p class="lede">Short sets with an explanation after every question. ${A.questions.length} questions across all eight domains. ${acc == null ? "Your accuracy appears here after your first quiz." : `Your accuracy so far: <b>${acc}%</b>.`}</p>
      <div class="grid-2" style="margin-top:28px">
        <a class="card focus" href="#/quiz/run/weak"><span class="kicker">Recommended</span><h3>My weak areas</h3><p>Questions from your focus domains and the topics you miss most.</p></a>
        <a class="card focus" href="#/quiz/run/mixed"><span class="kicker">Exam-like</span><h3>Mixed, all domains</h3><p>Ten questions weighted by the real exam’s domain weights.</p></a>
      </div>
      <h2 class="h-section">By domain</h2>
      <div class="dom-grid">${order.map(d => { const a = A.quizAccuracy(d.id), n = A.questions.filter(q => q.d === d.id).length;
        return `<a class="dom-tile" href="#/quiz/run/domain/${d.id}" style="${dc(d)}"><span class="toc-dot" style="background:var(--${d.id})"></span><b>D${d.n} ${esc(d.short)}</b><small>${n} questions · ${a == null ? "not tried" : a + "%"}</small><span class="band ${band(a)}">${a == null ? "—" : a + "%"}</span></a>`; }).join("")}</div>
      <h2 class="h-section">By topic</h2>
      <p class="sub">Pick a single section to drill. Topics with no questions yet are hidden.</p>
      ${order.map(d => `<details class="topic-group" style="${dc(d)}"><summary><span class="toc-dot" style="background:var(--${d.id})"></span>D${d.n} ${esc(d.title)}</summary>
        <div class="topic-list">${topicsOf(d).filter(t => t.n).map(t => `<a href="#/quiz/run/topic/${d.id}.${t.id}">${esc(t.title)} <small>${t.n}</small></a>`).join("")}</div></details>`).join("")}
    </div>`;
  }

  function buildSet(kind, arg, n = 10) {
    let pool = A.questions;
    if (kind === "domain") pool = pool.filter(q => q.d === arg);
    else if (kind === "topic") { const [d, t] = arg.split("."); pool = pool.filter(q => q.d === d && q.t === t); }
    else if (kind === "weak") {
      const miss = {}; A.attempts.forEach(a => { if (!a.correct) miss[a.qid] = (miss[a.qid] || 0) + 1; });
      const focus = D.filter(d => A.prio(d) !== "strong").map(d => d.id);
      pool = pool.slice().sort((a, b) => ((miss[b.id] || 0) * 3 + (focus.includes(b.d) ? 2 : 0) + Math.random()) - ((miss[a.id] || 0) * 3 + (focus.includes(a.d) ? 2 : 0) + Math.random()));
      return pool.slice(0, n).map(q => A.shuffleQ(q));
    } else if (kind === "mixed") return weighted(n);
    else if (kind === "retry") return (Q && Q.retry ? Q.retry : []).map(q => A.shuffleQ(q));
    return shuffle(pool).slice(0, n).map(q => A.shuffleQ(q));
  }
  function weighted(n) {
    const out = [], used = new Set();
    const per = D.map(d => ({ d, k: Math.max(1, Math.round(n * d.weight / 100)) }));
    per.forEach(({ d, k }) => shuffle(A.questions.filter(q => q.d === d.id)).slice(0, k).forEach(q => { out.push(q); used.add(q.id); }));
    shuffle(A.questions.filter(q => !used.has(q.id))).slice(0, Math.max(0, n - out.length)).forEach(q => out.push(q));
    return shuffle(out).slice(0, n).map(q => A.shuffleQ(q));
  }

  function startQuiz(r) {
    const kind = r.b, arg = location.hash.split("/").slice(4).join("/");
    const items = buildSet(kind, decodeURIComponent(arg || ""), kind === "topic" ? 20 : 10);
    let label = "Mixed quiz";
    if (kind === "domain" && byId[arg]) label = `D${byId[arg].n} ${byId[arg].title}`;
    if (kind === "topic") { const [d, t] = arg.split("."); const s = byId[d] && byId[d].sections.find(x => x.id === t); label = s ? s.title : "Topic quiz"; }
    if (kind === "weak") label = "My weak areas";
    if (kind === "retry") label = "Retry: questions you missed";
    Q = { kind, arg, label, items, i: 0, answers: [], done: false, key: location.hash };
  }

  function viewRun(r) {
    if (!Q || Q.key !== location.hash) startQuiz(r);
    if (!Q.items.length) return `<div class="page-narrow"><h1 class="h-display">No questions <em>here yet</em></h1><p class="lede">This topic has no questions in the bank yet. Try the whole domain instead.</p><a class="btn" href="#/quiz">Back to quizzes</a></div>`;
    if (Q.done) return summary(Q.items, Q.answers, Q.label, "quiz");
    const q = Q.items[Q.i], d = byId[q.d], ans = Q.answers[Q.i];
    const pct = Math.round(Q.i / Q.items.length * 100);
    return `<div class="page-narrow runner" style="${dc(d)}">
      <div class="run-top"><a href="#/quiz" class="btn small ghost">← Quizzes</a><span class="run-label">${esc(Q.label)}</span><span class="run-count">${Q.i + 1} / ${Q.items.length}</span></div>
      <div class="run-score">${scoreSoFar()}</div>
      <div class="run-bar"><i style="width:${pct}%"></i></div>
      <div class="q big">
        <div class="q-top"><span class="dot"></span>D${d.n} ${esc(d.short)}${q.t ? " · " + esc((d.sections.find(s => s.id === q.t) || {}).title || "") : ""}</div>
        <p class="q-stem">${esc(q.q)}</p>
        <div class="q-opts">${q.o.map((o, j) => { let c = ""; if (ans != null) { if (j === q.a) c = "correct"; else if (j === ans) c = "wrong"; }
          return `<button class="opt ${c}" data-pick="${j}" ${ans != null ? "disabled" : ""}><span class="l">${L[j]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>
        ${ans != null ? `<div class="why"><b style="color:${ans === q.a ? "var(--good)" : "var(--bad)"}">${ans === q.a ? pick(["Correct.", "Exactly right.", "Yes. Well reasoned."]) : "Not this time. The answer is " + L[q.a] + "."}</b>${esc(q.w)}
          <div class="actions">${nextButtons()}${ans === q.a ? "" : `<button class="btn small" id="logMiss">+ Error log</button>`}<a class="btn small ghost" href="#/domain/${d.id}${q.t ? "/" + q.t : ""}">Read the section</a></div></div>` : `<p class="hint">Press 1–4 or A–D to answer.</p>`}
      </div>
    </div>`;
  }

  function scoreSoFar() {
    const done = Q.answers.filter(a => a != null).length; if (!done) return "";
    const right = Q.items.filter((q, i) => Q.answers[i] === q.a).length;
    return `${right} of ${done} correct so far`;
  }
  // what comes after this quiz: the next topic (for topic quizzes) or the next domain
  function nextAfter() {
    if (!Q) return null;
    if (Q.kind === "topic") {
      const [d, t] = Q.arg.split("."); const n = A.nextSection(d, t);
      return n ? { href: `#/quiz/run/topic/${n.d.id}.${n.s.id}`, label: `Next topic: ${n.d.n}.${n.i + 1} ${n.s.title}`, read: `#/domain/${n.d.id}/${n.s.id}`, readLabel: `Read ${n.d.n}.${n.i + 1} ${n.s.title}` } : null;
    }
    if (Q.kind === "domain" && byId[Q.arg]) {
      const nd = D[D.indexOf(byId[Q.arg]) + 1];
      return nd ? { href: `#/quiz/run/domain/${nd.id}`, label: `Next domain quiz: D${nd.n} ${nd.short}`, read: `#/domain/${nd.id}`, readLabel: `Read D${nd.n} ${nd.short}` } : null;
    }
    return null;
  }
  function nextButtons() {
    if (Q.i + 1 < Q.items.length) return `<button class="btn small primary" id="next">Next question →</button>`;
    const n = nextAfter();
    return n ? `<button class="btn small primary" id="goNext" data-href="${n.href}">${esc(n.label)} →</button><button class="btn small" id="next">See my results</button>`
             : `<button class="btn small primary" id="next">See my results →</button>`;
  }
  function finishQuiz() {
    if (Q.done) return;
    Q.done = true;
    Q.retry = Q.items.filter((q, i) => Q.answers[i] !== q.a);
    db.logEvent("user.quiz_completed", { label: Q.label, n: Q.items.length });
  }

  function summary(items, answers, label, mode, extra) {
    const right = items.filter((q, i) => answers[i] === q.a).length, pct = Math.round(right / items.length * 100);
    const per = {}; items.forEach((q, i) => { per[q.d] = per[q.d] || [0, 0]; per[q.d][1]++; if (answers[i] === q.a) per[q.d][0]++; });
    const msg = pct >= 85 ? "Outstanding. This is passing territory. Keep it fresh." : pct >= 70 ? "Strong work. You’re thinking the way the exam wants." : pct >= 50 ? "Good foundation. Every miss below is a lesson you now own." : "This is exactly what practice is for. Read the explanations; your next set will be better.";
    const misses = items.map((q, i) => ({ q, a: answers[i] })).filter(x => x.a !== x.q.a);
    const circ = 2 * Math.PI * 52;
    return `<div class="page-narrow">
      <div class="kicker">${esc(label)}${extra ? " · " + esc(extra) : ""}</div>
      <div class="result">
        <svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" style="stroke:var(--${{ green: "good", orange: "warn", red: "bad", none: "muted" }[band(pct)]});stroke-dasharray:${circ};stroke-dashoffset:${circ * (1 - pct / 100)}"/><text x="60" y="66" text-anchor="middle">${pct}%</text></svg>
        <div><h1 class="h-display" style="margin:0 0 8px">${right} of ${items.length} <em>correct</em></h1><p class="lede">${msg}</p></div>
      </div>
      <h2 class="h-section">By domain</h2>
      <div class="bars">${Object.entries(per).map(([id, [r, t]]) => { const v = Math.round(r / t * 100); return `<div class="hbar" style="${dc(byId[id])}"><span>D${byId[id].n} ${esc(byId[id].short)}</span><div class="meter"><i style="width:${v}%"></i></div><b>${r}/${t}</b></div>`; }).join("")}</div>
      ${misses.length ? `<h2 class="h-section">Review your misses</h2><div class="quiz">${misses.map(({ q, a }) => `<div class="q" style="${dc(byId[q.d])}"><div class="q-top"><span class="dot"></span>D${byId[q.d].n}</div><p class="q-stem">${esc(q.q)}</p>
        <p class="miss-line"><span class="wrongtxt">${a == null ? "Not answered" : "You chose " + L[a] + ": " + esc(q.o[a])}</span><br><span class="righttxt">Answer ${L[q.a]}: ${esc(q.o[q.a])}</span></p><div class="why">${esc(q.w)}<div class="actions"><button class="btn small" data-logq="${q.id}">+ Error log</button></div></div></div>`).join("")}</div>` : ""}
      <div class="btn-row">${(() => {
        if (mode === "mock") return `<a class="btn primary" href="#/mock">Another mock</a><a class="btn" href="#/insights">See my insights</a>`;
        const n = nextAfter();
        return (n ? `<a class="btn primary" href="${n.href}">${esc(n.label)} →</a><a class="btn" href="${n.read}">${esc(n.readLabel)}</a>` : "")
          + (misses.length ? `<button class="btn ${n ? "" : "primary"}" id="retryMisses">Retry the ${misses.length} I missed</button>` : "")
          + `<a class="btn ghost" href="#/quiz">All quizzes</a>`;
      })()}</div>
    </div>`;
  }

  function bindRun(r) {
    keyHandler = null;
    if (Q && Q.done) return bindSummary(Q.items);
    const answer = (j) => {
      if (Q.answers[Q.i] != null) return;
      const q = Q.items[Q.i]; Q.answers[Q.i] = j;
      const row = { mode: "quiz", qid: q.id, domain: q.d, topic: q.t || null, correct: j === q.a, chosen: j };
      A.attempts.push(row); db.recordAttempts([row]).catch(() => {});
      A.rerender();
    };
    $$("[data-pick]").forEach(b => b.addEventListener("click", () => answer(+b.dataset.pick)));
    const nx = $("#next"); if (nx) { nx.addEventListener("click", () => { if (Q.i + 1 < Q.items.length) Q.i++; else finishQuiz(); A.rerender(); scrollTo(0, 0); }); }
    const gn = $("#goNext"); if (gn) gn.addEventListener("click", () => { finishQuiz(); location.hash = gn.dataset.href; });
    (gn || nx) && (gn || nx).focus();
    const lm = $("#logMiss"); if (lm) lm.addEventListener("click", () => { const q = Q.items[Q.i]; A.logMiss(q.d, q.q); lm.textContent = "✓ Logged"; lm.disabled = true; });
    keyHandler = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase(), idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (idx >= 0 && Q.answers[Q.i] == null && idx < Q.items[Q.i].o.length) answer(idx);
    };
  }
  function bindSummary(items) {
    const rt = $("#retryMisses"); if (rt) rt.addEventListener("click", () => {
      const retry = Q.retry; Q = { retry }; location.hash = "#/quiz/run/retry/" + Date.now();
    });
    $$("[data-logq]").forEach(b => b.addEventListener("click", () => { const q = items.find(x => x.id === b.dataset.logq); A.logMiss(q.d, q.q); b.textContent = "✓ Logged"; b.disabled = true; }));
  }
  let keyHandler = null;
  document.addEventListener("keydown", e => { if (keyHandler && /^#\/(quiz\/run|mock|flashcards)/.test(location.hash)) keyHandler(e); });
  addEventListener("hashchange", () => { keyHandler = null; });

  /* ======================= MOCK ======================= */
  let M = null;
  function viewMock() {
    if (M && M.done) return summary(M.items, M.answers, "Mock exam", "mock", `${fmtDur(M.seconds)} used`);
    if (M && !M.done) return mockRunner();
    const n = A.questions.length;
    const past = A.mocks.slice(-5).reverse();
    return `<div class="page-narrow">
      <div class="kicker">Mock exam</div>
      <h1 class="h-display">A quiet room, <em>a ticking clock</em></h1>
      <p class="lede">Like the real thing: no feedback until the end, no going back, about 72 seconds a question. Questions are weighted by the exam’s domain weights.</p>
      <div class="grid-3" style="margin-top:28px">
        ${[[25, "Sprint", "30 min"], [50, "Half", "1 hour"], [n, "Full bank", Math.round(n * 72 / 60) + " min"]].map(([k, t, time]) => `<button class="card focus mock-pick" data-n="${k}"><span class="kicker">${t}</span><h3>${k} questions</h3><p>${time}</p></button>`).join("")}
      </div>
      <p class="sub" style="margin-top:18px">The in-app bank has ${n} questions. For the full 100–150 experience, use outside banks (see <a href="#/resources">Resources</a>) and log the score in the <a href="#/tracker">Tracker</a>.</p>
      ${past.length ? `<h2 class="h-section">Recent mocks</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Questions</th><th>Time</th><th>Score</th></tr></thead><tbody>${past.map(m => { const v = Math.round(m.correct / m.total * 100); return `<tr><td>${fmtD(m.created_at)}</td><td>${m.total}</td><td>${fmtDur(m.seconds)}</td><td><span class="band ${band(v)}">${v}%</span></td></tr>`; }).join("")}</tbody></table></div>` : ""}
    </div>`;
  }
  function mockRunner() {
    const q = M.items[M.i], d = byId[q.d], left = Math.max(0, M.limit - Math.round((Date.now() - M.t0) / 1000));
    return `<div class="page-narrow runner mock">
      <div class="run-top"><button class="btn small ghost" id="mockQuit">End exam</button><span class="run-label">Mock exam</span><span class="run-count" id="clock">${fmtClock(left)}</span></div>
      <div class="run-bar"><i style="width:${Math.round(M.i / M.items.length * 100)}%"></i></div>
      <div class="q big">
        <div class="q-top">Question ${M.i + 1} of ${M.items.length}</div>
        <p class="q-stem">${esc(q.q)}</p>
        <div class="q-opts">${q.o.map((o, j) => `<button class="opt ${M.sel === j ? "chosen" : ""}" data-msel="${j}"><span class="l">${L[j]}</span><span>${esc(o)}</span></button>`).join("")}</div>
        <div class="btn-row"><button class="btn primary" id="mNext" ${M.sel == null ? "disabled" : ""}>Confirm and continue →</button></div>
        <p class="hint">Choose an answer, then confirm. You can’t return to earlier questions.</p>
      </div></div>`;
  }
  const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  let clockTimer = null;
  function finishMock() {
    clearInterval(clockTimer);
    M.done = true; M.seconds = Math.round((Date.now() - M.t0) / 1000);
    const rows = M.items.map((q, i) => ({ mode: "mock", qid: q.id, domain: q.d, topic: q.t || null, correct: M.answers[i] === q.a, chosen: M.answers[i] == null ? null : M.answers[i] }));
    A.attempts.push(...rows); db.recordAttempts(rows).catch(() => {});
    const breakdown = {}; M.items.forEach((q, i) => { breakdown[q.d] = breakdown[q.d] || { c: 0, t: 0 }; breakdown[q.d].t++; if (M.answers[i] === q.a) breakdown[q.d].c++; });
    const m = { total: M.items.length, correct: rows.filter(r => r.correct).length, seconds: M.seconds, breakdown };
    A.mocks.push(Object.assign({ created_at: new Date().toISOString() }, m)); db.saveMock(m).catch(() => {});
    A.rerender(); scrollTo(0, 0);
  }
  function bindMock() {
    keyHandler = null;
    if (M && M.done) { bindSummary(M.items); M = null; return; }
    $$(".mock-pick").forEach(b => b.addEventListener("click", () => {
      const n = +b.dataset.n; M = { items: weighted(n), i: 0, answers: [], sel: null, t0: Date.now(), limit: n * 72, done: false };
      db.logEvent("user.mock_started", { n }); A.rerender();
    }));
    if (!M) return;
    $$("[data-msel]").forEach(b => b.addEventListener("click", () => { M.sel = +b.dataset.msel; $$("[data-msel]").forEach(x => x.classList.toggle("chosen", +x.dataset.msel === M.sel)); $("#mNext").disabled = false; }));
    $("#mNext").addEventListener("click", () => { M.answers[M.i] = M.sel; M.sel = null; if (M.i + 1 < M.items.length) { M.i++; A.rerender(); } else finishMock(); });
    $("#mockQuit").addEventListener("click", () => { if (confirm("End the exam now? Unanswered questions count as wrong.")) finishMock(); });
    clearInterval(clockTimer);
    clockTimer = setInterval(() => {
      const el = $("#clock"); if (!el || !M) { clearInterval(clockTimer); return; }
      const left = M.limit - Math.round((Date.now() - M.t0) / 1000);
      el.textContent = fmtClock(Math.max(0, left)); el.classList.toggle("low", left < 300);
      if (left <= 0) finishMock();
    }, 1000);
    keyHandler = (e) => { const k = e.key.toLowerCase(), idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k); if (idx >= 0) { const b = $(`[data-msel="${idx}"]`); if (b) b.click(); } else if (e.key === "Enter" && M.sel != null) $("#mNext").click(); };
  }

  /* ======================= FLASHCARDS ======================= */
  const INTERVAL = [0, 1, 3, 7, 16, 35];
  let CS = {}; // card state
  A.loadCards = async () => { try { CS = await db.cards(); } catch (e) { CS = {}; } };
  A.cardsReviewed = (dom) => A.cards.filter(c => c.d === dom && CS[c.id] && CS[c.id].reviews > 0).length;
  A.dueCards = (dom) => A.cards.filter(c => (!dom || c.d === dom) && (!CS[c.id] || CS[c.id].due <= ymd(today())));
  let F = null, autoDone = null;
  addEventListener("hashchange", () => { autoDone = null; });

  function viewFlash(r) {
    if (F && F.key !== location.hash) F = null;
    const dom = r.a && byId[r.a] ? r.a : null;
    if (F && F.key === location.hash && F.i < F.deck.length) return flashRunner();
    if (F && F.key === location.hash && F.i >= F.deck.length) {
      const k = F.known, t = F.deck.length; F = null;
      return `<div class="page-narrow"><div class="kicker">Session complete</div><h1 class="h-display">${k} of ${t} <em>remembered</em></h1>
        <p class="lede">${k === t ? "A clean sweep. Those cards will come back later, spaced further apart." : "Cards you’re still learning will come back sooner. That’s how memory sticks."}</p>
        <div class="btn-row">${(() => { const cur = (location.hash.split("/")[2] || ""); const nd = byId[cur] ? D[D.indexOf(byId[cur]) + 1] : null; return nd ? `<a class="btn primary" href="#/flashcards/${nd.id}">Next deck: D${nd.n} ${esc(nd.short)} →</a><a class="btn" href="#/flashcards">All decks</a>` : `<a class="btn primary" href="#/flashcards">Back to decks</a>`; })()}<a class="btn" href="#/quiz/run/weak">Test it with a quiz</a></div></div>`;
    }
    const mastered = A.cards.filter(c => CS[c.id] && CS[c.id].box >= 4).length;
    return `<div class="page-narrow">
      <div class="kicker">Flashcards</div>
      <h1 class="h-display">Little and <em>often</em></h1>
      <p class="lede">${A.cards.length} cards. Each card you know moves to a longer interval (1, 3, 7, 16, 35 days); anything you miss comes back tomorrow. ${mastered} mastered so far.</p>
      <div class="grid-2" style="margin-top:28px">
        <button class="card focus deck" data-deck="due"><span class="kicker">Today</span><h3>${A.dueCards().length} cards due</h3><p>All domains, in your path order.</p></button>
        <button class="card focus deck" data-deck="weak"><span class="kicker">Focus</span><h3>Focus domains</h3><p>${D.filter(d => A.prio(d) === "weak").map(d => "D" + d.n).join(", ") || "Set focus domains in your profile"}</p></button>
      </div>
      <h2 class="h-section">Decks by domain</h2>
      <div class="dom-grid">${A.pathOrder().map(d => { const all = A.cards.filter(c => c.d === d.id), due = A.dueCards(d.id).length, m = all.filter(c => CS[c.id] && CS[c.id].box >= 4).length;
        return `<button class="dom-tile deck" data-deck="${d.id}" style="${dc(d)}"><span class="toc-dot" style="background:var(--${d.id})"></span><b>D${d.n} ${esc(d.short)}</b><small>${all.length} cards · ${due} due · ${m} mastered</small><span class="meter"><i style="width:${Math.round(m / all.length * 100)}%"></i></span></button>`; }).join("")}</div>
    </div>`;
  }
  function flashRunner() {
    const c = F.deck[F.i], d = byId[c.d];
    return `<div class="page-narrow runner" style="${dc(d)}">
      <div class="run-top"><a href="#/flashcards" class="btn small ghost" id="fQuit">← Decks</a><span class="run-label">${esc(F.label)}</span><span class="run-count">${F.i + 1} / ${F.deck.length}</span></div>
      <div class="run-bar"><i style="width:${Math.round(F.i / F.deck.length * 100)}%"></i></div>
      <div class="flip ${F.flipped ? "on" : ""}" id="flip" tabindex="0" aria-live="polite">
        <div class="face front"><span class="kicker" style="--kc:var(--dc)">D${d.n} ${esc(d.short)}</span><p>${esc(c.front)}</p><small>Tap or press space to reveal</small></div>
        <div class="face back"><span class="kicker" style="--kc:var(--dc)">${esc(c.front)}</span><p>${esc(c.back)}</p></div>
      </div>
      <div class="fc-actions" ${F.flipped ? "" : "hidden"}><button class="btn" data-grade="0">Still learning <kbd>1</kbd></button><button class="btn primary" data-grade="1">Got it <kbd>2</kbd></button></div>
    </div>`;
  }
  function bindFlash(r) {
    keyHandler = null;
    $$(".deck").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.deck; let deck, label;
      if (k === "due") { deck = A.pathOrder().flatMap(d => A.dueCards(d.id)); label = "Due today"; }
      else if (k === "weak") { const w = D.filter(d => A.prio(d) === "weak").map(d => d.id); deck = shuffle(A.cards.filter(c => w.includes(c.d))); label = "Focus domains"; }
      else { deck = A.dueCards(k); if (!deck.length) deck = A.cards.filter(c => c.d === k); deck = shuffle(deck); label = `D${byId[k].n} ${byId[k].short}`; }
      if (!deck.length) { A.toast("Nothing due. Pick a domain deck to review anyway."); return; }
      F = { deck: deck.slice(0, 30), i: 0, flipped: false, known: 0, label, key: location.hash };
      A.rerender();
    }));
    if (r.a && byId[r.a] && !F && autoDone !== location.hash) { autoDone = location.hash; const b = $(`.deck[data-deck="${r.a}"]`); if (b) b.click(); return; }
    const flip = $("#flip"); if (!flip) return;
    const turn = () => { F.flipped = !F.flipped; flip.classList.toggle("on", F.flipped); $(".fc-actions").hidden = !F.flipped; };
    flip.addEventListener("click", turn);
    const grade = (g) => {
      const c = F.deck[F.i], prev = CS[c.id] || { card_id: c.id, box: 1, reviews: 0 };
      const box = g ? Math.min(5, prev.box + (CS[c.id] ? 1 : 2)) : 1;
      const st = { card_id: c.id, box, due: ymd(addDays(today(), INTERVAL[box])), reviews: (prev.reviews || 0) + 1 };
      CS[c.id] = st; db.saveCard(st).catch(() => {});
      if (g) F.known++;
      F.i++; F.flipped = false; A.rerender();
    };
    $$("[data-grade]").forEach(b => b.addEventListener("click", () => grade(+b.dataset.grade)));
    keyHandler = (e) => { if (e.key === " ") { e.preventDefault(); turn(); } else if (F.flipped && (e.key === "1" || e.key === "2")) grade(e.key === "2" ? 1 : 0); };
  }

  /* ======================= INSIGHTS ======================= */
  let range = 30;
  async function viewInsights() {
    const rows = await A.loadTime();
    const since = range ? ymd(addDays(today(), -(range - 1))) : "0000";
    const R = rows.filter(r => r.day >= since);
    const total = R.reduce((n, r) => n + r.seconds, 0);
    const byDom = {}, byArea = {}, byTopic = {}, byDay = {};
    R.forEach(r => {
      if (r.domain) byDom[r.domain] = (byDom[r.domain] || 0) + r.seconds;
      byArea[r.area] = (byArea[r.area] || 0) + r.seconds;
      if (r.domain && r.topic) { const k = r.domain + ":" + r.topic; byTopic[k] = (byTopic[k] || 0) + r.seconds; }
      byDay[r.day] = (byDay[r.day] || 0) + r.seconds;
    });
    const days = range || Math.min(120, Math.max(14, Object.keys(byDay).length ? Math.round((today() - A.parseD(Object.keys(byDay).sort()[0])) / 864e5) + 1 : 14));
    const series = Array.from({ length: days }, (_, i) => { const d = ymd(addDays(today(), i - days + 1)); return [d, byDay[d] || 0]; });
    const maxDay = Math.max(60, ...series.map(s => s[1]));
    const maxDom = Math.max(1, ...Object.values(byDom));
    const att = A.attempts.filter(a => !range || (a.created_at || "9999") >= since);
    const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const areaName = { read: "Reading", quiz: "Quizzes", flashcards: "Flashcards", mock: "Mock exams", plan: "Planning", insights: "Insights", library: "Library", other: "Home" };
    const off = A.profile && A.profile.consent_analytics === false;
    return `<div class="page-narrow">
      <div class="kicker">Insights</div>
      <h1 class="h-display">Where your <em>time goes</em></h1>
      <p class="lede">Active study time only: the clock pauses when you switch tabs or stop interacting for 90 seconds.</p>
      ${off ? `<div class="warnbox">Study-time analytics is switched off in your privacy settings, so new time isn’t being recorded. <a href="#/privacy">Change this</a>.</div>` : ""}
      <div class="filters">${[[7, "7 days"], [30, "30 days"], [90, "90 days"], [0, "All time"]].map(([v, l]) => `<button class="chip ${range === v ? "on" : ""}" data-range="${v}">${l}</button>`).join("")}</div>
      <section class="facts" style="border-top:1px solid var(--rule)">
        <div class="fact"><b>${fmtDur(total)}</b><span>studied</span></div>
        <div class="fact"><b>${A.streak()}<small class="unit"> d</small></b><span>current streak</span></div>
        <div class="fact"><b>${att.length}</b><span>questions answered</span></div>
        <div class="fact"><b>${att.length ? Math.round(att.filter(a => a.correct).length / att.length * 100) + "%" : "—"}</b><span>accuracy</span></div>
      </section>
      <h2 class="h-section">Daily study time</h2>
      <div class="daychart">${series.map(([d, s]) => `<div class="dc-col" title="${fmtD(d)}: ${fmtDur(s)}"><i style="height:${Math.round(s / maxDay * 100)}%"></i></div>`).join("")}</div>
      <div class="dc-axis"><span>${fmtD(series[0][0])}</span><span>today</span></div>
      <h2 class="h-section">By domain</h2>
      <div class="bars">${D.map(d => { const s = byDom[d.id] || 0, a = A.quizAccuracy(d.id); return `<div class="hbar" style="${dc(d)}"><span>D${d.n} ${esc(d.short)}</span><div class="meter"><i style="width:${s / maxDom * 100}%"></i></div><b>${fmtDur(s)}</b><span class="band ${band(a)}">${a == null ? "—" : a + "%"}</span></div>`; }).join("")}</div>
      <p class="legend">Bar = time spent. Badge = quiz accuracy in that domain (all time).</p>
      <div class="grid-2" style="margin-top:40px">
        <div class="card"><h3>By activity</h3>${Object.keys(byArea).length ? Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="kv"><span>${areaName[k] || k}</span><b>${fmtDur(v)}</b></div>`).join("") : `<p>No study time recorded in this range yet.</p>`}</div>
        <div class="card"><h3>Most-read topics</h3>${topics.length ? topics.map(([k, v]) => { const [dd, t] = k.split(":"); const d = byId[dd], s = d && d.sections.find(x => x.id === t); return `<div class="kv"><a href="#/domain/${dd}/${t}"><span class="toc-dot" style="display:inline-block;background:var(--${dd});margin-right:6px"></span>${esc(s ? s.title : t)}</a><b>${fmtDur(v)}</b></div>`; }).join("") : `<p>Read a few sections and they’ll show here.</p>`}</div>
      </div>
      ${A.mocks.length ? `<h2 class="h-section">Mock exam trend</h2><div class="daychart mocks">${A.mocks.slice(-12).map(m => { const v = Math.round(m.correct / m.total * 100); return `<div class="dc-col" title="${fmtD(m.created_at)}: ${v}%"><i class="${band(v)}" style="height:${v}%"></i><small>${v}</small></div>`; }).join("")}</div><div class="dc-axis"><span>older</span><span>75% target</span><span>latest</span></div>` : ""}
    </div>`;
  }
  function bindInsights() { $$("[data-range]").forEach(b => b.addEventListener("click", () => { range = +b.dataset.range; A.rerender(); })); }

  /* ======================= LIBRARY ======================= */
  const ytId = (u) => { const m = String(u).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/); return m ? m[1] : null; };
  let libFilter = "all";
  async function viewLibrary() {
    let list = [];
    try { list = await db.resources(); } catch (e) { A.toast(A.errMsg(e)); }
    A._lib = list;
    const shown = list.filter(r => libFilter === "all" || r.domain === libFilter || (libFilter === "none" && !r.domain));
    return `<div class="page-narrow">
      <div class="kicker">My library</div>
      <h1 class="h-display">Your own <em>shelf</em></h1>
      <p class="lede">Keep the notes, documents and videos that help you, tagged by domain. Private to you${db.mode === "cloud" ? " (admins can see it for support)" : ""}.</p>
      <div class="card" style="margin-top:26px">
        <h3>Add a resource</h3>
        <div class="form-row">
          <label style="flex:2;min-width:220px">Title<input id="rTitle" maxlength="200" placeholder="e.g. Kerberos explained in 10 minutes"></label>
          <label>Domain<select id="rDom"><option value="">Any</option>${D.map(d => `<option value="${d.id}">D${d.n} ${esc(d.short)}</option>`).join("")}</select></label>
        </div>
        <div class="seg-tabs" role="tablist"><button class="on" data-rk="link">Link or YouTube</button><button data-rk="file" ${db.mode === "cloud" ? "" : "disabled title='Needs the online database'"}>Upload a file</button></div>
        <div class="form-row" id="rLinkRow"><label style="flex:1">URL<input id="rUrl" type="url" placeholder="https://www.youtube.com/watch?v=…"></label></div>
        <div class="form-row" id="rFileRow" hidden><label style="flex:1">File (PDF, Word, PowerPoint, Excel, images, text · max 20 MB)<input id="rFile" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.md"></label></div>
        <div class="form-row"><label style="flex:1">Note (optional)<textarea id="rNote" maxlength="1000" placeholder="Why it helps, which minutes to watch…"></textarea></label></div>
        <button class="btn primary small" id="rAdd">Add to my library</button>
        <p class="hint">Only upload material you have the right to share. Don’t upload personal data about other people.</p>
      </div>
      <div class="filters" style="margin-top:30px"><button class="chip ${libFilter === "all" ? "on" : ""}" data-lf="all">All (${list.length})</button>${D.map(d => `<button class="chip ${libFilter === d.id ? "on" : ""}" data-lf="${d.id}" style="${dc(d)}"><i></i>D${d.n}</button>`).join("")}</div>
      <div class="lib-list">${shown.length ? shown.map(r => {
        const y = r.kind === "video" ? ytId(r.url) : null, d = r.domain && byId[r.domain];
        return `<div class="lib-item" style="${d ? dc(d) : ""}">
          ${y ? `<button class="yt" data-yt="${y}" aria-label="Play video"><img src="https://i.ytimg.com/vi/${y}/hqdefault.jpg" alt="" loading="lazy"><span>▶</span></button>` : `<div class="res-ico">${r.kind === "file" ? "▤" : "↗"}</div>`}
          <div class="lib-body"><div class="lib-meta">${d ? `<span class="toc-dot" style="display:inline-block;background:var(--${d.id})"></span> D${d.n} · ` : ""}${r.kind === "file" ? "Document" : r.kind === "video" ? "Video" : "Link"} · ${fmtD(r.created_at)}</div>
            <h4>${r.kind === "file" ? `<a href="#" data-open="${esc(r.storage_path)}">${esc(r.title)}</a>` : `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a>`}</h4>
            ${r.note ? `<p>${esc(r.note)}</p>` : ""}</div>
          <button class="del" data-rdel="${esc(r.id)}" aria-label="Delete">×</button></div>`;
      }).join("") : `<p class="sub">Nothing here yet. Add the video that finally made subnetting click.</p>`}</div>
    </div>`;
  }
  function bindLibrary() {
    let kind = "link";
    $$("[data-rk]").forEach(b => b.addEventListener("click", () => { kind = b.dataset.rk; $$("[data-rk]").forEach(x => x.classList.toggle("on", x === b)); $("#rLinkRow").hidden = kind !== "link"; $("#rFileRow").hidden = kind !== "file"; }));
    $$("[data-lf]").forEach(b => b.addEventListener("click", () => { libFilter = b.dataset.lf; A.rerender(); }));
    $("#rAdd").addEventListener("click", async (e) => {
      const title = $("#rTitle").value.trim(), domain = $("#rDom").value || null, note = $("#rNote").value.trim() || null;
      try {
        if (kind === "link") {
          let url = $("#rUrl").value.trim();
          if (!/^https:\/\//i.test(url)) throw new Error("Links must start with https://");
          if (!title) throw new Error("Give it a title");
          await db.addResource({ title, kind: ytId(url) ? "video" : "link", url, domain, note });
        } else {
          const f = $("#rFile").files[0]; if (!f) throw new Error("Choose a file");
          if (f.size > 20 * 1024 * 1024) throw new Error("Files must be 20 MB or smaller");
          e.target.disabled = true; e.target.textContent = "Uploading…";
          await db.addResource({ title: title || f.name, kind: "file", domain, note }, f);
        }
        A.toast("Added to your library"); A.rerender();
      } catch (err) { A.toast(A.errMsg(err)); e.target.disabled = false; e.target.textContent = "Add to my library"; }
    });
    $$("[data-rdel]").forEach(b => b.addEventListener("click", async () => {
      const r = A._lib.find(x => String(x.id) === b.dataset.rdel); if (!r || !confirm(`Delete “${r.title}”?`)) return;
      try { await db.deleteResource(r); A.rerender(); } catch (e) { A.toast(A.errMsg(e)); }
    }));
    $$("[data-open]").forEach(a => a.addEventListener("click", async (e) => { e.preventDefault(); try { window.open(await db.fileUrl(a.dataset.open), "_blank", "noopener"); } catch (err) { A.toast(A.errMsg(err)); } }));
    $$("[data-yt]").forEach(b => b.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.className = "yt-frame"; f.title = "YouTube video";
      b.replaceWith(f); f.closest(".lib-item").classList.add("playing");
    }));
  }

  A.register("quiz", {
    render: r => r.a === "run" ? viewRun(r) : viewQuiz(),
    bind: r => { if (r.a === "run") bindRun(r); },
    title: "Quiz", nav: "quiz", area: "quiz"
  });
  A.register("mock", { render: viewMock, bind: bindMock, title: "Mock exam", nav: "mock", area: "mock" });
  A.register("flashcards", { render: viewFlash, bind: bindFlash, title: "Flashcards", nav: "flashcards", area: "flashcards" });
  A.register("insights", { render: viewInsights, bind: bindInsights, title: "Insights", nav: "insights", area: "insights" });
  A.register("library", { render: viewLibrary, bind: bindLibrary, title: "My library", nav: "library", area: "library" });
})();

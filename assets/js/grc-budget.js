/* LearNtime - security budget planner for the CEO and CFO.
   A simple, transparent model: expected annual loss = chance per year (from likelihood 1-5) x cost of the event (from impact 1-5 and revenue).
   Controls lower likelihood or impact; costs are rough Indian planning ranges, scaled by headcount. All figures are estimates to support a
   conversation, not a quote or an actuarial model. Written for LearNtime. */
(function () {
  "use strict";
  const A = window.App, { esc, $, $$ } = A;
  const P_L = [0, 0.01, 0.03, 0.08, 0.2, 0.4];               // likelihood 1-5 as chance per year
  const L_TXT = ["", "Rare (about 1 in 100 years)", "Unlikely (1 in 30)", "Possible (1 in 12)", "Likely (1 in 5)", "Very likely (2 in 5)"];
  const I_PCT = [0, 0.0005, 0.0025, 0.01, 0.03, 0.08];          // impact 1-5 as share of annual revenue
  const I_TXT = ["", "Minor", "Moderate", "Serious", "Major", "Severe"];
  const REV = [["Under ₹50 crore", 25], ["₹50 to 250 crore", 150], ["₹250 to 1,000 crore", 600], ["₹1,000 to 5,000 crore", 2500], ["Over ₹5,000 crore", 8000]];
  const HEAD = [["Under 100", 0.5], ["100 to 500", 1], ["500 to 2,000", 2.2], ["Over 2,000", 4.5]];
  const FLAGS = [["pd", "We hold personal data of customers or staff (DPDP applies)"], ["reg", "A sector regulator oversees us (RBI, SEBI, IRDAI, CEA, DoT)"], ["cards", "We store or process payment card data"],
    ["ot", "We run or manage OT (plants, airports, power, factories)"], ["ent", "We sell to large enterprises or overseas clients"], ["us", "Some clients are in the US"], ["cloud", "A foreign cloud or SaaS provider runs a critical service"]];

  const RISKS = [
    { id: "rw", t: "Ransomware stops operations", L: 3, I: 4 },
    { id: "br", t: "Breach of personal or client data", L: 3, I: 4, f: { pd: [0, 1] } },
    { id: "bec", t: "Payment fraud by fake email (BEC)", L: 3, I: 2 },
    { id: "vn", t: "A key vendor is breached or fails", L: 3, I: 3 },
    { id: "ins", t: "Misuse of admin access by an insider", L: 2, I: 3 },
    { id: "out", t: "Cloud or SaaS outage or suspension (including sanctions)", L: 2, I: 3, f: { cloud: [1, 0] } },
    { id: "reg", t: "Regulatory penalty or order", L: 2, I: 3, f: { pd: [1, 1], reg: [1, 0], cards: [0, 1] } },
    { id: "sal", t: "Losing deals for lack of certificates or reports", L: 1, I: 3, f: { ent: [2, 0], us: [0, 1] } },
    { id: "ot", t: "Disruption of OT or a physical process", L: 2, I: 5, need: "ot" }
  ];
  // [id, name, tier, cost low, cost high (₹ lakh a year at 100-500 staff), [[risk, -L, -I]], mandatory-if flag]
  const CTRL = [
    ["certin", "CERT-In readiness: 180-day logs, clock sync, 6-hour reporting", "must", 4, 12, [["reg", 1, 0], ["rw", 0, 1]], "always"],
    ["dpdp", "DPDP programme: notices, consent, records, breach process, DPAs", "must", 6, 20, [["reg", 2, 0], ["br", 0, 1]], "pd"],
    ["sector", "Sector regulator compliance programme", "must", 10, 30, [["reg", 2, 0]], "reg"],
    ["pci", "PCI DSS (first shrink scope with a payment provider)", "must", 8, 35, [["br", 1, 0], ["reg", 1, 0]], "cards"],
    ["mfa", "MFA everywhere", "essential", 2, 6, [["rw", 1, 0], ["br", 1, 0], ["bec", 1, 0], ["ins", 1, 0]]],
    ["edr", "EDR on all endpoints and servers, patching to a deadline", "essential", 8, 20, [["rw", 2, 0], ["br", 1, 0]]],
    ["bkp", "Immutable backups with restore tests", "essential", 5, 15, [["rw", 0, 2], ["out", 0, 1]]],
    ["aware", "Security awareness and phishing tests", "essential", 2, 6, [["bec", 1, 0], ["rw", 1, 0]]],
    ["pay", "Payment controls: call-back on bank changes, two-person approval", "essential", 1, 3, [["bec", 1, 1]]],
    ["pam", "Privileged access management (PAM)", "essential", 6, 15, [["ins", 1, 1], ["rw", 1, 0]]],
    ["tprm", "Vendor risk programme for Tier 1 vendors", "essential", 4, 12, [["vn", 1, 1], ["out", 1, 0]]],
    ["ir", "Incident response retainer and tested plan", "essential", 5, 20, [["rw", 0, 1], ["br", 0, 1]]],
    ["vapt", "Yearly VAPT by a CERT-In empanelled auditor", "essential", 2, 10, [["br", 1, 0]]],
    ["insur", "Cyber insurance (moves part of the loss to the insurer)", "essential", 3, 30, [["rw", 0, 1], ["br", 0, 1]]],
    ["iso", "ISO 27001 certification", "essential", 7, 25, [["sal", 2, 0], ["reg", 0, 1]], null, "ent"],
    ["soc2", "SOC 2 Type II report", "essential", 12, 40, [["sal", 1, 1]], null, "us"],
    ["otsec", "OT segmentation and controlled vendor remote access", "essential", 10, 40, [["ot", 2, 1]], null, "ot"],
    ["exit", "Fallback for critical SaaS and automated data export", "nice", 5, 25, [["out", 0, 2]]],
    ["grcp", "GRC automation platform", "nice", 5, 20, [["reg", 1, 0], ["sal", 1, 0]]],
    ["red", "Red team exercise", "nice", 8, 25, [["br", 1, 0], ["rw", 1, 0]]]
  ];
  const TIER = { must: "Mandatory", essential: "Essential", nice: "Good to have" };

  const st = () => { const S = A.state(); return (S.grcBudget = S.grcBudget || { rev: 1, head: 1, flags: { pd: 1, ent: 1, cloud: 1 }, rk: {}, on: null }); };
  const crore = v => v >= 100 ? `₹${Math.round(v).toLocaleString("en-IN")} crore` : v >= 1 ? `₹${(Math.round(v * 10) / 10).toLocaleString("en-IN")} crore` : `₹${Math.round(v * 100).toLocaleString("en-IN")} lakh`;
  const lakhR = (lo, hi) => `${lakh(lo)} to ${lakh(hi)}`;
  const lakh = v => v >= 100 ? `₹${(Math.round(v / 10) / 10).toLocaleString("en-IN")} crore` : `₹${Math.round(v).toLocaleString("en-IN")} lakh`;

  function model() {
    const B = st(), rev = REV[B.rev][1], hf = Math.max(HEAD[B.head][1], [0.5, 1, 2, 4, 8][B.rev]), F = B.flags || {};   // bigger companies pay more for the same control
    const risks = RISKS.filter(r => !r.need || F[r.need]).map(r => {
      let L = r.L, I = r.I; Object.entries(r.f || {}).forEach(([k, [dl, di]]) => { if (F[k]) { L += dl; I += di; } });
      const o = (B.rk || {})[r.id]; if (o) { L = o.L; I = o.I; }
      return { ...r, L: Math.min(5, Math.max(1, L)), I: Math.min(5, Math.max(1, I)) };
    });
    const applies = c => !c[7] || F[c[7]];
    const ctrls = CTRL.filter(applies).map(c => ({ id: c[0], t: c[1], tier: c[2], lo: c[3] * hf, hi: c[4] * hf, eff: c[5], must: c[6] === "always" || (c[6] && F[c[6]]) }));
    const ale = (L, I) => P_L[L] * I_PCT[I] * rev;          // ₹ crore a year
    const resid = (sel) => risks.map(r => { let L = r.L, I = r.I; ctrls.filter(c => sel.has(c.id)).forEach(c => c.eff.forEach(([rid, dl, di]) => { if (rid === r.id) { L -= dl; I -= di; } }));
      L = Math.max(1, L); I = Math.max(1, I); return { r, L, I, ale: ale(L, I) }; });
    const before = risks.reduce((n, r) => n + ale(r.L, r.I), 0);
    // packages
    const mustSet = new Set(ctrls.filter(c => c.must).map(c => c.id));
    const worth = (base, c) => { const s = new Set(base); const a = resid(s).reduce((n, x) => n + x.ale, 0); s.add(c.id); const b = resid(s).reduce((n, x) => n + x.ale, 0); return (a - b) * 100 / ((c.lo + c.hi) / 2); };  // loss avoided per ₹ spent
    const rec = new Set(mustSet);
    // add essential controls in order of value while each still returns more than it costs
    let added = true; while (added) { added = false; let best = null, bv = 1;
      ctrls.filter(c => c.tier === "essential" && !rec.has(c.id)).forEach(c => { const v = worth(rec, c); if (v > bv) { bv = v; best = c; } });
      if (best) { rec.add(best.id); added = true; } }
    const full = new Set(ctrls.map(c => c.id));
    const pack = (set) => { const cs = ctrls.filter(c => set.has(c.id)), R = resid(set), after = R.reduce((n, x) => n + x.ale, 0);
      return { set, lo: cs.reduce((n, c) => n + c.lo, 0), hi: cs.reduce((n, c) => n + c.hi, 0), after, R }; };
    const sel = B.on ? new Set(B.on.filter(id => ctrls.some(c => c.id === id)).concat([...mustSet])) : new Set(rec);
    return { B, rev, risks, ctrls, before, ale, resid, worth, packs: { min: pack(mustSet), rec: pack(rec), full: pack(full) }, mine: pack(sel), sel, mustSet };
  }

  function matrix(title, pts) {
    let h = "";
    for (let l = 5; l >= 1; l--) { h += `<span class="vz-yl">${l}</span>`; for (let i = 1; i <= 5; i++) { const s = l * i, c = s >= 15 ? "c4" : s >= 10 ? "c3" : s >= 5 ? "c2" : "c1", here = pts.filter(p => p.L === l && p.I === i);
      h += `<span class="vz-cell ${c} bp-cell" title="${here.map(p => p.n + ". " + p.t).join("; ")}">${here.map(p => `<b>${p.n}</b>`).join("")}</span>`; } }
    h += `<span></span>` + [1, 2, 3, 4, 5].map(i => `<span class="vz-xl">${i}</span>`).join("");
    return `<figure class="vz-mat bp-mat"><figcaption>${title}</figcaption><div class="vz-grid" role="img" aria-label="${title}: ${pts.map(p => `risk ${p.n} at likelihood ${p.L}, impact ${p.I}`).join("; ")}">${h}</div></figure>`;
  }

  function view() {
    const M = model(), B = M.B, mine = M.mine, cost = (mine.lo + mine.hi) / 2 / 100;   // crore
    const avoided = M.before - mine.after;
    const num = new Map(M.risks.map((r, i) => [r.id, i + 1]));
    const pk = [["min", "Minimum", "Only what the law and your regulators require."], ["rec", "Recommended", "Mandatory items plus the essential controls that avoid more loss than they cost."], ["full", "Full programme", "Everything on the list, including good-to-haves."]];
    return `<div class="page grc-budget">
      <a class="kicker" href="#/grc/spend">← CEO and CFO guide</a>
      <h1 class="h-display">Security budget <em>planner</em></h1>
      <p class="lede">Describe the company, check the risk scores, and see what a sensible security and compliance budget looks like: the range to spend, the yearly loss it avoids, and the risk matrix before and after.</p>
      <section class="card bp-profile"><h2 class="bp-h">1. The company</h2>
        <div class="form-row"><label>Annual revenue<select id="bpRev">${REV.map(([t], i) => `<option value="${i}" ${B.rev === i ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label>Employees<select id="bpHead">${HEAD.map(([t], i) => `<option value="${i}" ${B.head === i ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
        <fieldset class="vd-set"><legend>Tick what is true</legend>${FLAGS.map(([k, t]) => `<label class="check"><input type="checkbox" data-bpf="${k}" ${(B.flags || {})[k] ? "checked" : ""}><span>${t}</span></label>`).join("")}</fieldset></section>

      <section class="bp-packs" aria-label="Budget options">${pk.map(([k, t, d]) => { const p = M.packs[k], av = M.before - p.after, mid = (p.lo + p.hi) / 2 / 100;
        return `<div class="card bp-pack ${k}"><span class="kicker">${t}</span><b class="bp-range">${lakhR(p.lo, p.hi)}</b><small>a year</small>
          <dl><dt>Expected loss avoided</dt><dd>${crore(av)} a year</dd><dt>Left over (residual)</dt><dd>${crore(p.after)} a year</dd><dt>Return</dt><dd>${mid ? (av / mid).toFixed(1) + "× the midpoint spend" : "-"}</dd></dl>
          <p class="hint">${d}</p><button class="btn small ${k === "rec" ? "primary" : ""}" data-bppack="${k}">Use this as my plan</button></div>`; }).join("")}</section>

      <section class="card bp-sum"><h2 class="bp-h">2. Your plan</h2>
        <div class="facts" style="border:0;margin:0">
          <div class="fact"><b>${crore(M.before)}</b><span>expected loss a year today</span></div>
          <div class="fact"><b>${lakhR(mine.lo, mine.hi)}</b><span>cost a year (${mine.set.size} controls)</span></div>
          <div class="fact"><b>${crore(mine.after)}</b><span>expected loss a year after</span></div>
          <div class="fact"><b>${cost ? (avoided / cost).toFixed(1) + "×" : "-"}</b><span>loss avoided per rupee spent</span></div>
        </div>
        <div class="vz-mats bp-mats">${matrix("Before: inherent risk", M.risks.map(r => ({ n: num.get(r.id), t: r.t, L: r.L, I: r.I })))}${matrix("After your plan: residual risk", mine.R.map(x => ({ n: num.get(x.r.id), t: x.r.t, L: x.L, I: x.I })))}</div>
        <p class="vz-axis">Across: impact 1 (minor) to 5 (severe). Up: likelihood 1 (rare) to 5 (almost certain). Numbers are the risks in the table below.</p></section>

      <section class="card"><h2 class="bp-h">3. The risks</h2><p class="sub" style="margin-top:0">Scores are filled in from your answers; change any you disagree with. Loss = chance per year × cost of the event, using your revenue.</p>
        <div class="tbl-wrap"><table class="tbl bp-risks"><thead><tr><th>#</th><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Expected loss today</th><th>After your plan</th></tr></thead><tbody>
        ${M.risks.map((r, i) => { const a = mine.R.find(x => x.r.id === r.id); return `<tr><td>${i + 1}</td><td>${esc(r.t)}</td>
          <td><select data-bpl="${r.id}" aria-label="Likelihood of ${esc(r.t)}">${[1, 2, 3, 4, 5].map(v => `<option value="${v}" ${r.L === v ? "selected" : ""}>${v} ${L_TXT[v].split(" (")[0]}</option>`).join("")}</select></td>
          <td><select data-bpi="${r.id}" aria-label="Impact of ${esc(r.t)}">${[1, 2, 3, 4, 5].map(v => `<option value="${v}" ${r.I === v ? "selected" : ""}>${v} ${I_TXT[v]}</option>`).join("")}</select></td>
          <td class="num">${crore(M.ale(r.L, r.I))}</td><td class="num">${crore(a.ale)} <small>(${a.L}×${a.I})</small></td></tr>`; }).join("")}</tbody></table></div>
        ${Object.keys(B.rk || {}).length ? `<button class="btn small ghost" id="bpResetR">Reset scores to the defaults</button>` : ""}</section>

      <section class="card"><h2 class="bp-h">4. The controls</h2><p class="sub" style="margin-top:0">Tick or untick to build your own plan. Mandatory items for your profile are always included. "Value" is the loss each control avoids for every rupee it costs, given the rest of your plan.</p>
        ${["must", "essential", "nice"].map(tier => { const cs = M.ctrls.filter(c => c.tier === tier); if (!cs.length) return "";
          return `<h3 class="bp-tier ${tier}">${TIER[tier]}</h3><div class="bp-ctrls">${cs.map(c => { const others = new Set([...M.sel].filter(x => x !== c.id)), v = M.worth(others, c);
            return `<label class="bp-ctrl ${M.sel.has(c.id) ? "on" : ""}"><input type="checkbox" data-bpc="${c.id}" ${M.sel.has(c.id) ? "checked" : ""} ${c.must ? "disabled" : ""}>
              <span class="bp-ct"><b>${esc(c.t)}</b><small>Treats: ${c.eff.map(([rid]) => num.get(rid)).filter(Boolean).map(n => "#" + n).join(", ") || "-"}${c.must ? " · required for your profile" : ""}</small></span>
              <span class="bp-cc">${lakhR(c.lo, c.hi)}<small class="${v >= 1 ? "good" : "poor"}">value ${v >= 10 ? Math.round(v) : v.toFixed(1)}×</small></span></label>`; }).join("")}</div>`; }).join("")}</section>

      <div class="btn-row"><button class="btn primary small" id="bpCsv">Download for the Board pack (Excel)</button><button class="btn small" id="bpPrint">Print</button></div>
      <p class="hint" style="margin-top:14px"><b>How to read this.</b> It is a planning model, not a quote or an actuarial study. Chance per year: 1 = 1%, 2 = 3%, 3 = 8%, 4 = 20%, 5 = 40%. Cost of an event: 1 = 0.05%, 2 = 0.25%, 3 = 1%, 4 = 3%, 5 = 8% of annual revenue. Control costs are rough Indian ranges, scaled by headcount or revenue, whichever is larger. Mandatory items are required whatever the return. Use it to start the budget conversation, then replace the numbers with your own quotes and incident data. See the <a href="#/grc/spend">CEO and CFO guide</a> and <a href="#/grc/landscape">Regulators and standards</a>.</p>
    </div>`;
  }

  function bind() {
    const B = st(), go = () => { A.save(); A.rerender(); };
    const rv = $("#bpRev"); if (!rv) return;
    rv.addEventListener("change", () => { B.rev = +rv.value; go(); });
    $("#bpHead").addEventListener("change", e => { B.head = +e.target.value; go(); });
    $$("[data-bpf]").forEach(x => x.addEventListener("change", () => { B.flags = B.flags || {}; B.flags[x.dataset.bpf] = x.checked ? 1 : 0; go(); }));
    $$("[data-bpl],[data-bpi]").forEach(x => x.addEventListener("change", () => { const id = x.dataset.bpl || x.dataset.bpi, M = model(), r = M.risks.find(y => y.id === id);
      B.rk = B.rk || {}; B.rk[id] = { L: r.L, I: r.I }; if (x.dataset.bpl) B.rk[id].L = +x.value; else B.rk[id].I = +x.value; go(); }));
    const rr = $("#bpResetR"); if (rr) rr.addEventListener("click", () => { B.rk = {}; go(); });
    $$("[data-bpc]").forEach(x => x.addEventListener("change", () => { const M = model(), s = new Set(M.sel); if (x.checked) s.add(x.dataset.bpc); else s.delete(x.dataset.bpc); B.on = [...s]; go(); }));
    $$("[data-bppack]").forEach(x => x.addEventListener("click", () => { const M = model(); B.on = [...M.packs[x.dataset.bppack].set]; A.toast("Plan updated"); go(); }));
    $("#bpPrint").addEventListener("click", () => print());
    $("#bpCsv").addEventListener("click", () => {
      const M = model(), mine = M.mine, q = c => { c = String(c ?? ""); return /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c; };
      const rows = [["LearNtime security budget plan", new Date().toLocaleDateString("en-GB")], [], ["Revenue", REV[M.B.rev][0]], ["Employees", HEAD[M.B.head][0]], [],
        ["Option", "Cost low (₹ lakh/yr)", "Cost high (₹ lakh/yr)", "Expected loss after (₹ crore/yr)", "Loss avoided (₹ crore/yr)"]]
        .concat([["Minimum", "min"], ["Recommended", "rec"], ["Full", "full"], ["My plan", null]].map(([t, k]) => { const p = k ? M.packs[k] : mine; return [t, Math.round(p.lo), Math.round(p.hi), p.after.toFixed(2), (M.before - p.after).toFixed(2)]; }))
        .concat([[], ["#", "Risk", "Likelihood", "Impact", "Expected loss today (₹ crore/yr)", "Likelihood after", "Impact after", "Expected loss after (₹ crore/yr)"]])
        .concat(M.risks.map((r, i) => { const a = mine.R.find(x => x.r.id === r.id); return [i + 1, r.t, r.L, r.I, M.ale(r.L, r.I).toFixed(2), a.L, a.I, a.ale.toFixed(2)]; }))
        .concat([[], ["Control", "Level", "In my plan", "Cost low (₹ lakh/yr)", "Cost high (₹ lakh/yr)"]])
        .concat(M.ctrls.map(c => [c.t, TIER[c.tier], M.sel.has(c.id) ? "Yes" : "No", Math.round(c.lo), Math.round(c.hi)]));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + rows.map(r => r.map(q).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })); a.download = "security-budget-plan.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
  }
  window.GRC_BUDGET = { view, bind };
})();

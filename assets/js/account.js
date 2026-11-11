/* The CISSP Reader — sign-in, onboarding, profile, privacy & trust centre */
(function () {
  "use strict";
  const A = window.App, { D, byId, $, $$, esc, dc, ymd, today, addDays, fmtDY, db } = A;
  const C = window.CISSP_CONFIG || {};
  const VERSION = C.privacyVersion || "2026-11-v1";
  const cloud = db.mode === "cloud";

  const shell = (inner, wide) => `<div class="auth ${wide ? "wide" : ""}"><div class="auth-brand"><span class="brand-mark">C</span><div><b>The CISSP Reader</b><small>Read slowly. Pass once.</small></div></div>${inner}</div>`;
  const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };

  /* ---------------- login ---------------- */
  function viewLogin() {
    if (!cloud) return shell(`<div class="auth-card"><h1>Accounts are coming soon</h1><p class="auth-sub">Online accounts aren’t switched on yet. You can still study now: your plan and progress are saved privately in this browser.</p><div class="btn-row"><a class="btn primary" href="#/welcome">Set up my plan on this device</a><a class="btn ghost" href="#/landing">Back</a></div></div>`);
    return shell(`<div class="auth-card">
      <h1>Welcome back</h1><p class="auth-sub">Every session moves you closer. Sign in to pick up where you left off.</p>
      <form id="loginForm" class="stack">
        <label>Email or username<input id="lId" autocomplete="username" required></label>
        <label>Password<input id="lPw" type="password" autocomplete="current-password" required></label>
        <button class="btn primary" id="lGo">Sign in</button>
      </form>
      <div id="lMsg"></div>
      <div class="auth-links"><a href="#/forgot">Forgot password?</a><a href="#/signup">Create an account</a></div>
    </div><p class="auth-foot"><a href="#/privacy">Privacy &amp; trust</a></p>`);
  }
  function bindLogin() {
    const f = $("#loginForm"); if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const b = $("#lGo"); busy(b, true, "Signing in…"); $("#lMsg").innerHTML = "";
      try {
        await db.signIn($("#lId").value, $("#lPw").value);
        await A.afterLogin(); try { sessionStorage.removeItem("cissp.mode"); } catch (x) {} location.hash = A.isAdmin() ? "#/choose" : "#/"; A.route();
      } catch (err) {
        const m = A.errMsg(err);
        if (/not confirmed/i.test(m)) {
          $("#lMsg").innerHTML = `<div class="warnbox">Please verify your email first. Check your inbox (and spam) for the link.<div class="btn-row" style="margin-top:10px"><button class="btn small" id="resend">Resend verification email</button></div></div>`;
          $("#resend").addEventListener("click", async () => {
            let em = $("#lId").value.trim();
            try { if (!em.includes("@")) throw new Error("Enter your email address (not username) to resend."); await db.resend(em); A.toast("Verification email sent"); } catch (x) { A.toast(A.errMsg(x)); }
          });
        } else $("#lMsg").innerHTML = `<div class="warnbox">${esc(/invalid login/i.test(m) ? "That email/username and password don’t match." : m)}</div>`;
        busy(b, false, "Sign in");
      }
    });
  }

  /* ---------------- signup ---------------- */
  function viewSignup(r) {
    if (!cloud) return viewLogin();
    const pre = (r && r.a) || "gold";
    return shell(`<div class="auth-card">
      <h1>Start your CISSP journey</h1><p class="auth-sub">Free. A personal plan, quizzes, flashcards and mock exams, built around your exam date.</p>
      <form id="suForm" class="stack">
        <label>Full name<input id="sName" maxlength="80" autocomplete="name" required></label>
        <label>Username <small id="uHint" class="hint"></small><input id="sUser" maxlength="32" autocomplete="username" pattern="[a-z0-9_.\\-]{3,32}" required placeholder="lowercase letters, digits, . _ -"></label>
        <label>Email<input id="sEmail" type="email" autocomplete="email" required></label>
        <label>Password <small class="hint">at least 10 characters</small><input id="sPw" type="password" minlength="10" autocomplete="new-password" required></label>
        <fieldset class="plan-pick"><legend>Your plan <small class="hint">free for the first year</small></legend>
          ${A.plans.filter(p => p.active !== false).map(p => `<label class="pp pp-${p.id}"><input type="radio" name="sPlan" value="${p.id}" ${p.id === pre ? "checked" : ""}><span><b>${esc(p.name)}</b><small>${esc(p.tagline || "")} · free ${p.free_months} months</small></span></label>`).join("")}
        </fieldset>
        <label class="check"><input type="checkbox" id="sAge" required><span>I am 18 or older.</span></label>
        <label class="check"><input type="checkbox" id="sConsent" required><span>I have read the <a href="#/privacy" target="_blank">privacy notice</a> and consent to my account, study plan and study activity being processed to run this service. I can withdraw consent or delete my account at any time.</span></label>
        <button class="btn primary" id="sGo">Create account</button>
      </form>
      <div id="sMsg"></div>
      <div class="auth-links"><a href="#/login">I already have an account</a></div>
    </div>`);
  }
  function bindSignup() {
    const f = $("#suForm"); if (!f) return;
    let t;
    $("#sUser").addEventListener("input", (e) => {
      e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      clearTimeout(t); const v = e.target.value;
      t = setTimeout(async () => { if (v.length < 3) { $("#uHint").textContent = ""; return; } try { const ok = await db.usernameAvailable(v); $("#uHint").textContent = ok ? "✓ available" : "✗ taken or reserved"; $("#uHint").style.color = ok ? "var(--good)" : "var(--bad)"; } catch (x) {} }, 350);
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const b = $("#sGo"); busy(b, true, "Creating…");
      try {
        const username = $("#sUser").value.trim();
        if (!(await db.usernameAvailable(username))) throw new Error("That username is taken or reserved.");
        const email = $("#sEmail").value.trim();
        const plan = (f.querySelector('input[name="sPlan"]:checked') || {}).value || "silver";
        await db.signUp({ email, password: $("#sPw").value, username, full_name: $("#sName").value.trim(), consent: $("#sConsent").checked, plan });
        $(".auth-card").innerHTML = `<div class="dots verify-dots"><span class="on"></span><span class="on"></span><span></span><span></span></div><h1>Check your inbox</h1><p class="auth-sub">We sent a verification link to <b>${esc(email)}</b>. Open it to activate your account. You’ll come straight back here.</p>
          <ol class="land-steps small"><li><b>✓</b>Account created</li><li><b>2</b>Verify your email</li><li><b>3</b>Three quick questions about your exam</li><li><b>4</b>Your personal plan</li></ol>
          <p class="hint">Nothing after a few minutes? Check spam, or sign in and use “Resend verification email”.</p><a class="btn primary" href="#/login">Go to sign in</a>`;
      } catch (err) { $("#sMsg").innerHTML = `<div class="warnbox">${esc(A.errMsg(err))}</div>`; busy(b, false, "Create account"); }
    });
  }

  /* ---------------- forgot / reset ---------------- */
  const viewForgot = () => shell(`<div class="auth-card"><h1>Reset your password</h1><p class="auth-sub">We’ll email you a secure link.</p>
    <form id="fgForm" class="stack"><label>Email<input id="fEmail" type="email" required></label><button class="btn primary" id="fGo">Send reset link</button></form>
    <div class="auth-links"><a href="#/login">Back to sign in</a></div></div>`);
  function bindForgot() {
    const f = $("#fgForm"); if (!f) return;
    f.addEventListener("submit", async (e) => { e.preventDefault(); busy($("#fGo"), true, "Sending…");
      try { await db.resetPassword($("#fEmail").value.trim()); } catch (x) {}
      $(".auth-card").innerHTML = `<h1>Check your email</h1><p class="auth-sub">If an account exists for that address, a reset link is on its way.</p><a class="btn" href="#/login">Back to sign in</a>`; });
  }
  const viewReset = () => shell(`<div class="auth-card"><h1>Choose a new password</h1>
    <form id="rsForm" class="stack"><label>New password <small class="hint">at least 10 characters</small><input id="rPw" type="password" minlength="10" autocomplete="new-password" required></label><button class="btn primary" id="rGo">Save password</button></form></div>`);
  function bindReset() {
    const f = $("#rsForm"); if (!f) return;
    f.addEventListener("submit", async (e) => { e.preventDefault(); busy($("#rGo"), true, "Saving…");
      try { await db.updatePassword($("#rPw").value); A.toast("Password updated"); if (db.user) { await A.afterLogin(); } location.hash = "#/"; }
      catch (x) { A.toast(A.errMsg(x)); busy($("#rGo"), false, "Save password"); } });
  }

  /* ---------------- consent (invited users) ---------------- */
  const viewConsent = () => shell(`<div class="auth-card"><h1>One thing before you start</h1>
    <p class="auth-sub">Your administrator created this account for you. To use it, please confirm how your data is handled.</p>
    <ul class="mini-list"><li>We store your account, exam dates, self-assessment and study activity (time per topic, quiz answers) to run your plan and show your progress.</li><li>Your administrator can see your progress and an audit trail of account activity.</li><li>You can export, correct or delete your data at any time from Privacy &amp; my data.</li></ul>
    <form id="cnForm" class="stack"><label class="check"><input type="checkbox" required id="cAge"><span>I am 18 or older.</span></label>
    <label class="check"><input type="checkbox" required><span>I have read the <a href="#/privacy" target="_blank">privacy notice</a> and consent to this processing.</span></label>
    <button class="btn primary" id="cGo">Agree and continue</button></form>
    <div class="auth-links"><button class="linkbtn" id="cNo">I don’t agree. Sign me out.</button></div></div>`);
  function bindConsent() {
    const f = $("#cnForm"); if (!f) return;
    f.addEventListener("submit", async (e) => { e.preventDefault(); busy($("#cGo"), true, "Saving…");
      try { A.profile = await db.updateProfile({ consent_terms_at: new Date().toISOString(), consent_version: VERSION }); db.logEvent("user.consent_given", { version: VERSION }); location.hash = "#/welcome"; }
      catch (x) { A.toast(A.errMsg(x)); busy($("#cGo"), false, "Agree and continue"); } });
    $("#cNo").addEventListener("click", async () => { await db.signOut(); location.hash = "#/login"; location.reload(); });
  }

  /* ---------------- onboarding ---------------- */
  let W = null;
  const levels = [["new", "New to me", "I haven’t worked with this much"], ["some", "Some exposure", "I know parts of it"], ["confident", "Confident", "I use this in my work"]];
  function viewWelcome() {
    const p = A.profile || {};
    if (!W) W = { step: 1, data: { full_name: p.full_name || "", experience_years: p.experience_years ?? "", target_date: p.target_date || ymd(addDays(today(), 91)), latest_date: p.latest_date || "", exam_booked: !!p.exam_booked, weekly_hours: p.weekly_hours || 10, self_assessment: Object.assign({}, p.self_assessment || {}) } };
    const d = W.data, s = W.step;
    const dots = [1, 2, 3].map(i => `<span class="${i <= s ? "on" : ""}"></span>`).join("");
    let body = "";
    if (s === 1) body = `<span class="kicker">Step 1 of 3</span><h1>${cloud ? `You’re verified${d.full_name ? ", " + esc(d.full_name.split(" ")[0]) : ""}. Welcome.` : "Welcome. Let’s build your plan."}</h1>
      <p class="auth-sub">Three quick questions so your plan fits your exam date and what you already know. It takes about a minute.</p>
      <div class="stack"><label>What should we call you?<input id="wName" maxlength="80" value="${esc(d.full_name)}"></label>
      <label>Years of paid security experience<input id="wExp" type="number" min="0" max="60" value="${esc(d.experience_years)}"><small class="hint">CISSP needs five years in two or more domains. Less? You can still pass and become an Associate of ISC2.</small></label></div>`;
    if (s === 2) body = `<span class="kicker">Step 2 of 3</span><h1>When is your exam?</h1><p class="auth-sub">A date turns a wish into a plan. Pick a target even if you haven’t booked yet.</p>
      <div class="stack"><label>Target exam date<input id="wTarget" type="date" min="${ymd(addDays(today(), 7))}" value="${esc(d.target_date)}"></label>
      <label>Latest possible date <small class="hint">optional, e.g. before an outline change or a work deadline</small><input id="wLatest" type="date" value="${esc(d.latest_date)}"></label>
      <label class="check"><input type="checkbox" id="wBooked" ${d.exam_booked ? "checked" : ""}><span>I’ve already booked it with Pearson VUE</span></label>
      <label>Hours you can study in a normal week <b id="wHv">${d.weekly_hours}</b><input id="wHours" type="range" min="2" max="30" value="${d.weekly_hours}"></label></div>`;
    if (s === 3) body = `<span class="kicker">Step 3 of 3</span><h1>What do you already know?</h1><p class="auth-sub">Be honest; nobody else sees this. “New to me” domains go first in your plan and get the most time.</p>
      <div class="assess">${D.map(dm => `<div class="as-row" style="${dc(dm)}"><div><span class="toc-dot" style="display:inline-block;background:var(--${dm.id})"></span> <b>D${dm.n} ${esc(dm.title)}</b><small>${esc(dm.lede.split(".")[0])}.</small></div>
        <div class="seg3">${levels.map(([v, l, h]) => `<button type="button" data-as="${dm.id}:${v}" class="${(d.self_assessment[dm.id] || "") === v ? "on" : ""}" title="${h}">${l}</button>`).join("")}</div></div>`).join("")}</div>`;
    return shell(`<div class="auth-card wizard"><div class="dots">${dots}</div>${body}
      <div class="btn-row">${s > 1 ? `<button class="btn ghost" id="wBack">Back</button>` : ""}<button class="btn primary" id="wNext">${s < 3 ? "Continue" : "Build my plan →"}</button></div></div>`, s === 3);
  }
  function bindWelcome() {
    const d = W.data;
    const grab = () => {
      if ($("#wName")) { d.full_name = $("#wName").value.trim(); d.experience_years = $("#wExp").value === "" ? null : +$("#wExp").value; }
      if ($("#wTarget")) { d.target_date = $("#wTarget").value; d.latest_date = $("#wLatest").value || null; d.exam_booked = $("#wBooked").checked; d.weekly_hours = +$("#wHours").value; }
    };
    const h = $("#wHours"); if (h) h.addEventListener("input", () => { $("#wHv").textContent = h.value; });
    $$("[data-as]").forEach(b => b.addEventListener("click", () => { const [id, v] = b.dataset.as.split(":"); d.self_assessment[id] = v; $$(`[data-as^="${id}:"]`).forEach(x => x.classList.toggle("on", x === b)); }));
    const back = $("#wBack"); if (back) back.addEventListener("click", () => { grab(); W.step--; A.rerender(); });
    $("#wNext").addEventListener("click", async (e) => {
      grab();
      if (W.step === 2) {
        if (!d.target_date) return A.toast("Pick a target date");
        if (d.latest_date && d.latest_date < d.target_date) return A.toast("The latest date must be on or after the target date");
      }
      if (W.step < 3) { W.step++; A.rerender(); return; }
      if (D.some(dm => !d.self_assessment[dm.id])) return A.toast("Rate all eight domains (it takes ten seconds)");
      busy(e.target, true, "Building…");
      try {
        A.profile = await db.updateProfile(Object.assign({}, d, { onboarded: true, full_name: d.full_name || null }));
        A.state().planStart = ymd(today()); A.save();
        db.logEvent("user.onboarded", {}); W = null;
        A.toast("Your plan is ready. Let’s begin."); location.hash = "#/plan";
      } catch (x) { A.toast(A.errMsg(x)); busy(e.target, false, "Build my plan →"); }
    });
  }

  /* ---------------- profile ---------------- */
  function viewProfile() {
    const p = A.profile || {};
    return `<div class="page-narrow">
      <div class="kicker">Profile</div>
      <h1 class="h-display">You, <em>and your exam</em></h1>
      <p class="lede">Change anything here and your plan, path and focus areas update straight away.</p>
      <form id="pfForm" class="card stack" style="margin-top:26px">
        ${cloud && p.plan ? `<div class="plan-line plan-${esc(p.plan)}"><span class="plan-gem"></span><div><b>${esc(A.planById(p.plan).name)} plan</b><small>${p.plan_expires_at ? "Free until " + fmtDY(p.plan_expires_at) : "Free"} · <a href="#/plans">compare plans</a></small></div></div>` : ""}
        <h3>About you</h3>
        <div class="form-row">
          <label style="flex:1">Full name<input id="pName" maxlength="80" value="${esc(p.full_name || "")}"></label>
          <label>Experience (years)<input id="pExp" type="number" min="0" max="60" value="${esc(p.experience_years ?? "")}"></label>
        </div>
        ${cloud ? `<div class="form-row"><label style="flex:1">Email<input value="${esc(p.email || "")}" disabled></label><label style="flex:1">Username<input value="${esc(p.username || "")}" disabled></label></div><p class="hint">To change your email or username, raise a request under <a href="#/privacy">Privacy &amp; my data</a>.</p>` : ""}
        <h3 style="margin-top:14px">Your exam</h3>
        <div class="form-row">
          <label>Target date<input id="pTarget" type="date" value="${esc(p.target_date || "")}"></label>
          <label>Latest possible date<input id="pLatest" type="date" value="${esc(p.latest_date || "")}"></label>
          <label>Hours per week<input id="pHours" type="number" min="1" max="80" value="${esc(p.weekly_hours || 10)}"></label>
        </div>
        <label class="check"><input type="checkbox" id="pBooked" ${p.exam_booked ? "checked" : ""}><span>Booked with Pearson VUE</span></label>
        <h3 style="margin-top:14px">What you know</h3>
        <div class="assess">${D.map(dm => `<div class="as-row" style="${dc(dm)}"><div><span class="toc-dot" style="display:inline-block;background:var(--${dm.id})"></span> <b>D${dm.n} ${esc(dm.short)}</b></div>
          <div class="seg3">${levels.map(([v, l]) => `<button type="button" data-pas="${dm.id}:${v}" class="${((p.self_assessment || {})[dm.id] || "") === v ? "on" : ""}">${l}</button>`).join("")}</div></div>`).join("")}</div>
        <div class="btn-row"><button class="btn primary" id="pSave">Save changes</button></div>
      </form>
      ${cloud ? `<div class="card stack" style="margin-top:18px"><h3>Change password</h3><div class="form-row"><label style="flex:1">New password<input id="pPw" type="password" minlength="10" autocomplete="new-password"></label><button class="btn small" id="pPwGo">Update</button></div></div>` : ""}
    </div>`;
  }
  function bindProfile() {
    const sa = Object.assign({}, (A.profile || {}).self_assessment || {});
    $$("[data-pas]").forEach(b => b.addEventListener("click", () => { const [id, v] = b.dataset.pas.split(":"); sa[id] = v; $$(`[data-pas^="${id}:"]`).forEach(x => x.classList.toggle("on", x === b)); }));
    $("#pfForm").addEventListener("submit", async (e) => {
      e.preventDefault(); const b = $("#pSave"); busy(b, true, "Saving…");
      try {
        const t = $("#pTarget").value || null, l = $("#pLatest").value || null;
        if (t && l && l < t) throw new Error("The latest date must be on or after the target date");
        A.profile = await db.updateProfile({ full_name: $("#pName").value.trim() || null, experience_years: $("#pExp").value === "" ? null : +$("#pExp").value,
          target_date: t, latest_date: l, weekly_hours: +$("#pHours").value || null, exam_booked: $("#pBooked").checked, self_assessment: sa });
        A.toast("Saved. Your plan has been updated."); A.renderToc(A.parse());
      } catch (x) { A.toast(A.errMsg(x)); }
      busy(b, false, "Save changes");
    });
    const pw = $("#pPwGo"); if (pw) pw.addEventListener("click", async () => {
      const v = $("#pPw").value; if (v.length < 10) return A.toast("Use at least 10 characters");
      try { await db.updatePassword(v); $("#pPw").value = ""; A.toast("Password updated"); } catch (x) { A.toast(A.errMsg(x)); }
    });
  }

  /* ---------------- privacy & trust centre ---------------- */
  const controller = C.contactEmail ? `<a href="mailto:${esc(C.contactEmail)}">${esc(C.contactEmail)}</a>` : "the site administrator (use “Raise a request” below)";
  function notice() {
    return `<div class="prose" style="max-width:none">
      <p class="intro">This notice explains what The CISSP Reader collects, why, and the control you have over it. It is written to meet the EU General Data Protection Regulation (GDPR) and India’s Digital Personal Data Protection Act 2023 (DPDP) with the DPDP Rules 2025. Version ${esc(VERSION)}.</p>
      <h3>Who is responsible</h3><p>The operator of this site is the data controller (a “Data Fiduciary” under DPDP). Contact and grievance officer: ${controller}. We aim to acknowledge requests within 7 days and resolve them within 30 days.</p>
      <h3>What we collect</h3><ul>
        <li><strong>Account</strong>: email, username, name, and a password hash managed by our authentication provider. We never see your password.</li>
        <li><strong>Your plan</strong>: exam dates, weekly hours, years of experience and your self-assessment per domain.</li>
        <li><strong>Study activity</strong>: sections marked as read, quiz and mock answers, flashcard progress, error-log notes, and active study time per topic and day.</li>
        <li><strong>Your library</strong>: links and files you choose to upload.</li>
        <li><strong>Security records</strong>: an audit trail of account events (sign-ups, sign-ins, profile changes, data exports, deletions, admin actions).</li>
      </ul>
      <h3>Why, and on what basis</h3><ul>
        <li>To run the service, build your plan and show your progress: your <strong>consent</strong> (DPDP s.6; GDPR Art. 6(1)(a)) and performing the service you asked for (GDPR Art. 6(1)(b)).</li>
        <li>Study-time analytics: consent, which you can switch off below at any time.</li>
        <li>Security and accountability (audit trail): legitimate interest in protecting the service (GDPR Art. 6(1)(f)); a legitimate use under DPDP.</li>
      </ul>
      <p>We don’t sell data, show ads, use your data to train AI models, or make automated decisions with legal effect. Your administrator can see learner progress and the audit trail to support learners and keep the service secure.</p>
      <h3>Who processes it for us</h3><ul>
        <li><strong>Supabase</strong> (database, authentication, file storage), hosted in the region chosen at set-up. Data is encrypted in transit (TLS) and at rest.</li>
        <li><strong>Netlify</strong> (website hosting).</li>
        <li><strong>Google Fonts</strong> (typefaces): your browser fetches fonts, which reveals your IP address to Google.</li>
        <li><strong>YouTube</strong>, only if you press play on a video in your library (privacy-enhanced mode).</li>
      </ul><p>These providers may process data outside your country under their contractual safeguards (e.g. standard contractual clauses).</p>
      <h3>How long we keep it</h3><p>For as long as your account exists. When you delete your account, your profile, plan, activity, flashcards, library files and requests are erased immediately. Audit-trail entries are kept for security accountability but <strong>pseudonymised</strong>: your identity is replaced with a random reference.</p>
      <h3>Your rights</h3><ul>
        <li><strong>Access and portability</strong>: download everything as JSON, instantly.</li>
        <li><strong>Correction</strong>: edit your profile, or raise a request for anything you can’t edit.</li>
        <li><strong>Erasure</strong>: delete your account yourself, instantly.</li>
        <li><strong>Withdraw consent</strong>: switch off study analytics, or delete your account.</li>
        <li><strong>Grievance redressal and nomination</strong> (DPDP): raise a request; you may nominate someone to exercise your rights.</li>
        <li><strong>Complaint</strong>: to the Data Protection Board of India, or your EU/UK supervisory authority.</li>
      </ul>
      <h3>Age</h3><p>This service is for people aged 18 and over.</p>
      <h3>If something goes wrong</h3><p>If a personal data breach affects you, we will tell you and notify the relevant authority as the law requires (for GDPR, within 72 hours where feasible).</p>
    </div>`;
  }
  function trust() {
    const ctl = [
      ["5.15 / 8.3", "Access control, information access restriction", "Row-level security on every table: learners reach only their own rows; admin rights are enforced in the database, not the browser."],
      ["8.5", "Secure authentication", "Email verification before first sign-in, password minimum 10 characters, secure password reset by email link."],
      ["5.18 / 8.2", "Access rights, privileged access", "Admin role is reserved to a named account and can’t be self-assigned (database trigger). Admin creation of learners runs server-side."],
      ["8.15", "Logging", "Append-only audit trail: updates and deletes are blocked by a database trigger. Sign-ins, profile changes, exports, erasures and admin views are recorded."],
      ["8.16", "Monitoring activities", "Admin console shows activity, unusual patterns and request queues."],
      ["8.24", "Use of cryptography", "TLS for all traffic; storage and database encrypted at rest by the provider; private files served by short-lived signed URLs."],
      ["5.34", "Privacy and protection of PII", "Consent capture with version and time, self-service export and erasure, pseudonymised audit on erasure, data minimisation."],
      ["8.10 / 8.11", "Information deletion, data masking", "Erasure removes the account, data and files; audit entries are pseudonymised."],
      ["8.9 / 8.28", "Configuration management, secure coding", "Security headers and Content Security Policy; all user content is escaped before display; database functions pin their search path."],
      ["5.23", "Cloud services", "Supabase and Netlify used under their terms; responsibilities follow the shared-responsibility model."]
    ];
    const risks = [
      ["Account takeover via weak or reused passwords", "Medium", "High", "Email verification, 10-character minimum, reset by email, audit of sign-ins", "Medium", "Add MFA when the user base grows"],
      ["Learner sees another learner’s data", "Low", "High", "Row-level security on all tables and storage; tested policies", "Low", "Accept"],
      ["Malicious or infringing uploads", "Medium", "Medium", "Private per-user folders, type and size limits, upload notice", "Low", "Admin review on report"],
      ["Username enumeration via username sign-in", "Medium", "Low", "Usernames aren’t shown publicly; emails never displayed to others", "Low", "Accept (usability)"],
      ["Free-tier service pause or limits", "Medium", "Medium", "Weekly activity keeps the project live; export available any time", "Medium", "Monitor; upgrade if needed"],
      ["Admin misuse of learner data", "Low", "High", "Admin actions logged in an append-only trail; purpose limited in this notice", "Low", "Periodic review"],
      ["Personal data breach at a provider", "Low", "High", "Reputable providers, encryption, minimal data, breach-notification process", "Low", "Accept"]
    ];
    return `<h2 class="h-section">ISO/IEC 27001:2022 controls in place</h2>
      <p class="sub">The service is designed in line with ISO/IEC 27001 Annex A. This is a statement of design, not a certification.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Annex A</th><th>Control</th><th>How it’s met here</th></tr></thead><tbody>${ctl.map(c => `<tr><td style="white-space:nowrap"><b>${c[0]}</b></td><td>${c[1]}</td><td>${c[2]}</td></tr>`).join("")}</tbody></table></div>
      <h2 class="h-section">ISO 31000 risk register</h2>
      <p class="sub">Managed with the ISO 31000 cycle: establish context → identify → analyse → evaluate → treat → monitor and review, with communication throughout. Reviewed at least quarterly.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Treatment (controls)</th><th>Residual</th><th>Decision</th></tr></thead><tbody>${risks.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join("")}</tbody></table></div>`;
  }
  async function viewPrivacy() {
    const signed = cloud ? !!db.user : true;
    let reqs = [];
    if (cloud && db.user) { try { reqs = await db.myRequests(); } catch (e) {} }
    const p = A.profile || {};
    const rights = signed && A.profile ? `
      <h2 class="h-section">Your data, your controls</h2>
      <div class="grid-2">
        <div class="card"><h3>Download my data</h3><p>Everything we hold about you, as a JSON file.</p><button class="btn small" id="pvExport">Download</button></div>
        <div class="card"><h3>Correct my data</h3><p>Edit your details directly, or ask us to fix anything you can’t edit.</p><a class="btn small" href="#/profile">Edit profile</a></div>
        <div class="card"><h3>Study analytics</h3><p>Record active study time per topic for your Insights.</p><label class="switch"><input type="checkbox" id="pvAnalytics" ${p.consent_analytics !== false ? "checked" : ""}><span></span>${p.consent_analytics !== false ? "On" : "Off"}</label></div>
        <div class="card danger"><h3>Delete my account</h3><p>Erases your account, plan, progress and files now. This can’t be undone.</p><button class="btn small" id="pvDelete">Delete everything</button></div>
      </div>
      ${cloud ? `<div class="card" style="margin-top:16px"><h3>Raise a request</h3><p>For corrections you can’t make yourself, restriction, nomination, a grievance or any question about your data.</p>
        <div class="form-row"><label>Type<select id="rqKind"><option value="rectify">Correction</option><option value="access">Access / copy</option><option value="restrict">Restrict processing</option><option value="erase">Erasure</option><option value="withdraw_consent">Withdraw consent</option><option value="grievance">Grievance</option><option value="other">Other / nomination</option></select></label>
        <label style="flex:1">Details<textarea id="rqText" maxlength="2000" placeholder="Tell us what you need"></textarea></label><button class="btn small primary" id="rqGo">Send</button></div>
        ${reqs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Sent</th><th>Type</th><th>Status</th><th>Response</th></tr></thead><tbody>${reqs.map(r => `<tr><td>${fmtDY(r.created_at)}</td><td>${esc(r.kind)}</td><td><span class="tag plain">${esc(r.status)}</span></td><td>${esc(r.resolution || "")}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>
        <p class="hint">Consent recorded ${p.consent_terms_at ? "on " + fmtDY(p.consent_terms_at) : ""} for notice version ${esc(p.consent_version || "—")}.</p>` : `<p class="hint">Device-only mode: all data lives in this browser and never leaves it.</p>`}` : "";
    return `<div class="page-narrow">
      <div class="kicker">Privacy &amp; trust</div>
      <h1 class="h-display">Your data, <em>handled well</em></h1>
      <p class="lede">A security certification deserves a site that practises what it teaches: privacy by design, least privilege, and an audit trail.</p>
      ${!signed ? `<div class="btn-row"><a class="btn" href="#/login">Back to sign in</a></div>` : ""}
      ${rights}
      <h2 class="h-section">Privacy notice</h2>
      ${notice()}
      ${trust()}
    </div>`;
  }
  function bindPrivacy() {
    const ex = $("#pvExport"); if (ex) ex.addEventListener("click", async () => {
      try { const data = await db.exportMyData(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `cissp-reader-my-data-${ymd(today())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); A.toast("Your data has been downloaded"); }
      catch (e) { A.toast(A.errMsg(e)); }
    });
    const an = $("#pvAnalytics"); if (an) an.addEventListener("change", async () => {
      try { A.profile = await db.updateProfile({ consent_analytics: an.checked }); db.logEvent(an.checked ? "user.analytics_on" : "user.analytics_off", {}); A.rerender(); } catch (e) { A.toast(A.errMsg(e)); }
    });
    const del = $("#pvDelete"); if (del) del.addEventListener("click", async () => {
      const typed = prompt("This permanently deletes your account and all your study data.\n\nType DELETE to confirm.");
      if (typed !== "DELETE") return;
      try { await db.deleteMyAccount(); try { Object.keys(localStorage).filter(k => k.startsWith("cissp.v1")).forEach(k => localStorage.removeItem(k)); } catch (e) {}
        alert("Your account and data have been deleted. Thank you for studying with us, and good luck."); location.hash = cloud ? "#/login" : "#/welcome"; location.reload(); }
      catch (e) { A.toast(A.errMsg(e)); }
    });
    const rq = $("#rqGo"); if (rq) rq.addEventListener("click", async () => {
      const t = $("#rqText").value.trim(); if (!t) return A.toast("Add a few details");
      try { await db.request($("#rqKind").value, t); A.toast("Request sent. We’ll respond within 30 days."); A.rerender(); } catch (e) { A.toast(A.errMsg(e)); }
    });
  }

  A.register("login", { render: viewLogin, bind: bindLogin, title: "Sign in", bare: true, public: true });
  A.register("signup", { render: viewSignup, bind: bindSignup, title: "Create account", bare: true, public: true });
  A.register("forgot", { render: viewForgot, bind: bindForgot, title: "Reset password", bare: true, public: true });
  A.register("reset", { render: viewReset, bind: bindReset, title: "New password", bare: true, public: true });
  A.register("consent", { render: viewConsent, bind: bindConsent, title: "Consent", bare: true });
  A.register("welcome", { render: viewWelcome, bind: bindWelcome, title: "Welcome", bare: true });
  A.register("profile", { render: viewProfile, bind: bindProfile, title: "Profile", nav: "plan", area: "other" });
  A.register("privacy", { render: viewPrivacy, bind: bindPrivacy, title: "Privacy & trust", public: true, area: "other" });
})();

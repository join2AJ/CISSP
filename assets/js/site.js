/* StudyCISSP - public website pages: features, pricing, about, FAQ, contact, terms, footer */
(function () {
  "use strict";
  const A = window.App, { D, P, $, $$, esc, dc, db } = A;
  const BRAND = "StudyCISSP";

  const shield = `<svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true"><defs><linearGradient id="lgf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a7556"/><stop offset="1" stop-color="#1a4d38"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#lgf)"/><path d="M32 9.5l17.5 6.6v13.2c0 11-7.4 19.6-17.5 24.2C21.9 48.9 14.5 40.3 14.5 29.3V16.1z" fill="none" stroke="#f7f3ea" stroke-width="3.4" stroke-linejoin="round"/><path d="M21.5 25.6c3.8-1.2 7.6-.7 10.5 1.5 2.9-2.2 6.7-2.7 10.5-1.5v13.2c-3.8-1.2-7.6-.7-10.5 1.5-2.9-2.2-6.7-2.7-10.5-1.5z" fill="#f7f3ea" fill-opacity=".16" stroke="#f7f3ea" stroke-width="2.6" stroke-linejoin="round"/><path d="M32 27.1v13.2" stroke="#f7f3ea" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="19.2" r="2.1" fill="#e3b95a"/></svg>`;
  A.shield = shield;

  A.siteFooter = () => `<footer class="site-foot">
    <div class="sf-grid">
      <div class="sf-brand"><a class="brand" href="#/landing"><span class="brand-mark">${shield}</span><span class="brand-text"><b>${BRAND}</b><small>read slowly · pass once</small></span></a>
        <p>A calm, book-like way to prepare for the CISSP: clear chapters, small animations, a plan built around your date, and honest feedback on where you stand.</p></div>
      <div><h4>Product</h4><a href="#/features">Features</a><a href="#/pricing">Pricing</a><a href="#/faq">FAQ</a><a href="#/signup/gold">Get started</a></div>
      <div><h4>Learn</h4><a href="#/about">About the CISSP</a><a href="#/about/domains">The eight domains</a><a href="#/about/pathway">Path to certification</a><a href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" target="_blank" rel="noopener">ISC2 guide (PDF)</a></div>
      <div><h4>Company</h4><a href="#/contact">Contact</a><a href="#/privacy">Privacy &amp; trust</a><a href="#/terms">Terms of use</a><a href="#/login">Sign in</a></div>
    </div>
    <div class="sf-base"><span>© ${new Date().getFullYear()} ${BRAND}. All rights reserved.</span><span>Independent study material. Not affiliated with or endorsed by ISC2. CISSP® is a registered mark of ISC2, Inc.</span></div>
  </footer>`;

  const pageHead = (kicker, title, lede) => `<div class="kicker">${kicker}</div><h1 class="h-display">${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}`;

  /* ---------- features ---------- */
  const FEATURES = [
    ["📖", "Chapters you’ll actually read", "Every objective of the official outline, written as calm, plain-language chapters with the manager’s lens the exam rewards."],
    ["✨", "Animations for tricky ideas", "Watch encapsulation, the TCP handshake, Kerberos tickets, digital signatures and backup strategies unfold step by step."],
    ["🗓", "A plan around your date", "Tell us your exam date and what you already know. Your weakest domains come first and get the most time."],
    ["❓", "Quizzes with reasons", "Practise by domain, by topic or by weak area. Every answer comes with a clear explanation."],
    ["🃏", "Flashcards that space themselves", "Cards you know come back later; cards you miss come back tomorrow. Memory that lasts to exam day."],
    ["⏱", "Timed mock exams", "No feedback until the end and no going back, weighted like the real exam."],
    ["📈", "Insights on your time", "See active study time per day, domain and topic, plus streaks and accuracy."],
    ["🔤", "A-Z glossary", "Nearly 200 terms with what they mean, where you’ll meet them and real tools that use them."],
    ["📚", "Your own library", "Keep your notes, PDFs and favourite videos next to the chapters they belong to."]
  ];
  function viewFeatures() {
    return `<div class="site-page">
      <section class="site-hero">${pageHead("Features", "Everything you need, <em>nothing you don’t</em>", "Built for busy professionals: short sessions, clear explanations and a plan that adapts to your exam date.")}</section>
      <div class="feat-grid">${FEATURES.map(([i, t, d]) => `<div class="feat"><span class="feat-i">${i}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
      <section class="split">
        <div><div class="kicker">See it move</div><h2 class="h-section" style="margin-top:8px">Hard ideas, made visible</h2><p class="sub">Security models are easier to remember when you’ve watched them work. Press play, step through, replay.</p>
          <a class="btn primary" href="#/signup/gold">Start free</a></div>
        <div><div class="anim" data-anim="models"></div></div>
      </section>
      <h2 class="h-section">How it works</h2>
      <div class="how">${[["Create your free account", "Pick a plan. Finish the course in 90 days and it stays free."], ["Verify your email", "One click from your inbox keeps your account safe."], ["Answer three questions", "Your exam date, your hours and what you already know."], ["Follow your path", "Read, practise and track your progress, one session at a time."]].map(([t, d], i) => `<div class="how-s"><b>${i + 1}</b><h4>${t}</h4><p>${d}</p></div>`).join("")}</div>
      ${cta()}
    </div>`;
  }

  /* ---------- pricing ---------- */
  function viewPricing() {
    const plans = A.plans.filter(p => p.active !== false), M = P.modules || {};
    return `<div class="site-page">
      <section class="site-hero center">${pageHead("Pricing", "Finish in 90 days. <em>Pay nothing.</em>", `A complete CISSP course worth ${A.challengeOffer().value || "thousands"}+ elsewhere. Finish it in 90 days and it’s free. If you don’t, it’s ${A.challengeOffer().prices || "a small yearly price"} a year.`)}</section>
      ${A.planCards({ signup: !(db.mode === "cloud" && db.user) })}
      ${A.challengeBlock()}
      <h2 class="h-section">Compare plans</h2>
      <div class="tbl-wrap"><table class="tbl compare"><thead><tr><th>What’s included</th>${plans.map(p => `<th class="plan-${p.id}"><span class="plan-chip plan-${p.id}">${esc(p.name)}</span></th>`).join("")}</tr></thead><tbody>
        ${Object.entries(M).map(([k, l]) => `<tr><td>${esc(l)}</td>${plans.map(p => `<td class="cmp">${(p.modules || []).includes(k) ? `<span class="yes">✓</span>` : `<span class="no">-</span>`}</td>`).join("")}</tr>`).join("")}
        <tr><td>Value if bought elsewhere</td>${plans.map(p => `<td class="cmp">${+p.value ? A.money(+p.value, p.currency) + "+" : "-"}</td>`).join("")}</tr>
        <tr><td>Finish in 90 days</td>${plans.map(p => `<td class="cmp"><b>Free</b></td>`).join("")}</tr>
        <tr><td>Otherwise, per year</td>${plans.map(p => `<td class="cmp">${+p.price > 0 ? A.money(+p.price, p.currency) : "Free"}</td>`).join("")}</tr>
      </tbody></table></div>
      <p class="sub" style="margin-top:14px">No card needed to start. Your dashboard shows the days left and how close you are to finishing free.</p>
      ${cta()}
    </div>`;
  }

  /* ---------- about the CISSP ---------- */
  function viewAbout(r) {
    return `<div class="site-page">
      <section class="site-hero">${pageHead("About the CISSP", "The certification that says <em>you can lead security</em>", "The Certified Information Systems Security Professional (CISSP) from ISC2 shows you can design, build and run a security programme. It’s vendor-neutral, widely required for senior security roles, and respected worldwide.")}</section>
      <section class="facts">${P.exam.facts.map(f => `<div class="fact"><b>${esc(f.big)}</b><span>${esc(f.label)}</span></div>`).join("")}</section>
      <div class="grid-2" style="margin-top:34px">
        <div class="card"><h3>Who it’s for</h3><p>Security managers, architects, analysts, auditors, consultants and IT leaders. Typical roles include CISO, security architect, security manager and security consultant.</p></div>
        <div class="card"><h3>The experience requirement</h3><p>Five years of paid work in two or more of the eight domains. A relevant degree or approved credential can count for one year. Pass without it and you become an Associate of ISC2, with six years to gain the experience.</p></div>
        <div class="card"><h3>The exam</h3><p>A computer-adaptive test of 100-150 questions in up to three hours at a Pearson VUE centre. You need 700 out of 1,000. Questions test judgement, not just recall.</p></div>
        <div class="card"><h3>After you pass</h3><p>Get endorsed by an ISC2-certified member within nine months, then keep your certification with 120 CPE credits every three years and an annual maintenance fee.</p></div>
      </div>
      <h2 class="h-section" id="domains">The eight domains</h2>
      <p class="sub">Exam weights under the outline effective 15 April 2024. ISC2 has announced a new outline from 15 April 2027.</p>
      <div class="dom-list">${D.map(d => `<div class="dom-row" style="${dc(d)}"><span class="dom-w">${d.weight}%</span><div><b>Domain ${d.n}: ${esc(d.title)}</b><p>${esc(d.lede)}</p></div></div>`).join("")}</div>
      <h2 class="h-section" id="pathway">The path to certification</h2>
      <div class="path">${P.pathway.map((s, i) => `<div class="step"><b>${i + 1}</b><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join("")}</div>
      <div class="card" style="margin-top:34px"><h3>Official overview</h3><p>ISC2’s own <em>Ultimate Guide to the CISSP</em> summarises the benefits, exam format, pathway and continuing education.</p><a class="btn small" href="resources/ISC2-Ultimate-Guide-to-the-CISSP.pdf" target="_blank" rel="noopener">Open the PDF</a></div>
      <h2 class="h-section">About ${BRAND}</h2>
      <p class="lede" style="max-width:46rem">We believe anyone with the experience can pass the CISSP, whatever their background. The difference is a plan that fits real life and explanations that make sense the first time. ${BRAND} is independent study material and is not affiliated with ISC2.</p>
      ${cta()}
    </div>`;
  }

  /* ---------- FAQ ---------- */
  const FAQ = [
    ["Is this affiliated with ISC2?", "No. StudyCISSP is independent study material. CISSP is a registered mark of ISC2, Inc., and you book and sit the exam directly with ISC2 and Pearson VUE."],
    ["Is it really free?", "Yes, if you finish. Every plan is free for 90 days. Complete the four challenge goals in that time and it stays free. If you don’t, the yearly price on the Pricing page applies. No card is needed to start."],
    ["Do I still need the official book?", "We recommend pairing StudyCISSP with the ISC2 Official Study Guide and Official Practice Tests. Each chapter tells you which book chapters to read alongside it."],
    ["Which exam outline does it follow?", "The CISSP Exam Outline effective 15 April 2024, which applies to exams sat before 15 April 2027. We’ll update for the new outline."],
    ["I don’t have five years’ experience yet. Can I still use it?", "Yes. You can sit the exam and, if you pass, become an Associate of ISC2 while you build up the experience."],
    ["How is my study plan built?", "From your target date, the hours you have each week and how confident you are in each domain. Weaker domains come first and get the most time. Change your answers and the plan redraws itself."],
    ["Does it work on my phone?", "Yes. Every page is designed for phones, tablets and laptops, with light, sepia and night reading modes."],
    ["What happens to my data?", "It’s used only to run your study plan and show your progress. You can download it or delete your account at any time. See Privacy & trust for the details."],
    ["Can I upload my own notes and videos?", "Yes, on the Diamond plan. Your library is private to you."],
    ["How do I get help?", "Use the Contact page. We aim to reply within two working days."]
  ];
  const viewFaq = () => `<div class="site-page narrow">
    <section class="site-hero">${pageHead("FAQ", "Questions, <em>answered</em>", "")}</section>
    <div class="faq">${FAQ.map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
    <p class="sub" style="margin-top:24px">Still wondering? <a href="#/contact">Ask us directly</a>.</p>
    ${cta()}</div>`;

  /* ---------- contact (Netlify Forms) ---------- */
  const viewContact = () => `<div class="site-page narrow">
    <section class="site-hero">${pageHead("Contact", "We’d love to <em>hear from you</em>", "Questions about the plans, a topic you’d like explained, or feedback. We aim to reply within two working days.")}</section>
    <form class="card stack" id="contactForm" name="contact">
      <p hidden><label>Leave this empty<input name="bot-field"></label></p>
      <div class="form-row"><label style="flex:1">Your name<input name="name" required maxlength="80" autocomplete="name"></label><label style="flex:1">Email<input name="email" type="email" required autocomplete="email"></label></div>
      <label>Topic<select name="topic"><option>General question</option><option>Plans and pricing</option><option>Content or a topic request</option><option>Can’t sign in</option><option>Feedback</option></select></label>
      <p class="hint">Requests about your own data (a copy, a correction, deletion, withdrawing consent or a grievance) are taken only from the account owner: sign in and use <a href="#/privacy">Privacy &amp; trust → Raise a request</a>. That way you get a reference number, an automatic acknowledgement and a full record.</p>
      <label>Message<textarea name="message" required maxlength="3000" rows="6"></textarea></label>
      <label class="check"><input type="checkbox" required><span>I agree that StudyCISSP may use these details to reply to me, as described in the <a href="#/privacy">privacy notice</a>.</span></label>
      <button class="btn primary" id="cSend">Send message</button>
      <div id="cMsg"></div>
    </form></div>`;
  function bindContact() {
    const f = $("#contactForm"); if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const b = $("#cSend"); b.disabled = true; b.textContent = "Sending…";
      const data = new URLSearchParams({ "form-name": "contact" }); new FormData(f).forEach((v, k) => data.append(k, v));
      try {
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: data.toString() });
        if (!r.ok) throw new Error(r.status);
        f.innerHTML = `<h3>Thank you</h3><p>Your message is on its way. We’ll reply to your email soon.</p><a class="btn" href="#/landing">Back to home</a>`;
      } catch (x) { $("#cMsg").innerHTML = `<div class="warnbox">The message couldn’t be sent just now. Please try again in a moment.</div>`; b.disabled = false; b.textContent = "Send message"; }
    });
  }

  /* ---------- terms ---------- */
  const TERMS = [
    ["Using StudyCISSP", "StudyCISSP provides study material and tools to help you prepare for the CISSP exam. By creating an account or using the site you agree to these terms. You must be 18 or older."],
    ["Your account", "Keep your password safe and don’t share your account. You’re responsible for activity under your account. Tell us straight away if you think it has been misused."],
    ["Acceptable use", "Don’t try to break, overload or gain unauthorised access to the service; don’t upload malware, illegal content or material you don’t have the right to share; and don’t copy or resell the content."],
    ["Your content", "You keep ownership of anything you upload. You give us permission to store and display it to you (and to administrators for support) so the service works."],
    ["Our content", "Chapters, questions, animations and other material are protected by copyright and are for your personal study only. CISSP® and ISC2® are marks of ISC2, Inc.; StudyCISSP is not affiliated with ISC2."],
    ["No guarantee of results", "We work hard to keep content accurate and current, but we can’t guarantee you will pass the exam. Always confirm exam rules, fees and policies with ISC2."],
    ["Plans and the 90-day challenge", "Each plan is free for 90 days from sign-up. If you complete the four challenge goals shown on your dashboard within that time, it stays free. Otherwise the yearly price shown on the Pricing page applies to continue; we’ll give notice before anything is charged."],
    ["Availability", "We aim to keep the service available but it may be interrupted for maintenance or reasons outside our control."],
    ["Ending your account", "You can delete your account at any time from Privacy & trust. We may suspend accounts that break these terms."],
    ["Changes", "We may update these terms. We’ll show the date of the latest version here and tell you about important changes."]
  ];
  const viewTerms = () => `<div class="site-page narrow">
    <section class="site-hero">${pageHead("Terms of use", "The <em>simple</em> version", "Last updated November 2026.")}</section>
    <div class="prose" style="max-width:none">${TERMS.map(([h, t], i) => `<h3>${i + 1}. ${h}</h3><p>${t}</p>`).join("")}<p>Questions? <a href="#/contact">Contact us</a>.</p></div></div>`;

  const cta = () => `<section class="cta-band"><div><h2>Ready when you are.</h2><p>Create a free account, tell us your exam date, and get a plan that fits your life.</p></div>
    <div class="btn-row" style="margin:0">${db.mode === "cloud" && db.user ? `<a class="btn primary" href="#/">Open my dashboard</a>` : `<a class="btn primary" href="#/signup/gold">Get started free</a><a class="btn" href="#/pricing">See plans</a>`}</div></section>`;

  const bindAnims = () => { if (window.Anim) window.Anim.mountAll(document.getElementById("view")); };
  const scrollTo = (r) => { if (r.a) { const el = document.getElementById(r.a); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); } };

  A.register("features", { render: viewFeatures, bind: bindAnims, title: "Features", public: true, site: true, nav: "features" });
  A.register("pricing", { render: viewPricing, title: "Pricing", public: true, site: true, nav: "pricing" });
  A.register("about", { render: viewAbout, bind: scrollTo, title: "About the CISSP", public: true, site: true, nav: "about" });
  A.register("faq", { render: viewFaq, title: "FAQ", public: true, site: true, nav: "faq" });
  A.register("contact", { render: viewContact, bind: bindContact, title: "Contact", public: true, site: true, nav: "contact" });
  A.register("terms", { render: viewTerms, title: "Terms of use", public: true, site: true, nav: "terms" });
})();

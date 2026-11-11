/* StudyCISSP — public website pages: features, pricing, about, FAQ, contact, terms, footer */
(function () {
  "use strict";
  const A = window.App, { D, P, $, $$, esc, dc, db } = A;
  const BRAND = "StudyCISSP";

  const shield = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.5l7.5 3v6.2c0 4.6-3.2 8.3-7.5 9.8-4.3-1.5-7.5-5.2-7.5-9.8V5.5z" fill="currentColor" opacity=".18"/><path d="M12 2.5l7.5 3v6.2c0 4.6-3.2 8.3-7.5 9.8-4.3-1.5-7.5-5.2-7.5-9.8V5.5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 12l2.4 2.4 4.6-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
    ["🔤", "A–Z glossary", "Nearly 200 terms with what they mean, where you’ll meet them and real tools that use them."],
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
      <div class="how">${[["Create your free account", "Pick a plan. Every plan is free for its first year."], ["Verify your email", "One click from your inbox keeps your account safe."], ["Answer three questions", "Your exam date, your hours and what you already know."], ["Follow your path", "Read, practise and track your progress, one session at a time."]].map(([t, d], i) => `<div class="how-s"><b>${i + 1}</b><h4>${t}</h4><p>${d}</p></div>`).join("")}</div>
      ${cta()}
    </div>`;
  }

  /* ---------- pricing ---------- */
  function viewPricing() {
    const plans = A.plans.filter(p => p.active !== false), M = P.modules || {};
    return `<div class="site-page">
      <section class="site-hero center">${pageHead("Pricing", "Every plan, <em>free for a year</em>", "Start with the depth that suits you and move up any time.")}</section>
      ${A.planCards({ signup: !(db.mode === "cloud" && db.user) })}
      <h2 class="h-section">Compare plans</h2>
      <div class="tbl-wrap"><table class="tbl compare"><thead><tr><th>What’s included</th>${plans.map(p => `<th class="plan-${p.id}"><span class="plan-chip plan-${p.id}">${esc(p.name)}</span></th>`).join("")}</tr></thead><tbody>
        ${Object.entries(M).map(([k, l]) => `<tr><td>${esc(l)}</td>${plans.map(p => `<td class="cmp">${(p.modules || []).includes(k) ? `<span class="yes">✓</span>` : `<span class="no">—</span>`}</td>`).join("")}</tr>`).join("")}
        <tr><td>Free period</td>${plans.map(p => `<td class="cmp">${p.free_months} months</td>`).join("")}</tr>
        <tr><td>After the free period</td>${plans.map(p => `<td class="cmp">${+p.price > 0 ? A.money(+p.price, p.currency) + " / year" : "To be announced"}</td>`).join("")}</tr>
      </tbody></table></div>
      <p class="sub" style="margin-top:14px">No card needed to start. We’ll tell you well before any free period ends.</p>
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
        <div class="card"><h3>The exam</h3><p>A computer-adaptive test of 100–150 questions in up to three hours at a Pearson VUE centre. You need 700 out of 1,000. Questions test judgement, not just recall.</p></div>
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
    ["Is it really free?", "Yes. Every plan is free for its first year. If a price applies after that, it’s shown on the Pricing page and we’ll tell you well in advance. No card is needed to start."],
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
      <label>Topic<select name="topic"><option>General question</option><option>Plans and pricing</option><option>Content or a topic request</option><option>Account help</option><option>Privacy request</option><option>Feedback</option></select></label>
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
    ["Plans and free periods", "Each plan is free for the period shown when you sign up. Any price after that is shown on the Pricing page; we’ll give notice before anything changes for you."],
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

/* The CISSP Reader — plan, tactics, what's new, resources */
window.PAGES = {
  exam: {
    target: "2027-02-09",
    deadline: "2027-02-18",
    start: "2026-11-12",
    weeklyHours: "10–12",
    facts: [
      { big: "100–150", label: "questions, computerised adaptive (CAT)" },
      { big: "3 hrs", label: "maximum time" },
      { big: "700", label: "of 1,000 to pass" },
      { big: "8", label: "domains, 2024 outline" }
    ]
  },

  pathway: [
    { t: "Become an ISC2 Candidate", d: "Free for the first year (US$50 a year after). Gives 10% off Official ISC2 Online Self-Paced Training." },
    { t: "Have the experience", d: "Five years’ cumulative, paid, full-time work in two or more of the eight domains. A degree or approved credential can waive one year. Without it you become an Associate of ISC2 with six years to earn it." },
    { t: "Study for the exam", d: "Self-study or official training. This site is your reading room for that step." },
    { t: "Pass the exam", d: "100–150 items in up to three hours at a Pearson VUE centre. 700 out of 1,000 to pass." },
    { t: "Get endorsed", d: "Within nine months of passing, an ISC2-certified member endorses your experience." },
    { t: "Maintain it", d: "120 CPE credits over each three-year cycle (about 40 a year) and the US$135 annual maintenance fee." }
  ],

  phases: [
    { id: "p1", start: "2026-11-12", end: "2026-11-25", iter: "Iteration 1 · Intake", title: "Domain 4: Communication & Network Security", domain: "d4",
      text: "Your weakest domain, tackled first while energy is highest. Full-depth reading, then the end-of-chapter questions immediately after each chapter.",
      exit: "Draw the OSI/TCP-IP stack with protocols, PDUs and devices from memory.",
      tasks: ["Take a cold 100-question diagnostic before opening any book", "Book the Pearson VUE slot (9–12 Feb) and check 16–18 Feb availability", "Read Sybex Ch 11 and do its review questions", "Read Sybex Ch 12 and do its review questions", "Read all D4 sections on this site and tick them", "Draw the OSI table from memory twice"] },
    { id: "p2", start: "2026-11-26", end: "2026-12-09", iter: "Iteration 1 · Intake", title: "Domain 3: Architecture, Models & Cryptography", domain: "d3",
      text: "Security models and cryptography are concept-heavy. Read slowly, and build your own one-page cheat sheet as you go.",
      exit: "A one-page crypto and security-models cheat sheet, written from memory.",
      tasks: ["Sybex Ch 6 and 7 (cryptography, PKI)", "Sybex Ch 8 (models, design)", "Sybex Ch 9 and 10 (vulnerabilities, physical)", "Write the BLP / Biba / Clark–Wilson comparison from memory", "Write the ‘whose key?’ table for encryption and signatures"] },
    { id: "p3", start: "2026-12-10", end: "2026-12-16", iter: "Iteration 1 · Intake", title: "Domain 8: Software Development Security", domain: "d8",
      text: "Concept level only. Learn the lifecycle, methodologies, maturity models and the common vulnerabilities with their fixes.",
      exit: "A concept map linking SDLC phases to the security activity in each.",
      tasks: ["Sybex Ch 20 and 21", "Make the SDLC → security-activity concept map", "Learn XSS vs CSRF vs injection fixes"] },
    { id: "p4", start: "2026-12-17", end: "2026-12-23", iter: "Iteration 1 · Intake", title: "Domain 5: Identity & Access Management", domain: "d5",
      text: "Federation and protocols are where marks are lost. Build a comparison table for Kerberos, SAML, OAuth, OIDC, RADIUS and TACACS+.",
      exit: "Protocol comparison table, from memory.",
      tasks: ["Sybex Ch 13 and 14", "Draw the Kerberos ticket flow", "Build the protocol comparison table", "Checkpoint 23 Dec: D4, D3, D8, D5 at 65%+ on chapter questions"] },
    { id: "p5", start: "2026-12-24", end: "2026-12-30", iter: "Iteration 1 · Intake", title: "Domains 1, 2, 6, 7: fast pass", domain: "d1",
      text: "Your strong domains. Read for ISC2’s wording and its differences from ISO and ISACA, not for new concepts.",
      exit: "A per-domain score sheet filled in for all eight domains.",
      tasks: ["Skim Sybex Ch 1–5 and note ISC2 terms", "Skim Sybex Ch 15–19", "Enter baseline scores for all domains in the Tracker"] },
    { id: "p6", start: "2026-12-31", end: "2027-01-20", iter: "Iteration 2 · Targeted fix", title: "Domain-wise tests on red and orange domains", domain: "d6",
      text: "Practice Tests book, one domain at a time. Spend most of the time where the Tracker shows red or orange. Log every miss with its reason.",
      exit: "No domain below 65%, most at 75% or higher.",
      tasks: ["Domain-wise test: D4", "Domain-wise test: D3", "Domain-wise test: D8", "Domain-wise test: D5", "Domain-wise tests: D1, D2, D6, D7", "Review the error log by reason weekly", "Line up an ISC2-certified endorser", "Checkpoint 20 Jan: no red domains"] },
    { id: "p7", start: "2027-01-21", end: "2027-02-05", iter: "Iteration 3 · Drill", title: "Mixed sets, error log and two mocks", domain: "d7",
      text: "Full-length mixed sets (Boson, LearnZapp, Sybex). Two mocks of 125+ questions under timed conditions. Every wrong answer goes into the error log.",
      exit: "Consistent 75–80% on mixed sets.",
      tasks: ["Mixed set 1 (100+ questions)", "Mixed set 2", "Mock exam 1, timed, 125+ questions", "Mock exam 2, timed, 125+ questions", "Re-read every ‘Memorise’ card", "Checkpoint 5 Feb: two mocks at 75%+"] },
    { id: "p8", start: "2027-02-06", end: "2027-02-08", iter: "Taper", title: "Rest and light review", domain: "d2",
      text: "Cheat sheets only. Sleep. No new material. Confirm the route, ID and timing for exam day.",
      exit: "Rested, with logistics confirmed.",
      tasks: ["Read the Exam tactics page once", "Check ID matches the booking exactly", "Plan travel to the test centre with a 30-minute buffer"] },
    { id: "p9", start: "2027-02-09", end: "2027-02-12", iter: "Exam window", title: "Sit the exam", domain: "d5",
      text: "Arrive early. Read every question for its qualifier. Think like a manager. One question at a time; you cannot go back.",
      exit: "Pass. Then start the endorsement within nine months.",
      tasks: ["Sit the exam", "Start the endorsement application"] }
  ],

  checkpoints: [
    { date: "2026-12-23", check: "D4, D3, D8, D5 each at 65%+ on chapter questions", ifMissed: "Move the sit date to 16–18 Feb.", test: (s) => ["d4","d3","d8","d5"].every(d => (s[d] && s[d].latest >= 65)) },
    { date: "2027-01-20", check: "No red domains (all 65%+)", ifMissed: "Move to 16–18 Feb, and cut D6/D7 review to cheat sheets.", test: (s) => ["d1","d2","d3","d4","d5","d6","d7","d8"].every(d => (s[d] && s[d].latest >= 65)) },
    { date: "2027-02-05", check: "Two mocks at 75%+", ifMissed: "Use the 16–18 Feb slot if you booked one.", test: (s, mocks) => (mocks || []).filter(m => m.score >= 75).length >= 2 }
  ],

  budget: [
    ["Total practice questions", "2,000–3,000", "1,200–1,500, each wrong answer logged with its reason"],
    ["Iteration 1 reading", "All chapters in order", "Full depth on D4, D3, D8, D5; fast pass on D1, D2, D6, D7"],
    ["Weekly hours", "18", "10–12, measured weekly so shift weeks can flex"],
    ["Video lectures", "Normal speed", "1.25–1.5× on strong domains"]
  ],

  errorReasons: [
    "Knowledge gap",
    "Misread the question",
    "Missed a qualifier (BEST / FIRST / MOST)",
    "Too technical, not managerial",
    "Two good answers, picked the weaker",
    "Changed a correct answer",
    "Time pressure / guess"
  ],

  tactics: {
    method: [
      ["Read the last sentence first", "Find what is actually being asked before you read the scenario."],
      ["Circle the qualifier", "BEST, FIRST, MOST, LEAST, PRIMARY. Several answers are often true; the qualifier picks one."],
      ["Find the role you are playing", "Usually a security manager or adviser, not a technician with root access."],
      ["Eliminate the two weakest", "There are almost always two answers you can drop quickly."],
      ["Pick the answer that fixes the cause", "Process beats product; policy beats tool; prevention beats detection, unless the question is about detection."],
      ["Commit and move on", "The CAT exam does not let you go back. Spending five minutes on one item costs you later."]
    ],
    rules: [
      "Human safety comes first, always.",
      "Senior management owns risk. Security advises; management decides and accepts.",
      "Understand the business and its objectives before choosing controls.",
      "Policy and process before technology.",
      "Prefer the answer that is complete, not the one that is fastest or cheapest.",
      "Do not break the law, and do not take matters into your own hands; involve legal, HR and management.",
      "Contain before you eradicate; preserve evidence before you rebuild.",
      "Classification starts with the owner; protection follows the classification.",
      "Least privilege, separation of duties and defence in depth are almost never wrong.",
      "If two answers look identical, the more general one is often right; if one says ‘always’ or ‘never’, be suspicious."
    ],
    cat: [
      "The exam is computerised adaptive: each answer shapes the next question’s difficulty.",
      "It ends between 100 and 150 items, when the system is confident you are above or below the pass line, or when time runs out.",
      "Stopping at 100 does not mean you failed, and going to 150 does not mean you are failing.",
      "About 25 items are unscored pre-test questions you cannot identify. Don’t let one strange question shake you.",
      "You cannot skip, flag or return. Budget roughly 70 seconds per item.",
      "Breaks are optional and the clock keeps running."
    ],
    logistics: [
      "Bring government-issued photo ID whose name matches your ISC2 booking exactly.",
      "Arrive 30 minutes early; expect palm-vein or photo capture and a pocket check.",
      "Nothing goes into the room. You get a whiteboard or noteboard.",
      "Results: a provisional result is printed at the centre; official confirmation follows by email.",
      "Reschedule or cancel well before the deadline in your booking; check current fees and retake waiting periods on the ISC2 site before you book."
    ]
  },

  latest: [
    { tag: "Exam", title: "The 2024 outline applies to you", date: "15 Apr 2024 → 14 Apr 2027",
      body: "The outline in force since 15 April 2024 keeps the eight domains and weights 16/10/13/13/13/12/13/10. The CAT exam has 100–150 items in three hours. ISC2 has announced a new outline effective 15 April 2027; since you sit in February 2027, study the 2024 outline and ignore 2027 material.",
      domains: [] },
    { tag: "Governance", title: "NIST Cybersecurity Framework 2.0", date: "Feb 2024",
      body: "Adds a sixth function, Govern, at the centre of Identify, Protect, Detect, Respond and Recover, and widens the audience to every organisation. Govern covers strategy, roles, policy, oversight and supply-chain risk.",
      domains: ["d1"] },
    { tag: "Cryptography", title: "First post-quantum standards", date: "Aug 2024 · Mar 2025",
      body: "FIPS 203 (ML-KEM), FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) were published; HQC was later selected as a backup KEM. The management answer is crypto-agility: inventory where public-key crypto is used and plan migration, because of ‘harvest now, decrypt later’.",
      domains: ["d3"] },
    { tag: "Identity", title: "Passkeys and NIST SP 800-63-4", date: "2024–2025",
      body: "FIDO2 passkeys became mainstream across major platforms. NIST’s Digital Identity Guidelines revision 4 recognises syncable authenticators, pushes phishing-resistant MFA at higher assurance, and keeps the guidance against forced password rotation and composition rules.",
      domains: ["d5"] },
    { tag: "Incident response", title: "NIST SP 800-61 Rev. 3", date: "Apr 2025",
      body: "Incident response guidance rewritten around CSF 2.0, treating response as part of continuous risk management rather than a standalone four-phase lifecycle. Recognise both the new mapping and the classic phases.",
      domains: ["d7"] },
    { tag: "Testing", title: "CVSS v4.0, KEV and EPSS", date: "Nov 2023 →",
      body: "CVSS 4.0 restructures scoring into Base, Threat, Environmental and Supplemental metrics. Prioritisation increasingly combines severity with real-world exploitation data from CISA’s Known Exploited Vulnerabilities catalogue and EPSS probabilities.",
      domains: ["d6"] },
    { tag: "Software", title: "Supply chain, SBOM and OWASP 2025", date: "2024–2025",
      body: "SBOMs, NIST SSDF (SP 800-218) attestations and SLSA provenance are now normal procurement asks. OWASP published a 2025 Top 10 that adds Software Supply Chain Failures and Mishandling of Exceptional Conditions, and maintains a separate Top 10 for LLM applications led by prompt injection.",
      domains: ["d8"] },
    { tag: "Law & regulation", title: "NIS2, DORA, EU AI Act, DPDP Rules", date: "2024–2025",
      body: "NIS2 applied from October 2024; DORA for EU financial entities from January 2025; the EU AI Act is phasing in from 2025. In India, the DPDP Rules were notified in November 2025, giving effect to the DPDP Act 2023 in phases. PCI DSS v4.0.1 future-dated requirements became mandatory on 31 March 2025.",
      domains: ["d1", "d2"] },
    { tag: "Architecture", title: "Zero trust and SASE in the outline", date: "2024 outline",
      body: "The 2024 outline names zero trust and secure access service edge (SASE) among secure design principles. Expect scenarios where identity and device posture, not network location, decide access.",
      domains: ["d3", "d4"] },
    { tag: "Operations", title: "AI in detection and as an attack surface", date: "2024–2026",
      body: "Machine-learning and AI tools appear in the operations objectives. Know their value (scale, unknown patterns) and limits (false positives, drift, adversarial evasion). On the software side, treat AI features as new input channels that need validation, access control and monitoring.",
      domains: ["d7", "d8"] }
  ],

  resources: [
    { group: "Official from ISC2", items: [
      { ico: "◎", t: "CISSP certification page", u: "https://www.isc2.org/certifications/cissp", d: "Requirements, fees, exam booking links and current announcements.", tags: ["Free", "Official"] },
      { ico: "§", t: "CISSP Exam Outline", u: "https://www.isc2.org/certifications/cissp/cissp-certification-exam-outline", d: "The authoritative list of every objective. Use it as your final checklist in the taper week.", tags: ["Free", "Must read"] },
      { ico: "✦", t: "Become an ISC2 Candidate", u: "https://www.isc2.org/candidate", d: "First year free; 10% off Online Self-Paced Training.", tags: ["Free"] },
      { ico: "⌂", t: "Pearson VUE: ISC2 exams", u: "https://home.pearsonvue.com/isc2", d: "Book, reschedule and check centre availability.", tags: ["Booking"] },
      { ico: "✓", t: "Endorsement", u: "https://www.isc2.org/endorsement", d: "Complete within nine months of passing.", tags: ["After the exam"] },
      { ico: "⚖", t: "ISC2 Code of Ethics", u: "https://www.isc2.org/ethics", d: "Read the preamble and four canons in the original wording.", tags: ["Free", "Must read"] }
    ]},
    { group: "Books and question banks", items: [
      { ico: "▤", t: "ISC2 CISSP Official Study Guide, 10th ed. (Sybex)", u: "https://www.wiley.com/", d: "Chapple, Stewart, Gibson. Written for the 2024 outline. Your core reading; chapter references on this site follow its structure.", tags: ["Paid", "Core"] },
      { ico: "▥", t: "ISC2 CISSP Official Practice Tests, 4th ed. (Sybex)", u: "https://www.wiley.com/", d: "Domain-wise tests for Iteration 2 and full practice exams for Iteration 3.", tags: ["Paid", "Core"] },
      { ico: "◆", t: "Boson ExSim-Max for CISSP", u: "https://www.boson.com/", d: "Hard, well-explained questions. Use for mixed sets and mocks in Iteration 3.", tags: ["Paid", "Practice"] },
      { ico: "▣", t: "Official ISC2 study app (LearnZapp)", u: "https://www.learnzapp.com/", d: "Questions on your phone for short gaps between shifts.", tags: ["Paid", "Mobile"] },
      { ico: "◇", t: "Destination CISSP (Witcher, Berti, Hablas)", u: "https://destcert.com/", d: "A concise conceptual guide with excellent diagrams; strong for D3 and D4.", tags: ["Paid", "Concise"] }
    ]},
    { group: "Free video and reference", items: [
      { ico: "▶", t: "Destination Certification MindMap videos", u: "https://www.youtube.com/@DestinationCertification", d: "Short visual reviews of every domain. Ideal at 1.25× in Iteration 3.", tags: ["Free", "Video"] },
      { ico: "▶", t: "Pete Zerger: CISSP Exam Cram", u: "https://www.youtube.com/@insidecloudsec", d: "Long-form domain crams; good for the fast pass of strong domains.", tags: ["Free", "Video"] },
      { ico: "▶", t: "“Why you will pass the CISSP” (Kelly Handerhan)", u: "https://www.youtube.com/results?search_query=why+you+will+pass+the+cissp+kelly+handerhan", d: "The classic talk on the managerial mindset. Watch it twice: now and in taper week.", tags: ["Free", "Mindset"] },
      { ico: "⌘", t: "NIST Computer Security Resource Center", u: "https://csrc.nist.gov/", d: "Primary source for CSF 2.0, SP 800-37, 800-53, 800-61, 800-63, 800-88, 800-207 and FIPS 203–205.", tags: ["Free", "Reference"] },
      { ico: "⚑", t: "OWASP Top 10", u: "https://owasp.org/www-project-top-ten/", d: "Web application risks for Domain 8.", tags: ["Free", "Reference"] }
    ]}
  ],

  /* defaults; the live values come from the database and are editable by the admin */
  plans: [
    { id: "silver", name: "Silver", tagline: "Read, understand, plan.", price: 0, currency: "INR", free_months: 12, sort: 1, active: true,
      modules: ["chapters", "glossary", "plan", "flashcards"],
      perks: ["All eight chapters with animations", "A–Z glossary", "Personal study plan from your exam date", "Chapter questions with explanations", "Spaced-repetition flashcards"] },
    { id: "gold", name: "Gold", tagline: "Practise until it sticks.", price: 0, currency: "INR", free_months: 12, sort: 2, active: true,
      modules: ["chapters", "glossary", "plan", "flashcards", "quiz", "mock", "insights"],
      perks: ["Everything in Silver", "Quizzes by domain, topic and weak area", "Timed mock exams", "Insights: time spent, streaks, accuracy"] },
    { id: "diamond", name: "Diamond", tagline: "Everything, plus your own library.", price: 0, currency: "INR", free_months: 12, sort: 3, active: true,
      modules: ["chapters", "glossary", "plan", "flashcards", "quiz", "mock", "insights", "library"],
      perks: ["Everything in Gold", "Personal library: upload notes, PDFs and videos", "Priority help from the administrator", "First access to new content"] }
  ],
  modules: { chapters: "Chapters", glossary: "Glossary", plan: "Study plan", flashcards: "Flashcards", quiz: "Quizzes", mock: "Mock exams", insights: "Insights & tracker", library: "My library" }
};

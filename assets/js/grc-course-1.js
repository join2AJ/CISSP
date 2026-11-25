/* StudyCISSP - Learn GRC, modules 1-5. Original lessons written for StudyCISSP from the public standards
   (ISO/IEC 27001:2022, ISO 31000, NIST CSF 2.0, AICPA SOC, IIA Three Lines Model). */
window.GRC_COURSE = (window.GRC_COURSE || []).concat([
{
  id: "m1", n: 1, title: "GRC foundations", short: "Foundations",
  lede: "What governance, risk and compliance actually are, who does what, and how the big frameworks fit together.",
  lessons: [
  { id: "what", title: "What GRC is, in plain words", body: `
<p><b>Governance</b> is how an organisation decides things and holds people to account. <b>Risk management</b> is how it finds out what could go wrong and decides what to do about it. <b>Compliance</b> is proving that it keeps the promises it made: to laws, regulators, contracts and its own policies.</p>
<p>The three only work together. Governance without risk is rules for their own sake. Risk without governance is a spreadsheet nobody acts on. Compliance without either is box-ticking that passes an audit and still gets breached.</p>
<h3>What a GRC manager produces</h3>
<ul><li><b>A risk picture</b> the Board can act on: the top risks, their trend, and what is being done.</li>
<li><b>Evidence</b> that controls exist and work, ready before an auditor or client asks.</li>
<li><b>Decisions on record</b>: who accepted which risk, until when, and why.</li>
<li><b>A rhythm</b>: policy reviews, risk reviews, audits and reports on a predictable calendar.</li></ul>
<h3>What you do not do</h3>
<p>You do not configure firewalls or run the SOC. Engineers operate controls; you set the expectations, test that they are met, and report honestly when they are not. Your power is the question "show me", and the independence to write down the answer.</p>
<h3>Example</h3>
<p>A client airport asks: "Are you ISO 27001 certified, and can you show your last pen test closure?" Engineering says the findings were fixed. GRC's job is to have the closure evidence (ticket, retest report, date, approver) mapped to the control, so the answer takes ten minutes, not ten days.</p>`,
    remember: ["Governance decides, risk informs, compliance proves.", "You own the framework and the evidence, not the technology.", "Good GRC makes the answer to 'show me' fast and honest."],
    checks: [
      { q: "An engineer says a vulnerability is fixed. What is GRC's first move?", o: ["Accept it and close the risk", "Ask for evidence of the fix and the retest, then link it to the control", "Escalate to the Board", "Run the scan yourself"], a: 1, w: "GRC relies on evidence, not assertions. Closure needs proof (retest, ticket, approval) mapped to the control." },
      { q: "Which BEST describes compliance?", o: ["Buying security tools", "Proving the organisation meets the obligations it has committed to", "Writing as many policies as possible", "Running penetration tests"], a: 1, w: "Compliance is demonstrating that legal, contractual and internal obligations are met, with evidence." }
    ] },
  { id: "lines", title: "Who does what: the Three Lines Model", body: `
<p>The Institute of Internal Auditors' <b>Three Lines Model</b> (2020) is the way most organisations explain accountability for risk.</p>
<table><thead><tr><th>Line</th><th>Who</th><th>What they do</th></tr></thead><tbody>
<tr><td>First line</td><td>Business and IT operations, the SOC, engineering</td><td>Own and operate risks and controls day to day</td></tr>
<tr><td>Second line</td><td>Risk management, compliance, GRC, the CISO's governance function</td><td>Set frameworks, challenge the first line, monitor and report</td></tr>
<tr><td>Third line</td><td>Internal audit</td><td>Independent assurance to the Board that the first two lines work</td></tr>
<tr><td>Governing body</td><td>Board and its committees</td><td>Set appetite, oversee, hold management accountable</td></tr></tbody></table>
<p>External auditors and regulators sit outside the model and also provide assurance.</p>
<h3>Where you sit</h3>
<p>A GRC manager is <b>second line</b>. You design the risk framework, help the first line use it, and challenge them when ratings look too comfortable. You must stay independent enough to say "this control does not work" even when the owner is senior.</p>
<h3>Committees you will meet</h3>
<ul><li><b>Information Security Steering Committee</b>: senior managers who approve policies, priorities and risk acceptances. You often run its agenda and minutes.</li>
<li><b>Risk Committee of the Board</b>: receives the cyber risk report, usually quarterly.</li>
<li><b>Audit Committee</b>: receives internal and external audit results.</li></ul>
<h3>RACI in one line</h3>
<p>For every control or process, write who is <b>R</b>esponsible (does it), <b>A</b>ccountable (owns the outcome, exactly one person), <b>C</b>onsulted and <b>I</b>nformed. Most audit findings trace back to an "A" nobody agreed to.</p>`,
    remember: ["First line owns risk, second line oversees it, third line assures it.", "GRC is second line: framework, challenge, reporting.", "Every control needs exactly one accountable owner."],
    checks: [
      { q: "The SOC team runs daily log reviews. Which line are they?", o: ["First", "Second", "Third", "Governing body"], a: 0, w: "Operating controls day to day is first-line work." },
      { q: "Who gives the Board INDEPENDENT assurance that risk management works?", o: ["The CISO", "The GRC manager", "Internal audit", "The SOC lead"], a: 2, w: "Internal audit is the third line: independent of management." }
    ] },
  { id: "docs", title: "Policies, standards, procedures and exceptions", body: `
<p>Documents are how governance reaches thousands of people. Each layer answers a different question.</p>
<table><thead><tr><th>Layer</th><th>Answers</th><th>Example</th><th>Approved by</th></tr></thead><tbody>
<tr><td>Policy</td><td>What we require and why</td><td>"All privileged access uses MFA."</td><td>Senior management or Board</td></tr>
<tr><td>Standard</td><td>The specific, measurable rule</td><td>"Approved MFA: FIDO2 keys or authenticator app; no SMS."</td><td>CISO</td></tr>
<tr><td>Procedure</td><td>Step by step, how</td><td>"How to enrol a FIDO2 key for a domain admin."</td><td>Process owner</td></tr>
<tr><td>Guideline</td><td>Recommended, optional</td><td>"Tips for choosing a passphrase."</td><td>Team lead</td></tr></tbody></table>
<h3>Keeping documents alive</h3>
<ul><li>Every document has an owner, a version, an approval record and a review date (usually yearly).</li>
<li>Write for the reader: short sentences, "must" for requirements, no copied standard text.</li>
<li>Map each policy statement to the controls and evidence that prove it. Auditors test the mapping.</li></ul>
<h3>Exceptions</h3>
<p>Sometimes a team cannot comply (a legacy airport baggage system cannot take MFA). That is an <b>exception</b>, and it is a risk decision, not a favour. A good exception record has: the requirement not met, why, compensating controls (network isolation, jump host, extra logging), the risk owner who accepts it, and an <b>expiry date</b>. Open-ended exceptions are a classic audit finding.</p>`,
    remember: ["Policy says what, standard says exactly which, procedure says how.", "Every document: owner, version, approval, review date.", "Exceptions are time-bound risk acceptances with compensating controls."],
    checks: [
      { q: "'Passwords must be at least 14 characters' is BEST placed in:", o: ["A policy", "A standard", "A guideline", "A procedure"], a: 1, w: "Specific, measurable mandatory rules belong in standards; the policy states the intent." },
      { q: "Which is MOST important in a policy exception?", o: ["A long justification", "An expiry date, compensating controls and a named risk owner", "Approval by the requester's peer", "A screenshot of the system"], a: 1, w: "Exceptions must be time-bound, owned and compensated, or they become permanent hidden risk." }
    ] },
  { id: "frameworks", title: "The framework landscape", body: `
<p>Frameworks save you from inventing a control set. You will juggle several; the skill is mapping them so one piece of evidence serves many.</p>
<table><thead><tr><th>Framework</th><th>What it is</th><th>When you meet it</th></tr></thead><tbody>
<tr><td>ISO/IEC 27001:2022</td><td>Certifiable management system for information security, with 93 Annex A controls</td><td>Certification, client and tender requirements</td></tr>
<tr><td>ISO/IEC 27002:2022</td><td>Guidance on implementing those 93 controls</td><td>Designing controls</td></tr>
<tr><td>NIST CSF 2.0</td><td>Six functions: Govern, Identify, Protect, Detect, Respond, Recover</td><td>Maturity assessments, Board reporting</td></tr>
<tr><td>SOC 1 / SOC 2</td><td>Auditor reports on a service organisation's controls (AICPA)</td><td>Clients who outsource to you ask for them</td></tr>
<tr><td>ISO 31000</td><td>Risk management principles and process</td><td>Designing the risk framework</td></tr>
<tr><td>IEC 62443</td><td>Security for industrial automation and control systems</td><td>OT at airports, power and utilities</td></tr>
<tr><td>CIS Controls v8</td><td>18 prioritised technical safeguards</td><td>Practical baselines</td></tr>
<tr><td>COBIT 2019</td><td>Governance of enterprise IT</td><td>IT governance and audit</td></tr></tbody></table>
<h3>Control mapping</h3>
<p>Build one <b>common control set</b>: each internal control lists which ISO clause, SOC 2 criterion and NIST subcategory it satisfies. Then "quarterly access review" is tested once and the evidence answers three audits. Free tools such as CISO Assistant ship ready mappings you can study.</p>`,
    remember: ["ISO 27001 certifies a management system; SOC 2 is an auditor's report; NIST CSF is a maturity lens.", "Map once, test once, report many times.", "OT environments add IEC 62443."],
    checks: [
      { q: "A client wants an independent report on how well your controls OPERATED over the past year. You give them:", o: ["Your ISO 27001 SoA", "A SOC 2 Type II report", "Your NIST CSF self-assessment", "Your policy set"], a: 1, w: "SOC 2 Type II covers operating effectiveness over a period, tested by an independent auditor." },
      { q: "What is the main benefit of a common control set?", o: ["Fewer policies", "One control and its evidence satisfy several frameworks", "It replaces audits", "It removes the need for a risk register"], a: 1, w: "Mapping reduces duplicate testing and evidence requests across frameworks." }
    ] }
  ]
},
{
  id: "m2", n: 2, title: "Risk management that people use", short: "Risk management",
  lede: "From vocabulary to a working risk register: assess, treat, accept, monitor, and report in money where you can.",
  lessons: [
  { id: "language", title: "Risk language and the ISO 31000 process", body: `
<p>Most arguments about risk are arguments about words. Fix the words first.</p>
<ul><li><b>Asset</b>: something of value (a passenger database, an airside OT network, the SOC's SIEM).</li>
<li><b>Threat</b>: something that could cause harm (ransomware crew, insider, flood).</li>
<li><b>Vulnerability</b>: a weakness a threat can use (unpatched VPN, shared admin password).</li>
<li><b>Risk</b>: the effect of uncertainty on objectives. In practice: <i>threat × vulnerability × impact on the asset</i>, expressed as likelihood and consequence.</li>
<li><b>Control</b>: a measure that reduces likelihood or impact.</li>
<li><b>Inherent risk</b>: before controls. <b>Residual risk</b>: after controls. <b>Target risk</b>: where you want it.</li>
<li><b>Risk appetite</b>: how much risk the Board is willing to pursue or keep, in plain statements ("no tolerance for regulatory breach").</li></ul>
<h3>The ISO 31000 cycle</h3>
<p><b>Scope and context</b> → <b>risk assessment</b> (identify, analyse, evaluate) → <b>treatment</b> → <b>monitoring and review</b>, with <b>communication and consultation</b> and <b>recording and reporting</b> running throughout. It is a loop, not a project.</p>
<h3>Writing a risk well</h3>
<p>Use cause, event, consequence: "<i>Because</i> OT engineering laptops connect to both the corporate and airside networks, <i>there is a risk that</i> ransomware spreads into baggage handling systems, <i>leading to</i> flight delays, regulatory scrutiny and penalties." A vague risk ("cyber attack") cannot be owned or treated.</p>`,
    remember: ["Inherent before controls, residual after, target is the goal.", "Write risks as cause, event, consequence.", "ISO 31000 is a continuous loop with communication throughout."],
    checks: [
      { q: "Which is a well-written risk statement?", o: ["Cyber attack", "Ransomware", "Because backups share the domain, a ransomware infection could encrypt them, leading to days of outage", "Weak security"], a: 2, w: "Cause, event and consequence make a risk specific enough to own and treat." },
      { q: "Residual risk is:", o: ["Risk before any control", "Risk remaining after controls", "The Board's appetite", "Risk transferred to insurance"], a: 1, w: "Residual risk is what remains after current controls are applied." }
    ] },
  { id: "assess", title: "Assessing risk: likelihood, impact and the heat map", body: `
<p>Most organisations use a <b>5 × 5 matrix</b>. The trick is defining each level so two people score the same risk the same way.</p>
<table><thead><tr><th>Score</th><th>Likelihood</th><th>Impact (example scale)</th></tr></thead><tbody>
<tr><td>1</td><td>Rare: less than once in 10 years</td><td>Under ₹10 lakh, no client impact</td></tr>
<tr><td>2</td><td>Unlikely: once in 5-10 years</td><td>₹10-50 lakh, minor client inconvenience</td></tr>
<tr><td>3</td><td>Possible: once in 1-5 years</td><td>₹50 lakh-2 crore, one client SLA breach</td></tr>
<tr><td>4</td><td>Likely: about once a year</td><td>₹2-10 crore, regulator notification, press</td></tr>
<tr><td>5</td><td>Almost certain: several times a year</td><td>Over ₹10 crore, safety or national-infrastructure impact</td></tr></tbody></table>
<p>Risk score = likelihood × impact. Bands are typically 1-4 low, 5-9 medium, 10-16 high, 20-25 critical, each with a required action and approval level.</p>
<h3>Doing an assessment</h3>
<ol><li>List assets in scope with their owners and value.</li>
<li>Run a workshop with owners: threats, existing controls, what would happen.</li>
<li>Score inherent, then residual with current controls. Write the reasoning, not just the number.</li>
<li>Compare to appetite. Anything above it needs treatment or a formal acceptance.</li></ol>
<h3>Common traps</h3>
<ul><li><b>Optimism</b>: owners score their own controls as perfect. Ask for the last test result.</li>
<li><b>Everything amber</b>: a register where all risks are 9-12 tells the Board nothing. Force ranking.</li>
<li><b>Impact on whom?</b> For a managed security provider, rate impact on the client too: their outage is your contract.</li></ul>`,
    remember: ["Define every level in words and numbers.", "Score inherent and residual, and record why.", "A useful register has a clear top ten."],
    checks: [
      { q: "Likelihood 4 and impact 4 gives a score of:", o: ["8", "12", "16", "20"], a: 2, w: "4 × 4 = 16, high on a typical 5 × 5 scale." },
      { q: "Owners rate their controls as fully effective. The BEST response:", o: ["Accept their judgement", "Ask for recent test or audit evidence before lowering the residual score", "Raise every score by one", "Ignore controls entirely"], a: 1, w: "Control effectiveness should be evidenced, not assumed." }
    ] },
  { id: "treat", title: "Treating, accepting and tracking risk", body: `
<p>Every risk above appetite gets one of four responses:</p>
<ul><li><b>Mitigate</b>: add or improve controls (segment OT, deploy EDR, add MFA).</li>
<li><b>Transfer</b>: share it, usually by insurance or contract. You transfer the financial impact, never the accountability.</li>
<li><b>Avoid</b>: stop the activity (retire the unsupported server).</li>
<li><b>Accept</b>: keep it, formally, because treatment costs more than the risk is worth.</li></ul>
<h3>The treatment plan</h3>
<p>For each mitigation: action, owner, due date, expected residual score, and status. Review overdue actions monthly; three missed dates is a governance issue for the steering committee, not a project update.</p>
<h3>Risk acceptance done right</h3>
<p>Acceptance is signed by someone with authority for that level (high risks by an executive, critical by the CEO or Board), states the residual risk, any compensating controls, and an <b>expiry date</b> after which it must be reviewed. Silence is not acceptance.</p>
<h3>The risk register</h3>
<table><thead><tr><th>Field</th><th>Why it matters</th></tr></thead><tbody>
<tr><td>ID, title, cause-event-consequence</td><td>Clear and searchable</td></tr>
<tr><td>Owner</td><td>One accountable person</td></tr>
<tr><td>Inherent and residual scores</td><td>Shows the value of controls</td></tr>
<tr><td>Controls and their test status</td><td>Links to evidence</td></tr>
<tr><td>Treatment, due date, target score</td><td>Shows progress</td></tr>
<tr><td>Trend and last review date</td><td>Shows the register is alive</td></tr></tbody></table>`,
    remember: ["Mitigate, transfer, avoid, accept.", "Insurance transfers money, not accountability.", "Acceptance is signed, scoped and expires."],
    checks: [
      { q: "Buying cyber insurance is an example of:", o: ["Avoiding risk", "Transferring risk", "Accepting risk", "Ignoring risk"], a: 1, w: "Insurance transfers financial impact; accountability stays with the organisation." },
      { q: "A high risk was 'accepted' in a team chat. What is missing?", o: ["Nothing", "A formal, signed acceptance by someone with authority, with an expiry date", "A new policy", "A penetration test"], a: 1, w: "Acceptances must be documented, authorised at the right level and time-bound." }
    ] },
  { id: "money", title: "Speaking money: KRIs and quantification", body: `
<p>Boards understand money and trends. Two tools help you speak their language.</p>
<h3>Key risk indicators</h3>
<p>A <b>KRI</b> warns that a risk is rising before it happens; a <b>KPI</b> measures how well a process performs. Good KRIs have a threshold and an owner.</p>
<table><thead><tr><th>Risk</th><th>KRI</th><th>Amber / red</th></tr></thead><tbody>
<tr><td>Ransomware</td><td>Critical internet-facing vulnerabilities older than 15 days</td><td>3 / 10</td></tr>
<tr><td>Insider misuse</td><td>Privileged accounts without a quarterly review</td><td>5% / 15%</td></tr>
<tr><td>Third-party breach</td><td>Critical vendors without a current assessment</td><td>2 / 5</td></tr>
<tr><td>OT disruption</td><td>OT assets reachable from the corporate network</td><td>1 / 5</td></tr></tbody></table>
<h3>Quantifying a risk</h3>
<p>Classic formula: <b>ALE = SLE × ARO</b>, where SLE (single loss expectancy) is the cost of one event and ARO the expected events per year. If a ransomware outage costs ₹4 crore and is expected once every four years (ARO 0.25), ALE is ₹1 crore a year. A ₹30 lakh control that halves the likelihood saves ₹50 lakh a year: worth it.</p>
<p><b>FAIR</b> (Factor Analysis of Information Risk) refines this with ranges and probabilities instead of single numbers, which is more honest about uncertainty. You do not need FAIR on day one; you do need to put rough rupee ranges on your top five risks.</p>`,
    remember: ["KRIs warn; KPIs measure performance.", "ALE = SLE × ARO.", "Put rupee ranges on the top risks; the Board will listen."],
    checks: [
      { q: "SLE ₹2 crore, ARO 0.5. ALE is:", o: ["₹4 crore", "₹1 crore", "₹2.5 crore", "₹50 lakh"], a: 1, w: "ALE = 2 crore × 0.5 = 1 crore a year." },
      { q: "Which is a KRI rather than a KPI?", o: ["Tickets closed per week", "Percentage of critical vendors without a current assessment", "Training sessions delivered", "Policies published"], a: 1, w: "It signals rising third-party risk against a threshold." }
    ] }
  ]
},
{
  id: "m3", n: 3, title: "ISO/IEC 27001:2022 in practice", short: "ISO 27001",
  lede: "How an ISMS works, the 93 controls, the Statement of Applicability, and surviving a certification audit.",
  lessons: [
  { id: "isms", title: "The ISMS: clauses 4 to 10", body: `
<p>ISO/IEC 27001 is a <b>management system</b> standard. Certification says you run a working system for managing information security risk, not that you are unhackable. The mandatory requirements are in clauses 4 to 10.</p>
<table><thead><tr><th>Clause</th><th>Topic</th><th>What the auditor looks for</th></tr></thead><tbody>
<tr><td>4</td><td>Context</td><td>Internal and external issues, interested parties and their requirements, the ISMS scope</td></tr>
<tr><td>5</td><td>Leadership</td><td>Top management commitment, the information security policy, roles and authorities</td></tr>
<tr><td>6</td><td>Planning</td><td>Risk assessment and treatment method, the Statement of Applicability, objectives</td></tr>
<tr><td>7</td><td>Support</td><td>Resources, competence, awareness, communication, documented information</td></tr>
<tr><td>8</td><td>Operation</td><td>Running the risk assessments and treatment plans</td></tr>
<tr><td>9</td><td>Performance evaluation</td><td>Monitoring, internal audit, management review</td></tr>
<tr><td>10</td><td>Improvement</td><td>Nonconformity, corrective action, continual improvement</td></tr></tbody></table>
<p>This is the <b>Plan-Do-Check-Act</b> loop: plan (4-6), do (7-8), check (9), act (10).</p>
<h3>The 2022 version</h3>
<p>The 2022 edition reorganised Annex A from 114 controls in 14 domains to <b>93 controls in 4 themes</b> and added 11 new controls. Certificates against the 2013 version had to transition by 31 October 2025, so everything you see now should be on 2022.</p>
<h3>Scope is everything</h3>
<p>A certificate covers only its scope. "Managed SOC services delivered from the Gurugram Integrated Cyber Defence Center" is a scope; "the whole company" may not be. Always read the scope on a supplier's certificate before trusting it.</p>`,
    remember: ["Clauses 4-10 are mandatory; Annex A is the control menu.", "Plan 4-6, do 7-8, check 9, act 10.", "A certificate is only as good as its scope."],
    checks: [
      { q: "Internal audit and management review are in clause:", o: ["6", "8", "9", "10"], a: 2, w: "Clause 9 is performance evaluation: monitoring, internal audit, management review." },
      { q: "How many controls are in ISO/IEC 27001:2022 Annex A?", o: ["114", "93", "110", "18"], a: 1, w: "93 controls in four themes; 114 was the 2013 version." }
    ] },
  { id: "annexa", title: "Annex A controls and the Statement of Applicability", body: `
<p>The 93 controls sit in four themes:</p>
<table><thead><tr><th>Theme</th><th>Controls</th><th>Examples</th></tr></thead><tbody>
<tr><td>5 Organisational</td><td>37</td><td>5.7 Threat intelligence, 5.19-5.23 Supplier and cloud security, 5.24-5.28 Incident management</td></tr>
<tr><td>6 People</td><td>8</td><td>6.1 Screening, 6.3 Awareness and training, 6.7 Remote working</td></tr>
<tr><td>7 Physical</td><td>14</td><td>7.1 Perimeters, 7.4 Physical security monitoring</td></tr>
<tr><td>8 Technological</td><td>34</td><td>8.8 Technical vulnerabilities, 8.9 Configuration management, 8.16 Monitoring, 8.28 Secure coding</td></tr></tbody></table>
<p>The 11 new controls include threat intelligence (5.7), cloud services (5.23), ICT readiness for business continuity (5.30), physical security monitoring (7.4), configuration management (8.9), information deletion (8.10), data masking (8.11), data leakage prevention (8.12), monitoring activities (8.16), web filtering (8.23) and secure coding (8.28).</p>
<h3>The Statement of Applicability (SoA)</h3>
<p>The SoA lists all 93 controls and, for each: applicable or not, the <b>justification</b>, whether it is implemented, and where the evidence lives. It is the single most-read document in an audit.</p>
<ul><li>Exclusions need a real reason ("7.10 Storage media: not applicable, no removable media in scope, blocked by policy and EDR" is weak if laptops exist in scope).</li>
<li>Justification should point to your risk assessment: controls are selected because risks need them.</li>
<li>Keep it versioned and approved; auditors compare it year on year.</li></ul>`,
    remember: ["Four themes: organisational 37, people 8, physical 14, technological 34.", "The SoA: applicable, why, implemented, evidence.", "Controls are chosen because the risk assessment needs them."],
    checks: [
      { q: "What MUST the SoA contain for each Annex A control?", o: ["The vendor that supplies it", "Whether it is applicable and the justification", "Its cost", "The auditor's name"], a: 1, w: "The SoA records applicability, justification and implementation status for every control." },
      { q: "Which theme has the most controls?", o: ["People", "Physical", "Organisational", "Technological"], a: 2, w: "Organisational controls number 37." }
    ] },
  { id: "audit", title: "Certification audits, findings and corrective action", body: `
<h3>The cycle</h3>
<ul><li><b>Stage 1</b>: documentation review and readiness. The auditor checks scope, policy, risk method, SoA and whether you are ready.</li>
<li><b>Stage 2</b>: the certification audit. Interviews, sampling and evidence that the ISMS actually runs.</li>
<li><b>Surveillance audits</b> in years 2 and 3, then <b>recertification</b> every three years.</li></ul>
<h3>Findings</h3>
<table><thead><tr><th>Type</th><th>Meaning</th><th>Example</th></tr></thead><tbody>
<tr><td>Major nonconformity</td><td>A requirement is not met at all, or a systemic failure</td><td>No internal audit performed this year</td></tr>
<tr><td>Minor nonconformity</td><td>An isolated lapse</td><td>Two of 25 sampled leavers kept access for 10 days</td></tr>
<tr><td>Opportunity for improvement</td><td>Not a failure; advice</td><td>Risk register could show trends</td></tr></tbody></table>
<p>A major nonconformity usually blocks certification until it is closed.</p>
<h3>Corrective action that sticks</h3>
<ol><li><b>Contain</b>: fix the instance (remove the leavers' access).</li>
<li><b>Root cause</b>: ask "why" until you reach a process (HR does not notify IT for contractors).</li>
<li><b>Correct the cause</b>: change the process (automated leaver feed including contractors).</li>
<li><b>Verify effectiveness</b>: re-sample next month and record it.</li></ol>
<h3>Preparing well</h3>
<p>Run your own internal audit first, prepare a <b>PBC (provided by client) list</b> of evidence, brief interviewees to answer only what is asked and to say "let me get the evidence" rather than guess, and keep one GRC person in every session taking notes.</p>`,
    remember: ["Stage 1 readiness, stage 2 certification, yearly surveillance, 3-year recertification.", "Major blocks certification; minor is an isolated lapse.", "Corrective action fixes the root cause and proves it worked."],
    checks: [
      { q: "Two of 25 sampled leavers kept access too long. This is MOST likely a:", o: ["Major nonconformity", "Minor nonconformity", "Opportunity for improvement", "Pass"], a: 1, w: "An isolated lapse in an otherwise working control is typically minor." },
      { q: "Which step is MOST often skipped in corrective action?", o: ["Fixing the instance", "Verifying that the fix was effective", "Writing a ticket", "Telling the auditor"], a: 1, w: "Effectiveness verification proves the root cause was addressed." }
    ] }
  ]
},
{
  id: "m4", n: 4, title: "SOC reports and client assurance", short: "SOC 1 / SOC 2",
  lede: "What SOC 1 and SOC 2 reports are, the Trust Services Criteria, and how to run a SOC audit without chaos.",
  lessons: [
  { id: "soc", title: "SOC 1, SOC 2, Type I and Type II", body: `
<p>SOC reports are attestation reports by an independent CPA firm under AICPA standards, about a <b>service organisation's</b> controls. As a managed security provider, your clients ask for them because you are part of their control environment.</p>
<table><thead><tr><th>Report</th><th>Focus</th><th>Who reads it</th></tr></thead><tbody>
<tr><td>SOC 1</td><td>Controls relevant to clients' <b>financial reporting</b></td><td>Client finance and their external auditors</td></tr>
<tr><td>SOC 2</td><td>Security, availability, processing integrity, confidentiality, privacy</td><td>Client security, risk and procurement</td></tr>
<tr><td>SOC 3</td><td>A short public version of SOC 2</td><td>Anyone, marketing</td></tr></tbody></table>
<h3>Type I vs Type II</h3>
<ul><li><b>Type I</b>: are the controls suitably <b>designed</b> at a point in time?</li>
<li><b>Type II</b>: did they <b>operate effectively</b> over a period, usually 6 to 12 months (sometimes 3 for a first report)? This is what clients really want.</li></ul>
<h3>Inside the report</h3>
<ol><li>The auditor's opinion: unqualified (clean) or qualified (exceptions material enough to matter).</li>
<li>Management's assertion.</li>
<li>The system description: services, boundaries, infrastructure, people, processes.</li>
<li>Controls, the auditor's tests and the results, including <b>exceptions</b>.</li>
<li><b>Complementary user entity controls (CUECs)</b>: what the client must do for your controls to work (for example, telling you when their staff leave).</li></ol>
<p>When the report period ends months before a client asks, you provide a <b>bridge letter</b>: management's statement that nothing material has changed since.</p>`,
    remember: ["SOC 1 is financial reporting; SOC 2 is security and trust.", "Type I is design; Type II is operation over a period.", "Read the exceptions and the CUECs, not just the opinion."],
    checks: [
      { q: "A client's security team wants proof your controls worked for the last year. They need:", o: ["SOC 1 Type I", "SOC 2 Type II", "SOC 3", "ISO 27001 certificate only"], a: 1, w: "SOC 2 Type II covers security controls operating over a period." },
      { q: "CUECs are:", o: ["Controls the auditor performs", "Controls the CLIENT must operate for the service's controls to be effective", "Exceptions found", "Penalty clauses"], a: 1, w: "Complementary user entity controls are the client's side of shared controls." }
    ] },
  { id: "tsc", title: "Trust Services Criteria and common criteria", body: `
<p>SOC 2 is scoped by the <b>Trust Services Criteria</b> (TSC). <b>Security</b> is mandatory; the others are chosen based on what clients rely on.</p>
<table><thead><tr><th>Category</th><th>Question it answers</th><th>Typical for a managed SOC</th></tr></thead><tbody>
<tr><td>Security (common criteria)</td><td>Is the system protected against unauthorised access?</td><td>Always</td></tr>
<tr><td>Availability</td><td>Is it available as committed?</td><td>Yes, 24×7 monitoring SLAs</td></tr>
<tr><td>Confidentiality</td><td>Is confidential information protected?</td><td>Yes, client logs and incident data</td></tr>
<tr><td>Processing integrity</td><td>Is processing complete, accurate, timely?</td><td>Sometimes (alert triage SLAs)</td></tr>
<tr><td>Privacy</td><td>Is personal information handled per commitments?</td><td>If you process client personal data</td></tr></tbody></table>
<p>The Security criteria are the "CC" series (CC1 to CC9), built on COSO: control environment, communication, risk assessment, monitoring, control activities, logical and physical access (CC6), system operations (CC7), change management (CC8) and risk mitigation including vendors (CC9).</p>
<h3>Writing controls for SOC 2</h3>
<p>Each control must be testable: who, what, when, how evidenced. Compare "Access is reviewed" with "Each quarter, the SOC manager reviews all user access to the SIEM; changes are actioned within 5 business days; the signed review is stored in the GRC tool." Only the second can be tested.</p>`,
    remember: ["Security is always in scope; add availability and confidentiality for a SOC provider.", "CC6 access, CC7 operations, CC8 change, CC9 vendors.", "Controls must say who, what, when and what evidence."],
    checks: [
      { q: "Which TSC category is ALWAYS included in a SOC 2?", o: ["Availability", "Privacy", "Security", "Processing integrity"], a: 2, w: "The common criteria for security are mandatory." },
      { q: "Which control statement is testable?", o: ["We take access seriously", "Access is reviewed regularly", "Quarterly, the SOC manager reviews SIEM access and signs the review; removals within 5 days", "Access follows best practice"], a: 2, w: "It names the owner, frequency, action and evidence." }
    ] },
  { id: "runaudit", title: "Running an audit: PBC lists, sampling and exceptions", body: `
<h3>Before</h3>
<ul><li>Agree the scope, period and criteria with the auditor in writing.</li>
<li>Get the <b>PBC list</b> (the evidence they will request) early and assign each item an owner and due date.</li>
<li>Run a <b>readiness assessment</b> 2 to 3 months ahead: test a few samples yourself.</li></ul>
<h3>During</h3>
<p>The auditor tests each control by <b>inquiry</b> (asking), <b>observation</b> (watching), <b>inspection</b> (reviewing evidence) and <b>re-performance</b> (doing it again). For a Type II they <b>sample</b>: for example 25 of 300 changes, 2 of 4 quarterly reviews, or 1 for an annual control. Evidence must come from the period and show the date, who did it and the result.</p>
<h3>Good evidence</h3>
<table><thead><tr><th>Weak</th><th>Strong</th></tr></thead><tbody>
<tr><td>A screenshot with no date</td><td>A system export with timestamp and the reviewer's sign-off</td></tr>
<tr><td>"We discussed it in the meeting"</td><td>Minutes listing attendees, decisions and actions</td></tr>
<tr><td>A policy that says reviews happen</td><td>The completed reviews for each quarter</td></tr></tbody></table>
<h3>When there is an exception</h3>
<p>Do not argue the facts; explain the context, show compensating controls, and write a management response with the root cause and fix. One honest exception with a strong response is better than a qualified opinion from hiding problems.</p>`,
    remember: ["PBC list early, owners and dates for each item.", "Auditors inquire, observe, inspect and re-perform.", "Evidence shows date, who and result, from within the period."],
    checks: [
      { q: "Which is the STRONGEST evidence of a quarterly access review?", o: ["The access policy", "A dated system export with the reviewer's sign-off and actions taken", "An email saying it was done", "A meeting invite"], a: 1, w: "It is dated, attributable and shows the outcome." },
      { q: "Re-performance means the auditor:", o: ["Asks the owner how it works", "Executes the control again to see if it gives the same result", "Reads the policy", "Interviews the CEO"], a: 1, w: "Re-performance independently repeats the control." }
    ] }
  ]
},
{
  id: "m5", n: 5, title: "Controls, testing and evidence", short: "Controls & testing",
  lede: "Design controls that work, test them like an auditor, and keep evidence flowing all year with the right tools.",
  lessons: [
  { id: "design", title: "Designing controls", body: `
<p>A control is only useful if it reduces a named risk and someone can prove it ran.</p>
<h3>Types</h3>
<table><thead><tr><th>By purpose</th><th>Example</th></tr></thead><tbody>
<tr><td>Preventive</td><td>MFA on VPN; change approval before deployment</td></tr>
<tr><td>Detective</td><td>SIEM alert on impossible travel; weekly backup restore check</td></tr>
<tr><td>Corrective</td><td>Incident playbook; restore from immutable backup</td></tr>
<tr><td>Deterrent / directive</td><td>Acceptable use policy; login banner</td></tr>
<tr><td>Compensating</td><td>Jump host and session recording where MFA is impossible</td></tr></tbody></table>
<p>Also classify <b>manual vs automated</b> (automated controls are tested once and then relied on if change management is sound) and <b>key vs non-key</b> (key controls alone would prevent or detect a material failure; they get the most testing).</p>
<h3>A control card</h3>
<p>Write each control with: ID, objective (the risk it addresses), description (who, what, when, how), frequency, owner, type, evidence produced, and the framework references it maps to. If you cannot write the evidence line, the control is not ready.</p>
<h3>Design vs operating effectiveness</h3>
<p><b>Design</b>: would this control, run as described, address the risk? <b>Operating</b>: did it actually run, every time, as described? A beautifully designed quarterly review that skipped Q2 fails operating effectiveness.</p>`,
    remember: ["Preventive, detective, corrective, plus compensating.", "Key controls get the most testing.", "No evidence line, no control."],
    checks: [
      { q: "A weekly backup restore test is mainly:", o: ["Preventive", "Detective", "Deterrent", "Directive"], a: 1, w: "It detects whether backups actually work." },
      { q: "A control is well designed but was skipped one quarter. It fails:", o: ["Design effectiveness", "Operating effectiveness", "Both", "Neither"], a: 1, w: "Design is fine; it did not operate consistently." }
    ] },
  { id: "test", title: "Testing controls like an auditor", body: `
<h3>Test of design (TOD)</h3>
<p>Walk through the control once with the owner (a <b>walkthrough</b>): follow one real example from start to finish and confirm the steps and evidence exist.</p>
<h3>Test of operating effectiveness (TOE)</h3>
<p>Select a sample across the period and check each one. A common sampling guide:</p>
<table><thead><tr><th>Control frequency</th><th>Typical sample</th></tr></thead><tbody>
<tr><td>Annual</td><td>1</td></tr><tr><td>Quarterly</td><td>2</td></tr><tr><td>Monthly</td><td>2 to 3</td></tr>
<tr><td>Weekly</td><td>5 to 10</td></tr><tr><td>Daily or many times a day</td><td>25 to 60</td></tr></tbody></table>
<p>Pick samples randomly from a complete population (all changes in the period from the system, not the ones the owner offers). Check <b>completeness</b> of the population first, or you are testing a curated list.</p>
<h3>Recording results</h3>
<p>For each sample: what you checked, the evidence reference, pass or fail and notes. If a sample fails, find out why, decide whether it is an isolated exception or a pattern, and consider expanding the sample.</p>
<h3>Worked example</h3>
<p>Control: "Emergency changes are approved within 2 business days after implementation." Population: 48 emergency changes from the ITSM tool for the year. Sample: 10 at random. Result: 9 approved on time, 1 approved after 6 days. Conclusion: one exception; root cause, an approver on leave without a delegate. Fix: mandatory delegate in the tool.</p>`,
    remember: ["Walkthrough tests design; samples test operation.", "Sample from the full population, chosen by you.", "Every failure needs a cause, not just a note."],
    checks: [
      { q: "Before sampling, you should FIRST:", o: ["Ask the owner for good examples", "Confirm the population is complete", "Test all items", "Check the policy"], a: 1, w: "An incomplete population makes any sample meaningless." },
      { q: "A typical sample size for a quarterly control is:", o: ["1", "2", "25", "60"], a: 1, w: "Two of the four quarters is a common guide." }
    ] },
  { id: "tools", title: "Continuous evidence and GRC tools", body: `
<p>The audit-season scramble happens when evidence is collected once a year. Mature programmes collect it continuously.</p>
<h3>The evidence calendar</h3>
<p>List every control with its frequency and evidence, then plan the year: monthly vulnerability reports, quarterly access reviews, half-yearly DR tests, annual policy review and awareness training. Chase owners a week before, not a month after.</p>
<h3>What GRC platforms do</h3>
<ul><li>Hold the control library mapped to frameworks.</li>
<li>Assign evidence requests with due dates and reminders.</li>
<li>Store evidence with metadata (period, owner, control).</li>
<li>Run risk registers, vendor assessments and policy attestation.</li>
<li>Pull automated evidence through integrations (cloud configuration, identity provider, ticketing).</li></ul>
<p>Examples: ServiceNow IRM, Archer, MetricStream, OneTrust, and open-source CISO Assistant and Eramba (both free to try, and good for learning).</p>
<h3>Continuous control monitoring</h3>
<p>For technical controls, measure directly instead of asking for screenshots: percentage of endpoints with EDR running, MFA enrolment, critical patches over SLA, logging coverage of crown-jewel systems. A dashboard that turns red when a control drifts is better evidence than any annual sample.</p>
<h3>Start simple</h3>
<p>A spreadsheet control library, a shared evidence folder named by control ID and period, and a monthly 30-minute review beat an expensive tool nobody updates.</p>`,
    remember: ["Collect evidence on a calendar, not in audit season.", "Name evidence by control ID and period.", "Measure technical controls continuously where you can."],
    checks: [
      { q: "The BEST evidence that EDR is deployed across endpoints is:", o: ["A screenshot from last year", "A current export of coverage against the asset inventory", "The vendor contract", "The security policy"], a: 1, w: "Coverage against the full inventory shows actual deployment." },
      { q: "Why name evidence files by control ID and period?", o: ["It looks neat", "So any auditor request can be answered quickly and completely", "Tools require it", "To hide gaps"], a: 1, w: "Traceability from control to evidence is what audits test." }
    ] }
  ]
}
]);

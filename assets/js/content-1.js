/* The CISSP Reader — chapter content, Domains 1–4
   Written against the ISC2 CISSP Exam Outline effective 15 April 2024
   (the outline in force until 14 April 2027). */
window.DOMAINS = window.DOMAINS || [];

window.DOMAINS.push({
  id: "d1", n: 1, weight: 16, priority: "strong",
  title: "Security and Risk Management",
  short: "Risk & Governance",
  sybex: "Ch 1 Security Governance · Ch 2 Personnel Security & Risk · Ch 3 Business Continuity · Ch 4 Laws, Regulations & Compliance · Ch 19 Investigations & Ethics",
  lede: "The largest domain, and the lens for every other one. It asks a single question again and again: does this decision serve the business, within the law, at a risk the owners have chosen to accept?",
  intro: "Domain 1 is where the CISSP stops being a technical exam and becomes a leadership exam. You will meet governance, risk, law, ethics, people and continuity, and you will be asked to rank options rather than recall facts. A management or audit background is an advantage here. The work is learning ISC2’s vocabulary, which differs in places from ISO and ISACA, so that your instincts land on the answer the exam writers chose.",
  memorise: [
    "ALE = SLE × ARO, and SLE = AV × EF. A safeguard is worth it when (ALE before − ALE after) − annual cost of safeguard > 0.",
    "Risk responses: mitigate, transfer (share), avoid, accept. Ignoring or rejecting risk is never correct.",
    "Due care is doing the right thing (acting). Due diligence is checking it is being done (verifying). Remember: care = do, diligence = check.",
    "Policy (mandatory, high level) → Standard (mandatory, specific) → Baseline (minimum config) → Procedure (step by step). Guidelines are optional.",
    "ISC2 Code of Ethics canons, in priority order: society → principals honourably → principals diligently → the profession.",
    "MTD ≥ RTO + WRT. RPO is about data loss (looking back); RTO is about downtime (looking forward).",
    "Senior management holds ultimate accountability for security. It can delegate tasks, never accountability.",
    "Civil cases: preponderance of evidence. Criminal: beyond reasonable doubt. Regulatory: the regulator’s standard."
  ],
  sections: [
    { id: "cia", title: "The CIA triad and its companions",
      body: `<p>Every control you will ever recommend protects one or more of three properties. <strong>Confidentiality</strong> keeps information from people who should not see it. <strong>Integrity</strong> keeps it accurate and unaltered, and lets you detect when it is not. <strong>Availability</strong> keeps it usable by authorised people when they need it. The opposite set, <em>disclosure, alteration and destruction</em> (DAD), describes what attackers try to do.</p>
      <p>ISC2 extends the triad with <strong>authenticity</strong> (the data or party is genuine) and <strong>non-repudiation</strong> (a party cannot credibly deny an action). Non-repudiation needs both identity and integrity, which is why digital signatures and not symmetric MACs provide it: with a shared key, either party could have produced the MAC.</p>
      <p>Around the triad sits the identity chain you will see again in Domain 5: <strong>identification</strong> (claiming an identity), <strong>authentication</strong> (proving it), <strong>authorisation</strong> (deciding what it may do), and <strong>accountability</strong> (tracing actions back to it through auditing).</p>
      <div class="note exam"><p>When a question asks which property a control serves, look at the attack it stops. Hashing protects integrity, not confidentiality. Backups and redundancy protect availability. Encryption protects confidentiality and, with authenticated modes, integrity too.</p></div>`,
      exam: "Mapping controls and attacks to CIA, and knowing why non-repudiation needs asymmetric cryptography." },
    { id: "governance", title: "Governance: aligning security with the business",
      body: `<p>Security governance is the set of structures that make sure security serves the organisation’s mission. It is <em>top-down</em>: the board and senior management set direction, approve the policy, provide resources and accept the residual risk. Security professionals advise; they do not own the business’s risk decisions.</p>
      <p>Expect questions on roles. <strong>Senior management</strong> is ultimately accountable. The <strong>CISO</strong> runs the programme. <strong>Data owners</strong> (usually business managers) classify data and decide who gets access. <strong>Custodians</strong> carry out the owners’ decisions day to day. <strong>Auditors</strong> provide independent assurance. The security function should report high enough in the organisation to stay independent of IT operations, ideally to the CEO, board or a risk committee.</p>
      <h3>The document hierarchy</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Document</th><th>Mandatory?</th><th>What it does</th></tr></thead><tbody>
      <tr><td>Policy</td><td>Yes</td><td>Management’s intent, broad and technology-neutral. Approved by senior management.</td></tr>
      <tr><td>Standard</td><td>Yes</td><td>Specific, uniform requirements (for example, “AES-256 for data at rest”).</td></tr>
      <tr><td>Baseline</td><td>Yes</td><td>The minimum security level for a system type, often a hardened configuration.</td></tr>
      <tr><td>Guideline</td><td>No</td><td>Recommendations and good practice.</td></tr>
      <tr><td>Procedure</td><td>Yes</td><td>Step-by-step instructions to carry out the above.</td></tr>
      </tbody></table></div>
      <h3>Frameworks you should recognise</h3>
      <p><strong>ISO/IEC 27001:2022</strong> defines the ISMS and its certification requirements; <strong>ISO/IEC 27002:2022</strong> gives the 93 controls grouped into four themes (organisational, people, physical, technological). <strong>NIST CSF 2.0</strong> organises outcomes into six functions. <strong>COBIT 2019</strong> covers enterprise IT governance. <strong>NIST SP 800-53</strong> is the US federal control catalogue. <strong>NIST RMF</strong> (SP 800-37) runs Prepare, Categorise, Select, Implement, Assess, Authorise, Monitor.</p>
      <div class="note latest"><p><strong>NIST CSF 2.0</strong> (February 2024) added a sixth function, <strong>Govern</strong>, to Identify, Protect, Detect, Respond and Recover, and widened the scope from critical infrastructure to all organisations. Govern sits at the centre: strategy, roles, policy, oversight and supply-chain risk.</p></div>
      <div class="note manager"><p>If an answer says “the security team decides” and another says “present the options and let management decide”, the second is almost always right. Security informs. Management decides and accepts the risk.</p></div>`,
      exam: "Who is accountable, which document is mandatory, and where the security function should report." },
    { id: "due-care", title: "Due care, due diligence and compliance",
      body: `<p><strong>Due care</strong> is acting as a reasonable, prudent person would: putting the right controls in place. <strong>Due diligence</strong> is the ongoing investigation and verification that those controls work and that risks are understood, including before a merger or before signing with a vendor. Failing at due care is the root of <em>negligence</em>. The exam uses the “prudent person rule”: senior managers must apply the care an ordinary prudent person would in the same position.</p>
      <p><strong>Compliance</strong> means meeting external obligations (laws, regulations, contracts such as PCI DSS) and internal ones (your own policies). Compliance is a floor, not a goal. A compliant organisation can still be insecure.</p>
      <div class="note memory"><p><strong>Diligence detects, care corrects.</strong> Due diligence is research and verification; due care is the action that follows.</p></div>`,
      exam: "Telling due care from due diligence in a scenario, and recognising negligence." },
    { id: "risk", title: "Risk management, the way ISC2 frames it",
      body: `<p>Risk is the likelihood that a <strong>threat</strong> exploits a <strong>vulnerability</strong> and causes <strong>impact</strong> to an <strong>asset</strong>. Reduce any of those and you reduce risk. The process is to identify assets, assess threats and vulnerabilities, analyse risk, choose a response, implement controls, and monitor.</p>
      <h3>Quantitative analysis</h3>
      <div class="formula">SLE = AV × EF &nbsp;&nbsp;·&nbsp;&nbsp; ALE = SLE × ARO<br>Safeguard value = ALE<sub>before</sub> − ALE<sub>after</sub> − annual cost of safeguard</div>
      <p>Asset value (AV) is what the asset is worth. Exposure factor (EF) is the percentage lost in one incident. Annualised rate of occurrence (ARO) is how often per year you expect it. A server worth $100,000 that would lose 40% of its value in a flood (SLE $40,000) expected once in 20 years (ARO 0.05) has an ALE of $2,000. Spending $5,000 a year to protect it is not justified on cost alone.</p>
      <div class="anim" data-anim="ale"></div>
      <h3>Qualitative analysis</h3>
      <p>Qualitative methods rank risk with scales (high, medium, low), heat maps, scenarios and the Delphi technique (anonymous expert rounds that converge on a view). They are quicker and capture things that are hard to price, such as reputation. Most real programmes use both.</p>
      <h3>Responses</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Response</th><th>Meaning</th><th>Example</th></tr></thead><tbody>
      <tr><td>Mitigate</td><td>Reduce likelihood or impact</td><td>Patch, segment, add MFA</td></tr>
      <tr><td>Transfer / share</td><td>Shift financial impact to a third party</td><td>Cyber insurance, outsourcing</td></tr>
      <tr><td>Avoid</td><td>Stop the risky activity</td><td>Decline to launch a feature</td></tr>
      <tr><td>Accept</td><td>Document and live with it</td><td>Signed risk acceptance by the owner</td></tr>
      </tbody></table></div>
      <p><strong>Inherent risk</strong> exists before controls. <strong>Residual risk</strong> remains after them. <strong>Total risk</strong> = threats × vulnerabilities × asset value; total risk minus <em>controls gap</em> gives residual. <strong>Risk appetite</strong> is how much risk the organisation wants overall; <strong>risk tolerance</strong> is the acceptable variation around it.</p>
      <h3>Control types and categories</h3>
      <p>Categories are <em>administrative</em> (managerial), <em>technical</em> (logical) and <em>physical</em>. Functions are <em>preventive, detective, corrective, deterrent, recovery, compensating</em> and <em>directive</em>. A locked door is physical and preventive; a security camera is physical and detective (and deterrent); a policy is administrative and directive.</p>
      <div class="note trap"><p>Insurance transfers the financial impact, never the accountability. If customer data leaks, the organisation still owns the breach and the reputational damage.</p></div>`,
      exam: "ALE arithmetic, choosing a response, and classifying a control by category and function." },
    { id: "threat-model", title: "Threat modelling and supply chain risk",
      body: `<p>Threat modelling finds design weaknesses before attackers do. Know the main methods by name and what each produces.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Method</th><th>What it is</th></tr></thead><tbody>
      <tr><td>STRIDE</td><td>Microsoft: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. Maps threats to the property each one violates.</td></tr>
      <tr><td>PASTA</td><td>Seven-stage, risk-centric process that starts from business objectives and ends with risk and impact analysis.</td></tr>
      <tr><td>DREAD</td><td>Scores threats on Damage, Reproducibility, Exploitability, Affected users, Discoverability.</td></tr>
      <tr><td>VAST, Trike</td><td>VAST scales threat modelling across agile teams; Trike is an acceptable-risk, requirements-driven model.</td></tr>
      <tr><td>MITRE ATT&amp;CK</td><td>Knowledge base of real adversary tactics and techniques. Used for detection engineering and red-team planning.</td></tr>
      </tbody></table></div>
      <p><strong>Supply chain risk management (SCRM)</strong> covers every supplier of hardware, software and services. Assess vendors before onboarding, set security requirements in contracts and SLAs, ask for evidence (SOC 2 reports, ISO certificates, SBOMs), and monitor them through the relationship. Watch for counterfeit hardware, tampered firmware, compromised updates and fourth parties (your vendor’s vendors).</p>
      <div class="note latest"><p>Software supply chain attacks (SolarWinds, the 3CX and XZ Utils compromises) pushed SBOMs (software bills of materials), the NIST Secure Software Development Framework (SP 800-218) and attestation into procurement. Expect scenario questions that start with a vendor update.</p></div>`,
      exam: "Naming a threat-modelling method from its description, and choosing a vendor-risk control." },
    { id: "personnel", title: "Personnel security and awareness",
      body: `<p>People are both the strongest and the weakest control. The employment lifecycle gives you the control points: <strong>screening</strong> before hire (background and reference checks proportionate to the role), <strong>agreements</strong> at hire (NDA, acceptable use policy), <strong>controls during employment</strong>, and <strong>offboarding</strong> that removes access at the moment of exit, recovers assets and reminds the person of continuing obligations.</p>
      <ul>
        <li><strong>Separation of duties</strong>: no single person can complete a sensitive task alone. Defeated only by collusion.</li>
        <li><strong>Job rotation</strong>: detects fraud and builds cross-training.</li>
        <li><strong>Mandatory vacation</strong>: forces someone else to do the job, exposing hidden fraud.</li>
        <li><strong>Least privilege and need to know</strong>: the minimum access and information to do the job.</li>
      </ul>
      <p>Awareness, training and education are different things. <em>Awareness</em> changes behaviour across everyone (posters, phishing simulations). <em>Training</em> teaches a skill for a job. <em>Education</em> builds deeper understanding, usually for security staff. Measure effectiveness, for example phishing click-rates over time, rather than counting attendance.</p>
      <div class="note manager"><p>For a hostile termination, disable access <em>before or during</em> the termination meeting, not after. For a friendly one, still remove access promptly and collect assets.</p></div>`,
      exam: "Picking the control that detects fraud (rotation, vacation) versus prevents it (separation of duties)." },
    { id: "bcp", title: "Business continuity planning",
      body: `<p>BCP keeps critical business functions running through a disruption. DR (Domain 7) restores the IT that supports them. BCP comes first and drives DR priorities.</p>
      <p>The ISC2 flow is: project scope and planning (get senior management sponsorship, form the team) → <strong>business impact analysis</strong> → continuity strategy → plan approval and implementation → training, testing and maintenance.</p>
      <h3>Business impact analysis (BIA)</h3>
      <p>The BIA identifies critical processes and what it costs when each one stops. Its outputs are the recovery targets:</p>
      <div class="tbl-wrap"><table><thead><tr><th>Metric</th><th>Question it answers</th></tr></thead><tbody>
      <tr><td>MTD / MAD</td><td>How long can the function be down before the damage is unacceptable or the business may not survive?</td></tr>
      <tr><td>RTO</td><td>How quickly must the system be restored? Must be less than MTD.</td></tr>
      <tr><td>RPO</td><td>How much data, measured in time, can we afford to lose? Sets backup frequency.</td></tr>
      <tr><td>WRT</td><td>Work recovery time: verifying data and catching up after the system is back.</td></tr>
      </tbody></table></div>
      <div class="formula">MTD ≥ RTO + WRT</div>
      <div class="note manager"><p>Human life always comes first. In any continuity or emergency scenario, the answer that protects people beats the one that protects data or equipment.</p></div>`,
      exam: "Ordering BCP steps, and choosing RTO/RPO/MTD from a scenario." },
    { id: "law", title: "Law, regulation, privacy and intellectual property",
      body: `<p>You will not be tested as a lawyer, but you must recognise the main legal regimes and what they demand.</p>
      <h3>Kinds of law</h3>
      <p><strong>Criminal</strong> law punishes offences against society (proof: beyond reasonable doubt). <strong>Civil</strong> law settles disputes between parties (proof: preponderance of evidence). <strong>Administrative / regulatory</strong> law is made by agencies. Common-law systems rely on precedent; civil-law systems on written codes.</p>
      <h3>Privacy and data protection</h3>
      <ul>
        <li><strong>GDPR</strong> (EU): lawful basis, data-subject rights, data protection by design, DPIAs, 72-hour breach notification to the supervisory authority, fines up to 4% of global turnover. Controllers decide purpose; processors act on instructions.</li>
        <li><strong>India’s DPDP Act 2023</strong>, with the DPDP Rules notified in November 2025 and phased in: consent-led processing, Data Fiduciaries and Data Processors, Significant Data Fiduciaries with extra duties, and a Data Protection Board.</li>
        <li>US sector laws: <strong>HIPAA</strong> (health), <strong>GLBA</strong> (financial), <strong>SOX</strong> (financial reporting integrity), <strong>FERPA</strong> (education), <strong>COPPA</strong> (children), plus state laws such as CCPA/CPRA.</li>
        <li><strong>PCI DSS v4.0.1</strong> is a contractual standard, not a law. Its future-dated requirements became mandatory on 31 March 2025.</li>
      </ul>
      <p>Know the OECD privacy principles in outline: collection limitation, data quality, purpose specification, use limitation, security safeguards, openness, individual participation and accountability. Cross-border transfers need a legal mechanism (adequacy decisions, standard contractual clauses, binding corporate rules). Export controls such as the <strong>Wassenaar Arrangement</strong> restrict some cryptography and security tools.</p>
      <h3>Intellectual property</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Protects</th><th>Term / notes</th></tr></thead><tbody>
      <tr><td>Copyright</td><td>Expression of an idea (code, text)</td><td>Automatic; long term (life + 70 years in many countries)</td></tr>
      <tr><td>Trademark</td><td>Brand names, logos</td><td>Renewable indefinitely while in use</td></tr>
      <tr><td>Patent</td><td>Novel, useful, non-obvious inventions</td><td>20 years from filing; public disclosure is the price</td></tr>
      <tr><td>Trade secret</td><td>Confidential business information</td><td>Lasts as long as secrecy is maintained (NDAs)</td></tr>
      </tbody></table></div>
      <div class="note latest"><p>New regimes to recognise by name: the <strong>EU NIS2</strong> directive (from October 2024), <strong>DORA</strong> for EU financial entities (applied from 17 January 2025), the <strong>EU AI Act</strong> (phased from 2025), and the SEC rule requiring US-listed companies to disclose material cyber incidents within four business days.</p></div>`,
      exam: "Matching a scenario to the right law or IP type, and knowing PCI DSS is contractual." },
    { id: "ethics-investigations", title: "Ethics and investigation types",
      body: `<p>The <strong>ISC2 Code of Ethics</strong> has a preamble and four canons. When canons conflict, apply them in order:</p>
      <ol>
        <li>Protect society, the common good, necessary public trust and confidence, and the infrastructure.</li>
        <li>Act honourably, honestly, justly, responsibly and legally.</li>
        <li>Provide diligent and competent service to principals.</li>
        <li>Advance and protect the profession.</li>
      </ol>
      <p>Members who see a breach of the code are expected to report it through the ISC2 ethics complaint process. Know also RFC 1087 (“Ethics and the Internet”) as an example of unethical behaviour lists.</p>
      <h3>Investigation types</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Purpose</th><th>Standard of proof</th></tr></thead><tbody>
      <tr><td>Administrative</td><td>Internal: operational issue or policy breach</td><td>Lowest; internal policy</td></tr>
      <tr><td>Criminal</td><td>Violation of criminal law; law enforcement involved</td><td>Beyond reasonable doubt</td></tr>
      <tr><td>Civil</td><td>Dispute between parties, e.g. contract or IP</td><td>Preponderance of evidence</td></tr>
      <tr><td>Regulatory</td><td>Breach of regulation, run by a regulator</td><td>Set by the regulator</td></tr>
      <tr><td>Industry standards</td><td>Compliance with e.g. PCI DSS</td><td>Set by the standard body</td></tr>
      </tbody></table></div>`,
      exam: "Applying the canons in order to a dilemma; matching an investigation to its burden of proof." }
  ],
  questions: [
    { q: "A warehouse worth $400,000 has a 25% exposure factor for fire. Fire is expected once every 10 years. A suppression upgrade costs $12,000 per year and would cut the ARO to once every 50 years. What should the security manager recommend?",
      options: ["Implement it, because it reduces risk", "Do not implement it on cost grounds, because its annual cost exceeds the reduction in ALE", "Transfer the risk by buying insurance instead", "Accept the risk because fires are rare"],
      answer: 1,
      why: "SLE = 400,000 × 0.25 = $100,000. ALE before = 100,000 × 0.1 = $10,000. ALE after = 100,000 × 0.02 = $2,000. Reduction = $8,000, which is less than the $12,000 cost. The control costs more than it saves. Insurance may be worth considering, but the question asks about this safeguard." },
    { q: "A CISO has identified a risk in a new customer portal and calculated the cost of fixing it. What is the MOST appropriate next step?",
      options: ["Implement the fix immediately", "Present the risk and the options to the business owner for a decision", "Document the risk as accepted", "Buy cyber insurance to transfer the risk"],
      answer: 1,
      why: "Risk decisions belong to the business owner or senior management. Security advises and presents options. Accepting or fixing without the owner’s decision bypasses governance." },
    { q: "Which ISC2 Code of Ethics canon takes priority if two canons conflict?",
      options: ["Provide diligent and competent service to principals", "Advance and protect the profession", "Protect society, the common good and the infrastructure", "Act honourably, honestly, justly, responsibly and legally"],
      answer: 2,
      why: "The canons are listed in priority order, and protecting society comes first." },
    { q: "An organisation reviews a cloud provider’s SOC 2 Type II report before signing a contract. This is an example of:",
      options: ["Due care", "Due diligence", "Risk transfer", "Separation of duties"],
      answer: 1,
      why: "Investigating and verifying before committing is due diligence. Putting controls in place afterwards would be due care." }
  ]
});

window.DOMAINS.push({
  id: "d2", n: 2, weight: 10, priority: "strong",
  title: "Asset Security",
  short: "Asset Security",
  sybex: "Ch 5 Protecting Security of Assets",
  lede: "You cannot protect what you have not found, named and valued. Asset security is the discipline of knowing what information you hold, who owns it, how sensitive it is, and how it dies.",
  intro: "Asset security is the smallest domain by weight and one of the most predictable. It follows information through its life: identified, classified, owned, handled according to its label, retained only as long as needed, and destroyed in a way that matches its sensitivity. Most questions turn on two things. Who is responsible for which decision? And which sanitisation method fits which media?",
  memorise: [
    "The data owner classifies data and sets access. The custodian implements protection. The user follows policy.",
    "Classification is based on value and sensitivity. Labelling and marking communicate it; handling rules enforce it.",
    "Clearing (overwrite; protects against casual recovery) < Purging (protects against lab attack) < Destruction (physical).",
    "Degaussing does not work on SSDs or optical media. For SSDs use crypto-erase, vendor secure-erase, or physical destruction.",
    "Scoping removes controls from a baseline that do not apply. Tailoring adjusts the remaining controls to fit.",
    "Data states: at rest, in transit, in use. Each needs its own controls.",
    "Retention is set by law, regulation and business need. Keep data no longer than required."
  ],
  sections: [
    { id: "inventory", title: "Identifying and classifying information and assets",
      body: `<p>Everything starts with an <strong>inventory</strong>: hardware, software, data stores, cloud services and the information they hold. Automated discovery helps, but the inventory is only useful if each entry has an <strong>owner</strong> and a <strong>classification</strong>.</p>
      <p>Classification groups information by the harm its compromise would cause, so that protection can be applied by class instead of item by item.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Government (US)</th><th>Commercial (typical)</th><th>Harm if disclosed</th></tr></thead><tbody>
      <tr><td>Top Secret</td><td>Confidential / Proprietary</td><td>Exceptionally grave</td></tr>
      <tr><td>Secret</td><td>Private</td><td>Serious</td></tr>
      <tr><td>Confidential</td><td>Sensitive</td><td>Damage</td></tr>
      <tr><td>Unclassified</td><td>Public</td><td>None</td></tr>
      </tbody></table></div>
      <p><strong>Marking</strong> (or labelling) attaches the classification to the asset: headers, footers, metadata tags, physical labels on media. <strong>Categorisation</strong> in the NIST sense (FIPS 199) rates impact (low, moderate, high) separately for confidentiality, integrity and availability.</p>
      <div class="note exam"><p>The <em>owner</em> classifies. Not IT, not security, not the custodian. If a question asks who decides the classification of a customer database, the answer is the business owner of that data.</p></div>`,
      exam: "Who classifies, and why classification precedes control selection." },
    { id: "roles", title: "Data roles",
      body: `<div class="tbl-wrap"><table><thead><tr><th>Role</th><th>Responsibility</th></tr></thead><tbody>
      <tr><td>Data owner</td><td>Senior business person accountable for the data. Classifies it, approves access, sets protection requirements.</td></tr>
      <tr><td>Data controller</td><td>(GDPR term) Decides the purposes and means of processing personal data.</td></tr>
      <tr><td>Data processor</td><td>Processes personal data on behalf of the controller, e.g. a cloud or payroll provider.</td></tr>
      <tr><td>Data custodian</td><td>Implements the owner’s requirements: backups, access configuration, patching. Usually IT.</td></tr>
      <tr><td>Data steward</td><td>Business role responsible for data quality and metadata.</td></tr>
      <tr><td>Data subject</td><td>The person the personal data is about.</td></tr>
      <tr><td>System owner</td><td>Owns the system that processes the data; ensures it meets the data owner’s requirements.</td></tr>
      </tbody></table></div>
      <div class="note memory"><p><strong>Owner decides, custodian does.</strong> Owners make the choices; custodians carry them out.</p></div>`,
      exam: "Matching a task to a role, especially owner versus custodian and controller versus processor." },
    { id: "lifecycle", title: "The information lifecycle and data states",
      body: `<p>A typical lifecycle runs <strong>create/collect → store → use → share → archive → destroy</strong>. Controls change at each step: classify at creation, encrypt in storage, enforce access in use, protect in transit while sharing, keep integrity during archiving, and sanitise at the end.</p>
      <h3>Three states of data</h3>
      <ul>
        <li><strong>At rest</strong>: full-disk, database and file encryption; access control; backups.</li>
        <li><strong>In transit</strong>: TLS 1.2/1.3, IPsec, SSH, VPNs.</li>
        <li><strong>In use</strong>: the hardest state, because data must be decrypted to be processed. Controls include memory protection, trusted execution environments (confidential computing), and homomorphic encryption in research settings.</li>
      </ul>
      <h3>Privacy-enhancing techniques</h3>
      <p><strong>Anonymisation</strong> removes identifiers irreversibly; truly anonymised data falls outside GDPR. <strong>Pseudonymisation</strong> replaces identifiers with tokens that can be re-linked with a separately held key; it is still personal data. <strong>Tokenisation</strong> replaces a value (such as a card number) with a meaningless token held in a vault. <strong>Data masking</strong> hides parts of a value for display or testing.</p>`,
      exam: "Choosing the right protection for a data state; pseudonymisation versus anonymisation." },
    { id: "handling", title: "Handling, retention and data protection controls",
      body: `<p>Handling rules say how each class may be stored, sent, printed and discussed. <strong>Retention</strong> policies say how long records must be kept, driven by law, regulation and business need. Keeping data too long is a risk too: more to breach, more to disclose in litigation (e-discovery).</p>
      <p>Choosing controls usually starts from a <strong>baseline</strong> such as NIST SP 800-53 or the CIS Benchmarks, then:</p>
      <ul>
        <li><strong>Scoping</strong>: decide which baseline controls apply to this system.</li>
        <li><strong>Tailoring</strong>: modify the applicable controls to fit the organisation’s mission and environment, including compensating controls.</li>
      </ul>
      <h3>Tools</h3>
      <p><strong>DLP</strong> (data loss prevention) finds and blocks sensitive data leaving through email, web, USB or cloud, at the network and the endpoint. <strong>DRM / IRM</strong> keeps protection attached to the file wherever it goes (who may open, print, forward, and for how long). <strong>CASB</strong> brokers access to cloud services, enforcing policy and finding shadow IT.</p>
      <p>Asset owners also manage <strong>end-of-life</strong> (vendor stops selling) and <strong>end-of-support</strong> (no more patches). EOS systems need isolation, compensating controls or replacement.</p>`,
      exam: "Scoping versus tailoring; DLP versus DRM; what to do with unsupported systems." },
    { id: "sanitisation", title: "Data remanence and sanitisation",
      body: `<p>Deleted data is rarely gone. <strong>Data remanence</strong> is what remains on media after deletion or formatting. Sanitisation methods are chosen by classification and media type, following guidance such as <strong>NIST SP 800-88</strong>.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Method</th><th>What it does</th><th>Fit</th></tr></thead><tbody>
      <tr><td>Erasing / deleting</td><td>Removes pointers only</td><td>Not sanitisation</td></tr>
      <tr><td>Clearing (overwriting)</td><td>Overwrites so data cannot be recovered by normal tools</td><td>Reuse inside the organisation</td></tr>
      <tr><td>Purging</td><td>Makes recovery infeasible even in a lab: degaussing (magnetic), crypto-erase, block erase</td><td>Media leaving your control</td></tr>
      <tr><td>Destruction</td><td>Shredding, disintegration, incineration, pulverising</td><td>Highest sensitivity, failed drives</td></tr>
      </tbody></table></div>
      <p>SSDs use wear-levelling and over-provisioning, so overwriting may miss cells. Use the drive’s built-in secure erase, <strong>cryptographic erasure</strong> (destroy the key of a self-encrypting drive), or physical destruction. In the cloud you cannot shred the provider’s disks, so crypto-erase is the practical answer.</p>
      <div class="note trap"><p>Degaussing an SSD does nothing useful, and degaussing a hard disk usually destroys the drive too. Do not pick degaussing for flash media.</p></div>`,
      exam: "Matching sanitisation to media and sensitivity; crypto-erase for SSDs and cloud." }
  ],
  questions: [
    { q: "Who is primarily responsible for determining the classification of a customer database?",
      options: ["The database administrator", "The CISO", "The data owner", "The data custodian"],
      answer: 2,
      why: "The data owner, a business manager accountable for the data, classifies it. Custodians and DBAs implement the protection the owner specifies." },
    { q: "A company is decommissioning laptops with SSDs that held confidential data. The laptops will be donated. What is the BEST sanitisation method?",
      options: ["Degauss the drives", "Format the drives twice", "Use cryptographic erase or the vendor’s secure-erase command, verified", "Delete all user files and empty the recycle bin"],
      answer: 2,
      why: "Degaussing does not affect flash memory, and formatting or deleting only clears pointers. Crypto-erase or a verified secure-erase is appropriate for SSDs leaving the organisation." },
    { q: "An organisation adopts NIST SP 800-53 and removes controls for wireless networking because it has no wireless. This is:",
      options: ["Tailoring", "Scoping", "Compensating", "Risk avoidance"],
      answer: 1,
      why: "Scoping decides which controls apply. Tailoring adjusts the applicable controls to fit the organisation." }
  ]
});

window.DOMAINS.push({
  id: "d3", n: 3, weight: 13, priority: "weak",
  title: "Security Architecture and Engineering",
  short: "Architecture & Crypto",
  sybex: "Ch 6 Cryptography & Symmetric Algorithms · Ch 7 PKI & Cryptographic Applications · Ch 8 Security Models, Design & Capabilities · Ch 9 Vulnerabilities, Threats & Countermeasures · Ch 10 Physical Security",
  lede: "The engineer’s domain: secure design principles, the formal models behind them, cryptography from first principles, and the physical building that holds it all.",
  intro: "Many candidates find this the hardest domain, so read it slowly. It has three parts that feel unrelated at first. Secure design principles and security models describe how trustworthy systems are built. Cryptography gives you the tools for confidentiality, integrity and authenticity. Physical security protects the facility. The exam rarely asks you to do maths; it asks you to pick the right mechanism and to know why the others are wrong.",
  memorise: [
    "Bell–LaPadula (confidentiality): no read up, no write down. Biba (integrity): no read down, no write up.",
    "Clark–Wilson enforces integrity through well-formed transactions and separation of duties (the access triple: subject–program–object).",
    "Brewer–Nash (Chinese Wall) prevents conflicts of interest; access depends on what you have already accessed.",
    "Symmetric keys needed for n people: n(n−1)/2. Asymmetric: 2n (one key pair each).",
    "Sign with your private key; others verify with your public key. Encrypt to someone with their public key; they decrypt with their private key.",
    "AES: 128-bit block, 128/192/256-bit keys. ECB leaks patterns; GCM gives confidentiality and integrity.",
    "Shor’s algorithm threatens RSA, DH and ECC. Grover’s halves effective symmetric key strength, so AES-256 stays safe.",
    "Fire classes (US): A ordinary combustibles, B liquids, C electrical, D metals, K cooking oils.",
    "Pre-action sprinklers suit data centres: two triggers before water flows."
  ],
  sections: [
    { id: "principles", title: "Secure design principles",
      body: `<p>The 2024 outline lists the principles by name, so you should be able to recognise each one in a scenario.</p>
      <ul>
        <li><strong>Threat modelling</strong>: think like an attacker during design.</li>
        <li><strong>Least privilege</strong>: every subject gets the minimum access it needs, for the minimum time.</li>
        <li><strong>Defence in depth</strong>: layered, diverse controls so one failure does not expose the asset.</li>
        <li><strong>Secure defaults</strong>: out of the box, the system is in its most secure sensible state.</li>
        <li><strong>Fail securely</strong>: on error, deny access and protect data (fail-closed). Note the life-safety exception: doors on fire exits <em>fail safe</em> (open) to protect people.</li>
        <li><strong>Segregation of duties</strong>: split critical functions across people or processes.</li>
        <li><strong>Keep it simple and small</strong>: less code and fewer features mean a smaller attack surface.</li>
        <li><strong>Zero trust or trust but verify</strong>: never trust based on network location; verify every request explicitly.</li>
        <li><strong>Privacy by design</strong>: build privacy in from the start, with privacy as the default setting.</li>
        <li><strong>Shared responsibility</strong>: in cloud, the provider and customer each own defined parts of security.</li>
        <li><strong>Secure access service edge (SASE)</strong>: network and security services (SD-WAN, SWG, CASB, ZTNA, FWaaS) delivered from the cloud close to the user. Added in the 2024 outline.</li>
      </ul>
      <div class="note latest"><p><strong>Zero trust</strong> is defined in NIST SP 800-207: a policy decision point and policy enforcement point evaluate every access using identity, device posture and context. There is no trusted internal network. Expect it in D3, D4 and D5 questions.</p></div>
      <div class="note trap"><p><em>Fail-secure</em> protects assets; <em>fail-safe</em> protects people. If life safety is involved, fail-safe wins.</p></div>`,
      exam: "Naming the principle a design decision applies, and fail-safe versus fail-secure." },
    { id: "models", title: "Security models",
      body: `<p>Security models are formal descriptions of a security policy. The exam wants you to recognise each model from its rules and its goal.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Model</th><th>Goal</th><th>Key rules</th></tr></thead><tbody>
      <tr><td>Bell–LaPadula</td><td>Confidentiality (military)</td><td><em>Simple security</em>: no read up. <em>*-property</em>: no write down. <em>Strong star</em>: read and write only at your own level.</td></tr>
      <tr><td>Biba</td><td>Integrity</td><td><em>Simple integrity</em>: no read down. <em>*-integrity</em>: no write up. <em>Invocation</em>: cannot invoke a subject at higher integrity.</td></tr>
      <tr><td>Clark–Wilson</td><td>Integrity (commercial)</td><td>Users reach constrained data items (CDIs) only through transformation procedures (TPs); integrity verification procedures (IVPs) check them. Enforces separation of duties.</td></tr>
      <tr><td>Brewer–Nash</td><td>Conflict of interest</td><td>Access changes dynamically based on prior access (consultant for Bank A cannot then see Bank B).</td></tr>
      <tr><td>Graham–Denning</td><td>Secure creation/deletion</td><td>Eight protection rights for creating and deleting subjects and objects and granting rights.</td></tr>
      <tr><td>Harrison–Ruzzo–Ullman</td><td>Rights changes</td><td>Extends Graham–Denning; shows whether rights can leak (safety problem).</td></tr>
      <tr><td>Take–Grant</td><td>Rights propagation</td><td>Directed graph with take, grant, create, remove.</td></tr>
      <tr><td>Lattice / state machine / information flow / non-interference</td><td>Foundations</td><td>A secure state machine always moves between secure states; non-interference means high-level actions do not affect what low-level users see.</td></tr>
      </tbody></table></div>
      <div class="anim" data-anim="models"></div>
      <div class="note memory"><p><strong>Bell–LaPadula keeps secrets: “no read up, no write down”</strong> (you cannot leak secrets downwards). <strong>Biba is the mirror: “no read down, no write up”</strong> (you cannot be contaminated by dirty data, nor contaminate cleaner data). Integrity is <em>“I”</em>nverted.</p></div>`,
      exam: "Recognising a model from one rule, especially BLP versus Biba and where Clark–Wilson fits." },
    { id: "evaluation", title: "Trusted computing, evaluation and hardware security",
      body: `<p>The <strong>trusted computing base (TCB)</strong> is every component that enforces security: hardware, firmware and software. The <strong>reference monitor</strong> is the concept that mediates every access of subjects to objects; it must be tamper-proof, always invoked, and small enough to verify. The <strong>security kernel</strong> is its implementation. The <strong>security perimeter</strong> separates the TCB from everything else.</p>
      <p><strong>Common Criteria</strong> (ISO/IEC 15408) evaluates products. A <em>Protection Profile</em> states what a class of product needs; a <em>Security Target</em> states what a specific product claims; the <em>Target of Evaluation</em> is the product. Assurance levels run <strong>EAL1</strong> (functionally tested) to <strong>EAL7</strong> (formally verified design and tested).</p>
      <p>Hardware security capabilities:</p>
      <ul>
        <li><strong>TPM</strong>: a chip on the motherboard that stores keys, measures boot (attestation) and binds disk encryption to the device.</li>
        <li><strong>HSM</strong>: a hardened device for generating, storing and using keys at scale (CAs, payments).</li>
        <li><strong>Trusted execution environments</strong> (Intel SGX/TDX, AMD SEV, Arm TrustZone): isolate code and data in use.</li>
        <li><strong>Secure boot / measured boot</strong>: only signed code loads; measurements prove what loaded.</li>
        <li>Memory protection, process isolation, protection rings (ring 0 kernel, ring 3 user), virtualisation.</li>
      </ul>
      <p><strong>Certification</strong> is the technical evaluation of a system’s controls. <strong>Accreditation</strong> (authorisation) is management’s formal acceptance of the residual risk to operate it.</p>`,
      exam: "Reference monitor properties, CC vocabulary, certification versus accreditation." },
    { id: "vulns", title: "Vulnerabilities in architectures",
      body: `<p>Each architecture brings its own weaknesses. Expect short scenarios naming one.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Architecture</th><th>Typical concern</th></tr></thead><tbody>
      <tr><td>Client-based</td><td>Local caches, applets, untrusted code on endpoints</td></tr>
      <tr><td>Server-based</td><td>Data flow control, privileged services</td></tr>
      <tr><td>Database</td><td>Aggregation and inference (see D8), injection</td></tr>
      <tr><td>Cryptographic systems</td><td>Weak algorithms, poor key management, implementation flaws</td></tr>
      <tr><td>ICS / SCADA / OT</td><td>Legacy protocols without authentication, availability above all, long patch cycles; segment (Purdue model) and monitor</td></tr>
      <tr><td>Cloud (IaaS, PaaS, SaaS)</td><td>Shared responsibility gaps, misconfiguration, data residency, multi-tenancy</td></tr>
      <tr><td>Distributed / IoT / edge / fog</td><td>Weak default credentials, no updates, physical exposure</td></tr>
      <tr><td>Virtualised systems</td><td>VM escape, VM sprawl, hypervisor compromise</td></tr>
      <tr><td>Containers / microservices / serverless</td><td>Image provenance, secrets in images, east-west traffic, over-privileged functions, API sprawl</td></tr>
      <tr><td>Embedded / HPC</td><td>Firmware updates, resource constraints, high-value targets</td></tr>
      </tbody></table></div>
      <h3>Shared responsibility in the cloud</h3>
      <p>In <strong>IaaS</strong> the customer secures the OS, applications and data. In <strong>PaaS</strong> the customer secures applications and data. In <strong>SaaS</strong> the customer secures data, identities and configuration. The customer is always accountable for its data and who can reach it.</p>
      <p>Other names to know: <strong>TOCTOU</strong> (time-of-check to time-of-use race), <strong>covert channels</strong> (timing and storage), <strong>maintenance hooks / backdoors</strong>, emanations (TEMPEST).</p>`,
      exam: "Picking the main risk for a named architecture; who owns what in each cloud model." },
    { id: "crypto-basics", title: "Cryptography I: concepts and symmetric ciphers",
      body: `<p>Cryptography delivers confidentiality, integrity, authentication and non-repudiation. Start with vocabulary: <em>plaintext</em> becomes <em>ciphertext</em> using an <em>algorithm</em> and a <em>key</em>. <strong>Kerckhoffs’s principle</strong>: the system must stay secure even if everything except the key is public. Strength depends on key length, algorithm quality, and key secrecy. <strong>Confusion</strong> hides the relationship between key and ciphertext; <strong>diffusion</strong> spreads each plaintext bit across the ciphertext.</p>
      <p>Symmetric algorithms use one shared key. They are fast and suit bulk data, but key distribution is hard and they cannot provide non-repudiation.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Algorithm</th><th>Block</th><th>Key</th><th>Status</th></tr></thead><tbody>
      <tr><td>DES</td><td>64</td><td>56</td><td>Broken; retired</td></tr>
      <tr><td>3DES</td><td>64</td><td>112/168</td><td>Deprecated; NIST disallowed after 2023</td></tr>
      <tr><td>AES (Rijndael)</td><td>128</td><td>128/192/256</td><td>The standard</td></tr>
      <tr><td>Blowfish / Twofish</td><td>64 / 128</td><td>32–448 / up to 256</td><td>Legacy / AES finalist</td></tr>
      <tr><td>ChaCha20</td><td>stream</td><td>256</td><td>Modern stream cipher in TLS 1.3</td></tr>
      <tr><td>RC4</td><td>stream</td><td>40–2048</td><td>Broken (WEP)</td></tr>
      </tbody></table></div>
      <h3>Block cipher modes</h3>
      <ul>
        <li><strong>ECB</strong>: each block encrypted alone; identical plaintext gives identical ciphertext. Never use for real data.</li>
        <li><strong>CBC</strong>: chains blocks with an IV; errors propagate; needs a separate MAC.</li>
        <li><strong>CTR</strong>: turns a block cipher into a stream; parallelisable.</li>
        <li><strong>GCM</strong>: counter mode with authentication (AEAD). Default in TLS 1.3.</li>
      </ul>
      <div class="formula">Keys for n users — symmetric: n(n−1)/2 &nbsp;·&nbsp; asymmetric: 2n<br>e.g. 100 users → 4,950 shared keys vs 200 keys</div>`,
      exam: "Choosing an algorithm or mode, and the key-count formulas." },
    { id: "crypto-asym", title: "Cryptography II: asymmetric, hashing and signatures",
      body: `<p>Asymmetric cryptography uses a key pair. What one key does, only the other can undo. It solves key distribution and enables digital signatures, but it is slow, so real systems use it to exchange a symmetric session key (<strong>hybrid cryptography</strong>, as in TLS).</p>
      <ul>
        <li><strong>RSA</strong>: security from factoring large numbers. 2048-bit minimum today.</li>
        <li><strong>Diffie–Hellman</strong>: key agreement over an open channel; no authentication on its own, so vulnerable to man-in-the-middle unless authenticated. Ephemeral DH (DHE/ECDHE) gives <strong>perfect forward secrecy</strong>.</li>
        <li><strong>ECC</strong>: equivalent strength with much smaller keys (256-bit ECC ≈ 3072-bit RSA). Good for mobile and IoT.</li>
        <li><strong>ElGamal, DSA</strong>: discrete-log based encryption and signatures.</li>
      </ul>
      <h3>Hashing</h3>
      <p>A hash turns any input into a fixed-length digest. It is one-way and should be collision-resistant. <strong>MD5</strong> and <strong>SHA-1</strong> are broken for collision resistance. Use <strong>SHA-2</strong> (SHA-256/384/512) or <strong>SHA-3</strong>. A <strong>HMAC</strong> adds a secret key to give integrity and authenticity between parties sharing it. For passwords use slow, salted functions: bcrypt, scrypt, Argon2, PBKDF2. Salts defeat rainbow tables.</p>
      <h3>Digital signatures</h3>
      <p>The sender hashes the message and encrypts the hash with their <strong>private key</strong>. The receiver decrypts with the sender’s <strong>public key</strong> and compares hashes. That proves integrity, authenticity and non-repudiation, but not confidentiality.</p>
      <div class="anim" data-anim="signature"></div>
      <div class="note memory"><p><strong>Whose key?</strong> To keep it secret, use the <em>recipient’s</em> public key. To prove it is you, use <em>your</em> private key. To check a signature, use the <em>sender’s</em> public key.</p></div>`,
      exam: "Which key is used for which operation, PFS, and which hashes are acceptable." },
    { id: "pki", title: "Cryptography III: PKI, key management and attacks",
      body: `<p>A <strong>public key infrastructure</strong> binds public keys to identities using <strong>X.509 certificates</strong> signed by a <strong>certificate authority (CA)</strong>. A <strong>registration authority (RA)</strong> verifies identity for the CA. Trust flows from an offline root CA through intermediate CAs. Revocation is published through <strong>CRLs</strong> or checked live with <strong>OCSP</strong> (OCSP stapling lets the server send a fresh response). Certificate pinning and Certificate Transparency logs reduce mis-issuance risk.</p>
      <h3>Key management lifecycle</h3>
      <p>Generation → distribution → storage → use → rotation → backup/escrow → revocation → destruction. Use split knowledge and dual control for master keys. Store keys in HSMs or cloud KMS, separate from the data they protect. Shorter cryptoperiods limit damage from a compromised key.</p>
      <h3>Cryptanalytic attacks</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Attack</th><th>Idea</th></tr></thead><tbody>
      <tr><td>Brute force</td><td>Try every key; defeated by key length</td></tr>
      <tr><td>Ciphertext-only / known-plaintext / chosen-plaintext / chosen-ciphertext</td><td>Ranked by how much the attacker has</td></tr>
      <tr><td>Frequency analysis</td><td>Breaks simple substitution ciphers</td></tr>
      <tr><td>Birthday</td><td>Finds hash collisions in about 2<sup>n/2</sup> tries</td></tr>
      <tr><td>Meet-in-the-middle</td><td>Why 2DES adds little over DES</td></tr>
      <tr><td>Side-channel</td><td>Timing, power, EM, acoustic leakage</td></tr>
      <tr><td>Replay</td><td>Resend captured messages; defeated by nonces and timestamps</td></tr>
      <tr><td>Pass-the-hash, Kerberos attacks</td><td>Abuse stolen credentials material (see D5)</td></tr>
      <tr><td>Fault injection, implementation attacks</td><td>Exploit the code, not the maths</td></tr>
      </tbody></table></div>
      <div class="note latest"><p><strong>Post-quantum cryptography.</strong> In August 2024 NIST published the first PQC standards: <strong>FIPS 203 ML-KEM</strong> (key encapsulation, from Kyber), <strong>FIPS 204 ML-DSA</strong> (signatures, from Dilithium) and <strong>FIPS 205 SLH-DSA</strong> (hash-based signatures, from SPHINCS+). HQC was selected in 2025 as a backup KEM. The risk today is “harvest now, decrypt later”, so the right answer is usually crypto-agility and an inventory of where public-key crypto is used.</p></div>`,
      exam: "CRL versus OCSP, roles of CA and RA, naming an attack, and the PQC migration logic." },
    { id: "physical", title: "Site and facility security",
      body: `<p>Physical security starts with site selection (natural hazards, crime, access to emergency services) and design. <strong>CPTED</strong> (crime prevention through environmental design) uses natural surveillance, natural access control and territorial reinforcement. Layer the controls from perimeter to rack: fencing and lighting, guards and dogs, mantraps (access control vestibules), badge readers and biometrics, locked cages, then cabinet locks.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Fence height</th><th>Effect</th></tr></thead><tbody>
      <tr><td>3–4 ft (≈1 m)</td><td>Deters casual trespassers</td></tr>
      <tr><td>6–7 ft (≈2 m)</td><td>Too hard to climb easily</td></tr>
      <tr><td>8 ft (≈2.4 m) + barbed wire</td><td>Deters determined intruders</td></tr>
      </tbody></table></div>
      <h3>Environment and power</h3>
      <p>Keep data centres at about 18–27 °C and 40–60% relative humidity: too dry builds static, too wet corrodes. Power problems: <em>fault</em> (momentary loss), <em>blackout</em> (prolonged loss), <em>sag</em> (momentary low voltage), <em>brownout</em> (prolonged low), <em>spike</em> (momentary high), <em>surge</em> (prolonged high). UPS covers short gaps; generators cover long ones.</p>
      <h3>Fire</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Class (US)</th><th>Fuel</th><th>Suppressant</th></tr></thead><tbody>
      <tr><td>A</td><td>Ordinary combustibles</td><td>Water, foam</td></tr>
      <tr><td>B</td><td>Flammable liquids</td><td>CO₂, foam, dry chemical</td></tr>
      <tr><td>C</td><td>Electrical</td><td>CO₂, clean agents (no water)</td></tr>
      <tr><td>D</td><td>Combustible metals</td><td>Dry powder</td></tr>
      <tr><td>K</td><td>Cooking oils</td><td>Wet chemical</td></tr>
      </tbody></table></div>
      <p>Sprinklers: <strong>wet pipe</strong> (water always in pipes, fastest, risk of leaks), <strong>dry pipe</strong> (air until triggered; for cold areas), <strong>deluge</strong> (all heads open; for high hazard), <strong>pre-action</strong> (dry pipe that needs two triggers: best for data centres). Gas systems such as FM-200, Inergen and Novec 1230 replace Halon, which was banned for ozone damage. CO₂ is dangerous to people in occupied spaces.</p>`,
      exam: "Sprinkler choice, fire class, power terms, and CPTED principles." }
  ],
  questions: [
    { q: "A system lets a user with Secret clearance write a report into a Top Secret folder but prevents that user from reading Top Secret documents. Which model does this follow?",
      options: ["Biba", "Bell–LaPadula", "Clark–Wilson", "Brewer–Nash"],
      answer: 1,
      why: "No read up and no write down is Bell–LaPadula. Writing up is allowed because it cannot leak secrets to a lower level." },
    { q: "Alice wants to send Bob a message that only Bob can read and that proves it came from Alice. Which keys are used?",
      options: ["Encrypt with Bob’s public key; sign with Alice’s private key", "Encrypt with Alice’s public key; sign with Bob’s private key", "Encrypt with Bob’s private key; sign with Alice’s public key", "Encrypt and sign with a shared symmetric key"],
      answer: 0,
      why: "Confidentiality uses the recipient’s public key. Proof of origin uses the sender’s private key. A shared symmetric key cannot provide non-repudiation." },
    { q: "Which fire suppression system is MOST appropriate for a data centre that must use water?",
      options: ["Wet pipe", "Deluge", "Pre-action", "Dry pipe"],
      answer: 2,
      why: "Pre-action needs two events before water reaches the heads, reducing accidental discharge over equipment." },
    { q: "An organisation is worried that encrypted traffic captured today could be decrypted by a future quantum computer. What is the BEST first step?",
      options: ["Double all AES key lengths immediately", "Inventory where public-key cryptography is used and plan migration to NIST post-quantum algorithms", "Stop using encryption for long-term data", "Replace TLS with IPsec"],
      answer: 1,
      why: "The threat is to public-key algorithms (Shor’s). Crypto-agility starts with an inventory and a migration plan to ML-KEM and ML-DSA. AES-256 is already considered quantum-resistant." }
  ]
});

window.DOMAINS.push({
  id: "d4", n: 4, weight: 13, priority: "weak",
  title: "Communication and Network Security",
  short: "Network Security",
  sybex: "Ch 11 Secure Network Architecture & Components · Ch 12 Secure Communications & Network Attacks",
  lede: "Packets, layers and the paths between them. Learn the stack well enough to draw it from memory, and every network question becomes a question of where a control sits.",
  intro: "Networking is where many managers feel least at home, so this chapter goes deeper than the rest. The goal is not to become a network engineer. It is to know the layers, the protocols that live at each one, the devices that act on them, and the attacks that abuse them, well enough to place any control at the right layer and to reject options that sit at the wrong one.",
  memorise: [
    "OSI top down: Application, Presentation, Session, Transport, Network, Data Link, Physical. (“All People Seem To Need Data Processing”)",
    "PDUs: data (L5–7), segment/datagram (L4), packet (L3), frame (L2), bits (L1).",
    "TCP is connection-oriented (SYN, SYN-ACK, ACK); UDP is connectionless and faster.",
    "IPsec: AH gives integrity and authentication only; ESP adds confidentiality. Transport mode protects payload; tunnel mode protects the whole packet.",
    "Firewall generations: packet filter (L3) → stateful (L4) → application proxy (L7) → NGFW. A WAF protects web apps at L7.",
    "WPA3 uses SAE instead of a pre-shared-key handshake. EAP-TLS (certificates on both sides) is the strongest EAP method.",
    "Ports: 22 SSH, 23 Telnet, 25 SMTP, 53 DNS, 80/443 HTTP(S), 88 Kerberos, 389/636 LDAP(S), 445 SMB, 3389 RDP.",
    "SPF says who may send, DKIM signs the message, DMARC sets policy and reporting.",
    "SDN separates the control plane from the data plane."
  ],
  sections: [
    { id: "osi", title: "The OSI and TCP/IP models",
      body: `<p><strong>OSI</strong> stands for <strong>Open Systems Interconnection</strong>, a reference model published by the International Organization for Standardization (ISO) in 1984. <strong>TCP/IP</strong> stands for <strong>Transmission Control Protocol / Internet Protocol</strong>, the protocol suite the internet actually runs on. One is a map; the other is the territory.</p>
      <p>The <strong>OSI model</strong> is a teaching tool with seven layers. Each layer serves the one above and uses the one below. When data goes down the stack it is <em>encapsulated</em>: each layer wraps it with its own header.</p>
      <div class="anim" data-anim="osi"></div>
      <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Layer</th><th>PDU</th><th>Protocols / examples</th><th>Devices</th></tr></thead><tbody>
      <tr><td>7</td><td>Application</td><td>Data</td><td>HTTP, DNS, SMTP, SNMP, LDAP, SSH</td><td>WAF, proxy, L7 firewall</td></tr>
      <tr><td>6</td><td>Presentation</td><td>Data</td><td>Encoding, compression, encryption formats (ASCII, JPEG, TLS is often placed here)</td><td>—</td></tr>
      <tr><td>5</td><td>Session</td><td>Data</td><td>NetBIOS, RPC, session setup and teardown</td><td>Circuit-level gateway</td></tr>
      <tr><td>4</td><td>Transport</td><td>Segment / datagram</td><td>TCP, UDP, (TLS runs over TCP)</td><td>Stateful firewall</td></tr>
      <tr><td>3</td><td>Network</td><td>Packet</td><td>IPv4, IPv6, ICMP, IPsec, routing protocols (OSPF, BGP)</td><td>Router, packet filter</td></tr>
      <tr><td>2</td><td>Data link</td><td>Frame</td><td>Ethernet, 802.11, ARP, PPP, VLAN tagging (802.1Q), MAC addresses</td><td>Switch, bridge, WAP</td></tr>
      <tr><td>1</td><td>Physical</td><td>Bits</td><td>Cables, radio, voltages, connectors</td><td>Hub, repeater</td></tr>
      </tbody></table></div>
      <p>The <strong>TCP/IP model</strong> (also called the Internet model or DoD model) has four layers: Application (OSI 5–7), Transport (4), Internet (3), and Link / Network Access (1–2).</p>
      <div class="note memory"><p>Top down: <strong>All People Seem To Need Data Processing</strong>. Bottom up: <strong>Please Do Not Throw Sausage Pizza Away</strong>. Draw the table above on a blank sheet every few days until it is automatic.</p></div>
      <div class="note exam"><p>ARP sits at layer 2 (it maps IP to MAC). ICMP sits at layer 3. A switch with routing ability is a layer 3 switch. If the question mentions MAC addresses, think layer 2; IP addresses, layer 3; ports, layer 4.</p></div>`,
      exam: "Placing protocols, devices and attacks at the right layer." },
    { id: "tcpip", title: "IP addresses, classes, TCP, UDP and ports",
      body: `<h3>IPv4 addresses and classes</h3>
      <p><strong>IPv4</strong> addresses are 32 bits, written as four decimal numbers from 0 to 255 (for example <code>192.168.1.10</code>). Each address has a <strong>network</strong> part and a <strong>host</strong> part; the subnet mask says where one ends and the other begins.</p>
      <p>The original internet split addresses into <strong>classes</strong> by their first number. In 1993 <strong>CIDR</strong> (Classless Inter-Domain Routing) replaced fixed classes with prefixes such as <code>/24</code>, so networks can be any size. You still need the classes: the exam and everyday conversation use them, and the private ranges follow them.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Class</th><th>First octet</th><th>Default mask</th><th>Private range</th><th>Used for</th></tr></thead><tbody>
      <tr><td>A</td><td>1–126</td><td>255.0.0.0 (/8)</td><td>10.0.0.0 – 10.255.255.255</td><td>Very large networks: about 16.7 million hosts each</td></tr>
      <tr><td>B</td><td>128–191</td><td>255.255.0.0 (/16)</td><td>172.16.0.0 – 172.31.255.255</td><td>Medium networks: about 65,000 hosts each</td></tr>
      <tr><td>C</td><td>192–223</td><td>255.255.255.0 (/24)</td><td>192.168.0.0 – 192.168.255.255</td><td>Small networks: 254 hosts each</td></tr>
      <tr><td>D</td><td>224–239</td><td>—</td><td>—</td><td>Multicast (one sender, many receivers: video streams, routing protocols)</td></tr>
      <tr><td>E</td><td>240–255</td><td>—</td><td>—</td><td>Reserved / experimental</td></tr>
      </tbody></table></div>
      <p>Special addresses to recognise:</p>
      <ul>
        <li><strong>127.0.0.0/8</strong>: loopback. <code>127.0.0.1</code> is “this computer”, which is why 127 is missing from class A.</li>
        <li><strong>169.254.0.0/16</strong>: APIPA / link-local. A host gives itself one of these when it can’t reach a DHCP server, a useful troubleshooting clue.</li>
        <li><strong>0.0.0.0</strong>: “any” or “unknown” address; <strong>255.255.255.255</strong>: broadcast to the local network.</li>
        <li><strong>Private ranges</strong> (RFC 1918, the three in the table) are not routed on the internet; they reach it through <strong>NAT</strong>, which also hides internal addressing.</li>
      </ul>
      <div class="note memory"><p>First octet: <strong>A</strong> starts with 1–126, <strong>B</strong> 128–191, <strong>C</strong> 192–223. Private: <strong>10</strong>, <strong>172.16–31</strong>, <strong>192.168</strong>. Think “ten, sixteen-to-thirty-one, one-nine-two”.</p></div>
      <h3>IPv6</h3>
      <p><strong>IPv6</strong> uses 128-bit addresses written as eight groups of hexadecimal, for example <code>2001:db8:0:0:0:0:0:1</code>, shortened to <code>2001:db8::1</code> (a run of zero groups becomes <code>::</code>, once per address). There are no classes; everything is prefix-based. It removes broadcast in favour of multicast, replaces ARP with the Neighbor Discovery Protocol, and lets hosts configure their own addresses (SLAAC). IPsec support was part of its design.</p>
      <div class="tbl-wrap"><table><thead><tr><th>IPv6 prefix</th><th>Type</th><th>IPv4 equivalent</th></tr></thead><tbody>
      <tr><td>::1</td><td>Loopback</td><td>127.0.0.1</td></tr>
      <tr><td>fe80::/10</td><td>Link-local (same segment only)</td><td>169.254.x.x</td></tr>
      <tr><td>fc00::/7</td><td>Unique local (private)</td><td>10.x / 172.16–31.x / 192.168.x</td></tr>
      <tr><td>2000::/3</td><td>Global unicast (public internet)</td><td>Public addresses</td></tr>
      <tr><td>ff00::/8</td><td>Multicast</td><td>Class D</td></tr>
      </tbody></table></div>
      <p>Many networks run <strong>dual stack</strong> (IPv4 and IPv6 together). Security tools and firewall rules must cover both, or IPv6 becomes an unmonitored side door. Tunnelling techniques that carry IPv6 inside IPv4 (6to4, Teredo) can also bypass controls.</p>
      <div class="note exam"><p>Expect to recognise a class or private range from an address, spot loopback and APIPA, and know that NAT conserves addresses and hides internal hosts. Deep subnetting arithmetic is rarely tested.</p></div>
      <h3>TCP and UDP</h3>
      <p><strong>TCP</strong> is connection-oriented and reliable: the three-way handshake (SYN, SYN-ACK, ACK), sequence numbers, acknowledgements and retransmission. <strong>UDP</strong> is connectionless, with no handshake or guarantee, used where speed matters (DNS queries, VoIP, streaming, QUIC).</p>
      <div class="anim" data-anim="handshake"></div>
      <h3>Ports that matter</h3>
      <p>A port number tells the receiving computer which service should get the traffic. Ports 0–1023 are “well-known” ports for standard services. Know these and their secure replacements:</p>
      <div class="tbl-wrap"><table class="ports"><thead><tr><th>Port</th><th>Service</th><th>What it does</th><th>Secure alternative</th></tr></thead><tbody>
      <tr><td>20/21</td><td>FTP</td><td>File Transfer Protocol: moves files between computers. Port 21 carries commands, port 20 the data. Usernames, passwords and files travel in cleartext.</td><td>SFTP (22) or FTPS (990)</td></tr>
      <tr><td>22</td><td>SSH / SFTP / SCP</td><td>Secure Shell: encrypted remote command line for administering servers; SFTP and SCP copy files over the same encrypted channel.</td><td>— (already secure)</td></tr>
      <tr><td>23</td><td>Telnet</td><td>Old remote command line. Everything, including passwords, is sent in cleartext and can be sniffed.</td><td>SSH</td></tr>
      <tr><td>25</td><td>SMTP</td><td>Simple Mail Transfer Protocol: servers relay email to each other. Unencrypted by default and abused for spam and spoofing.</td><td>STARTTLS; port 587 with authentication for users sending mail</td></tr>
      <tr><td>53</td><td>DNS</td><td>Domain Name System: turns names like example.com into IP addresses. UDP for normal lookups, TCP for zone transfers and large replies. Target of poisoning and tunnelling.</td><td>DNSSEC (integrity); DNS over HTTPS / TLS (privacy); restrict zone transfers</td></tr>
      <tr><td>80 / 443</td><td>HTTP / HTTPS</td><td>The web. HTTP (80) is cleartext; HTTPS (443) is HTTP inside TLS, encrypting and authenticating the session.</td><td>Use 443 only; redirect 80 and enable HSTS</td></tr>
      <tr><td>88</td><td>Kerberos</td><td>Ticket-based single sign-on, the default in Active Directory domains.</td><td>— (protect the KDC; keep clocks in sync)</td></tr>
      <tr><td>110 / 143</td><td>POP3 / IMAP</td><td>Mail clients fetching email. POP3 downloads and usually deletes from the server; IMAP keeps mail synchronised on the server. Both cleartext.</td><td>POP3S 995 / IMAPS 993</td></tr>
      <tr><td>123</td><td>NTP</td><td>Network Time Protocol: keeps clocks in sync. Accurate time matters for logs, forensics and Kerberos. Can be abused for amplification attacks.</td><td>NTS (Network Time Security); internal trusted time sources</td></tr>
      <tr><td>161 / 162</td><td>SNMP</td><td>Simple Network Management Protocol: monitors and configures network devices (161 queries, 162 traps/alerts). v1/v2c use cleartext “community strings” as passwords.</td><td>SNMPv3 (authentication and encryption)</td></tr>
      <tr><td>389</td><td>LDAP</td><td>Lightweight Directory Access Protocol: queries directories such as Active Directory for users and groups. Cleartext binds expose credentials.</td><td>LDAPS 636, or LDAP with StartTLS</td></tr>
      <tr><td>445</td><td>SMB</td><td>Server Message Block: Windows file and printer sharing. Exploited by WannaCry and many worms.</td><td>SMB 3 with encryption and signing; never expose to the internet</td></tr>
      <tr><td>514</td><td>Syslog</td><td>Sends log messages from devices to a central log server (UDP, unauthenticated, cleartext).</td><td>Syslog over TLS (6514)</td></tr>
      <tr><td>1812 / 1813</td><td>RADIUS</td><td>Remote Authentication Dial-In User Service: central authentication (1812) and accounting (1813) for VPN, Wi-Fi and network devices. Only the password is encrypted.</td><td>RADIUS over TLS (RadSec); TACACS+ (TCP 49) for device admin</td></tr>
      <tr><td>3389</td><td>RDP</td><td>Remote Desktop Protocol: full graphical remote control of Windows machines. A favourite ransomware entry point when exposed.</td><td>Only behind a VPN or remote-desktop gateway, with MFA and lockout</td></tr>
      </tbody></table></div>`,
      exam: "Matching a service to its port and secure replacement; TCP versus UDP behaviour." },
    { id: "secure-protocols", title: "Secure channels: TLS, IPsec, VPN and email",
      body: `<p><strong>TLS</strong> secures a session using a handshake that authenticates the server (and optionally the client) with certificates, agrees keys, then encrypts with a symmetric cipher. <strong>TLS 1.3</strong> removed weak ciphers and RSA key transport, makes forward secrecy mandatory and shortens the handshake. SSL and TLS 1.0/1.1 are deprecated.</p>
      <h3>IPsec</h3>
      <ul>
        <li><strong>AH</strong> (Authentication Header): integrity and origin authentication, no encryption. Breaks with NAT.</li>
        <li><strong>ESP</strong> (Encapsulating Security Payload): confidentiality plus integrity.</li>
        <li><strong>Transport mode</strong>: protects the payload; host to host.</li>
        <li><strong>Tunnel mode</strong>: wraps the whole original packet; gateway to gateway (site-to-site VPN).</li>
        <li><strong>IKE</strong> negotiates <strong>security associations (SAs)</strong>, which are one-way, so two are needed per conversation.</li>
      </ul>
      <h3>VPN and remote access</h3>
      <p>Site-to-site VPNs connect networks; remote-access VPNs connect users. <strong>Split tunnelling</strong> sends only corporate traffic through the VPN; it improves performance but lets an infected home network sit next to your tunnel. Full tunnelling is safer. <strong>ZTNA</strong> is replacing broad VPN access with per-application access decided by identity and device posture. Legacy tunnelling protocols: PPTP (broken), L2TP (no encryption alone; paired with IPsec).</p>
      <h3>Email security</h3>
      <p><strong>S/MIME</strong> (certificates) and <strong>PGP</strong> (web of trust) give end-to-end confidentiality and signatures. For domain spoofing: <strong>SPF</strong> lists the servers allowed to send for a domain, <strong>DKIM</strong> signs messages with the domain’s key, and <strong>DMARC</strong> tells receivers what to do when SPF or DKIM fail and sends reports back.</p>`,
      exam: "AH versus ESP, transport versus tunnel, and which email control does what." },
    { id: "devices", title: "Network components and segmentation",
      body: `<h3>Firewalls</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Layer</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Static packet filter</td><td>3</td><td>Rules on IP, port, protocol; fast; no context</td></tr>
      <tr><td>Stateful inspection</td><td>3–4</td><td>Tracks connection state; return traffic allowed automatically</td></tr>
      <tr><td>Circuit-level gateway</td><td>5</td><td>Validates sessions (SOCKS) without inspecting content</td></tr>
      <tr><td>Application proxy</td><td>7</td><td>Breaks the connection and inspects content; slowest, most secure</td></tr>
      <tr><td>NGFW</td><td>3–7</td><td>Stateful + application awareness + IPS + identity + TLS inspection</td></tr>
      <tr><td>WAF</td><td>7</td><td>Protects web apps from injection, XSS and similar</td></tr>
      </tbody></table></div>
      <p>Architectures: a <strong>screened subnet</strong> (DMZ) between two firewalls holds public-facing servers; a <strong>bastion host</strong> is hardened because it is exposed. Firewalls should default-deny, with an explicit deny-all at the end of the rule set.</p>
      <h3>Detection and access</h3>
      <p><strong>IDS</strong> detects and alerts (passive, out of band); <strong>IPS</strong> sits in line and blocks. Both may be signature-based (known attacks, few false positives) or anomaly/behaviour-based (unknown attacks, more false positives). <strong>NAC</strong> checks device identity and posture (802.1X) before granting network access, and can quarantine non-compliant devices.</p>
      <h3>Segmentation</h3>
      <p><strong>VLANs</strong> separate broadcast domains at layer 2; traffic between them needs a router or layer 3 switch where you can apply ACLs. <strong>Micro-segmentation</strong> applies policy per workload, often in software, limiting east-west movement. <strong>SDN</strong> separates the <em>control plane</em> (decisions, in a central controller) from the <em>data plane</em> (forwarding), making network policy programmable. <strong>VXLAN</strong> extends layer 2 segments over layer 3 for large data centres. <strong>SD-WAN</strong> manages WAN links centrally.</p>
      <p>Other terms: <em>CDN</em> (content delivery network, absorbs DDoS), <em>proxy</em> and <em>reverse proxy</em>, <em>load balancer</em>, <em>jump box</em> for admin access, <em>air gap</em>.</p>`,
      exam: "Picking the firewall type or device for a requirement; IDS versus IPS; why segmentation." },
    { id: "wireless", title: "Wireless, cellular and converged networks",
      body: `<h3>Wi-Fi security</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Standard</th><th>Encryption</th><th>Status</th></tr></thead><tbody>
      <tr><td>WEP</td><td>RC4 with 24-bit IV</td><td>Broken</td></tr>
      <tr><td>WPA</td><td>TKIP (RC4)</td><td>Deprecated</td></tr>
      <tr><td>WPA2</td><td>CCMP (AES)</td><td>Acceptable; PSK vulnerable to offline guessing; KRACK attack</td></tr>
      <tr><td>WPA3</td><td>AES-GCMP; SAE replaces PSK handshake</td><td>Current; forward secrecy; Enterprise 192-bit mode</td></tr>
      </tbody></table></div>
      <p><strong>Personal</strong> mode uses a shared passphrase. <strong>Enterprise</strong> mode uses 802.1X with a RADIUS server, so each user authenticates individually. 802.1X roles: <em>supplicant</em> (client), <em>authenticator</em> (access point or switch), <em>authentication server</em> (RADIUS).</p>
      <p>EAP methods: <strong>EAP-TLS</strong> (certificates on client and server; strongest), <strong>PEAP</strong> and <strong>EAP-TTLS</strong> (server certificate creates a tunnel, then password inside), LEAP and EAP-MD5 (weak).</p>
      <p>Wireless attacks: rogue access points, evil twins, deauthentication, war driving, jamming. Bluetooth: bluejacking (unsolicited messages), bluesnarfing (data theft), bluebugging (control). Other technologies: Zigbee (IoT mesh), NFC and RFID (short range), Li-Fi (light), satellite, and <strong>5G</strong>, which brings network slicing, stronger subscriber identity protection (SUCI) and a larger edge attack surface.</p>
      <h3>Converged protocols</h3>
      <p>Converged protocols run special-purpose traffic over standard IP networks: <strong>iSCSI</strong> (storage over IP), <strong>FCoE</strong> (Fibre Channel over Ethernet), <strong>VoIP</strong> (SIP signalling and RTP media; protect with SRTP and separate voice VLANs), and <strong>MPLS</strong> (label switching for WAN performance).</p>`,
      exam: "WPA2 versus WPA3, Personal versus Enterprise, which EAP is strongest." },
    { id: "attacks", title: "Network attacks and their countermeasures",
      body: `<div class="tbl-wrap"><table><thead><tr><th>Attack</th><th>How it works</th><th>Countermeasure</th></tr></thead><tbody>
      <tr><td>SYN flood</td><td>Half-open connections exhaust the server</td><td>SYN cookies, rate limiting, DDoS scrubbing</td></tr>
      <tr><td>Smurf / Fraggle</td><td>Spoofed ICMP/UDP broadcasts amplify traffic to a victim</td><td>Disable directed broadcasts</td></tr>
      <tr><td>DNS / NTP / memcached amplification</td><td>Small spoofed request, huge reply to victim</td><td>Ingress filtering (BCP 38), close open resolvers</td></tr>
      <tr><td>ARP poisoning</td><td>Fake ARP replies redirect LAN traffic (on-path)</td><td>Dynamic ARP inspection, static ARP for key hosts</td></tr>
      <tr><td>DNS cache poisoning</td><td>False records inserted into a resolver</td><td>DNSSEC, randomised source ports</td></tr>
      <tr><td>VLAN hopping</td><td>Switch spoofing or double tagging crosses VLANs</td><td>Disable auto-trunking (DTP), unused native VLAN</td></tr>
      <tr><td>MAC flooding</td><td>Fills the switch CAM table so it acts like a hub</td><td>Port security</td></tr>
      <tr><td>On-path (MITM)</td><td>Attacker relays and alters traffic</td><td>Mutual authentication, TLS, certificate validation</td></tr>
      <tr><td>Session hijacking</td><td>Steals a session token</td><td>Encryption, token rotation, short sessions</td></tr>
      <tr><td>Teardrop / ping of death</td><td>Malformed fragments crash old stacks</td><td>Patching</td></tr>
      </tbody></table></div>
      <p><strong>DNSSEC</strong> signs DNS records so resolvers can verify them. It provides integrity and origin authentication, <em>not</em> confidentiality. <strong>DNS over HTTPS / TLS</strong> provides confidentiality between client and resolver.</p>
      <div class="note manager"><p>For any “best protection” network question, prefer the answer that fixes the root cause at the right layer (DNSSEC for poisoning, 802.1X for rogue devices) over one that only detects it later.</p></div>`,
      exam: "Recognising an attack from its description and choosing the matching control." },
    { id: "transmission", title: "Cabling, topologies and transmission",
      body: `<p><strong>Coaxial</strong> cable resists interference but is legacy. <strong>Twisted pair</strong> (UTP and STP) is the common LAN cable; Cat 5e/6 supports gigabit, Cat 6a/7 10 gigabit; maximum run about 100 m. <strong>Fibre</strong> is immune to EMI, hard to tap, and runs long distances (single-mode for long, multimode for short).</p>
      <p>Problems: <em>attenuation</em> (signal weakens with distance), <em>crosstalk</em> (signals bleed between wires), <em>EMI/RFI</em>. Plenum-rated cable is needed in air-handling spaces because it gives off fewer toxic fumes when burning.</p>
      <p>Topologies: bus (single point of failure), star (common; hub/switch is the failure point), ring, mesh (most resilient, most expensive). Media access: CSMA/CD (Ethernet, collision detection, legacy), CSMA/CA (Wi-Fi, collision avoidance), token passing.</p>`,
      exam: "Choosing media for distance and interference; topology resilience." }
  ],
  questions: [
    { q: "An analyst sees a large number of TCP connection requests to a web server that never complete the handshake. Which attack is MOST likely?",
      options: ["Smurf attack", "SYN flood", "ARP poisoning", "Teardrop"],
      answer: 1,
      why: "Incomplete three-way handshakes that exhaust server resources describe a SYN flood. Smurf uses ICMP broadcasts; ARP poisoning is layer 2; teardrop uses malformed fragments." },
    { q: "A company needs a site-to-site VPN that encrypts the entire original IP packet, including headers. Which IPsec configuration fits?",
      options: ["AH in transport mode", "ESP in transport mode", "AH in tunnel mode", "ESP in tunnel mode"],
      answer: 3,
      why: "ESP provides confidentiality, and tunnel mode encapsulates the whole original packet. AH never encrypts." },
    { q: "Which wireless authentication method provides the STRONGEST security for an enterprise network?",
      options: ["WPA2-Personal with a long passphrase", "PEAP with MSCHAPv2", "EAP-TLS", "WPA with TKIP"],
      answer: 2,
      why: "EAP-TLS uses certificates on both client and server, giving mutual authentication without passwords." },
    { q: "A company is receiving phishing emails that appear to come from its own domain. Which control BEST lets receiving servers reject such spoofed mail?",
      options: ["S/MIME", "DMARC with a reject policy, backed by SPF and DKIM", "TLS on the mail server", "DNSSEC"],
      answer: 1,
      why: "SPF and DKIM let receivers validate the sender; DMARC tells them to reject failures. S/MIME and TLS protect content and transport, not domain spoofing." }
  ]
});

import React, { useState, useMemo, useEffect } from "react";

/* =====================================================================
   Manager - GRC @ GRAMAX Cybertech : Zero-to-Ready Field Guide v3
   For a selected joiner with no prior GRC / cyber background.
   NOTE: all sample data is ILLUSTRATIVE, modelled on a typical airport /
   critical-infrastructure managed-security context. Replace with real
   data after joining. Nothing here is actual GRAMAX or client data.
   ===================================================================== */

const TABS = [
  ["overview", "Overview"], ["day", "Day in Life"], ["meetings", "Meetings"],
  ["tools", "Tools"], ["ladder", "Skill Ladder"], ["glossary", "Glossary"],
  ["unknowns", "Unknowns"], ["playbook", "Daily Playbook"], ["mindset", "Mindset"],
  ["plan", "20-Day Plan"], ["first90", "First 90 Days"], ["resources", "Resources"],
  ["templates", "Templates"],
];

const SNAPSHOT = [
  ["Employer", "GRAMAX Cybertech, GMR Group's cybersecurity arm (managed security, Integrated Cyber Defence Center)"],
  ["Role", "Manager - GRC, Cyber Security department, Gurugram / Delhi, on-site, full-time"],
  ["Clients", "Airports (Delhi, Hyderabad), power, utilities, urban infrastructure, maritime, fintech; UK and Singapore"],
  ["Scope", "Cyber risk, governance, SOC 1/2 and ISO 27001 audits, privacy, third-party risk, Board reporting, mentoring"],
  ["Context", "Converged IT, OT and IoT environments; SIEM-based managed detection (Securonix partnership)"],
];

const BODY_MAP = [
  ["Risk assessment", "Diagnosis: what could go wrong, how likely, how badly"],
  ["Controls (policies, access rules, backups)", "The exercise, sleep and hygiene routine that keeps the body resilient"],
  ["Audit", "Independent medical examination: does the routine exist and really work?"],
  ["KRIs / dashboards", "Vitals: heart rate, blood pressure, trend over time"],
  ["Incident", "Injury or sudden illness: respond, treat, learn"],
  ["Business continuity / DR", "Rehabilitation plan: back to full function"],
  ["Board report", "The doctor's summary for the family: what matters, what to decide"],
];

const OWN_NOT = [
  ["You own", [
    "The cyber risk framework and the risk register",
    "Governance: policies, standards, exceptions",
    "Audit and certification readiness (SOC 2, ISO 27001, client audits)",
    "Third-party (vendor) risk programme",
    "Privacy and regulatory compliance tracking",
    "Executive dashboards and Board / CXO risk reporting",
    "Mentoring junior analysts",
  ]],
  ["You do not do", [
    "Configure firewalls, servers or SIEM rules",
    "Write code or detection queries",
    "Run penetration tests or malware analysis",
    "Fix vulnerabilities yourself (you track and challenge)",
  ]],
];

const SUCCESS = [
  ["Month 1", "You understand the landscape: risks, audits, tools, people. You can explain current posture in 5 minutes."],
  ["Month 2", "You run the weekly rhythm, close aged findings, and speak the vocabulary in every meeting."],
  ["Month 3", "You present a Board-ready risk view and a 12-month GRC roadmap with owners and dates."],
];

const DAY_BLOCKS = [
  ["09:30", "Posture scan", "Skim overnight SOC highlights, critical vulnerabilities, CERT-In and vendor advisories. Ask: does anything change a risk rating? Takes 15-20 minutes."],
  ["10:00", "GRC stand-up (15 min)", "Open audit actions, risk treatments due, policy reviews, vendor onboarding queue. You unblock; the team executes."],
  ["10:30", "Control-owner follow-ups", "Chase evidence and remediation from IT, infra, HR and procurement. Escalate when dates slip twice."],
  ["12:00", "Audit and certification work", "Prepare SOC 2 / ISO surveillance: evidence samples, walkthroughs, exception drafts, auditor queries."],
  ["14:00", "Risk workshop", "Sit with an application or project owner, assess risk, agree treatment and residual risk."],
  ["15:30", "Vendor or client questionnaire", "Review a vendor's answers or reply to a client's questionnaire about an asset."],
  ["16:30", "Reporting and dashboards", "Update KRIs, control health, audit ageing, heatmap. Turn numbers into a 'so what'."],
  ["17:30", "Mentoring and next-day prep", "Review junior work, read pre-reads, send the day's recap emails."],
];

const SAMPLE_WEEK = [
  ["Mon", "Plan the week; GRC stand-up; review risk register movements; 1:1s with direct reports"],
  ["Tue", "Vendor reviews and client questionnaires; procurement / legal sync on contract clauses"],
  ["Wed", "Audit prep and evidence chasing; sample testing; draft exceptions"],
  ["Thu", "Stakeholder meetings (SOC, IT owners); policy reviews; risk workshops"],
  ["Fri", "Update dashboard and KRIs; weekly status email; learning hour; plan next week"],
];

const SPECIAL_DAYS = [
  ["Audit fieldwork day", "Morning: confirm sample requests received. Midday: walkthrough with auditors and control owners. Afternoon: log queries, chase missing evidence, draft management responses. Evening: daily recap to CISO with open items."],
  ["Incident day", "You are not the technical responder. You track the timeline, severity, notification clocks (CERT-In 6 hours, client SLAs, DPDP), evidence preservation, and ensure the post-incident review is scheduled."],
  ["Board-prep day", "Collect numbers by noon, draft one page by 3 PM, rehearse a 3-minute update, pre-brief the CISO, finalise by evening. Decision requests go first."],
];

const CADENCE = [
  ["Daily", "Posture scan, evidence chasing, escalations", "Team, control owners"],
  ["Weekly", "GRC stand-up, vendor review, open-findings tracker", "GRC team, IT leads"],
  ["Monthly", "Risk and KRI review, policy exceptions, training statistics", "CISO / Head of Cyber"],
  ["Quarterly", "CXO / Board risk report, management review inputs", "CXO, Board committee"],
  ["Annual", "SOC 2 Type II window, ISO surveillance audit, policy refresh, continuity tests", "Auditors, clients, regulators"],
];

const FEELS = [
  ["Influence without authority", "Control owners do not report to you. You win through clarity, dates and escalation paths."],
  ["Peaks and valleys", "Audit windows and client questionnaires compress the calendar. Plan buffers."],
  ["Translator work", "Technical detail comes in; a business decision goes out."],
  ["Evidence discipline", "If it is not documented, it did not happen."],
];

const MEETINGS = [
  { who: "CISO / Head of Cyber", topics: "Top risks, audit readiness, budget, priorities", youDo: "Bring a decision, not a status", hear: ["residual risk", "risk appetite", "treatment plan"], say: "Three risks moved this month. One needs a funding decision by Friday." },
  { who: "SOC / Security Operations lead", topics: "What is monitored, alert volumes, incident metrics, log sources", youDo: "Turn operations data into control evidence", hear: ["SIEM", "use case", "MTTD / MTTR", "false positive"], say: "Which log sources feed this control, and can the evidence be pulled monthly?" },
  { who: "IT / Infrastructure / Application owners", topics: "Patching, access reviews, change records, exceptions", youDo: "Agree dates without acting as police", hear: ["CMDB", "change window", "compensating control", "EOL"], say: "What blocks closure, and what date can you commit to? I will log a risk acceptance if it slips." },
  { who: "Legal, HR, Procurement", topics: "DPDP duties, contract clauses, joiner / leaver steps, awareness training", youDo: "Build security terms into contracts and onboarding", hear: ["data fiduciary", "processor", "DPA", "right to audit"], say: "Please add breach-notification timelines and audit rights to this vendor contract." },
  { who: "External auditors", topics: "Scope, samples, evidence, exceptions, management responses", youDo: "No surprises, clean evidence trail", hear: ["population", "sample", "walkthrough", "design vs operating effectiveness"], say: "Here is the control, owner, population and evidence for your sample." },
  { who: "Clients (airports, utilities, maritime)", topics: "Security questionnaires, SLAs, incident communication, attestations", youDo: "Protect trust and revenue", hear: ["SLA", "attestation", "sub-processor", "right to audit"], say: "Our current attestations are X and Y. The gap on Z has a dated plan." },
  { who: "CXO / Board", topics: "Risk appetite, residual risk, regulatory exposure, investment", youDo: "Short, visual, decision-ready", hear: ["risk appetite", "materiality", "tolerance"], say: "Top risk is X. Impact range is Y. Recommended action is Z. Decision needed by date." },
];

const AGENDAS = [
  ["Weekly GRC stand-up (15 min)", "0-3 Wins and blockers · 3-8 Open audit actions and due dates · 8-11 Vendor and policy queue · 11-14 Risks moved this week · 14-15 Decisions and owners"],
  ["Monthly risk committee (60 min)", "0-5 Minutes and actions · 5-20 Top 5 risks and trend · 20-30 KRIs red / amber · 30-40 Audit and findings ageing · 40-50 Vendor and privacy updates · 50-60 Decisions requested"],
  ["Audit kick-off (45 min)", "Scope and period · Control list and owners · Evidence process and portal · Sampling approach · Calendar and escalation contacts · Questions"],
];

const NEW_JOINER_Q = [
  "Can you explain this with a simple example? I am new to this area.",
  "Which document should I read to understand this control?",
  "Who is the owner, and what evidence do we normally keep?",
  "What does 'good' look like for this metric?",
  "I will confirm and revert by end of day.",
];

const TOOL_GROUPS = [
  { group: "GRC platforms", depth: "Operate / Own", what: "Software holding the risk register, control library, audit tasks, policies and dashboards in one place.", items: "ServiceNow IRM, RSA Archer, MetricStream, OneTrust, Vanta, Drata" },
  { group: "SIEM / SOC", depth: "Read", what: "A SIEM collects logs from many systems, spots suspicious patterns and raises alerts that analysts triage. GRC uses its numbers as evidence and KRIs.", items: "Securonix (GRAMAX partner), Splunk, Microsoft Sentinel, QRadar" },
  { group: "Vulnerability and exposure", depth: "Read", what: "Scanners find known weaknesses and score them (CVSS). You track how fast they are fixed against SLA.", items: "Tenable / Nessus, Qualys, Rapid7, penetration-test reports" },
  { group: "Endpoint, network, identity", depth: "Concept", what: "Protective layers: EDR on devices, firewalls, who can log in (IAM), privileged access (PAM), multi-factor login.", items: "EDR / XDR, firewalls, PAM, IAM, MFA, email security" },
  { group: "Third-party risk (TPRM)", depth: "Operate", what: "Tools and questionnaires that score vendors and monitor them after onboarding.", items: "OneTrust Vendorpedia, SecurityScorecard, BitSight, SIG / CAIQ" },
  { group: "Reporting and collaboration", depth: "Own", what: "How you communicate: dashboards, decks, evidence repository, task tracking.", items: "Excel, Power BI, PowerPoint, SharePoint / Confluence, Jira / ServiceNow" },
  { group: "OT / ICS awareness", depth: "Concept", what: "Operational technology runs physical systems (baggage, power, building controls) and follows safety-first rules unlike office IT. Airport and utility clients rely on it.", items: "IEC 62443, Purdue model, passive OT monitoring" },
];

const VULN_COLS = ["Finding", "Asset", "Severity", "Exposure", "Age (d)", "SLA (d)", "Status", "What you ask"];
const VULN_ROWS = [
  ["Log4j remote code execution (CVE-2021-44228)", "Analytics server", "Critical", "Internal", "22", "15", "Breached", "Is it reachable? Any compensating control? New date?"],
  ["Missing OS security patches", "Operational DB replica", "High", "Internal", "31", "30", "Breached", "Why missed the patch window? Is it in the change calendar?"],
  ["Default credentials on network camera", "CCTV network", "High", "Segmented", "9", "30", "Within SLA", "Is the VLAN isolated? Who owns the device?"],
  ["TLS 1.0 still enabled", "Client portal", "Medium", "Internet", "40", "60", "Within SLA", "Which clients still need it? Contract impact?"],
  ["Weak SSH ciphers", "Jump host", "Low", "Internal", "15", "90", "Within SLA", "Batch with next maintenance window."],
];

const SIEM_SAMPLE = [
  ["Alert", "Multiple failed logins then success from a new country"],
  ["Source", "VPN logs · account vendor-svc-07"],
  ["Severity / time", "High · 02:14 IST"],
  ["Triage", "L1 flagged → L2 confirmed true positive in 11 minutes"],
  ["Action", "Account disabled, password reset, session logs preserved"],
  ["GRC takeaway", "Check MFA enforcement for vendor accounts; update risk R-002; keep ticket as evidence for incident-monitoring controls"],
];

const SIX_Q = [
  "What exactly is the issue, and on which asset?",
  "How bad can it get (impact) and how easily (exploitability)?",
  "Is it exposed to the internet or only inside?",
  "What compensating controls exist today?",
  "Who owns the fix, and by what date?",
  "How will we prove it is fixed (evidence)?",
];

const LADDER = [
  { lvl: 1, name: "Foundations", target: "Explain in plain words", rows: [
    ["IT basics: network, server, cloud, endpoint, database", "Draw a simple company IT map", "D2"],
    ["Security basics: CIA triad; threat, vulnerability, risk", "Explain with one example each", "D3"],
    ["Security operations: logs, SIEM, SOC, incident", "Trace an alert from log to incident", "D4"],
  ]},
  { lvl: 2, name: "Frameworks and audits", target: "Know structure and purpose", rows: [
    ["Controls and frameworks", "Give 5 control examples with owners", "D5"],
    ["ISO 27001:2022 (clauses 4-10, 93 Annex A controls, 4 themes)", "Describe the management-system cycle", "D6"],
    ["NIST CSF 2.0 (Govern, Identify, Protect, Detect, Respond, Recover)", "Map to ISO themes", "D7"],
    ["SOC 1 / SOC 2 / SSAE 18 / ISAE 3402; Type I vs II", "Explain differences in a table", "D8"],
    ["Audit lifecycle: scope, test, evidence, exception, report", "Walk one control end to end", "D9-10"],
  ]},
  { lvl: 3, name: "Risk, vendors, privacy", target: "Run process with guidance", rows: [
    ["Risk management: ISO 31000 / 27005 / NIST 800-30", "Create 5 risks in a register", "D12"],
    ["Threat modelling (STRIDE), MITRE ATT&CK, FAIR", "Estimate one risk as a rupee range", "D13"],
    ["Third-party risk: tiering, due diligence, contracts", "Tier 10 sample vendors", "D14"],
    ["DPDP Act and Rules, GDPR basics, CERT-In 6-hour reporting", "One-page obligations matrix", "D15"],
  ]},
  { lvl: 4, name: "Practice and leadership", target: "Operate and lead", rows: [
    ["GRC platform and continuous control monitoring", "Design 10 automated control checks", "D16"],
    ["Reading scan, pen-test and SIEM outputs", "Annotate a sample report", "D17"],
    ["KRIs, heatmaps, executive dashboard", "Build a one-page dashboard", "D18"],
    ["Stakeholder communication, policy architecture, roadmap", "Board brief and 12-month roadmap", "D19-20"],
  ]},
];

const GLOSSARY = [
  ["CIA triad", "Confidentiality, Integrity, Availability: the three goals of security."],
  ["Asset", "Anything of value: data, systems, people, premises."],
  ["Threat", "Something that could cause harm, e.g. a ransomware group or insider."],
  ["Vulnerability", "A weakness a threat can use, e.g. an unpatched server."],
  ["Risk", "Likelihood of a threat using a vulnerability × the impact."],
  ["Inherent risk", "Risk before any controls."],
  ["Residual risk", "Risk remaining after controls."],
  ["Risk appetite", "How much risk leadership is willing to accept."],
  ["Risk treatment", "Mitigate, transfer, accept or avoid."],
  ["Risk register", "Master list of risks with scores, owners and actions."],
  ["KRI", "Key Risk Indicator: a metric signalling rising risk."],
  ["KPI", "Key Performance Indicator: how well a process performs."],
  ["Control", "A safeguard: policy, technical setting or process."],
  ["Preventive / detective / corrective", "Stops it / spots it / fixes it."],
  ["Compensating control", "Alternative control when the standard one is not possible."],
  ["Design effectiveness", "Is the control built properly on paper?"],
  ["Operating effectiveness", "Did it actually work over the period?"],
  ["Framework", "Structured set of practices, e.g. NIST CSF, ISO 27001."],
  ["ISMS", "Information Security Management System (ISO 27001)."],
  ["Statement of Applicability", "ISO 27001 list of chosen controls and why."],
  ["SOC 1", "Report on controls relevant to a client's financial reporting."],
  ["SOC 2", "Report on security-related controls using Trust Services Criteria."],
  ["Type I / Type II", "Design at a date / operation over a period."],
  ["Trust Services Criteria", "Security, Availability, Processing Integrity, Confidentiality, Privacy."],
  ["Evidence", "Proof a control operated: tickets, logs, screenshots, sign-offs."],
  ["PBC list", "Prepared By Client: evidence list auditors request."],
  ["Population / sample", "All instances of a control / the subset auditors test."],
  ["Exception / finding", "A test failure or gap noted by an auditor."],
  ["Management response", "Owner's reply with committed fix date."],
  ["SIEM", "Tool that collects and correlates logs to raise alerts."],
  ["SOC", "Security Operations Centre: team watching and responding to threats."],
  ["Incident", "A security event that harms or threatens harm."],
  ["MTTD / MTTR", "Mean time to detect / respond or recover."],
  ["CVE / CVSS", "Public ID of a vulnerability / its 0-10 severity score."],
  ["Patch management", "Applying vendor fixes on a schedule."],
  ["IAM / PAM", "Identity and access management / privileged access management."],
  ["MFA", "Multi-factor authentication."],
  ["EDR / XDR", "Endpoint (and cross-layer) detection and response."],
  ["Zero trust", "Never trust by default; verify every access."],
  ["Phishing / ransomware", "Deceptive messages / malware that locks data for payment."],
  ["Penetration test", "Authorised simulated attack to find weaknesses."],
  ["TPRM", "Third-party risk management."],
  ["Data fiduciary / processor", "DPDP terms: decides purpose and means / processes on behalf."],
  ["DPDP Act", "India's Digital Personal Data Protection Act, 2023."],
  ["CERT-In", "India's national cyber agency; incidents reportable within 6 hours."],
  ["BCP / DR", "Business continuity plan / disaster recovery."],
  ["RTO / RPO", "Time to restore / data loss tolerated."],
  ["OT / ICS", "Operational technology / industrial control systems."],
  ["ERM", "Enterprise risk management: all risk types rolled up."],
  ["RACI", "Responsible, Accountable, Consulted, Informed."],
  ["BLUF", "Bottom line up front: lead with the conclusion."],
  ["ICDC", "GRAMAX's Integrated Cyber Defence Center service."],
];

const PHASES = [
  { name: "Phase 1 · Foundations", days: "Days 1-4", color: "bg-sky-600" },
  { name: "Phase 2 · Frameworks and audits", days: "Days 5-11", color: "bg-emerald-600" },
  { name: "Phase 3 · Risk, vendors, privacy", days: "Days 12-15", color: "bg-amber-600" },
  { name: "Phase 4 · Tools, reporting, leadership", days: "Days 16-20", color: "bg-rose-600" },
];

const PLAN = [
  { d: 1, p: 0, t: "See the whole picture", src: "gramax.ai (ICDC page); this guide's Overview, Day in Life, Meetings", tasks: ["Read the GRAMAX site: ICDC, IT / OT / IoT, sectors served", "Read this guide's first three tabs end to end", "Write 5 lines: what a GRC Manager does, for whom, and why it matters"], out: "5-line role statement in your own words", check: ["Who are GRAMAX's clients and what do they expect from GRC?", "What is the difference between doing security and governing it?"] },
  { d: 2, p: 0, t: "IT basics", src: "ISC2 CC course (free), network and cloud modules", tasks: ["Learn network, firewall, server, cloud (IaaS / PaaS / SaaS), endpoint, database, identity", "Understand shared responsibility in cloud", "Draw a simple company IT map and mark where data lives"], out: "One-page IT map", check: ["Who secures what in IaaS vs SaaS?", "Where would client log data live in a managed-security service?"] },
  { d: 3, p: 0, t: "Security basics", src: "ISC2 CC security principles; MITRE ATT&CK overview", tasks: ["CIA triad; threat, vulnerability, risk, control", "Common attacks: phishing, ransomware, insider, supply chain, DDoS", "Skim ATT&CK tactic names only"], out: "20 glossary terms in your own words", check: ["Give one example each of threat, vulnerability and risk.", "Which CIA goal does ransomware hit most directly?"] },
  { d: 4, p: 0, t: "How security operations works", src: "Any one SIEM vendor overview page (Securonix, Splunk or Sentinel)", tasks: ["Log → normalise → correlate → alert → triage → incident → closure", "Learn SOC tiers (L1, L2, L3) and what MTTD / MTTR measure", "Note where GRC takes evidence from the SOC"], out: "Flow diagram with GRC touchpoints", check: ["What is a false positive and why does it matter for KRIs?", "Which SOC metrics belong in a monthly report?"] },
  { d: 5, p: 1, t: "Controls and frameworks", src: "NIST CSF 2.0 introduction pages", tasks: ["What a control is; preventive, detective, corrective", "Why frameworks exist; ISO 27001, NIST CSF, SOC 2, COBIT at one-paragraph level", "List 10 everyday controls (access review, backup test...)"], out: "Controls list with owner and evidence", check: ["Name one preventive, one detective, one corrective control.", "Why do organisations use more than one framework?"] },
  { d: 6, p: 1, t: "ISO 27001:2022", src: "ISO 27001:2022 overview; your own Annex A theme notes", tasks: ["Clauses 4-10 (context, leadership, planning, support, operation, evaluation, improvement)", "Annex A: 93 controls in four themes (Organizational, People, Physical, Technological)", "ISMS cycle: Plan, Do, Check, Act"], out: "One-page ISMS cycle sketch", check: ["Name the four Annex A themes.", "What does the Statement of Applicability record?"] },
  { d: 7, p: 1, t: "NIST CSF 2.0", src: "NIST CSF 2.0 core document", tasks: ["Six functions: Govern, Identify, Protect, Detect, Respond, Recover", "Understand Tiers and Profiles", "Map functions to ISO themes"], out: "CSF ↔ ISO mapping table", check: ["What does the Govern function cover?", "Which function does log monitoring belong to?"] },
  { d: 8, p: 1, t: "SOC 1, SOC 2, SSAE 18", src: "AICPA SOC 2 overview page", tasks: ["Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy", "Type I vs Type II; SOC 1 vs SOC 2; ISAE 3402", "Who reads these reports and why clients demand them"], out: "Comparison table: SOC 1 / SOC 2 / ISO 27001", check: ["When would a client ask for SOC 1 instead of SOC 2?", "Why is Type II more valuable than Type I?"] },
  { d: 9, p: 1, t: "Audit lifecycle", src: "Any SOC 2 audit-process explainer (Vanta / Drata blogs)", tasks: ["Scoping, risk-based planning, walkthroughs, sampling, testing", "Findings, management response, remediation tracking", "Sketch a 12-month audit calendar (Templates tab)"], out: "Audit lifecycle diagram", check: ["Walkthrough vs test of operating effectiveness: what differs?", "What does a good management response contain?"] },
  { d: 10, p: 1, t: "Evidence and control testing", src: "Templates tab: control matrix, PBC list", tasks: ["Study the sample 12-control matrix and the PBC list", "Build your own 15-control matrix (access, change, backup, vulnerability, incident, onboarding, logging)", "For each: owner, frequency, evidence, test steps"], out: "15-control matrix + PBC list", check: ["For 'quarterly access review', what is population and sample?", "What evidence would convince an auditor?"] },
  { d: 11, p: 1, t: "Checkpoint and consolidation", src: "Your own notes; Glossary quiz mode", tasks: ["Explain Days 1-10 aloud in 10 minutes without notes", "List what is unclear and pick one source to fix each", "Run Glossary quiz mode twice"], out: "Gap list with fixes", check: ["Which two topics feel weakest?", "Can you explain SOC 2 to a non-technical colleague in 90 seconds?"] },
  { d: 12, p: 2, t: "Risk management fundamentals", src: "NIST SP 800-30 r1 (executive summary and Chapter 2)", tasks: ["ISO 31000 process; ISO 27005 and NIST 800-30 for information risk", "Likelihood × impact scales; inherent vs residual", "Treatments and risk-acceptance sign-off; study the sample register"], out: "5 risks in the register template", check: ["Inherent vs residual risk?", "When is risk acceptance appropriate and who signs?"] },
  { d: 13, p: 2, t: "Threat modelling and quantification", src: "MITRE ATT&CK; FAIR Institute introduction", tasks: ["STRIDE: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege", "FAIR idea: frequency × magnitude as ranges", "Scenario: ransomware on an airport operations database, with a rupee range"], out: "One quantified scenario", check: ["Why use ranges rather than single numbers?", "Recite the six STRIDE letters."] },
  { d: 14, p: 2, t: "Third-party risk", src: "NIST SP 800-161 r1 summary; sample vendor table", tasks: ["Tiering by data sensitivity, criticality, connectivity", "Due diligence, SIG / CAIQ, contract clauses, continuous monitoring", "Tier the 8 sample vendors yourself, then compare"], out: "Tiering model + 25-question questionnaire", check: ["How do you decide a vendor is Tier 1?", "Name three clauses to add to a vendor contract."] },
  { d: 15, p: 2, t: "Privacy and regulation", src: "MeitY DPDP pages; CERT-In directions", tasks: ["DPDP Act and Rules: data fiduciary vs processor, breach duties", "CERT-In 6-hour reporting; GDPR contrasts", "Ask your manager for the exact aviation / critical-infrastructure requirements"], out: "One-page obligations matrix", check: ["Fiduciary vs processor: who is GRAMAX for a client?", "What is the CERT-In reporting window?"] },
  { d: 16, p: 3, t: "GRC platforms and automation", src: "CISO Assistant or Eramba documentation", tasks: ["Try CISO Assistant or Eramba, or watch vendor demos if setup is heavy", "Load ISO 27001, create a risk assessment, link controls", "Concept of continuous control monitoring (automatic evidence pulls)"], out: "Screenshots + 10-control automation sketch", check: ["Which evidence can be collected automatically?", "What is the danger of automating a weak control?"] },
  { d: 17, p: 3, t: "Reading technical outputs", src: "Sample vulnerability and SIEM tables in the Tools tab", tasks: ["Annotate the sample vulnerability table: severity, exposure, age, SLA", "Read a public sample pen-test report: finding, impact, remediation", "Memorise the six questions to ask about any technical report"], out: "Annotated sample + question list", check: ["Why is CVSS alone not enough to prioritise?", "What do you ask when a critical issue is 'accepted'?"] },
  { d: 18, p: 3, t: "Dashboards and KRIs", src: "Power BI Desktop; sample KRI table in Templates", tasks: ["Choose 8 KRIs from the sample", "Build in Excel or Power BI: heatmap, top 5 risks, control health", "One page, one message per chart"], out: "One-page exec dashboard", check: ["Which KRIs warn early?", "What makes a dashboard decision-ready?"] },
  { d: 19, p: 3, t: "Communication and policy", src: "Templates: executive one-pager, policy skeleton, email pack", tasks: ["BLUF writing: one risk, one number, one ask", "Policy hierarchy: policy, standard, procedure, guideline; exception workflow", "Practise a 3-minute risk update aloud"], out: "1-page brief + recorded 3-minute update", check: ["State your top risk in one sentence with a number and an ask.", "Policy vs procedure: what differs?"] },
  { d: 20, p: 3, t: "Day-1 readiness kit", src: "First 90 Days tab", tasks: ["Write your 30-60-90 plan", "Prepare the document request list and people-to-meet list", "Pack glossary, templates, RAFT scripts, question list; rest"], out: "30-60-90 plan + Day-1 kit", check: ["What are your three questions for week 1?", "What will you deliver by day 30?"] },
];

const WEEK1 = [
  ["Day 1", "Meet manager and team. Get tool-access list and org chart. Ask for last audit reports and current risk register."],
  ["Day 2", "Read policy-library index and ISMS scope. Sit with the SOC lead for 1 hour."],
  ["Day 3", "Shadow an evidence collection or control-owner follow-up. Note recurring blockers."],
  ["Day 4", "Review open audit findings and ageing. Meet vendor-risk and procurement contacts."],
  ["Day 5", "Write a one-page 'what I learned' note; share 3 questions with your manager."],
];

const DOCS = [
  "Last SOC 2 / ISO 27001 reports and open findings",
  "Current risk register and risk methodology",
  "Policy and standards library with review dates",
  "Audit calendar for the next 12 months",
  "Vendor inventory and tiering",
  "Latest Board / CXO risk report",
  "GRC tool access and dashboards",
  "Incident log and last post-incident review",
  "Client contracts' security schedules (top 3 clients)",
];

const PEOPLE = [
  "CISO / Head of Cyber", "SOC lead", "IT infrastructure and application owners",
  "Legal / privacy counsel", "HR and Procurement contacts", "Internal audit / compliance counterpart",
  "Your direct reports (one-to-one each)", "Client-facing leads for airport and utility accounts",
];

const RESOURCES = [
  ["NIST Cybersecurity Framework 2.0", "Framework", "Free", "2 h", "https://www.nist.gov/cyberframework"],
  ["NIST SP 800-30 r1: Risk Assessments", "Standard", "Free", "2 h", "https://csrc.nist.gov/pubs/sp/800/30/r1/final"],
  ["NIST SP 800-161 r1: Supply Chain Risk", "Standard", "Free", "1.5 h skim", "https://csrc.nist.gov/pubs/sp/800/161/r1/final"],
  ["AICPA SOC 2 and Trust Services Criteria", "Standard", "Free overview", "2 h", "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"],
  ["MITRE ATT&CK", "Knowledge base", "Free", "1.5 h", "https://attack.mitre.org/"],
  ["FAIR Institute", "Quantification", "Free intro", "1.5 h", "https://www.fairinstitute.org/"],
  ["CISO Assistant (open-source GRC)", "Hands-on tool", "Free", "2 h", "https://github.com/intuitem/ciso-assistant-community"],
  ["Eramba Community GRC", "Hands-on tool", "Free", "2 h", "https://www.eramba.org/"],
  ["ServiceNow Developer Program", "Hands-on tool", "Free", "1-2 h", "https://developer.servicenow.com/"],
  ["ISA / IEC 62443 series overview", "OT standard", "Free overview", "1 h", "https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards"],
  ["CERT-In", "Regulator", "Free", "1 h", "https://www.cert-in.org.in/"],
  ["MeitY (DPDP Act and Rules)", "Regulator", "Free", "1.5 h", "https://www.meity.gov.in/"],
  ["ISC2 Certified in Cybersecurity (CC)", "Course", "Free", "6-8 h selected", "https://www.isc2.org/certifications/cc"],
  ["GRAMAX", "Company", "Free", "1 h", "https://gramax.ai/"],
  ["Microsoft Power BI Desktop", "Dashboards", "Free", "2 h", "https://powerbi.microsoft.com/"],
  ["Vanta / Drata SOC 2 explainers", "Blog", "Free", "1 h", "https://www.vanta.com/"],
];

/* ===================== TEMPLATE DATA: TABLES ===================== */

const band = (s) => (s >= 15 ? "Critical" : s >= 10 ? "High" : s >= 5 ? "Medium" : "Low");
// id, title, asset, threat, L, I, controls, resL, resI, treatment, owner, due, status, KRI
const RISKS = [
  ["R-001", "Ransomware halts operational database", "Airport operational DB / FIDS", "Ransomware group", 4, 5, "EDR; daily offline backup; segmentation", 2, 5, "Mitigate", "Head - Infrastructure", "31-Jan-27", "In progress", "Backup restore success %"],
  ["R-002", "Compromise of vendor remote access", "Vendor VPN / jump hosts", "Stolen credentials", 4, 4, "MFA; time-bound access; session recording", 2, 4, "Mitigate", "IAM Lead", "20-Dec-26", "In progress", "Vendor accounts without MFA"],
  ["R-003", "Unpatched internet-facing VPN gateway", "Edge VPN", "Exploit of known vulnerability", 3, 5, "Monthly patching; WAF; external scan", 2, 5, "Mitigate", "Network Lead", "15-Dec-26", "Open", "Critical vulns aged >15 days"],
  ["R-004", "SIEM blind spot: log source not onboarded", "Client log collectors", "Undetected intrusion", 3, 4, "Onboarding checklist; weekly coverage report", 2, 4, "Mitigate", "SOC Lead", "15-Jan-27", "Open", "Log-source coverage %"],
  ["R-005", "Phishing leads to credential theft", "Email and user accounts", "Phishing", 5, 3, "Email gateway; MFA; awareness training", 3, 3, "Mitigate", "CISO Office", "28-Feb-27", "In progress", "Phishing click rate"],
  ["R-006", "OT controller infected via maintenance laptop", "Baggage-system PLC network", "Malware on vendor device", 2, 5, "Zone segmentation; USB control; laptop scan", 2, 4, "Mitigate", "OT Security Lead", "31-Mar-27", "Open", "Unscanned vendor devices"],
  ["R-007", "Personal-data breach under DPDP", "Passenger / customer data", "Misconfiguration or insider", 3, 5, "Classification; DLP; encryption; breach playbook", 2, 4, "Mitigate", "Privacy Lead", "31-Jan-27", "In progress", "Open privacy incidents"],
  ["R-008", "SIEM disaster-recovery failover untested", "SIEM / ICDC", "Outage", 3, 4, "Backup architecture; annual DR plan", 2, 3, "Mitigate", "ICDC Head", "15-Feb-27", "Open", "DR tests done vs plan"],
  ["R-009", "Sub-processor outside contract", "Cloud analytics vendor", "Data exposure", 3, 3, "Contract clause; vendor tiering", 2, 3, "Mitigate", "Procurement + GRC", "10-Jan-27", "Open", "Vendors without assessment"],
  ["R-010", "Key-person dependency in SOC L3", "SOC team", "Attrition", 3, 3, "Cross-training; runbooks", 3, 2, "Accept (review quarterly)", "Head - SOC", "31-Mar-27", "Accepted", "Attrition rate"],
];
const RISK_COLS = ["Risk ID", "Risk", "Asset", "Threat", "L", "I", "Inherent", "Inh. band", "Existing controls", "Res L", "Res I", "Residual", "Res. band", "Treatment", "Owner", "Due", "Status", "KRI"];
const RISK_ROWS = RISKS.map((r) => [r[0], r[1], r[2], r[3], String(r[4]), String(r[5]), String(r[4] * r[5]), band(r[4] * r[5]), r[6], String(r[7]), String(r[8]), String(r[7] * r[8]), band(r[7] * r[8]), r[9], r[10], r[11], r[12], r[13]]);

const RCM_COLS = ["Control", "SOC 2", "ISO 27001:2022", "Description", "Type", "Frequency", "Owner", "Evidence", "Test", "Sample", "Result"];
const RCM_ROWS = [
  ["C-01", "CC6.1", "A.5.15", "Logical access to SOC / ICDC systems needs an approved request and role-based access", "Preventive", "Per request", "IAM Lead", "Approved access tickets", "Inspect tickets vs access granted", "25", "Effective"],
  ["C-02", "CC6.2", "A.5.18", "New-joiner access only after manager approval", "Preventive", "Per joiner", "HR + IAM", "Joiner ticket + approval", "Inspect", "25", "Effective"],
  ["C-03", "CC6.3", "A.5.18", "Leaver access removed within 24 hours", "Preventive", "Per leaver", "IAM Lead", "Leaver list vs disable date", "Reperform", "25", "Exception (2 late)"],
  ["C-04", "CC6.1", "A.8.2", "Privileged access reviewed quarterly", "Detective", "Quarterly", "Head - Infra", "Signed review sheets", "Inspect", "4 of 4", "Exception (1 missed)"],
  ["C-05", "CC6.1", "A.8.5", "MFA enforced for remote and privileged access", "Preventive", "Continuous", "IAM Lead", "IdP report; config screenshot", "Inspect configuration", "1", "Effective"],
  ["C-06", "CC7.1", "A.8.8", "Monthly vulnerability scans; critical fixes within SLA", "Detective", "Monthly", "Vuln Mgmt Lead", "Scan reports; closure tickets", "Inspect", "6 months", "Exception (SLA breaches)"],
  ["C-07", "CC7.2", "A.8.15 / A.8.16", "Security logs collected and monitored 24x7", "Detective", "Continuous", "SOC Lead", "SIEM coverage report", "Inspect", "12 sources", "Effective"],
  ["C-08", "CC7.4", "A.5.24-A.5.26", "Incidents classified, handled, reviewed per IR plan", "Corrective", "Per incident", "IR Lead", "Incident tickets; PIRs", "Inspect", "25", "Effective"],
  ["C-09", "CC8.1", "A.8.32", "Changes tested and approved before production", "Preventive", "Per change", "Change Manager", "CAB minutes; tickets", "Inspect", "25", "Effective"],
  ["C-10", "A1.2", "A.8.13", "Daily backups; restore tested quarterly", "Corrective", "Daily / quarterly", "Infra Lead", "Backup logs; restore reports", "Inspect", "4", "Effective"],
  ["C-11", "CC9.2", "A.5.19-A.5.22", "Tier-1 vendors assessed before onboarding and yearly", "Preventive", "Annual", "GRC Manager", "Assessments; contracts", "Inspect", "8", "Exception (2 overdue)"],
  ["C-12", "CC2.2", "A.6.3", "Security awareness training for all staff yearly", "Preventive", "Annual", "HR / Security", "Completion report", "Inspect", "All staff", "Effective"],
];

const PBC_COLS = ["Req #", "Control", "Evidence requested", "Period", "Owner", "Requested", "Due", "Received", "Status", "Remarks"];
const PBC_ROWS = [
  ["P-001", "C-01", "Population of access requests; auditor samples 25", "Jul-Dec 26", "IAM Lead", "05-Jan-27", "12-Jan-27", "11-Jan-27", "Received", "On time"],
  ["P-002", "C-03", "Leaver list with HR last day and disable date", "Jul-Dec 26", "IAM Lead", "05-Jan-27", "12-Jan-27", "14-Jan-27", "Late", "2 delays explained"],
  ["P-003", "C-04", "Signed privileged-access reviews Q3 and Q4", "Jul-Dec 26", "Head - Infra", "05-Jan-27", "12-Jan-27", "NA", "Pending", "Reminder sent 13-Jan; Q3 sheet missing"],
  ["P-004", "C-05", "MFA policy and IdP enforcement report", "As at 31-Dec-26", "IAM Lead", "05-Jan-27", "12-Jan-27", "10-Jan-27", "Received", "Screenshot dated"],
  ["P-005", "C-06", "Monthly scan reports + closure tickets for Criticals", "Jul-Dec 26", "Vuln Lead", "05-Jan-27", "15-Jan-27", "13-Jan-27", "Received", "Two SLA breaches flagged"],
  ["P-006", "C-07", "Monthly SIEM log-source coverage report", "Jul-Dec 26", "SOC Lead", "05-Jan-27", "15-Jan-27", "12-Jan-27", "Received", "Coverage 88%"],
  ["P-007", "C-08", "Incident population; 25 sampled tickets and PIRs", "Jul-Dec 26", "IR Lead", "05-Jan-27", "15-Jan-27", "14-Jan-27", "Partial", "9 PIRs outstanding"],
  ["P-008", "C-09", "Change tickets sample and CAB minutes", "Jul-Dec 26", "Change Mgr", "05-Jan-27", "15-Jan-27", "11-Jan-27", "Received", "None"],
  ["P-009", "C-10", "Backup job logs; Q3 and Q4 restore tests", "Jul-Dec 26", "Infra Lead", "05-Jan-27", "15-Jan-27", "12-Jan-27", "Received", "None"],
  ["P-010", "C-11", "Assessments for 8 Tier-1 vendors", "Jan-Dec 26", "GRC Manager", "05-Jan-27", "20-Jan-27", "NA", "In progress", "2 vendors overdue"],
  ["P-011", "C-12", "Training completion report", "Jan-Dec 26", "HR", "05-Jan-27", "15-Jan-27", "10-Jan-27", "Received", "96% completion"],
  ["P-012", "All", "Policy approvals with version history", "As at 31-Dec-26", "GRC Manager", "05-Jan-27", "15-Jan-27", "09-Jan-27", "Received", "Two reviews overdue"],
];

// vendor, service, data(1-5), criticality(1-5), connectivity(1-5), tier, last assessed, status, next action
const VENDORS = [
  ["V-01", "SIEM platform provider", "Core detection platform", 5, 5, 4, "Tier 1", "Mar-26", "Current", "Annual SOC 2 report review"],
  ["V-02", "Remote-support integrator", "OT vendor remote access", 4, 5, 5, "Tier 1", "Overdue", "Gap", "Reassess; enforce MFA and session recording"],
  ["V-03", "Managed firewall OEM support", "Firewall support", 4, 5, 4, "Tier 1", "Jun-26", "Current", "Track patch SLAs"],
  ["V-04", "Colocation / data-centre provider", "Hosting", 3, 5, 3, "Tier 1 (override)", "Apr-26", "Current", "Review DR evidence"],
  ["V-05", "Cloud analytics vendor", "Reporting analytics", 4, 3, 3, "Tier 2", "Never", "Gap", "Questionnaire; confirm sub-processors"],
  ["V-06", "Payroll SaaS", "HR data", 4, 2, 2, "Tier 2", "Aug-26", "Current", "Annual attestation"],
  ["V-07", "Threat-intelligence feed", "Indicator feed", 1, 3, 1, "Tier 3", "Jul-26", "Current", "Light questionnaire"],
  ["V-08", "Awareness-training platform", "Training content", 2, 2, 1, "Tier 3", "Jul-26", "Current", "Light questionnaire"],
];
const VENDOR_COLS = ["Vendor", "Name", "Service", "Data", "Critical", "Connect", "Score", "Tier", "Last assessed", "Status", "Next action"];
const VENDOR_ROWS = VENDORS.map((v) => [v[0], v[1], v[2], String(v[3]), String(v[4]), String(v[5]), String(v[3] + v[4] + v[5]), v[6], v[7], v[8], v[9]]);

const KRI_COLS = ["KRI", "Definition", "Target", "Current", "RAG", "Trend", "Owner"];
const KRI_ROWS = [
  ["Aged critical vulnerabilities", "Criticals open beyond 15 days", "0", "7", "Red", "▲ worse", "Vuln Mgmt Lead"],
  ["Privileged accounts without MFA", "Count of privileged accounts", "0", "3", "Amber", "▼ better", "IAM Lead"],
  ["Quarterly access review completion", "% reviews signed on time", "100%", "92%", "Amber", "► flat", "Head - Infra"],
  ["Backup restore success", "% test restores passed", ">=98%", "99%", "Green", "► flat", "Infra Lead"],
  ["Log-source coverage", "% planned sources feeding SIEM", ">=95%", "88%", "Red", "▲ worse", "SOC Lead"],
  ["Overdue audit findings", "Open past committed date", "<=2", "5", "Red", "▲ worse", "GRC Manager"],
  ["Phishing click rate", "% of simulated emails clicked", "<=5%", "8%", "Amber", "▼ better", "CISO Office"],
  ["Tier-1 vendors assessed (12 m)", "% with current assessment", "100%", "75%", "Amber", "► flat", "GRC Manager"],
  ["P1 incident response time", "Median minutes to contain", "<=60", "48", "Green", "▼ better", "IR Lead"],
  ["Policies overdue for review", "Count past review date", "0", "4", "Amber", "▲ worse", "GRC Manager"],
];

const RACI_COLS = ["Activity", "CISO", "GRC Mgr", "SOC Lead", "IT Owner", "Legal", "HR"];
const RACI_ROWS = [
  ["Maintain risk register", "A", "R", "C", "C", "I", "-"],
  ["Run risk assessments", "I", "A/R", "C", "R", "C", "-"],
  ["Evidence collection for audits", "I", "A", "R", "R", "-", "R"],
  ["Vulnerability remediation", "I", "C", "C", "A/R", "-", "-"],
  ["Incident response", "A", "I", "R", "R", "C", "I"],
  ["Regulatory notification (CERT-In, DPDP)", "A", "C", "R", "C", "R", "-"],
  ["Vendor onboarding assessment", "I", "A", "C", "C", "C", "-"],
  ["Policy approval", "A", "R", "C", "C", "C", "C"],
  ["Awareness training", "I", "C", "-", "-", "-", "A/R"],
];

const CAL_COLS = ["Month", "Activity", "Owner", "Output"];
const CAL_ROWS = [
  ["Jan", "SOC 2 Type II evidence collection", "GRC + owners", "PBC list closed"],
  ["Feb", "Draft findings and management responses", "GRC + owners", "Signed responses"],
  ["Mar", "SOC 2 report issued; ISO internal-audit planning", "GRC", "Report + audit plan"],
  ["Apr", "ISO 27001 internal audit", "Internal audit", "Audit report"],
  ["May", "Annual risk-assessment refresh", "GRC", "Updated register"],
  ["Jun", "BCP / DR test", "BCP Lead", "Test report"],
  ["Jul", "ISO 27001 surveillance audit", "Certification body", "Surveillance report"],
  ["Aug", "Vendor re-assessments", "GRC + Procurement", "Tier-1 reviews"],
  ["Sep", "Annual policy review", "Policy owners", "Updated policies"],
  ["Oct", "Ransomware tabletop exercise", "IR Lead + GRC", "Exercise report"],
  ["Nov", "Awareness campaign and phishing test", "CISO Office", "Completion stats"],
  ["Dec", "Management review; next-year audit plan", "CISO + GRC", "Approved plan"],
];

const POL_COLS = ["Policy", "Version", "Owner", "Approver", "Last review", "Next review", "Status"];
const POL_ROWS = [
  ["Information Security Policy", "3.2", "CISO", "CEO", "12-Mar-26", "12-Mar-27", "Current"],
  ["Access Control Policy", "2.1", "IAM Lead", "CISO", "01-Apr-26", "01-Apr-27", "Current"],
  ["Incident Response Policy", "2.4", "IR Lead", "CISO", "20-Jan-26", "20-Jan-27", "Due soon"],
  ["Vendor Risk Policy", "1.3", "GRC Manager", "CISO", "10-Oct-25", "10-Oct-26", "Overdue"],
  ["Data Classification and Handling", "1.8", "Privacy Lead", "CISO", "05-Jun-26", "05-Jun-27", "Current"],
  ["BCP / DR Policy", "2.0", "BCP Lead", "CEO", "15-Feb-26", "15-Feb-27", "Due soon"],
  ["Acceptable Use Policy", "4.0", "HR", "CISO", "01-Sep-26", "01-Sep-27", "Current"],
  ["Change Management Policy", "2.2", "Change Manager", "CISO", "18-Nov-25", "18-Nov-26", "Overdue"],
];

/* ===================== TEMPLATE DATA: TEXT ===================== */

const T_EXEC = `QUARTERLY CYBER RISK BRIEF - Q3 FY27 (ILLUSTRATIVE)
Prepared by: Manager - GRC   For: CEO, CISO, Audit Committee   Date: 25-Nov-2026

1. HEADLINE (one sentence)
Overall posture is stable, but two risks sit above appetite: edge-device patching and SIEM log coverage. Two decisions are needed by 15-Dec.

2. TOP 5 RISKS (residual score, trend, owner)
R-001 Ransomware on operational DB    10 High   ► flat    Head - Infra
R-002 Vendor remote-access compromise  8 Medium ▼ better  IAM Lead
R-003 Unpatched VPN gateway           10 High   ▲ worse   Network Lead
R-004 SIEM blind spots                 8 Medium ▲ worse   SOC Lead
R-007 DPDP personal-data breach        8 Medium ► flat    Privacy Lead

3. CONTROL HEALTH
10 of 12 key controls effective; 4 exceptions open (leaver removal, privileged review, vulnerability SLA, vendor reassessment).

4. AUDIT AND COMPLIANCE
SOC 2 Type II fieldwork starts 05-Jan. 5 findings overdue (target 2). ISO surveillance due Jul-27.

5. VENDOR RISK
6 of 8 Tier-1 / Tier-2 vendors currently assessed. Remote-support integrator and cloud analytics vendor have gaps.

6. DECISIONS REQUESTED
a) Approve emergency patch window for edge VPN by 15-Dec (owner: CTO).
b) Fund 2 additional log-source onboardings for the Q4 coverage target (owner: CISO).
c) Endorse risk acceptance R-010 (SOC key-person) for one more quarter.`;

const T_FINDING = `AUDIT FINDING AND MANAGEMENT RESPONSE (ILLUSTRATIVE)

Finding ID: F-2027-03        Control: C-04 Privileged access review
Condition (what we saw): The Q3 privileged-access review for jump hosts was not performed; Q1, Q2 and Q4 were signed on time.
Criteria (what should be): Policy requires quarterly review signed by the system owner within 15 days of quarter end.
Cause: Reviewer left in August; role not reassigned; calendar reminder lapsed.
Effect (risk): Stale privileged accounts could remain active unnoticed for up to six months.
Rating: Moderate

Recommendation: Assign a named backup reviewer; automate quarterly reminders; run catch-up review now.

MANAGEMENT RESPONSE
Agree. A catch-up review will be done by 31-Jan-27. A backup reviewer is assigned from 01-Feb-27. The GRC team will monitor sign-off through the monthly KRI.
Owner: Head - Infrastructure     Committed date: 31-Jan-27     Evidence on closure: Signed review sheet + reminder configuration screenshot`;

const T_PIR = `POST-INCIDENT REVIEW (ILLUSTRATIVE, NOT A REAL EVENT)
Incident: INC-2026-031   Severity: P2   Owner: IR Lead   Review date: 12-Dec-26

SUMMARY
A vendor service account was used to log in to the VPN from an unusual country at 02:14 IST. The SOC detected and disabled it within 11 minutes. No data access was confirmed.

TIMELINE
02:14 Alert fires (multiple failures then success, new country)
02:19 L2 analyst confirms true positive
02:25 Account disabled; sessions terminated
03:10 Client contact informed per SLA
Next day: Credentials reset, logs preserved, PIR scheduled

ROOT CAUSE
Shared service-account password leaked in an older vendor ticket; MFA not enforced for that account.

IMPACT
Systems: VPN only. Data: none confirmed. Cost: approx 6 staff-hours. Regulatory: assessed as not reportable; decision recorded.

WHAT WORKED: Detection rule, 11-minute response, clear client communication.
WHAT FAILED: No MFA on service accounts; password in a ticket.

ACTIONS
1. Enforce MFA or certificate auth for all vendor accounts - IAM Lead - 20-Dec-26
2. Scan ticketing system for stored secrets - SOC Lead - 31-Dec-26
3. Update risk R-002 and KRI 'Vendor accounts without MFA' - GRC Manager - 15-Dec-26`;

const T_ACCEPT = `RISK ACCEPTANCE FORM (ILLUSTRATIVE)
Risk ID: R-010   Title: Key-person dependency in SOC L3
Description: Two engineers hold most knowledge of correlation rules.
Residual rating: Low-Medium (3 x 2 = 6)
Why not treated now: Hiring is under way; cross-training takes 3 months.
Compensating measures: Runbooks updated; weekly knowledge-sharing; escalation to vendor support.
Acceptance period: 01-Jan-27 to 31-Mar-27 (then review)
Accepted by: Head - SOC (owner)   Approved by: CISO   Date: 20-Dec-26
Conditions: Re-evaluate immediately if either engineer resigns.
Rule: Acceptance beyond your authority goes to the next level. Never self-approve a risk you own.`;

const T_POLICY = `ACCESS CONTROL POLICY - SKELETON WITH SAMPLE WORDING (ILLUSTRATIVE)

1. Purpose: Ensure only authorised people access systems and data, with the minimum rights needed.
2. Scope: All employees, contractors, vendors and all systems in the ICDC and corporate environments.
3. Roles: CISO (owner), IAM Lead (implements), system owners (approve and review), HR (joiner / leaver triggers), GRC (monitors compliance).
4. Policy statements
   4.1 Access is granted only on an approved request from the line manager and system owner.
   4.2 Access follows role-based least privilege.
   4.3 MFA is mandatory for remote and privileged access.
   4.4 Leaver access is removed within 24 hours of the last working day.
   4.5 Privileged access is reviewed quarterly; user access is reviewed half-yearly.
   4.6 Shared accounts are prohibited unless approved with compensating controls.
5. Exceptions: Request via the exception form; max 90 days; CISO approval; logged in the exceptions register.
6. Compliance: Breaches may lead to disciplinary action and contract termination for vendors.
7. Related documents: Access Control Standard, Joiner-Mover-Leaver Procedure, Privileged Access Procedure.
8. Review: Annual, or after major change or incident.
Version table: v2.1 | 01-Apr-26 | Reviewed by GRC | Approved by CISO`;

const T_QUEST = `CLIENT SECURITY QUESTIONNAIRE - SAMPLE ANSWERS (ILLUSTRATIVE; use only approved, verified wording)

Q1 Do you hold an independent security certification?
A: [State certificate, scope, issuing body and validity date exactly as on the certificate.] Copy available under NDA.

Q2 How do you control access to client data?
A: Role-based, least-privilege access with MFA for remote and privileged users; quarterly privileged reviews; leaver removal within 24 hours.

Q3 Do you monitor security events 24x7?
A: Yes, through our security operations centre using a SIEM. Alerts are triaged by severity with defined response targets.

Q4 What is your incident notification commitment?
A: Per contract. Material incidents are notified within the agreed SLA; regulatory reporting follows applicable law (for example, CERT-In timelines).

Q5 Do you use sub-processors?
A: [List approved sub-processors or reference the contract annex.] Changes are notified per contract.

Q6 Have you had a data breach in the last 12 months?
A: Do NOT answer from memory. Route to CISO and Legal for an approved statement.

Q7 How is data encrypted?
A: [Confirm exact in-transit and at-rest standards with the Infrastructure team before answering.]

Q8 When did you last test business continuity?
A: [Insert date and scope from the latest test report.]

Rule: every answer needs an owner and a source document. If unsure, write 'To be confirmed by <owner> on <date>'.`;

const T_MEET = `MEETING NOTES AND ACTION LOG - SAMPLE (ILLUSTRATIVE)
Meeting: Weekly GRC stand-up   Date: 26-Nov-26   Attendees: GRC team, SOC lead
Terms I did not know: 'use case' (SIEM detection rule), 'CAB' (change advisory board)
Decisions: Prioritise log-source onboarding for client B; hold patch exception for 7 days.
Actions:
1. Send evidence request for Q4 access review - Analyst 1 - 28-Nov
2. Confirm SIEM coverage numbers - SOC Lead - 27-Nov
3. Draft vendor questionnaire for cloud analytics vendor - GRC Manager - 02-Dec
Follow-up questions: What counts as 'covered' for a log source?
Documents to request: SIEM coverage report; CAB minutes.
Recap email sent: 26-Nov, within 2 hours.`;

const T_JOURNAL = `DAILY LEARNING JOURNAL - SAMPLE (Day 8)
Today's topic: SOC 1 vs SOC 2
3 things learned: (1) SOC 2 uses five Trust Services Criteria. (2) Type II covers a period and is what clients prefer. (3) SOC 1 relates to financial-reporting controls.
1 thing unclear: How are the 'points of focus' used in testing?
Link to my role: Clients will ask for SOC 2 reports; I own readiness.
Output produced: Y (comparison table)
Tomorrow's first task: Draft the audit lifecycle diagram.
Self-check: Can I explain Type I vs II in 30 seconds? Y`;

const T_AGENDA = `MEETING AGENDAS (ILLUSTRATIVE)

WEEKLY GRC STAND-UP (15 min)
0-3 Wins and blockers | 3-8 Open audit actions and due dates | 8-11 Vendor and policy queue | 11-14 Risks moved this week | 14-15 Decisions and owners

MONTHLY RISK COMMITTEE (60 min)
0-5 Minutes and actions | 5-20 Top 5 risks and trend | 20-30 KRIs red / amber | 30-40 Audit findings ageing | 40-50 Vendor and privacy updates | 50-60 Decisions requested

AUDIT KICK-OFF (45 min)
Scope and period | Controls and owners | Evidence portal and process | Sampling approach | Calendar and escalation contacts | Questions`;

const T_EMAIL = `EMAIL PACK (ILLUSTRATIVE)

1. EVIDENCE CHASE (first reminder)
Subject: Evidence needed by 12-Jan: Q3 privileged access review (C-04)
Hi <Name>,
For the SOC 2 fieldwork we need the signed Q3 privileged-access review for jump hosts by 12-Jan. If a catch-up review is needed, I can set up a 20-minute session this week. Please confirm a date by tomorrow.
Thanks, <Your name>

2. ESCALATION (second miss, polite)
Subject: Support needed: overdue evidence C-04 (audit starts 15-Jan)
Hi <Manager>,
The Q3 privileged-access review is two weeks overdue. It blocks one audit sample. I have offered a working session twice. Could you help confirm an owner and date by Friday? Impact if missed: a likely audit exception.
Regards, <Your name>

3. WEEKLY STATUS (Friday)
Subject: GRC weekly status - week ending 27-Nov
Done: 6 evidence items collected; vendor questionnaire sent. Risks: SIEM coverage at 88% (target 95%). Next week: audit kick-off, policy review (2 overdue). Decisions needed: patch window approval by 15-Dec.

4. POST-MEETING RECAP (send within 2 hours)
Subject: Recap: risk committee 26-Nov
Decisions: (1) ... (2) ... Actions: <owner, date>. Please reply by EOD if anything is incorrect.`;

const T_3060 = `30-60-90 DAY PLAN (DETAILED, ILLUSTRATIVE)

DAYS 1-30: LISTEN AND MAP
- Meet 15 key people; record their top 3 concerns each.
- Read the last audit reports, risk register, policy index, tool list.
- Shadow SOC, vulnerability review, one control-owner follow-up.
- Deliver a one-page gap snapshot to the CISO by day 30.
Success measure: you can state the top 5 risks, open findings and audit calendar without notes.

DAYS 31-60: QUICK WINS
- Close or re-baseline all findings overdue more than 30 days.
- Refresh the top 10 risks with owners and dates.
- Formalise vendor tiering for all vendors; assess overdue Tier-1 vendors.
- Agree 8-10 KRIs and a monthly reporting slot.
Success measure: overdue findings reduced by half; KRI pack agreed.

DAYS 61-90: BUILD
- Launch the one-page executive dashboard.
- Automate evidence for 10 controls.
- Present the 12-month GRC roadmap and audit calendar for approval.
- Run one tabletop exercise.
Success measure: first Board / CXO risk brief delivered; roadmap approved.`;

const TEMPLATES = [
  { id: "risk", name: "Risk register", kind: "table", cols: RISK_COLS, rows: RISK_ROWS, pill: [7, 12, 16],
    purpose: "Master list of cyber risks with scores, controls, owners and dates.",
    when: "Create on Day 1 of any assessment; review monthly; present top 5 quarterly.",
    how: ["Inherent score = Likelihood (1-5) × Impact (1-5) before controls; residual after controls.", "Bands: 1-4 Low, 5-9 Medium, 10-14 High, 15-25 Critical.", "One owner per risk; due date on every treatment.", "Use NA for unknown text and 0 for unknown numbers so the sheet stays filterable."] },
  { id: "rcm", name: "Control matrix (RCM)", kind: "table", cols: RCM_COLS, rows: RCM_ROWS, pill: [10],
    purpose: "Maps each control to SOC 2 / ISO criteria, owners, evidence and test results.",
    when: "Before an audit; update after each test cycle.",
    how: ["Each control: one owner, one evidence source, one test.", "SOC 2 CC refs and ISO 27001:2022 Annex A refs are shown for illustration; confirm against the current criteria.", "Record results as Effective or Exception with a short reason."] },
  { id: "pbc", name: "Audit evidence request (PBC)", kind: "table", cols: PBC_COLS, rows: PBC_ROWS, pill: [8],
    purpose: "Tracks evidence the auditor requests, who owes it, and its status.",
    when: "Opened at audit kick-off; reviewed daily during fieldwork.",
    how: ["Give owners at least 5 working days.", "Send a recap of 'received / pending' every morning.", "Keep evidence in one repository with the request number as file name."] },
  { id: "vendor", name: "Vendor tiering and status", kind: "table", cols: VENDOR_COLS, rows: VENDOR_ROWS, pill: [9],
    purpose: "Scores vendors by data sensitivity, criticality and connectivity to set review depth.",
    when: "At onboarding and annually.",
    how: ["Score = Data + Criticality + Connectivity (each 1-5).", "Tier 1: 12 or more (or override for criticality); Tier 2: 8-11; Tier 3: 7 or less.", "Tier 1 gets full assessment and contract clauses; Tier 3 gets a light questionnaire."] },
  { id: "kri", name: "KRI dashboard data", kind: "table", cols: KRI_COLS, rows: KRI_ROWS, pill: [4],
    purpose: "Early-warning metrics for the monthly risk review and Board pack.",
    when: "Update monthly; chart the last 6 months.",
    how: ["Each KRI needs a definition, target, owner and data source.", "RAG: Green on target; Amber within 10-20% of target; Red beyond. Agree thresholds with the CISO.", "Show trend arrows; leaders read direction faster than numbers."] },
  { id: "raci", name: "RACI for GRC activities", kind: "table", cols: RACI_COLS, rows: RACI_ROWS, pill: [],
    purpose: "Clarifies who does, approves, advises and is informed.",
    when: "Agree in month 1; republish after reorganisations.",
    how: ["R = Responsible, A = Accountable (one per row), C = Consulted, I = Informed.", "Use it to resolve 'whose job is this?' arguments calmly."] },
  { id: "cal", name: "12-month audit and assurance calendar", kind: "table", cols: CAL_COLS, rows: CAL_ROWS, pill: [],
    purpose: "Year view of audits, tests and reviews so nothing collides.",
    when: "Approve in December for the next year.",
    how: ["Avoid placing two major audits in one month.", "Add 2 weeks of buffer before each external audit."] },
  { id: "policy", name: "Policy register", kind: "table", cols: POL_COLS, rows: POL_ROWS, pill: [6],
    purpose: "Tracks every policy's version, owner, approver and review dates.",
    when: "Review monthly; escalate anything overdue.",
    how: ["Overdue policies are common audit findings.", "Send owners a reminder 30 days before the review date."] },
  { id: "exec", name: "Executive risk one-pager", kind: "text", body: T_EXEC,
    purpose: "One page for the CXO / Board.", when: "Quarterly.",
    how: ["Headline first; decisions last but visible.", "One number and one arrow per risk.", "Never more than three asks."] },
  { id: "finding", name: "Audit finding and management response", kind: "text", body: T_FINDING,
    purpose: "Standard structure for gaps found in audits.", when: "On every exception.",
    how: ["Condition, Criteria, Cause, Effect, Recommendation.", "Management response must include owner, date and closure evidence."] },
  { id: "pir", name: "Post-incident review", kind: "text", body: T_PIR,
    purpose: "Learning loop after incidents.", when: "Within 5 working days of closure.",
    how: ["Blame-free language; focus on process.", "Every action has an owner and date and feeds the risk register."] },
  { id: "accept", name: "Risk acceptance form", kind: "text", body: T_ACCEPT,
    purpose: "Formal, time-boxed acceptance of residual risk.", when: "When treatment is not feasible now.",
    how: ["Always time-boxed; always signed above the risk owner.", "Review at expiry."] },
  { id: "policydoc", name: "Policy skeleton (Access Control)", kind: "text", body: T_POLICY,
    purpose: "Model structure for any policy.", when: "Creating or refreshing a policy.",
    how: ["Policy states what; standard states how much; procedure states how.", "Keep statements testable."] },
  { id: "quest", name: "Client questionnaire answers", kind: "text", body: T_QUEST,
    purpose: "Safe, sourced answers to client security questions.", when: "Whenever a client sends a questionnaire.",
    how: ["Every answer has an owner and source.", "Never improvise on breaches or certifications."] },
  { id: "emails", name: "Email pack", kind: "text", body: T_EMAIL,
    purpose: "Evidence chase, escalation, weekly status, recap.", when: "Daily communication.",
    how: ["Subject line carries the ask and date.", "Send recap emails within 2 hours of meetings."] },
  { id: "agenda", name: "Meeting agendas", kind: "text", body: T_AGENDA,
    purpose: "Time-boxed agendas for standard meetings.", when: "Circulate 24 hours ahead.",
    how: ["Put decisions on the agenda explicitly.", "End on time."] },
  { id: "notes", name: "Meeting notes and action log", kind: "text", body: T_MEET,
    purpose: "Capture decisions, actions and words you did not know.", when: "Every meeting.",
    how: ["Write unknown terms and add them to your glossary the same day."] },
  { id: "journal", name: "Daily learning journal", kind: "text", body: T_JOURNAL,
    purpose: "10-minute end-of-day learning record.", when: "Every day of the 20-day plan.",
    how: ["Be honest about what is unclear; that list drives tomorrow."] },
  { id: "plan", name: "30-60-90 day plan", kind: "text", body: T_3060,
    purpose: "Structured start with measurable outcomes.", when: "Day 20 of prep; share with your manager in week 1.",
    how: ["Adjust after your manager's feedback."] },
];

/* ===================== CALM TOOLKIT DATA ===================== */

const RAFT = [
  ["0 · Breathe", "One slow exhale (about 4 seconds out). Drop your shoulders. Slow your speech by a quarter. Silence for 2-3 seconds looks thoughtful, not weak."],
  ["R · Restate", "Repeat the question in your own words: 'So you are asking whether...'. It buys 5-10 seconds and confirms you are answering the right thing."],
  ["A · Anchor", "Start from what you do know: the principle, standard, process or the nearest item in the risk register."],
  ["F · Fence", "State the boundary honestly: 'The specific figure / configuration I will confirm.' Fence the unknown; do not guess inside it."],
  ["T · Take ownership", "Name the person, the time and the channel: 'I will confirm with the SOC lead and email you by 4 PM.' Then log it and deliver."],
];

const SCRIPTS = [
  ["Buying thinking time", [
    "Let me make sure I answer the right question: you are asking whether...",
    "Good question. Give me a moment to structure it.",
    "Let me think about that for a second.",
  ]],
  ["Anchoring on what you know", [
    "At a principle level, the standard expects X. How we implement it here, I will verify.",
    "From the framework perspective, this sits under...",
    "In the register, the closest item is R-00X; let me pull its current status.",
  ]],
  ["Fencing the unknown", [
    "I do not want to quote a number from memory. I will confirm from the source and send it by 4 PM.",
    "That sits with <owner>; I will bring them in and revert today.",
    "I have not seen that report yet. I will read it tonight and respond first thing tomorrow.",
  ]],
  ["Redirecting without dodging", [
    "The part I can answer now is... The part I will confirm is...",
    "Here is what we know, what we suspect, and what we are verifying.",
  ]],
  ["Under pressure from seniors", [
    "I would rather be accurate than quick on this. I will confirm and come back within the hour.",
    "Let me give you the headline now and the detail by end of day.",
  ]],
  ["Challenging or hostile tone", [
    "I hear the concern. Let us separate the facts from the options.",
    "Help me understand what is driving the concern, so I answer the right problem.",
  ]],
  ["Jargon you do not know", [
    "Could you spell out that acronym? I want to record it correctly.",
    "What does that mean for the risk or the control?",
  ]],
  ["Committing dates", [
    "I can commit to X by <date>. Y depends on <dependency>; I will update you on <day>.",
    "If we want it sooner, here are the trade-offs. Which matters more?",
  ]],
  ["Owning a mistake", [
    "I got that wrong. The correct position is... I have updated the record.",
  ]],
  ["Respectful disagreement", [
    "I see it differently because the evidence shows... Can we check it together?",
  ]],
];

const NEVER = [
  "Guess a number, a date or a certification status.",
  "Invent, backdate or 'tidy' evidence. Integrity is the whole job.",
  "Promise a date without the owner's agreement.",
  "Fill silence with a long, unfocused answer.",
  "Say 'I do not know' and stop. Add what you will do next.",
  "Blame a person in public. Describe the process gap instead.",
  "Reply to an angry email within the first hour. Draft, wait, then send.",
  "Sign or approve something you have not verified.",
];

const QTYPES = [
  ["Definition", "'What is SOC 2?'", "Give a one-line definition, then one example. Offer detail if wanted."],
  ["Status", "'Are we compliant?'", "Scope + date + open exceptions. 'As at <date>...'"],
  ["Number", "'How many findings are open?'", "Give the number you can source or fence it: 'I will confirm from the tracker by 3 PM.'"],
  ["Cause", "'Why did this happen?'", "Facts first, then hypotheses clearly labelled, then how you will verify."],
  ["Opinion", "'Should we accept this risk?'", "Frame criteria (appetite, impact, compensating controls) then your recommendation."],
  ["Commitment", "'When will it be fixed?'", "Owner-agreed date, dependencies, next update date."],
  ["Blame", "'Whose fault is this?'", "Redirect: 'Let us fix the control gap first; the review will cover accountability.'"],
  ["Deep technical", "'How is the firewall rule set?'", "Anchor on the control objective; route the how to the SME."],
  ["Hypothetical", "'What if ransomware hits?'", "Walk the plan: detect, contain, notify, recover. Cite the playbook."],
];

// [question, who asks, model answer]
const DRILLS = [
  ["Are we compliant with ISO 27001?", "CXO", "State certificate scope and status as at the last audit, then open nonconformities and the next surveillance date. If unsure: 'I will confirm scope and status from the certificate and send it by end of day.'"],
  ["What is our biggest cyber risk?", "Board member", "'From the register, the highest residual risks are X and Y. X matters most because of impact on airport operations. The decision I need is Z.'"],
  ["Show me evidence for the Q2 access review.", "Auditor", "'Let me confirm the population and owner. I will provide the signed sheet and ticket references by tomorrow noon.' Never produce evidence you have not seen."],
  ["Can you just sign off this vendor today?", "Business head", "'I can sign once I see the security assessment and contract clause check. If we need it today, I can propose a time-boxed conditional approval for CISO sign-off.'"],
  ["Have you had a breach in the last 12 months?", "Client", "'I will route that to our CISO and Legal for an approved statement within X days.' Do not answer from memory."],
  ["Is this alert a reportable incident?", "SOC lead", "'Apply the classification criteria; start the CERT-In 6-hour clock if criteria are met; inform CISO and Legal now; record the decision.'"],
  ["How much would a ransomware attack cost us?", "CFO", "'A range, not a single number: downtime hours × operational impact, recovery cost, notification and regulatory costs. I will build a P50 / P90 range with Finance this week.'"],
  ["Why can't we just accept this risk?", "CTO", "'We can, if it is within appetite, time-boxed and signed at the right level. Here are the compensating controls and the review date.'"],
  ["Is DPDP applicable to us?", "Senior leader", "'For client data we likely act as a processor and in some cases as a fiduciary for our own staff data. I will confirm with Legal and send a one-page view.'"],
  ["What is the recovery time for the SIEM?", "Client", "'The documented RTO is in the BCP; I will quote it from the latest approved document and confirm the last test date.'"],
  ["Why are we spending on this control?", "Finance head", "'It reduces the likelihood of risk R-00X, whose exposure range is Y. Cost per rupee of risk reduced is Z. Alternatives are A and B.'"],
  ["You have been here three weeks. What do you think of our programme?", "CISO", "'Observations, not conclusions yet: strengths are A and B; gaps I see are C and D; I will validate them with owners and bring a plan by day 30.'"],
  ["When will all findings be closed?", "Auditor / CEO", "'Here is the plan: 5 by 31-Jan, 3 by 28-Feb. Two depend on vendor delivery; I will update you every Friday.' Never promise all-closed without owner commitments."],
  ["I do not know how to test this control.", "Junior analyst", "'Good that you flagged it. Start with: what is the control objective, what evidence shows it operated, how many samples. Let us draft the steps together in 15 minutes.'"],
  ["Who approved this exception?", "Auditor", "'Let me check the exceptions register and approval record, then send you the evidence.'"],
  ["Explain SOC 1 versus SOC 2 simply.", "Colleague", "'SOC 1 covers controls affecting a client's financial reporting; SOC 2 covers security-related controls such as security and availability. Type II covers a period, Type I a single date.'"],
];

// [situation, mindset, do[], say, avoid]
const SCENARIOS = [
  ["Control owner keeps missing evidence dates", "They are probably overloaded, not careless.", ["Ask what blocks them", "Offer a 15-minute working session", "Agree a new date in writing", "On the second miss, escalate with their manager copied"], "What is stopping this, and what date can you commit to? I will log it.", "Public shaming or vague reminders."],
  ["A senior leader disputes your finding", "A challenge to evidence is not a challenge to you.", ["Separate facts from interpretation", "Re-check the evidence together", "Invite counter-evidence", "Document the outcome"], "If you can show X, I will revise the finding.", "Arguing in front of others."],
  ["Auditor asks something you cannot answer", "Auditors respect precision, not instant answers.", ["Ask which criterion they are testing", "Confirm scope and period", "Bring the control owner", "Log the request"], "Let me confirm with the owner and provide evidence by tomorrow noon.", "Improvising evidence."],
  ["CXO asks 'Are we secure?'", "They want a risk view, not a yes or no.", ["Answer in three numbers plus a trend", "State the top risk and the ask"], "Security is a range. Here are three indicators, the main risk, and the decision we need.", "Yes or no."],
  ["Client escalates after an incident rumour", "Facts, not speculation, protect trust.", ["Loop in CISO and Legal", "Use approved communication", "Commit to a time for verified facts"], "We will share verified facts by <time>.", "Speculating or promising what is unverified."],
  ["2 AM incident call", "You are the recorder and compliance clock, not the technical lead.", ["Start a timeline", "Ask 'confirmed or suspected?'", "Track CERT-In and client notification clocks", "Preserve evidence"], "Let us note what is confirmed and what is suspected, and who owns each next step.", "Giving technical direction."],
  ["A junior analyst makes a mistake", "Fix the process, then coach the person.", ["Give private feedback", "Ask what made the error easy", "Add a checklist or review step"], "Walk me through what happened; let us make it harder to repeat.", "Blaming in the team channel."],
  ["Two seniors disagree", "Your role is to clarify the decision, not pick sides.", ["Restate each position fairly", "Map both to risk appetite", "Name the decision-owner"], "I hear two options with different trade-offs. The decision sits with <owner>; here is the risk of each.", "Taking a side informally."],
  ["Ambush question in a meeting", "Everyone gets them; prepared people use a method.", ["Run RAFT", "Write the question down", "Take a sip of water"], "Let me restate it so I answer precisely...", "Bluffing."],
  ["Unrealistic deadline", "Trade-offs are information, not refusal.", ["Show what can be done by when", "Offer two options"], "We can do A by Friday or A and B by next Wednesday. Which matters more?", "Silent acceptance, then a miss."],
  ["You feel blamed for an audit finding", "Owning a control is different from owning a detection.", ["Build a short factual timeline", "Separate ownership from detection", "Propose the fix"], "Here is the timeline and the control owner. Here is what we change.", "Defensiveness or silence."],
  ["Inbox and chat overload", "Not everything is urgent; triage.", ["Sort into: decide, delegate, schedule, ignore", "Check email at two fixed windows", "Use the action log"], "I will respond by 4 PM today.", "Instant replies to everything."],
  ["Imposter feeling after a meeting", "Everyone new feels this; it fades with repetition.", ["Write 3 things you did well and 1 thing to learn", "Add new terms to the glossary", "Ask one trusted colleague for feedback"], "Next time I will prepare this term and this number.", "Replaying the meeting for hours."],
  ["You do not understand a technical report", "Ask the six standard questions.", ["Use the six questions in the Tools tab", "Ask the SME to explain impact in one sentence"], "In one sentence, what does this mean for the risk?", "Pretending to follow."],
  ["Vendor refuses to complete the questionnaire", "There are alternatives to a questionnaire.", ["Escalate to the business owner", "Accept SOC 2 report or ISO certificate", "Risk-accept with sign-off if needed"], "Alternatively, we can accept your latest SOC 2 report and a signed attestation.", "Letting it drift."],
  ["Asked to 'just sign off'", "A signature is your integrity.", ["Check your authority", "Ask for the evidence", "Sign only what you have verified", "Escalate if pressured"], "I can sign once I see X.", "Signing under pressure."],
  ["Friday 6 PM urgent request", "Urgent is not the same as important.", ["Ask: is this a risk, an audit date or a preference?", "Agree what can wait until Monday"], "If this is time-critical, who will approve the exception? Otherwise I will start Monday 9 AM.", "Silently losing the weekend."],
  ["Feedback from your manager feels harsh", "Feedback is information; emotion needs time.", ["Pause 24 hours", "Ask for two examples and what good looks like", "Agree one improvement and a check-in date"], "Can you share one example and what good would look like?", "Reacting immediately."],
];

// [technique, how, when]
const BODY = [
  ["Longer exhale", "Inhale 4 seconds, exhale 6-8 seconds, repeat for 1 minute. A longer exhale tends to settle the body, like a cool-down jog after a sprint.", "Before a meeting, after a surprise"],
  ["Box breathing", "In 4, hold 4, out 4, hold 4. Four rounds.", "Waiting outside a room"],
  ["Double-inhale sigh", "Two short inhales through the nose, one long exhale through the mouth. Two or three rounds.", "A sudden spike of stress"],
  ["Ground your feet", "Press both feet into the floor and feel the contact for 10 seconds. Unclench jaw, drop shoulders.", "While being questioned"],
  ["Slow the pace", "Speak 25% slower; pause before key numbers. Silence reads as confidence.", "Any presentation"],
  ["Hydrate and move", "Water at hand; a 5-minute walk between heavy meetings, like a stretch between sets.", "Back-to-back meetings"],
  ["Write it down", "Jot the question and your 3 points before answering.", "Complex or multi-part questions"],
  ["Sleep as training", "Protect 7 hours when possible; recall and calm both depend on it.", "Every night"],
];

const RITUALS = [
  ["Morning (5 min)", "Read today's calendar and agendas; pick your top 3 outcomes; write 3 numbers you may be asked for."],
  ["Pre-meeting (2 min)", "Re-read the last minutes; state your goal; one longer-exhale breathing round."],
  ["Post-meeting (3 min)", "Write decisions, actions and new terms; send the recap email within 2 hours."],
  ["Evening shutdown (5 min)", "List open loops; set tomorrow's top 3; note one thing learned; close the laptop."],
  ["Weekly review (20 min)", "Check the action log, overdue items, glossary additions, and one win to share with your manager."],
];

const ANCHORS = [
  ["1. Start where you are", "Nobody expects a new manager to know everything on Day 1. They expect structure, curiosity and follow-through."],
  ["2. Use one answer frame", "Context → Risk → Control → Evidence → Decision. It works for any topic."],
  ["3. Say what you know and what you will verify", "'I understand the principle; I will confirm specifics with the SOC lead by 4 PM.'"],
  ["4. Learn in public, early", "Basic questions are expected in the first weeks and build trust. Ask now."],
  ["5. Progressive training", "Like building fitness for a trek: short daily sessions, rest days, steady load."],
  ["6. Evidence over opinion", "Every claim gets a source: a policy clause, a metric, a log, a standard."],
];

const SAY = [
  ["I am new to this area; walk me through how it works today.", "Nodding through a term you do not know."],
  ["Which control does this map to, and what evidence do we keep?", "Giving an opinion without a source."],
  ["I will check with the control owner and confirm by end of day.", "Guessing a number in a meeting."],
  ["Here is the risk, the exposure, and the decision I need.", "Presenting a long list of activities."],
  ["I would like to shadow the SOC / audit for a day.", "Waiting to be taught unasked."],
];

const CREDIBILITY = [
  "Close every loop within 24 hours, even if the answer is 'still waiting on X'.",
  "Send recap emails after meetings within 2 hours.",
  "Keep one running action log with owner and date.",
  "Under-promise dates; over-deliver on quality.",
  "Bring a recommendation with every problem.",
  "Praise owners publicly when they close items.",
];

/* ============================ UI HELPERS ============================ */

function Card({ title, children, className = "" }) {
  return (
    <section className={"rounded-xl border border-slate-200 bg-white p-4 shadow-sm " + className}>
      {title && <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>}
      {children}
    </section>
  );
}
function H({ children, sub }) {
  return (
    <div className="mb-3">
      <h2 className="text-xl font-bold text-slate-900">{children}</h2>
      {sub && <p className="text-sm text-slate-600">{sub}</p>}
    </div>
  );
}
function Chips({ items }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {items.map((x) => (
        <span key={x} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{x}</span>
      ))}
    </div>
  );
}
function Bullets({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
      {items.map((x) => <li key={x}>{x}</li>)}
    </ul>
  );
}
function CopyBtn({ text, label = "Copy" }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch (e) {
      setOk(false);
    }
  };
  return (
    <button onClick={copy} className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white">
      {ok ? "Copied" : label}
    </button>
  );
}

const TONES = {
  rose: "bg-rose-100 text-rose-800",
  amber: "bg-amber-100 text-amber-800",
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-emerald-100 text-emerald-800",
};
function toneOf(v) {
  const s = String(v).toLowerCase();
  if (/^(critical|red|exception|overdue|breached|gap|late)/.test(s)) return TONES.rose;
  if (/^(high|amber|pending|due soon|open|partial)/.test(s)) return TONES.amber;
  if (/^(medium|in progress)/.test(s)) return TONES.yellow;
  if (/^(low|green|effective|current|received|closed|accepted|within sla)/.test(s)) return TONES.green;
  return "";
}

function DataTable({ cols, rows, pill = [] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-2 py-2 font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 align-top">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-2 text-slate-700">
                  {pill.includes(j) ? (
                    <span className={"whitespace-nowrap rounded-full px-2 py-0.5 font-semibold " + toneOf(c)}>{c}</span>
                  ) : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const toTSV = (cols, rows) => [cols.join("\t")].concat(rows.map((r) => r.join("\t"))).join("\n");

/* ============================== SECTIONS A ============================== */

function Overview() {
  return (
    <div className="space-y-4">
      <H sub="Written for someone joining with no prior GRC or cybersecurity background">What this job really is</H>
      <Card title="In one line">
        <p className="text-sm text-slate-700">
          You tell the Board and clients <b>how safe the company really is, whether it can prove it, and what must be fixed next</b>. You own the framework, the evidence, the audits and the story. You do not operate the technology.
        </p>
      </Card>
      <Card title="Snapshot">
        <dl className="space-y-2 text-sm">
          {SNAPSHOT.map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-20 shrink-0 font-medium text-slate-500">{k}</dt>
              <dd className="text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="A health-check way to understand GRC">
        <table className="w-full text-left text-sm">
          <tbody>
            {BODY_MAP.map(([a, b]) => (
              <tr key={a} className="border-b last:border-0 align-top">
                <td className="py-2 pr-2 font-medium text-slate-800">{a}</td>
                <td className="py-2 text-slate-600">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {OWN_NOT.map(([h, list]) => (
          <Card key={h} title={h}><Bullets items={list} /></Card>
        ))}
      </div>
      <Card title="What success looks like">
        <ul className="space-y-2 text-sm">
          {SUCCESS.map(([a, b]) => (
            <li key={a} className="flex gap-3">
              <span className="w-16 shrink-0 font-semibold text-indigo-700">{a}</span>
              <span className="text-slate-700">{b}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">
          <b>About the sample data in this guide:</b> every table, form and number is illustrative, modelled on a typical airport / critical-infrastructure managed-security setting. It is not real GRAMAX or client data. Use it to learn the shapes, then replace it with real data after joining.
        </p>
      </Card>
    </div>
  );
}

function DayLife() {
  return (
    <div className="space-y-4">
      <H sub="A typical weekday; the mix shifts with audit season">A day in the role</H>
      <Card>
        <ol className="space-y-3">
          {DAY_BLOCKS.map(([t, h, d]) => (
            <li key={t} className="flex gap-3">
              <span className="h-fit w-14 shrink-0 rounded bg-slate-800 px-2 py-1 text-center text-xs font-bold text-white">{t}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{h}</p>
                <p className="text-sm text-slate-600">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="A sample week">
        <ul className="space-y-2 text-sm">
          {SAMPLE_WEEK.map(([a, b]) => (
            <li key={a} className="flex gap-3"><span className="w-10 shrink-0 font-semibold text-indigo-700">{a}</span><span className="text-slate-700">{b}</span></li>
          ))}
        </ul>
      </Card>
      {SPECIAL_DAYS.map(([a, b]) => (
        <Card key={a} title={"Special day: " + a}><p className="text-sm text-slate-700">{b}</p></Card>
      ))}
      <Card title="Rhythm beyond the day">
        <DataTable cols={["Cycle", "What happens", "With whom"]} rows={CADENCE} />
      </Card>
      <Card title="What it feels like">
        <ul className="space-y-2 text-sm">
          {FEELS.map(([a, b]) => (
            <li key={a}><b className="text-slate-900">{a}.</b> <span className="text-slate-700">{b}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Meetings() {
  return (
    <div className="space-y-4">
      <H sub="Who you will sit with, what is discussed, words you will hear, and a model sentence">Discussions you will lead</H>
      {MEETINGS.map((s) => (
        <Card key={s.who} title={s.who}>
          <p className="text-sm text-slate-700"><b>Topics:</b> {s.topics}</p>
          <p className="mt-1 text-sm text-slate-700"><b>Your job:</b> {s.youDo}</p>
          <p className="mt-2 text-xs font-semibold uppercase text-slate-500">Words you will hear</p>
          <Chips items={s.hear} />
          <p className="mt-3 rounded-lg bg-indigo-50 p-2 text-sm italic text-indigo-900">"{s.say}"</p>
        </Card>
      ))}
      <Card title="Standard agendas">
        <ul className="space-y-2 text-sm">
          {AGENDAS.map(([a, b]) => (
            <li key={a}><b className="text-slate-900">{a}</b><br /><span className="text-slate-600">{b}</span></li>
          ))}
        </ul>
      </Card>
      <Card title="Safe questions for a new joiner (use freely in month 1)"><Bullets items={NEW_JOINER_Q} /></Card>
    </div>
  );
}

function Tools() {
  return (
    <div className="space-y-4">
      <H sub="Depth key: Read = understand outputs · Concept = know the purpose · Operate = use daily · Own = accountable">Tools and platforms</H>
      {TOOL_GROUPS.map((g) => (
        <Card key={g.group}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{g.group}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{g.depth}</span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{g.what}</p>
          <p className="mt-1 text-xs text-slate-500">Examples: {g.items}</p>
        </Card>
      ))}
      <Card title="Sample output 1: vulnerability report (illustrative)">
        <DataTable cols={VULN_COLS} rows={VULN_ROWS} pill={[2, 6]} />
        <p className="mt-2 text-xs text-slate-500">Read left to right: what, where, how bad, how exposed, how old versus the SLA, then the question you ask.</p>
      </Card>
      <Card title="Sample output 2: a SIEM alert and what it means for GRC (illustrative)">
        <dl className="space-y-2 text-sm">
          {SIEM_SAMPLE.map(([k, v]) => (
            <div key={k} className="flex gap-3"><dt className="w-28 shrink-0 font-medium text-slate-500">{k}</dt><dd className="text-slate-800">{v}</dd></div>
          ))}
        </dl>
      </Card>
      <Card title="Six questions for any technical report"><Bullets items={SIX_Q} /></Card>
    </div>
  );
}

function Ladder() {
  return (
    <div className="space-y-4">
      <H sub="Four levels from zero. 'Good enough by Day 20' is the target, not mastery.">Skill ladder</H>
      {LADDER.map((l) => (
        <Card key={l.lvl}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Level {l.lvl} · {l.name}</h3>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">{l.target}</span>
          </div>
          <DataTable cols={["Topic", "Day-20 proof", "Day"]} rows={l.rows} />
        </Card>
      ))}
      <Card title="Not required for this role">
        <p className="text-sm text-slate-700">Coding, writing SIEM queries, penetration testing, malware analysis. You need to read and challenge these outputs, not produce them.</p>
      </Card>
    </div>
  );
}

function Glossary() {
  const [q, setQ] = useState("");
  const [hide, setHide] = useState(false);
  const [shown, setShown] = useState(new Set());
  const list = GLOSSARY.filter(([a, b]) => (a + " " + b).toLowerCase().includes(q.toLowerCase()));
  const flip = (t) => {
    const n = new Set(shown);
    if (n.has(t)) n.delete(t);
    else n.add(t);
    setShown(n);
  };
  return (
    <div className="space-y-4">
      <H sub={GLOSSARY.length + " terms you will hear in the first month"}>Glossary</H>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a term" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
        <button onClick={() => setHide(!hide)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">{hide ? "Show all" : "Quiz mode"}</button>
      </div>
      <div className="space-y-2">
        {list.map(([t, d]) => {
          const covered = hide && !shown.has(t);
          return (
            <button key={t} onClick={() => hide && flip(t)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
              <p className="text-sm font-semibold text-indigo-700">{t}</p>
              <p className={"text-sm " + (covered ? "text-slate-300" : "text-slate-700")}>{covered ? "Tap to reveal" : d}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== SECTIONS B ============================== */

function Unknowns() {
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [secs, setSecs] = useState(0);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!run) return undefined;
    if (secs <= 0) { setRun(false); return undefined; }
    const id = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(id);
  }, [run, secs]);

  const next = () => {
    let n = Math.floor(Math.random() * DRILLS.length);
    if (n === i) n = (n + 1) % DRILLS.length;
    setI(n); setReveal(false); setRun(false); setSecs(0);
  };
  const start = () => { setSecs(30); setRun(true); };
  const [q, who, ans] = DRILLS[i];

  return (
    <div className="space-y-4">
      <H sub="You will be asked things you cannot answer. This is the method, the words and the practice.">When you do not know the answer</H>
      <Card title="The RAFT method (about 20 seconds)">
        <ol className="space-y-3">
          {RAFT.map(([a, b]) => (
            <li key={a} className="flex gap-3">
              <span className="h-fit w-28 shrink-0 rounded bg-indigo-600 px-2 py-1 text-xs font-bold text-white">{a}</span>
              <span className="text-sm text-slate-700">{b}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-900">
          Worked example. Q: "What is the recovery time for the SIEM?" → "You are asking how fast we must restore monitoring after an outage (R). Our business continuity plan sets a target for critical systems (A). I do not want to quote the exact figure from memory; I will take it from the approved plan (F). I will email it with the last test date by 4 PM (T)."
        </p>
      </Card>

      <Card title="Practice drill: random question from daily work">
        <p className="text-xs font-semibold uppercase text-slate-500">Asked by: {who}</p>
        <p className="mt-1 text-base font-semibold text-slate-900">"{q}"</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={start} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">Start 30s think</button>
          <button onClick={() => setReveal(!reveal)} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white">{reveal ? "Hide model" : "Show model answer"}</button>
          <button onClick={next} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">Next question</button>
          {run && <span className="text-sm font-bold text-emerald-700">{secs}s</span>}
        </div>
        {reveal && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{ans}</p>}
        <p className="mt-2 text-xs text-slate-500">{DRILLS.length} questions. Answer aloud using RAFT before revealing the model.</p>
      </Card>

      <Card title="Decode the question type">
        <DataTable cols={["Type", "Example", "How to answer"]} rows={QTYPES} />
      </Card>

      <H sub="Say these words; they work in meetings, audits and calls">Script bank</H>
      {SCRIPTS.map(([g, lines]) => (
        <Card key={g} title={g}>
          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l} className="rounded-lg bg-slate-50 p-2 text-sm italic text-slate-800">"{l}"</li>
            ))}
          </ul>
        </Card>
      ))}

      <Card title="Never do this" className="border-rose-200">
        <Bullets items={NEVER} />
      </Card>
    </div>
  );
}

function Playbook() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-4">
      <H sub="Tap a situation for the mindset, steps, words and what to avoid">Daily situations playbook</H>
      {SCENARIOS.map(([s, mind, dos, say, avoid], idx) => (
        <div key={s} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen(open === idx + 1 ? 0 : idx + 1)}>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">{idx + 1}</span>
            <span className="flex-1 text-sm font-semibold text-slate-900">{s}</span>
            <span className="text-slate-400">{open === idx + 1 ? "−" : "+"}</span>
          </button>
          {open === idx + 1 && (
            <div className="space-y-2 border-t border-slate-100 p-3 text-sm">
              <p className="text-slate-700"><b>Mindset:</b> {mind}</p>
              <div><b className="text-slate-900">Do:</b><Bullets items={dos} /></div>
              <p className="rounded-lg bg-indigo-50 p-2 italic text-indigo-900">Say: "{say}"</p>
              <p className="text-rose-700"><b>Avoid:</b> {avoid}</p>
            </div>
          )}
        </div>
      ))}

      <H sub="Calm is a physical skill; train it like fitness">Calm toolkit for the body</H>
      <Card>
        <DataTable cols={["Technique", "How", "When"]} rows={BODY} />
        <p className="mt-2 text-xs text-slate-500">General wellbeing practices, not medical advice. If stress feels overwhelming or persistent, speak with a doctor or counsellor.</p>
      </Card>

      <Card title="Daily rituals">
        <ul className="space-y-2 text-sm">
          {RITUALS.map(([a, b]) => (
            <li key={a}><b className="text-slate-900">{a}:</b> <span className="text-slate-700">{b}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Mindset() {
  return (
    <div className="space-y-4">
      <H sub="Confidence comes from structure, evidence and consistent practice">Mindset and credibility</H>
      {ANCHORS.map(([a, b]) => (
        <Card key={a} title={a}><p className="text-sm text-slate-700">{b}</p></Card>
      ))}
      <Card title="Say this / not that">
        <DataTable cols={["Say", "Avoid"]} rows={SAY} />
      </Card>
      <Card title="Build a credibility bank"><Bullets items={CREDIBILITY} /></Card>
      <Card title="Integrity red lines" className="border-rose-200">
        <p className="text-sm text-slate-700">
          In GRC your signature and your evidence are the product. Never assure compliance you have not verified, never alter or backdate evidence, and never sign under pressure. If you are being pushed, escalate calmly and document it. This protects you, your team and the company.
        </p>
      </Card>
    </div>
  );
}

function Plan() {
  const [done, setDone] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem("grc.plan.done") || "[]")); } catch (e) { return new Set(); } });
  useEffect(() => { try { localStorage.setItem("grc.plan.done", JSON.stringify([...done])); } catch (e) {} }, [done]);
  const [open, setOpen] = useState(1);
  const total = PLAN.length;
  const pct = Math.round((done.size / total) * 100);
  const toggle = (d) => {
    const n = new Set(done);
    if (n.has(d)) n.delete(d);
    else n.add(d);
    setDone(n);
  };
  const byPhase = useMemo(() => PHASES.map((ph, i) => ({ ...ph, items: PLAN.filter((x) => x.p === i) })), []);

  return (
    <div className="space-y-4">
      <H sub="About 2 hours a day: 60 min learn · 40 min produce · 20 min recall. Weekends can stretch to 3 hours.">20-day zero-to-ready plan</H>
      <Card>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="font-bold text-slate-900">{done.size}/{total} days · {pct}%</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: pct + "%" }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">A day counts only when its Output exists. Progress resets on reload.</p>
      </Card>
      {byPhase.map((ph) => (
        <div key={ph.name}>
          <div className={"mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-white " + ph.color}>
            <span className="text-sm font-semibold">{ph.name}</span>
            <span className="text-xs">{ph.days}</span>
          </div>
          <div className="space-y-2">
            {ph.items.map((x) => (
              <div key={x.d} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 p-3">
                  <input type="checkbox" checked={done.has(x.d)} onChange={() => toggle(x.d)} className="h-5 w-5 accent-emerald-600" aria-label={"Mark day " + x.d + " done"} />
                  <button className="flex-1 text-left" onClick={() => setOpen(open === x.d ? 0 : x.d)}>
                    <p className="text-xs font-semibold uppercase text-slate-500">Day {x.d}</p>
                    <p className={"text-sm font-semibold " + (done.has(x.d) ? "text-slate-400 line-through" : "text-slate-900")}>{x.t}</p>
                  </button>
                  <span className="text-slate-400">{open === x.d ? "−" : "+"}</span>
                </div>
                {open === x.d && (
                  <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2 text-sm">
                    <p className="text-xs text-slate-500"><b>Time-box:</b> Learn 60 · Produce 40 · Recall 20 min</p>
                    <p className="text-slate-700"><b>Source:</b> {x.src}</p>
                    <Bullets items={x.tasks} />
                    <p className="rounded-lg bg-emerald-50 p-2 text-emerald-900"><b>Output:</b> {x.out}</p>
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-900">
                      <b>Check yourself (answer aloud):</b>
                      <ul className="mt-1 list-decimal pl-5">{x.check.map((c) => <li key={c}>{c}</li>)}</ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Card title="Smart-strategy rules">
        <Bullets items={[
          "Concepts before tools. Tools change; frameworks and logic stay.",
          "Output beats input. One produced page beats three hours of watching.",
          "Teach it back. Explain aloud or to Claude; gaps appear instantly.",
          "Spaced recall: 5 minutes each day on the previous two days' terms.",
          "Rest is training. Keep sleep steady; recall suffers on short nights.",
          "If time slips, protect Days 3-4, 6-10, 12, 14, 18-20.",
        ]} />
      </Card>
    </div>
  );
}

function First90() {
  return (
    <div className="space-y-4">
      <H sub="What to do once you join">First 90 days</H>
      <Card title="Week 1 checklist">
        <ul className="space-y-2 text-sm">
          {WEEK1.map(([a, b]) => (
            <li key={a} className="flex gap-3"><span className="w-12 shrink-0 font-semibold text-indigo-700">{a}</span><span className="text-slate-700">{b}</span></li>
          ))}
        </ul>
      </Card>
      <Card title="Documents to request on Day 1"><Bullets items={DOCS} /></Card>
      <Card title="People to meet in the first 2 weeks"><Bullets items={PEOPLE} /></Card>
      <Card title="Questions for your manager in week 1">
        <Bullets items={[
          "Which attestations do clients ask for most, and where are the gaps?",
          "Is the role mainly internal GRAMAX risk, client-facing assurance, or both?",
          "What does the GRC tooling and automation roadmap look like?",
          "How does GRC work with the ICDC / SOC team for evidence?",
          "What are the top three outcomes expected from me in 90 days?",
        ]} />
      </Card>
      <p className="text-sm text-slate-600">The full 30-60-90 plan is in the Templates tab.</p>
    </div>
  );
}

function Resources() {
  return (
    <div className="space-y-4">
      <H sub="Mostly free. Time is a suggested budget.">Resources</H>
      <div className="space-y-2">
        {RESOURCES.map(([n, t, c, h, u]) => (
          <a key={n} href={u} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-sm font-semibold text-indigo-700">{n}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t} · {c} · {h}</p>
          </a>
        ))}
      </div>
      <Card title="Certifications later, not now">
        <p className="text-sm text-slate-700">After 3-6 months in the role, consider ISO 27001 Lead Auditor, CISA or CISM. For the next 20 days, skills and vocabulary matter more than credentials.</p>
      </Card>
    </div>
  );
}

function Templates() {
  const [id, setId] = useState(TEMPLATES[0].id);
  const t = TEMPLATES.find((x) => x.id === id);
  const copyText = t.kind === "table" ? toTSV(t.cols, t.rows) : t.body;
  return (
    <div className="space-y-4">
      <H sub="Filled with illustrative GRAMAX-style data. Tables copy as tab-separated text that pastes straight into Excel.">Template library</H>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEMPLATES.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={"whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium " + (x.id === id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700")}>
            {x.name}
          </button>
        ))}
      </div>
      <Card title={t.name}>
        <p className="text-sm text-slate-700"><b>Purpose:</b> {t.purpose}</p>
        <p className="mt-1 text-sm text-slate-700"><b>When:</b> {t.when}</p>
        <div className="mt-2"><b className="text-sm text-slate-900">How to use:</b><Bullets items={t.how} /></div>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Sample (illustrative)</h3>
          <CopyBtn text={copyText} label={t.kind === "table" ? "Copy for Excel" : "Copy"} />
        </div>
        {t.kind === "table" ? (
          <DataTable cols={t.cols} rows={t.rows} pill={t.pill} />
        ) : (
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{t.body}</pre>
        )}
      </Card>
    </div>
  );
}

/* ================================ APP ================================ */

export default function App() {
  const [tab, setTab] = useState(() => { try { return localStorage.getItem("grc.tab") || "overview"; } catch (e) { return "overview"; } });
  useEffect(() => { try { localStorage.setItem("grc.tab", tab); } catch (e) {} window.scrollTo(0, 0); }, [tab]);
  const view = {
    overview: <Overview />, day: <DayLife />, meetings: <Meetings />, tools: <Tools />,
    ladder: <Ladder />, glossary: <Glossary />, unknowns: <Unknowns />, playbook: <Playbook />,
    mindset: <Mindset />, plan: <Plan />, first90: <First90 />, resources: <Resources />,
    templates: <Templates />,
  }[tab];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 px-4 py-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-400">GRAMAX Cybertech · Manager - GRC</p>
        <h1 className="text-xl font-bold">Zero-to-Ready Field Guide</h1>
      </header>
      <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={"whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium " + (tab === k ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700")}>
            {label}
          </button>
        ))}
      </nav>
      <main className="mx-auto max-w-3xl p-4 pb-16">{view}</main>
    </div>
  );
}

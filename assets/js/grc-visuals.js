/* LearNtime - GRC diagrams and plain-language concepts. Written for LearNtime; organisations, people and numbers are illustrative. */

/* Concepts that have no short form, shown in the GRC glossary next to the short forms. [term, meaning, topic] */
window.GRC_TERMS = [
  ["Inherent risk", "The level of risk before any controls are applied. Used to decide how much attention a vendor, system or process needs.", "Risk and governance"],
  ["Residual risk", "The risk left after controls are in place. This is what the risk owner accepts, and it must sit inside the risk appetite.", "Risk and governance"],
  ["Risk appetite", "How much risk the Board is willing to take to reach its goals, set in a short statement, for example 'no tolerance for breaches of client data'.", "Risk and governance"],
  ["Risk tolerance", "The measurable limit around the appetite, for example 'no more than 2 critical audit findings open beyond 30 days'.", "Risk and governance"],
  ["Risk owner", "The person accountable for a risk and for deciding how to treat it: usually a business or department head, not GRC.", "Risk and governance"],
  ["Control owner", "The person who makes sure a control runs as designed and keeps the evidence, for example the IT manager for access reviews.", "Audit and assurance"],
  ["Compensating control", "A different control that reduces the same risk when the normal control isn't possible. Example: a vendor can't support SSO, so you require MFA on their portal, restrict it to your office IPs and review its log monthly.", "Third parties and contracts"],
  ["Due diligence", "The checks done before signing with a vendor or partner: security, privacy, financial, legal and compliance. Each check has an owner; see the Diagrams page.", "Third parties and contracts"],
  ["Fourth party", "Your vendor's own vendors (sub-processors), for example the cloud provider your payroll vendor uses. Their failure can still hurt you.", "Third parties and contracts"],
  ["Concentration risk", "Relying on one vendor, region or provider for too many critical services, so one failure stops a lot at once.", "Third parties and contracts"],
  ["Right to audit", "A contract clause letting you (or an auditor you appoint) inspect the vendor's controls. RBI outsourcing rules expect it for material vendors.", "Third parties and contracts"],
  ["Exit plan", "How you would leave a vendor safely: getting your data back, deleting copies, and moving the service without a gap.", "Third parties and contracts"],
  ["Bridge letter", "A vendor's letter covering the gap between the end of its last SOC report period and today, saying nothing material has changed.", "Audit and assurance"],
  ["Attestation", "A formal statement by an independent auditor about controls, as in a SOC 2 report. Different from certification (ISO 27001).", "Audit and assurance"],
  ["Nonconformity", "An ISO audit finding that a requirement isn't met. Major ones can stop certification; minor ones need a corrective action plan.", "Audit and assurance"],
  ["Sampling", "Testing a selection of items (for example 25 of 400 joiners) to judge whether a control ran all period.", "Audit and assurance"],
  ["Risk acceptance (exception)", "A signed, time-limited decision by the risk owner to live with a risk or a policy gap, with a review date.", "Risk and governance"],
  ["Segregation of duties", "Splitting a task so one person can't do it end to end, for example the person who requests access can't approve it.", "Technology and access"],
  ["Least privilege", "Giving each person or system only the access needed for the job, and no more.", "Technology and access"],
  ["Read, write, execute", "The three basic permissions: read = view data, write = change or delete it, execute = run a program or command. Execute rights on OT or finance systems are the most dangerous.", "Technology and access"],
  ["Data classification", "Labelling data by sensitivity (Public, Internal, Confidential, Restricted) so everyone handles it the same way.", "Privacy and data"],
  ["Data flow", "Where data goes: which system, vendor or country it moves to, in which direction (import or export) and how it is protected on the way.", "Privacy and data"],
  ["Data diode", "A device that lets data pass only one way, typically from OT to IT, so nothing can be sent back into the plant network.", "OT and industrial"],
  ["Sub-processor", "A company your vendor uses to process your personal data. Under DPDP and GDPR you should know who they are.", "Privacy and data"],
  ["Three lines model", "The IIA model: the first line runs the business and its controls, the second line (risk, compliance, GRC) sets rules and challenges, the third line (internal audit) gives independent assurance.", "Organisation and roles"]
];

/* Topic for each short form, used by the glossary's "By topic" view. */
window.GRC_ABBR_TOPIC = {
  "Standards and frameworks": ["CIS", "COBIT", "COSO", "CSF", "ISMS", "ISO", "IEC", "NIST", "OSCAL", "PDCA", "SCF", "CC", "TSC", "SoA", "SSAE", "ISAE"],
  "Indian law and regulators": ["BCAS", "CEA", "CERT-In", "CII", "CSCRF", "DGCA", "DPDP", "DPDPA", "MeitY", "NBFC", "NCIIPC", "RBI", "SEBI"],
  "Other laws": ["SOX", "AGPL"],
  "Audit and assurance": ["AICPA", "CPA", "CUEC", "IIA", "PBC", "SOC", "TOD", "TOE", "CAPA"],
  "Risk and governance": ["ERM", "FAIR", "GRC", "KPI", "KRI", "CIA"],
  "Third parties and contracts": ["CAIQ", "SIG", "SLA", "TPRM", "RFI", "RFP", "RFQ", "NDA", "MSA", "DPA", "SOW"],
  "Privacy and data": ["DPIA", "DPO", "PIA", "SFTP"],
  "Continuity and incidents": ["BCM", "BIA", "DR", "IR", "MBCO", "MTPD", "RTO", "RPO"],
  "OT and industrial": ["ICS", "IoT", "OT", "PLC", "SL"],
  "Technology and access": ["EDR", "IaaS", "PaaS", "SaaS", "IT", "ITSM", "NTP", "SIEM", "IAM", "MFA", "PAM"],
  "Organisation and roles": ["CISO", "RACI"]
};

/* Diagrams page */
window.GRC_VISUALS = [
{ id: "org", t: "Where the GRC Manager sits", lede: "A typical structure at a managed security provider such as the one in this course. Names of roles vary; the lines of reporting are what matter.", html: `
<div class="vz-org">
  <div class="vz-row"><div class="vz-box top">Board of Directors</div></div>
  <div class="vz-down" aria-hidden="true"></div>
  <div class="vz-row"><div class="vz-box">Audit Committee<small>oversees internal audit</small></div><div class="vz-box">Risk Committee<small>sets risk appetite</small></div></div>
  <div class="vz-down" aria-hidden="true"></div>
  <div class="vz-row"><div class="vz-box top">CEO</div></div>
  <div class="vz-down" aria-hidden="true"></div>
  <div class="vz-row wrap"><div class="vz-box">CFO<small>finance, procurement</small></div><div class="vz-box">CRO<small>enterprise risk</small></div><div class="vz-box">CIO / CTO<small>IT, OT engineering</small></div><div class="vz-box me-line">CISO<small>security</small></div><div class="vz-box">General Counsel<small>legal, DPO</small></div><div class="vz-box">CHRO<small>people</small></div></div>
  <div class="vz-down" aria-hidden="true"></div>
  <div class="vz-row wrap"><div class="vz-box">Security engineering</div><div class="vz-box">SOC operations</div><div class="vz-box me">GRC Manager<small>you are here</small></div></div>
  <div class="vz-down" aria-hidden="true"></div>
  <div class="vz-row wrap"><div class="vz-box sub">Compliance analysts<small>ISO, SOC 2, CERT-In</small></div><div class="vz-box sub">Risk analyst<small>risk register, KRIs</small></div><div class="vz-box sub">TPRM analyst<small>vendors</small></div><div class="vz-box sub">Policy and awareness</div></div>
  <div class="vz-side"><b>Dotted lines</b> GRC Manager → CRO (enterprise risk reporting) and → Risk Committee (quarterly report). <b>Independent</b> Internal Audit reports to the Audit Committee, not to the CISO, so it can audit GRC too.</div>
</div>
<h3>The three lines</h3>
<div class="vz-lines">
  <div class="vz-line l1"><b>First line</b><span>Runs the business and owns the controls</span><small>SOC, IT, OT engineering, HR, finance, procurement</small></div>
  <div class="vz-line l2"><b>Second line</b><span>Sets the rules, advises and challenges</span><small>GRC Manager, risk, compliance, privacy / DPO</small></div>
  <div class="vz-line l3"><b>Third line</b><span>Independent assurance to the Board</span><small>Internal audit; then external auditors and regulators</small></div>
</div>
<p class="vz-note">Why it matters in an interview: the GRC Manager is <b>second line</b>. You don't run the firewall or approve your own controls; you define what good looks like, check it, and report honestly upwards.</p>` },

{ id: "tprm", t: "Third-party risk: the lifecycle", lede: "From a business need to a signed vendor and back out again. Each step has an owner and an output.", html: `
<ol class="vz-flow">
  <li><b>1. Need and scoping</b><span>Business owner describes the service, the data and the access the vendor will get.</span><em>Output: request form</em></li>
  <li><b>2. Inherent risk tiering</b><span>TPRM scores the vendor <i>before</i> controls: data sensitivity, access to systems, criticality to clients, regulatory impact.</span><em>Output: Tier 1 (critical) to Tier 3 (low)</em></li>
  <li><b>3. Market approach</b><span><b>RFI</b> asks what vendors can do. <b>RFP</b> asks how they would do it, with a proposal. <b>RFQ</b> asks for a price when the requirement is already clear. Security and privacy questions go into the RFP, not after it.</span><em>Owner: procurement</em></li>
  <li><b>4. Due diligence</b><span>Depth depends on the tier: questionnaire (SIG or CAIQ), SOC 2 Type II or ISO 27001 certificate, pen test summary, financial health, sanctions and litigation checks, data protection review.</span><em>Output: findings</em></li>
  <li class="dec"><b>5. Decision</b><span>Compare findings with the risk appetite.</span>
    <div class="vz-choices"><span class="ok">Accept</span><span>Fix before signing</span><span>Compensating control</span><span class="no">Reject</span></div><em>Owner: risk owner, advised by GRC</em></li>
  <li><b>6. Contract</b><span>MSA, SOW, SLA, NDA, DPA; right to audit; breach notice within hours (CERT-In needs 6 hours for you, so the vendor must tell you sooner); sub-processor approval; exit and data return.</span><em>Owner: legal</em></li>
  <li><b>7. Onboarding</b><span>Least-privilege access, named accounts, MFA, data shared only through approved channels.</span><em>Owner: IT and the business owner</em></li>
  <li><b>8. Ongoing monitoring</b><span>Tier 1 yearly review, new SOC report and bridge letter, CUECs checked, incidents and SLA breaches logged, residual risk re-scored.</span><em>Owner: TPRM</em></li>
  <li><b>9. Offboarding</b><span>Remove access the same day, get data back, collect a deletion certificate, close the risk.</span><em>Owner: business owner, checked by TPRM</em></li>
</ol>
<h3>Whose due diligence, and why</h3>
<div class="tbl-wrap"><table class="tbl vz-tbl"><thead><tr><th>Who</th><th>Checks</th><th>Why them</th></tr></thead><tbody>
<tr><td>Business owner</td><td>Need, scope, which data and access the vendor really needs</td><td>Owns the risk and the budget; knows the service best</td></tr>
<tr><td>Procurement</td><td>RFI, RFP, RFQ, pricing, vendor registration</td><td>Fair, documented selection; stops shadow buying</td></tr>
<tr><td>TPRM / security</td><td>Questionnaire, SOC 2 or ISO evidence, pen test, access design</td><td>Judges whether the vendor's controls protect your data and clients</td></tr>
<tr><td>Privacy / DPO</td><td>Personal data involved, purpose, DPA, sub-processors, cross-border transfer</td><td>DPDP makes you, the Data Fiduciary, responsible for your processors</td></tr>
<tr><td>Legal</td><td>Contract clauses, liability, right to audit, exit</td><td>Turns the security and privacy needs into enforceable terms</td></tr>
<tr><td>Finance</td><td>Financial health, credit, insurance</td><td>A vendor that goes bust is a continuity risk</td></tr>
<tr><td>Compliance</td><td>Sector rules, for example RBI outsourcing or SEBI CSCRF</td><td>Regulators hold you responsible for outsourced activities</td></tr>
<tr><td>IT / OT engineering</td><td>Integration, network paths, remote access into OT</td><td>Vendors with remote access to plants are a top OT attack route</td></tr>
<tr><td>Internal audit</td><td>Whether the TPRM process itself was followed</td><td>Third-line check, independent of everyone above</td></tr>
</tbody></table></div>` },

{ id: "data", t: "Data sensitivity by department", lede: "Classify first, then handle. The label decides encryption, who may access, whether it may leave the country and how fast a leak must be reported.", html: `
<div class="vz-class">
  <div class="vz-cl c1"><b>Public</b><span>Can be published</span><small>Website text, press releases, marketing brochures</small></div>
  <div class="vz-cl c2"><b>Internal</b><span>Staff only; small harm if leaked</span><small>Org charts, internal policies, meeting notes</small></div>
  <div class="vz-cl c3"><b>Confidential</b><span>Named groups; real harm if leaked</span><small>Client contracts, SOC reports, risk register, pricing</small></div>
  <div class="vz-cl c4"><b>Restricted</b><span>Need to know; severe harm, legal duty</span><small>Aadhaar and PAN, salaries, health data, card data, OT safety logic, client log data</small></div>
</div>
<div class="tbl-wrap"><table class="tbl vz-tbl"><thead><tr><th>Department</th><th>Typical data</th><th>Label</th><th>Main handling rules</th></tr></thead><tbody>
<tr><td>HR</td><td>Employee IDs, Aadhaar, PAN, bank account, salary, medical records, background checks</td><td><span class="vz-tag c4">Restricted</span></td><td>DPDP personal data; HR and payroll only; encrypted; export to payroll vendor only by encrypted SFTP under a DPA</td></tr>
<tr><td>Finance</td><td>General ledger, vendor bank details, client invoices, card data</td><td><span class="vz-tag c3">Confidential</span> to <span class="vz-tag c4">Restricted</span></td><td>Segregation of duties (raise, approve, pay); change to vendor bank details needs call-back check; card data stays in a PCI scope</td></tr>
<tr><td>OT</td><td>PLC programs, SCADA network diagrams, safety system settings, historian data</td><td><span class="vz-tag c4">Restricted</span></td><td>Execute and write rights only for named engineers; changes by work permit; data leaves OT one way only</td></tr>
<tr><td>SOC</td><td>Client logs, alerts, incident reports</td><td><span class="vz-tag c4">Restricted</span></td><td>Client-owned data; kept 180 days (CERT-In); access by shift roster; no copies outside the SIEM</td></tr>
<tr><td>Sales and legal</td><td>Contracts, proposals, SOC 2 report</td><td><span class="vz-tag c3">Confidential</span></td><td>SOC report shared under NDA only</td></tr>
<tr><td>Marketing</td><td>Website, case studies (with client consent)</td><td><span class="vz-tag c1">Public</span></td><td>Approval before publishing; no client names without consent</td></tr>
</tbody></table></div>` },

{ id: "flow", t: "Data flows and access: import, export, read, write, execute", lede: "Draw where data enters (import) and leaves (export), then decide who may read, write or execute on each system. Most audit findings hide in these arrows.", html: `
<div class="vz-dflow">
  <div class="vz-df"><div class="vz-node">HR system</div><div class="vz-arrow"><span>Export · monthly</span><small>Encrypted SFTP, DPA signed</small></div><div class="vz-node ext">Payroll vendor</div></div>
  <div class="vz-df"><div class="vz-node ext">Bank</div><div class="vz-arrow"><span>Import · daily</span><small>Statements over bank API, read only</small></div><div class="vz-node">Finance ERP</div></div>
  <div class="vz-df"><div class="vz-node ot">OT historian</div><div class="vz-arrow one"><span>Export · one way</span><small>Data diode, nothing can flow back</small></div><div class="vz-node">IT data lake</div></div>
  <div class="vz-df"><div class="vz-node ext">Client firewalls</div><div class="vz-arrow"><span>Import · continuous</span><small>Logs over TLS to the SIEM</small></div><div class="vz-node">SOC SIEM</div></div>
  <div class="vz-df"><div class="vz-node ext">OEM vendor engineer</div><div class="vz-arrow warn"><span>Remote access · on request</span><small>Jump host, MFA, session recorded, time-limited</small></div><div class="vz-node ot">Plant PLCs</div></div>
</div>
<h3>Who may read, write or execute</h3>
<div class="tbl-wrap"><table class="tbl vz-tbl vz-rwx"><thead><tr><th>Role</th><th>HR system</th><th>Finance ERP</th><th>SIEM</th><th>PLC / SCADA</th></tr></thead><tbody>
<tr><td>HR executive</td><td>R W</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>Accounts payable</td><td>-</td><td>R W</td><td>-</td><td>-</td></tr>
<tr><td>Finance controller</td><td>R (salary totals)</td><td>R + approve</td><td>-</td><td>-</td></tr>
<tr><td>SOC analyst</td><td>-</td><td>-</td><td>R</td><td>-</td></tr>
<tr><td>SOC engineer</td><td>-</td><td>-</td><td>R W X (rules, playbooks)</td><td>-</td></tr>
<tr><td>OT engineer</td><td>-</td><td>-</td><td>-</td><td>R W X (permit needed)</td></tr>
<tr><td>Plant operator</td><td>-</td><td>-</td><td>-</td><td>R (HMI screens)</td></tr>
<tr><td>GRC Manager</td><td>R (reports)</td><td>R (reports)</td><td>R (dashboards)</td><td>-</td></tr>
</tbody></table></div>
<p class="vz-note"><b>R</b> read, <b>W</b> write (change or delete), <b>X</b> execute (run programs, scripts or commands). GRC reads evidence but never gets write or execute: that would break segregation of duties. On OT, an execute right can start or stop a physical process, so it is the most tightly controlled.</p>` },

{ id: "matrix", t: "Risk matrix: before and after controls", lede: "One risk, scored twice. Inherent risk is before controls; residual risk is after. Score = likelihood × impact, each from 1 to 5.", html: `
<div class="vz-risk-eg"><b>Risk:</b> because the payroll vendor holds all employee bank and Aadhaar data, a breach at the vendor could expose it, leading to DPDP penalties, fraud against staff and loss of trust.</div>
<div class="vz-mats">
  <figure class="vz-mat" data-l="4" data-i="5"><figcaption>Before: inherent <b>4 × 5 = 20</b> <span class="vz-tag c4">Critical</span></figcaption><div class="vz-grid"></div></figure>
  <figure class="vz-mat" data-l="2" data-i="4"><figcaption>After: residual <b>2 × 4 = 8</b> <span class="vz-tag c2">Medium</span></figcaption><div class="vz-grid"></div></figure>
</div>
<p class="vz-axis">Across: impact 1 (minor) to 5 (severe). Up: likelihood 1 (rare) to 5 (almost certain).</p>
<div class="tbl-wrap"><table class="tbl vz-tbl"><thead><tr><th>Control added</th><th>What it reduces</th></tr></thead><tbody>
<tr><td>Vendor's SOC 2 Type II reviewed, CUECs met</td><td>Likelihood</td></tr>
<tr><td>Encrypted SFTP, files encrypted at rest, keys held by us</td><td>Likelihood and impact</td></tr>
<tr><td>Only the data payroll needs is sent (no medical data)</td><td>Impact</td></tr>
<tr><td>DPA with 24-hour breach notice and sub-processor approval</td><td>Impact (faster response)</td></tr>
<tr><td><b>Compensating control:</b> the vendor can't do SSO, so MFA plus an IP allow-list on its portal and a monthly log review</td><td>Likelihood</td></tr>
</tbody></table></div>
<p class="vz-note">Impact only drops from 5 to 4 because a breach would still be serious: you can make a bad event less likely more easily than you can make it less bad. The residual score of 8 is inside the appetite ("medium or below for personal data"), so the risk owner, the CHRO, signs the acceptance.</p>
<div class="vz-legend"><span class="vz-tag c1">1-4 Low</span><span class="vz-tag c2">5-9 Medium</span><span class="vz-tag c3">10-14 High</span><span class="vz-tag c4">15-25 Critical</span></div>` },

{ id: "grc", t: "How GRC fits together", lede: "Governance sets direction, risk decides where to spend effort, compliance proves it. The loop runs every year.", html: `
<ol class="vz-cycle">
  <li><b>Govern</b><span>Board sets risk appetite; policies and roles agreed</span></li>
  <li><b>Identify risk</b><span>Assets, threats, vendors, obligations (laws, contracts, ISO, SOC 2)</span></li>
  <li><b>Assess</b><span>Inherent risk scored on the 5 × 5 matrix</span></li>
  <li><b>Treat</b><span>Controls chosen; owners named; compensating controls where needed</span></li>
  <li><b>Test and evidence</b><span>Test of design, test of operation, evidence calendar</span></li>
  <li><b>Report</b><span>Residual risk, KRIs and audit results to the Risk Committee</span></li>
  <li><b>Improve</b><span>Findings fixed (CAPA); appetite and policies updated</span></li>
</ol>
<p class="vz-note">This is the Plan-Do-Check-Act loop behind ISO 27001: Govern and Identify are Plan, Treat is Do, Test and Report are Check, Improve is Act.</p>` }
];

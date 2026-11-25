/* LearNtime - Learn GRC, modules 6-10. Original lessons written for LearNtime from public laws and standards
   (DPDP Act 2023 and Rules 2025, CERT-In Directions 2022, IEC 62443, NIST SP 800-82, ISO 22301). */
window.GRC_COURSE = (window.GRC_COURSE || []).concat([
{
  id: "m6", n: 6, title: "Third-party and supply chain risk", short: "Third-party risk",
  lede: "Tier vendors, assess them in proportion, write the right contract clauses and keep watching after signing.",
  lessons: [
  { id: "lifecycle", title: "The vendor risk lifecycle", body: `
<p>Most large breaches now involve a third party: a supplier with access, a software update, a cloud service. Third-party risk management (TPRM) handles that risk from first contact to exit.</p>
<ol><li><b>Inventory</b>: you cannot manage vendors you do not know about. Pull from procurement, finance (who gets paid) and network logs (who connects).</li>
<li><b>Tiering</b>: rate inherent risk by data access, system access, criticality to service and regulatory relevance.</li>
<li><b>Due diligence</b> proportional to the tier.</li>
<li><b>Contract</b> with the right security clauses.</li>
<li><b>Ongoing monitoring</b>: reassessment on a schedule plus alerts when something changes.</li>
<li><b>Offboarding</b>: revoke access, return or destroy data, get it in writing.</li></ol>
<h3>Tiering example</h3>
<table><thead><tr><th>Tier</th><th>Example</th><th>Assessment</th><th>Reassess</th></tr></thead><tbody>
<tr><td>Critical</td><td>SIEM platform hosting client logs; OT maintenance vendor with remote access</td><td>Full questionnaire, SOC 2 / ISO evidence, call or onsite</td><td>Yearly</td></tr>
<tr><td>High</td><td>HR system with employee data</td><td>Questionnaire plus certificates</td><td>Yearly</td></tr>
<tr><td>Medium</td><td>Marketing agency with no data access</td><td>Short questionnaire</td><td>Every 2 years</td></tr>
<tr><td>Low</td><td>Office supplies</td><td>None beyond contract basics</td><td>On change</td></tr></tbody></table>
<p>Watch for <b>concentration risk</b> (many critical services on one provider) and <b>fourth parties</b> (your vendor's critical vendors).</p>`,
    remember: ["Inventory, tier, assess, contract, monitor, offboard.", "Effort follows tier.", "Ask who your critical vendors depend on."],
    checks: [
      { q: "An OT maintenance vendor has remote access to airport systems. Tier:", o: ["Low", "Medium", "High", "Critical"], a: 3, w: "Remote access to critical infrastructure systems is critical tier." },
      { q: "The FIRST step in TPRM is:", o: ["Sending questionnaires", "Building a complete vendor inventory", "Negotiating contracts", "Onsite audits"], a: 1, w: "You cannot tier or assess vendors you do not know about." }
    ] },
  { id: "diligence", title: "Due diligence and contract clauses", body: `
<h3>Questionnaires and evidence</h3>
<p>Standard questionnaires save everyone time: <b>SIG</b> (Shared Assessments) and the <b>CSA CAIQ</b> for cloud. Ask for evidence, not just answers: SOC 2 Type II report, ISO 27001 certificate <i>and its scope</i>, recent penetration test summary, insurance certificate, incident history.</p>
<h3>Reading a vendor's SOC 2</h3>
<ul><li>Is the period recent and the opinion unqualified?</li>
<li>Does the system description cover the service you buy?</li>
<li>What exceptions were found, and how were they fixed?</li>
<li>Which <b>CUECs</b> must you implement? Put them in your own control set.</li>
<li>Which subservice organisations (their cloud host) are carved out?</li></ul>
<h3>Clauses worth fighting for</h3>
<table><thead><tr><th>Clause</th><th>Why</th></tr></thead><tbody>
<tr><td>Security requirements schedule</td><td>Makes your minimum controls contractual</td></tr>
<tr><td>Breach notification (e.g. within 24 hours)</td><td>You need time for your own regulatory clocks (CERT-In 6 hours)</td></tr>
<tr><td>Right to audit or to receive assurance reports</td><td>Lets you verify, not trust</td></tr>
<tr><td>Data location, return and deletion</td><td>DPDP, client contracts</td></tr>
<tr><td>Subcontractor approval</td><td>Controls fourth-party risk</td></tr>
<tr><td>Liability and insurance</td><td>Transfers some financial impact</td></tr></tbody></table>
<h3>When a vendor falls short</h3>
<p>Do not just record "fail". Agree remediation with dates, add compensating controls on your side, or escalate a risk acceptance to the business owner who wants the vendor.</p>`,
    remember: ["Ask for evidence: SOC 2, ISO scope, pen test summary.", "Breach notice in the contract must beat your own regulatory clock.", "Gaps become remediation plans or formal acceptances."],
    checks: [
      { q: "A vendor sends an ISO 27001 certificate. What must you check?", o: ["The logo", "That the certificate scope covers the service you buy", "The price", "Nothing more"], a: 1, w: "A certificate only covers its stated scope." },
      { q: "Why should vendor breach notification be short (e.g. 24 hours)?", o: ["It is traditional", "So you can meet your own regulatory reporting deadlines", "To penalise vendors", "Auditors like short numbers"], a: 1, w: "CERT-In expects reports within 6 hours of noticing an incident." }
    ] },
  { id: "cloud", title: "Cloud and the shared responsibility model", body: `
<p>In cloud, security is split between the provider and you. Misunderstanding the split causes most cloud incidents.</p>
<table><thead><tr><th>Layer</th><th>IaaS</th><th>PaaS</th><th>SaaS</th></tr></thead><tbody>
<tr><td>Physical, network, hypervisor</td><td>Provider</td><td>Provider</td><td>Provider</td></tr>
<tr><td>Operating system, patching</td><td>You</td><td>Provider</td><td>Provider</td></tr>
<tr><td>Application</td><td>You</td><td>You (your code)</td><td>Provider</td></tr>
<tr><td>Identity, access, configuration</td><td>You</td><td>You</td><td>You</td></tr>
<tr><td>Data classification and protection</td><td>You</td><td>You</td><td>You</td></tr></tbody></table>
<p>Whatever the model, <b>identity, configuration and data are always yours</b>. A public storage bucket is a customer misconfiguration, not a cloud provider breach.</p>
<h3>GRC tasks for cloud</h3>
<ul><li>Keep an inventory of cloud accounts and SaaS, including shadow IT.</li>
<li>Use the provider's assurance reports (SOC 2, ISO 27001/27017/27018) instead of auditing the data centre.</li>
<li>Set and monitor configuration baselines (CIS Benchmarks) with posture tools.</li>
<li>Confirm data residency where clients or regulators require it.</li>
<li>Plan exit: can you get your data out, in what format, how fast?</li></ul>`,
    remember: ["Identity, configuration and data are always yours.", "Use provider reports for their layers; test your own layers.", "Plan the exit before you depend on the service."],
    checks: [
      { q: "In SaaS, who is responsible for configuring user access correctly?", o: ["The SaaS provider", "The customer", "The cloud host", "Nobody"], a: 1, w: "Identity and access configuration remains with the customer in every model." },
      { q: "An exposed storage bucket in your IaaS account is MOST likely:", o: ["A provider breach", "A customer misconfiguration", "A hardware fault", "Normal"], a: 1, w: "Configuration of resources is the customer's responsibility." }
    ] }
  ]
},
{
  id: "m7", n: 7, title: "Indian privacy and cyber regulation", short: "India: DPDP & CERT-In",
  lede: "The DPDP Act and Rules, CERT-In directions and the sector regulators you will meet, compared with GDPR.",
  lessons: [
  { id: "dpdp", title: "DPDP Act 2023 and Rules 2025", body: `
<p>The <b>Digital Personal Data Protection Act, 2023</b> governs digital personal data in India. The <b>DPDP Rules, 2025</b> were notified on 13 November 2025, with the Data Protection Board set up immediately and most obligations phased in by 13 May 2027.</p>
<h3>Key roles</h3>
<ul><li><b>Data Principal</b>: the individual.</li>
<li><b>Data Fiduciary</b>: decides why and how data is processed (like a GDPR controller).</li>
<li><b>Data Processor</b>: processes on the fiduciary's behalf. A managed SOC handling client logs that contain personal data is usually a processor for that data.</li>
<li><b>Significant Data Fiduciary</b>: designated by government for volume or sensitivity; must appoint a Data Protection Officer in India, run DPIAs and periodic audits.</li>
<li><b>Consent Manager</b>: a registered platform for giving and withdrawing consent.</li></ul>
<h3>Core obligations</h3>
<ul><li>Lawful basis: <b>consent</b> (free, specific, informed, unambiguous, with a clear notice) or certain <b>legitimate uses</b> (for example employment, legal obligations, emergencies).</li>
<li>Reasonable security safeguards, purpose limitation, erasure when the purpose is served.</li>
<li>Rights: access, correction and erasure, grievance redressal, nomination.</li>
<li>Extra care for children's data (verifiable parental consent) and persons with disabilities.</li></ul>
<h3>Breach notification</h3>
<p>Notify the Data Protection Board and each affected Data Principal. The Rules require an initial intimation without delay and a <b>detailed report to the Board within 72 hours</b> (extendable on request): what happened, likely impact, mitigation, and the findings about the person responsible where known.</p>
<h3>Penalties</h3>
<p>Up to <b>₹250 crore</b> per instance for failing to take reasonable security safeguards; up to ₹200 crore for failing to notify a breach.</p>`,
    remember: ["Fiduciary decides; processor acts on instructions.", "Consent or a legitimate use; security safeguards always.", "Breach: tell the Board and the people; detailed report within 72 hours."],
    checks: [
      { q: "Under DPDP, the organisation that decides the purpose of processing is the:", o: ["Data Principal", "Data Fiduciary", "Data Processor", "Consent Manager"], a: 1, w: "The Data Fiduciary determines purpose and means." },
      { q: "The detailed breach report to the Data Protection Board is due within:", o: ["6 hours", "24 hours", "72 hours", "30 days"], a: 2, w: "The Rules require a detailed report within 72 hours, extendable on request." }
    ] },
  { id: "certin", title: "CERT-In directions and sector regulators", body: `
<h3>CERT-In Directions (April 2022)</h3>
<p>Issued under section 70B of the IT Act, they apply to service providers, intermediaries, data centres and corporates. The headline rules:</p>
<ul><li>Report specified cyber incidents to CERT-In <b>within 6 hours</b> of noticing them (the list includes targeted scanning, compromise of critical systems, data breaches, ransomware, attacks on cloud and IoT).</li>
<li>Keep <b>ICT system logs for 180 days</b>, within India, and provide them when asked.</li>
<li>Synchronise clocks with NTP servers of NIC or NPL (or traceable to them).</li>
<li>Name a <b>point of contact</b> for CERT-In.</li>
<li>VPN, cloud and data-centre providers must keep certain customer records for five years.</li></ul>
<h3>Critical infrastructure</h3>
<p><b>NCIIPC</b> protects Critical Information Infrastructure. Systems declared CII (likely for airports, power and telecom operators) face additional controls, audits and reporting. For airports, <b>DGCA</b> and <b>BCAS</b> add aviation security requirements; for power, the <b>CEA</b> cyber security regulations and sectoral CERTs (CERT-Trans, CERT-Thermal and others) apply.</p>
<h3>Financial sector</h3>
<p>RBI master directions on IT governance and cyber security for banks and NBFCs, and <b>SEBI's Cybersecurity and Cyber Resilience Framework (CSCRF, 2024)</b> for market entities. Fintech clients will pass these requirements to you through contracts.</p>
<h3>Why it matters for a provider</h3>
<p>Your clients have regulatory clocks. If you run their SOC, your detection and escalation must be fast enough for them to report to CERT-In in 6 hours, and your contracts should say so.</p>`,
    remember: ["CERT-In: report in 6 hours, logs 180 days in India, NTP sync, a named contact.", "CII adds NCIIPC; aviation adds DGCA/BCAS; power adds CEA.", "Clients' clocks become your SLAs."],
    checks: [
      { q: "Under CERT-In directions, reportable incidents must be reported within:", o: ["1 hour", "6 hours", "72 hours", "7 days"], a: 1, w: "Six hours from noticing or being told of the incident." },
      { q: "How long must ICT logs be kept under the CERT-In directions?", o: ["30 days", "90 days", "180 days", "5 years"], a: 2, w: "180 days, maintained within Indian jurisdiction." }
    ] },
  { id: "gdpr", title: "DPDP compared with GDPR, and running privacy", body: `
<p>Clients in the UK and Singapore, and global groups, will ask about GDPR (or UK GDPR) and Singapore's PDPA. Knowing the differences lets one programme cover most of them.</p>
<table><thead><tr><th>Topic</th><th>DPDP (India)</th><th>GDPR (EU/UK)</th></tr></thead><tbody>
<tr><td>Scope</td><td>Digital personal data (and digitised offline data)</td><td>All personal data, digital or not</td></tr>
<tr><td>Lawful bases</td><td>Consent or specified legitimate uses</td><td>Six bases including legitimate interests and contract</td></tr>
<tr><td>Sensitive data category</td><td>No separate category; children's data has extra rules</td><td>Special categories with stricter rules</td></tr>
<tr><td>Breach notice</td><td>Board and every affected person; detailed report in 72 hours</td><td>Regulator within 72 hours if risk; individuals if high risk</td></tr>
<tr><td>DPO</td><td>Required for Significant Data Fiduciaries</td><td>Required in certain cases</td></tr>
<tr><td>Fines</td><td>Up to ₹250 crore per instance</td><td>Up to €20 million or 4% of global turnover</td></tr></tbody></table>
<h3>A practical privacy programme</h3>
<ol><li><b>Data inventory and map</b>: what personal data, where, why, who can see it, how long.</li>
<li><b>Notices and consent</b> that are short and specific.</li>
<li><b>Rights handling</b> with a logged process and deadlines.</li>
<li><b>Privacy impact assessments</b> for new high-risk processing.</li>
<li><b>Retention and deletion</b> enforced, not just written.</li>
<li><b>Processor contracts</b> with security and breach terms.</li>
<li><b>Breach playbook</b> combining CERT-In 6-hour and DPDP 72-hour clocks.</li></ol>`,
    remember: ["DPDP: consent or legitimate uses; GDPR has six bases.", "DPDP notifies every affected person; GDPR only when high risk.", "Build one programme: inventory, notices, rights, PIAs, retention, contracts, breach playbook."],
    checks: [
      { q: "Which is a lawful basis under GDPR but NOT under DPDP?", o: ["Consent", "Legitimate interests", "Legal obligation", "Medical emergency"], a: 1, w: "DPDP has no general legitimate interests basis; it lists specific legitimate uses." },
      { q: "The FIRST step in building a privacy programme is usually:", o: ["Appointing a lawyer", "A data inventory and map", "Buying a consent tool", "Writing a cookie banner"], a: 1, w: "You cannot protect or report on data you have not mapped." }
    ] }
  ]
},
{
  id: "m8", n: 8, title: "OT, IoT and critical infrastructure", short: "OT & critical infra",
  lede: "Why airports, power and utilities are different, IEC 62443 in practice, and governing converged IT/OT.",
  lessons: [
  { id: "otdiff", title: "Why OT is different", body: `
<p><b>Operational technology</b> controls physical processes: baggage handling, airfield lighting, HVAC, fuel systems, substations, water pumps. <b>IoT</b> adds sensors and smart devices everywhere.</p>
<table><thead><tr><th></th><th>IT</th><th>OT</th></tr></thead><tbody>
<tr><td>Top priority</td><td>Confidentiality</td><td><b>Safety and availability</b></td></tr>
<tr><td>Lifespan</td><td>3 to 5 years</td><td>15 to 30 years</td></tr>
<tr><td>Patching</td><td>Monthly</td><td>Rare; needs vendor approval and a maintenance window</td></tr>
<tr><td>Scanning</td><td>Routine</td><td>Active scans can crash controllers; use passive monitoring</td></tr>
<tr><td>Protocols</td><td>Modern, authenticated</td><td>Modbus, DNP3, BACnet: often no authentication</td></tr>
<tr><td>Owner</td><td>CIO</td><td>Engineering or operations</td></tr></tbody></table>
<h3>What this changes for GRC</h3>
<ul><li>Risk impact scales must include <b>safety</b> and <b>public service</b>, not just money.</li>
<li>"Patch within 30 days" policies do not fit; write OT standards with compensating controls (segmentation, allow-listing, monitored remote access).</li>
<li>Engineering owns OT risk. Earn trust: never propose a control that could stop a runway without them.</li>
<li>Asset inventory is hard and vital: use passive discovery tools and engineering drawings.</li></ul>
<p>Guidance to know: <b>NIST SP 800-82 Rev. 3</b> (OT security guide), <b>IEC 62443</b> series, and for converged environments, NIST CSF 2.0 profiles for manufacturing and energy.</p>`,
    remember: ["OT puts safety and availability first.", "Do not actively scan OT; patch with care; compensate.", "Engineering owns OT risk; GRC helps them govern it."],
    checks: [
      { q: "In OT, the TOP security priority is usually:", o: ["Confidentiality", "Safety and availability", "Non-repudiation", "Privacy"], a: 1, w: "Physical processes put safety and availability first." },
      { q: "Why avoid aggressive vulnerability scans on OT networks?", o: ["They are expensive", "They can crash fragile controllers and disrupt operations", "They are illegal", "OT has no vulnerabilities"], a: 1, w: "Many controllers fail under unexpected traffic; passive monitoring is preferred." }
    ] },
  { id: "iec", title: "IEC 62443: zones, conduits and security levels", body: `
<p><b>IEC 62443</b> is the international series for securing industrial automation and control systems. It speaks to asset owners, integrators and product vendors.</p>
<h3>Zones and conduits</h3>
<p>Group assets with similar security needs into <b>zones</b> (for example "baggage PLCs", "airfield lighting", "building management"). Every communication path between zones is a <b>conduit</b> with controlled, monitored traffic. This is segmentation with a design method behind it.</p>
<h3>Security levels</h3>
<table><thead><tr><th>Level</th><th>Protects against</th></tr></thead><tbody>
<tr><td>SL 1</td><td>Casual or accidental violation</td></tr>
<tr><td>SL 2</td><td>Intentional attack with simple means and low motivation</td></tr>
<tr><td>SL 3</td><td>Sophisticated attack with moderate resources and OT skills</td></tr>
<tr><td>SL 4</td><td>Sophisticated attack with extensive resources (nation-state level)</td></tr></tbody></table>
<p>You set a <b>target</b> level per zone from a risk assessment (IEC 62443-3-2), then compare to the <b>achieved</b> level.</p>
<h3>Parts you will hear about</h3>
<ul><li><b>2-1</b>: security programme for asset owners.</li>
<li><b>3-2</b>: risk assessment and zone/conduit design.</li>
<li><b>3-3</b>: system security requirements per level.</li>
<li><b>4-1 / 4-2</b>: secure product development and component requirements for vendors.</li></ul>
<h3>Remote access</h3>
<p>The most common OT attack path is a vendor's remote connection. Require a brokered remote-access solution with MFA, approval per session, recording and time limits, and keep a list of who can connect to what.</p>`,
    remember: ["Zones group assets; conduits control the paths between them.", "SL 1 accident to SL 4 nation-state; set targets per zone.", "Broker, approve and record all vendor remote access."],
    checks: [
      { q: "In IEC 62443, a controlled communication path between zones is a:", o: ["Firewall", "Conduit", "Tunnel", "Bridge"], a: 1, w: "Conduits are the defined paths between zones." },
      { q: "A zone that must resist a skilled attacker with moderate resources targets:", o: ["SL 1", "SL 2", "SL 3", "SL 4"], a: 2, w: "SL 3 covers sophisticated attacks with moderate resources and OT skills." }
    ] },
  { id: "converged", title: "Governing converged IT/OT for clients", body: `
<p>Airports and utilities run IT, OT and IoT on increasingly connected networks, monitored by one SOC. Governance must join them without pretending they are the same.</p>
<h3>Practical steps</h3>
<ol><li><b>Joint risk register</b> with an OT section, scored on safety, operations, regulatory and financial impact.</li>
<li><b>Asset inventory</b> combining IT CMDB and OT passive discovery, with criticality and owner.</li>
<li><b>Segmentation programme</b> using zones and conduits, tracked as a KRI ("OT assets reachable from corporate network").</li>
<li><b>OT-aware incident playbooks</b>: who can isolate what, and who decides to stop a process. The SOC must never shut down an OT system without operations.</li>
<li><b>Change and maintenance windows</b> agreed with engineering for any security work.</li>
<li><b>Regulatory map</b>: NCIIPC for CII, DGCA/BCAS for aviation, CEA for power.</li></ol>
<h3>Monitoring OT in a SOC</h3>
<p>OT monitoring tools (for example Nozomi, Claroty, Dragos, Tenable OT) passively decode industrial protocols and alert on new devices, unusual commands (a write to a PLC) or new remote connections. GRC's job is to make sure coverage is measured, alerts have OT-aware runbooks, and clients see it in reporting.</p>
<h3>Reporting to the client</h3>
<p>Show OT risk in operational terms: "Two baggage-handling zones can still be reached from the corporate network; target closure Q2; until then, monitored by OT alert rules 14 and 15."</p>`,
    remember: ["One register, scored for safety and operations too.", "Never isolate OT without operations deciding.", "Report OT risk in operational language."],
    checks: [
      { q: "The SOC detects malware on a baggage-handling server. The FIRST action is to:", o: ["Shut it down immediately", "Follow the OT playbook and involve operations before isolating", "Wait for the next audit", "Reimage it"], a: 1, w: "OT actions affect safety and operations; operations must decide with the SOC." },
      { q: "A good KRI for an OT segmentation programme is:", o: ["Number of firewalls bought", "OT assets reachable from the corporate network", "Training hours", "Policies approved"], a: 1, w: "It measures the risk the programme exists to reduce." }
    ] }
  ]
},
{
  id: "m9", n: 9, title: "Incidents, continuity and resilience", short: "Incidents & BCP",
  lede: "Incident governance, regulator clocks, business impact analysis, and testing that proves you can recover.",
  lessons: [
  { id: "incident", title: "Incident governance and the regulator clocks", body: `
<p>The SOC handles the technical response. GRC makes sure the <b>decisions, notifications and records</b> are right.</p>
<h3>Before an incident</h3>
<ul><li>An incident response plan with roles: incident manager, technical lead, communications, legal, executive decision-maker.</li>
<li><b>Severity levels</b> defined by impact (for example Sev 1: client critical service down or confirmed data breach).</li>
<li>A <b>notification matrix</b>: who must be told, by whom, within how long.</li>
<li>Contact lists for CERT-In, insurers, clients' incident contacts and external forensics.</li></ul>
<h3>The clocks</h3>
<table><thead><tr><th>Who</th><th>When</th></tr></thead><tbody>
<tr><td>CERT-In</td><td>Within 6 hours of noticing a reportable incident</td></tr>
<tr><td>DPDP Board and affected people</td><td>Without delay; detailed report to the Board within 72 hours</td></tr>
<tr><td>Clients</td><td>As per contract (often 24 hours or less)</td></tr>
<tr><td>Sector regulators</td><td>Per their rules (RBI, SEBI, NCIIPC)</td></tr>
<tr><td>Insurer</td><td>Per policy, often "as soon as practicable"</td></tr></tbody></table>
<h3>During and after</h3>
<p>Keep a timestamped <b>decision log</b>: what was known, what was decided, by whom. Preserve evidence. After closure, run a <b>blameless post-incident review</b> within two weeks: timeline, root cause, what went well, actions with owners. Feed actions into the risk register; track them like audit findings.</p>`,
    remember: ["GRC owns decisions, notifications and records.", "CERT-In 6 hours; DPDP detailed report 72 hours; clients per contract.", "Decision log during, blameless review after, actions tracked."],
    checks: [
      { q: "Which document BEST proves who decided what during an incident?", o: ["The SIEM alert", "A timestamped decision log", "The IR policy", "Email signatures"], a: 1, w: "A decision log records knowledge, decisions and owners in time order." },
      { q: "Post-incident actions should be:", o: ["Discussed once", "Owned, dated and tracked like audit findings", "Kept secret", "Left to the SOC"], a: 1, w: "Lessons only matter if actions are completed." }
    ] },
  { id: "bia", title: "Business impact analysis, RTO and RPO", body: `
<p>A <b>business impact analysis (BIA)</b> works out which services matter most and how fast they must come back. ISO 22301 is the standard for business continuity management.</p>
<h3>Key terms</h3>
<ul><li><b>MTPD</b> (maximum tolerable period of disruption): after this, damage becomes unacceptable.</li>
<li><b>RTO</b> (recovery time objective): target time to restore the service; must be shorter than the MTPD.</li>
<li><b>RPO</b> (recovery point objective): maximum acceptable data loss, measured in time. RPO 1 hour means backups or replication at least hourly.</li>
<li><b>MBCO</b> (minimum business continuity objective): the reduced level of service acceptable during disruption.</li></ul>
<h3>Running a BIA</h3>
<ol><li>List services and their dependencies (people, sites, systems, suppliers).</li>
<li>For each, ask: what happens after 1 hour, 4 hours, 1 day, 3 days? Score financial, client, regulatory and safety impact.</li>
<li>Set MTPD, RTO and RPO with the business owner.</li>
<li>Compare with what IT can actually deliver. The gap is a risk to treat or accept.</li></ol>
<h3>Example</h3>
<p>24×7 SOC monitoring for an airport client: MTPD 4 hours (contract SLA and safety-relevant monitoring), RTO 2 hours (failover to the secondary SOC site), RPO 15 minutes for alert data. If the SIEM restore actually takes 8 hours, that is a high risk with a clear treatment: a hot standby.</p>`,
    remember: ["RTO is time to recover; RPO is data you can lose.", "RTO must be shorter than the MTPD.", "The gap between required and achievable recovery is a risk."],
    checks: [
      { q: "Backups run every 4 hours. The best achievable RPO is about:", o: ["15 minutes", "4 hours", "1 day", "It depends on RTO"], a: 1, w: "You can lose up to the time since the last backup." },
      { q: "Which must be true?", o: ["RTO longer than MTPD", "RTO shorter than MTPD", "RPO equals RTO", "MTPD is zero"], a: 1, w: "You must recover before the disruption becomes intolerable." }
    ] },
  { id: "exercise", title: "Testing resilience: exercises that teach", body: `
<p>A plan that has never been tested is a hope. Test in increasing realism:</p>
<table><thead><tr><th>Type</th><th>What happens</th><th>Effort</th></tr></thead><tbody>
<tr><td>Plan walkthrough</td><td>Owners read the plan together and fix gaps</td><td>Low</td></tr>
<tr><td>Tabletop exercise</td><td>A facilitated scenario discussed step by step</td><td>Low to medium</td></tr>
<tr><td>Simulation</td><td>Teams act out responses with injects, no real systems touched</td><td>Medium</td></tr>
<tr><td>Technical recovery test</td><td>Restore systems from backup or fail over for real</td><td>High</td></tr>
<tr><td>Full interruption</td><td>Production actually switched; rare and risky</td><td>Very high</td></tr></tbody></table>
<h3>A tabletop in one hour</h3>
<ol><li>Scenario: "Ransomware on the corporate network at 02:00; the OT jump host shows the same indicators."</li>
<li>Inject every 10 minutes: the media calls; CERT-In's 6-hour clock; a client asks for status; backups are found encrypted.</li>
<li>Ask: who decides, who is told, what do we say, which plan step applies?</li>
<li>Close with what worked, what did not, and actions with owners.</li></ol>
<h3>Evidence from tests</h3>
<p>Auditors (ISO 27001 control 5.30, SOC 2 availability) want the plan, the test record, results against RTO and RPO, and the follow-up actions. Measure: "restored the SIEM in 3 h 10 m against an RTO of 2 h" is a useful finding, not a failure to hide.</p>`,
    remember: ["Walkthrough, tabletop, simulation, technical test, full interruption.", "Injects make tabletops real.", "Record results against RTO and RPO, and track the actions."],
    checks: [
      { q: "The LOWEST-risk way to test whether executives know their incident roles:", o: ["Full interruption test", "Tabletop exercise", "Production failover", "Pen test"], a: 1, w: "A tabletop exercises decisions without touching systems." },
      { q: "A restore took 3 hours against a 2-hour RTO. You should:", o: ["Hide it", "Record it, treat it as a risk and assign improvement actions", "Change the RTO to 3 hours quietly", "Retest until it passes"], a: 1, w: "Tests exist to find gaps; record and treat them." }
    ] }
  ]
},
{
  id: "m10", n: 10, title: "Metrics, reporting and leading GRC", short: "Reporting & leading",
  lede: "Board reporting that drives decisions, running the GRC programme, and leading people through change.",
  lessons: [
  { id: "board", title: "Reporting to the Board", body: `
<p>Boards have little time and wide responsibilities. A good cyber report helps them <b>decide</b>, not just know.</p>
<h3>A one-page structure</h3>
<ol><li><b>Headline</b>: overall posture and trend in one sentence ("Risk reduced since last quarter; one new high risk from a supplier").</li>
<li><b>Top five risks</b>: score, trend arrow, owner, treatment status, in business words.</li>
<li><b>Key indicators</b> against appetite, red/amber/green with thresholds stated.</li>
<li><b>Incidents and near misses</b> that matter, with lessons.</li>
<li><b>Audit and regulatory status</b>: findings open, overdue, upcoming audits.</li>
<li><b>Decisions needed</b>: risk acceptances, budget, priorities. Always end with what you need from them.</li></ol>
<h3>Writing for the Board</h3>
<ul><li>Lead with impact: "A ransomware event could stop airport baggage operations for up to 2 days" not "47 critical CVEs on Windows servers".</li>
<li>Use trends over snapshots, ranges over false precision.</li>
<li>Same format every quarter so changes stand out.</li>
<li>No surprises: brief the CISO and risk owners before the meeting.</li></ul>
<p>NIST CSF 2.0's <b>Govern</b> function is a useful frame: it explicitly makes cyber risk a Board-level governance responsibility.</p>`,
    remember: ["One page; end with the decisions you need.", "Impact in business words, trends over snapshots.", "No surprises: pre-brief owners."],
    checks: [
      { q: "Which line is BEST for a Board report?", o: ["47 critical CVEs remain on Windows servers", "A ransomware event could halt baggage handling for up to 2 days; fix funded and due in Q2", "The SIEM processed 2 billion events", "Firewall rules were optimised"], a: 1, w: "It states business impact and the action, which the Board can act on." },
      { q: "Every Board cyber report should end with:", o: ["A thank-you slide", "Decisions needed from the Board", "Technical appendices", "Vendor logos"], a: 1, w: "The purpose is to enable decisions." }
    ] },
  { id: "programme", title: "Running the GRC programme", body: `
<h3>The annual calendar</h3>
<table><thead><tr><th>Cadence</th><th>Activities</th></tr></thead><tbody>
<tr><td>Monthly</td><td>Risk and action review with owners, KRI refresh, evidence collection, steering committee pre-read</td></tr>
<tr><td>Quarterly</td><td>Steering committee, Board risk report, access reviews, vendor tier reviews</td></tr>
<tr><td>Half-yearly</td><td>DR / BCP tests, policy exception review</td></tr>
<tr><td>Yearly</td><td>Risk assessment refresh, policy review, internal audit, management review, ISO surveillance, SOC 2 period, awareness campaign</td></tr></tbody></table>
<h3>Your first 90 days as a GRC manager</h3>
<ol><li><b>Weeks 1-2</b>: read the risk register, SoA, last audit reports, open findings, contracts with security clauses. Meet the CISO, SOC lead, IT, legal, HR, procurement and key client managers.</li>
<li><b>Weeks 3-6</b>: map the control set to frameworks, build the evidence calendar, list every open finding with owner and date.</li>
<li><b>Weeks 7-12</b>: deliver one visible win (for example closing overdue findings or a clean access review), propose the reporting format, and agree priorities for the year.</li></ol>
<h3>Measuring the programme</h3>
<p>Overdue findings, overdue treatment actions, evidence submitted on time, policy exceptions past expiry, critical vendors without assessment. If these trend down, the programme works.</p>`,
    remember: ["Run GRC on a published calendar.", "First 90 days: read, map, deliver one visible win.", "Measure the programme by what is overdue."],
    checks: [
      { q: "A good measure of a GRC programme's health is:", o: ["Number of policies", "Trend of overdue findings and actions", "Pages in the SoA", "Size of the GRC team"], a: 1, w: "Overdue items show whether governance turns into action." },
      { q: "In your first two weeks, the MOST valuable activity is:", o: ["Rewriting all policies", "Reading the risk register, audit reports and open findings, and meeting key people", "Buying a GRC tool", "Running a pen test"], a: 1, w: "Understand the current state and people before changing anything." }
    ] },
  { id: "lead", title: "Influence, difficult conversations and your team", body: `
<p>GRC has little direct authority. You succeed through trust, clarity and persistence.</p>
<h3>Influencing without authority</h3>
<ul><li><b>Start from their goal</b>: the SOC wants fewer false positives, operations want uptime. Frame controls as help with those goals.</li>
<li><b>Make the right thing easy</b>: templates, pre-filled evidence requests, office hours before audits.</li>
<li><b>Be predictable</b>: same calendar, same format, no surprise escalations.</li>
<li><b>Escalate as a last resort</b>, with facts and a proposed decision, after telling the person first.</li></ul>
<h3>When you do not know the answer</h3>
<p>Say "Good question. I will confirm and come back to you by Thursday," write it down, and do it. Guessing in front of an auditor or a client costs more than a short delay. Your field guide's Unknowns tab has a drill for this.</p>
<h3>A difficult conversation, step by step</h3>
<ol><li>State the fact: "The Q3 access review for the SIEM was not done."</li>
<li>State the impact: "It will be an exception in the SOC 2 report the client reads."</li>
<li>Ask, do not accuse: "What got in the way?"</li>
<li>Agree a fix and a date, and write it down.</li></ol>
<h3>Mentoring analysts</h3>
<p>Give each analyst ownership of a framework or a client, review their work with them, and let them present at the steering committee. People grow by owning real outcomes.</p>`,
    remember: ["Frame controls around their goals.", "'I will confirm by Thursday' beats a guess.", "Fact, impact, question, agreed fix."],
    checks: [
      { q: "An auditor asks something you are unsure of. BEST response:", o: ["Guess confidently", "Say you will confirm and come back by a specific time, then do it", "Change the subject", "Say it is not applicable"], a: 1, w: "Accuracy and follow-through build credibility." },
      { q: "A control owner keeps missing deadlines. FIRST step:", o: ["Escalate to the CEO", "Talk to them directly: fact, impact, question, agreed fix", "Mark the control failed", "Do the task yourself"], a: 1, w: "Direct conversation first; escalate only with facts if it continues." }
    ] }
  ]
}
]);
window.GRC_READING = [
  { t: "awesome-security-GRC (curated links)", u: "https://github.com/GRC-Engineer/awesome-security-GRC", d: "The largest curated list of GRC resources on GitHub." },
  { t: "awesome-compliance (CC0)", u: "https://github.com/getprobo/awesome-compliance", d: "Tools, frameworks and standards for IT compliance, free to reuse." },
  { t: "awesome-grcengineering (CC0)", u: "https://github.com/grcengineering/awesome-grcengineering", d: "Automating GRC: compliance as code, evidence automation." },
  { t: "CISO Assistant (open-source GRC tool)", u: "https://github.com/intuitem/ciso-assistant-community", d: "Ready framework mappings for ISO 27001, NIST CSF, SOC 2 and more; great for practice." },
  { t: "NIST Cybersecurity Framework 2.0", u: "https://www.nist.gov/cyberframework", d: "The six functions, with Govern added in 2024." },
  { t: "NIST SP 800-82 Rev. 3: OT security", u: "https://csrc.nist.gov/pubs/sp/800/82/r3/final", d: "The reference guide for operational technology security." },
  { t: "DPDP Act 2023 and Rules 2025 (MeitY)", u: "https://www.meity.gov.in/", d: "The official texts and notifications." },
  { t: "CERT-In Directions, 28 April 2022", u: "https://www.cert-in.org.in/", d: "The 6-hour reporting and 180-day log rules." }
];
/* Hands-on labs: practise with real open-source GRC tools. Each tool keeps its own licence; nothing is copied from AGPL projects. */
window.GRC_LABS = [
  { id: "ciso", title: "Run an assessment in CISO Assistant", time: "3-4 hours", mods: ["m2", "m3", "m7"],
    tool: "CISO Assistant (open source, AGPL-3.0)", u: "https://github.com/intuitem/ciso-assistant-community",
    why: "A real GRC platform with 200+ frameworks already loaded, including ISO 27001:2022, India's DPDPA 2023 and the RBI Master Direction 2023. Doing a small assessment here is the closest thing to day-one work.",
    steps: ["Start the free cloud trial from intuitem.com, or run it locally with Docker: clone the repo and run ./docker-compose.sh.",
      "Load three libraries: ISO/IEC 27001:2022, India DPDPA 2023, and the Secure Controls Framework (SCF).",
      "Create a perimeter called 'Managed SOC service' with two assets: 'SIEM platform' and 'Client log data'.",
      "Start a compliance assessment against ISO 27001:2022. Assess ten controls you can reason about (5.15, 5.18, 5.19, 5.23, 5.24, 5.30, 6.3, 8.8, 8.15, 8.16) and write a one-line justification for each.",
      "Create a risk assessment with the built-in 5x5 matrix. Add five risks written as cause, event, consequence. Link each to the controls you assessed.",
      "Open the DPDPA framework and mark which requirements apply when you act as a processor of client data.",
      "Export the assessment report and compare it with Module 3's Statement of Applicability lesson."],
    deliver: "An assessment report, a five-risk register and a one-paragraph summary you could show your manager." },
  { id: "github-gap", title: "SOC 2 gap assessment of a GitHub account", time: "1-2 hours", mods: ["m4", "m5"],
    tool: "claude-grc-engineering by the GRC Engineering Club (MIT)", u: "https://github.com/GRCEngClub/claude-grc-engineering",
    why: "Shows how modern GRC collects evidence automatically from systems instead of screenshots, and maps it to SOC 2 through the Secure Controls Framework.",
    steps: ["Install Claude Code and open it in an empty folder.",
      "Add the marketplace: /plugin marketplace add GRCEngClub/claude-grc-engineering",
      "Install: /plugin install grc-engineer@grc-engineering-suite, then /plugin install github-inspector@grc-engineering-suite and /plugin install soc2@grc-engineering-suite",
      "Connect and collect: /github-inspector:setup, then /github-inspector:collect --scope=@me (use your personal GitHub, never an employer's without approval).",
      "Run /grc-engineer:gap-assessment SOC2 --sources=github-inspector",
      "For three findings, write: the SOC 2 criterion, the evidence it used, whether you agree, and the fix.",
      "Try /teach-me:control CC6.1 and /teach-me:quiz to test yourself."],
    deliver: "A gap report with three findings you have reviewed and explained in your own words." },
  { id: "comply", title: "Policies as code with Comply", time: "2 hours", mods: ["m1", "m4"],
    tool: "Comply by strongDM (Apache-2.0)", u: "https://github.com/strongdm/comply",
    why: "Version-controlled policies mapped to SOC 2 criteria, published as a website and PDFs. The same 25 templates are in this site's Library, so you can read them first.",
    steps: ["Install Comply (brew install strongdm/comply/comply, or run the Docker image).",
      "Run comply init in a new folder and choose the SOC 2 standard.",
      "Open policies/access.md and adapt it to a managed SOC: who approves SIEM access, how fast leavers are removed, how often access is reviewed.",
      "Run comply todo to see which SOC 2 criteria are not yet satisfied by any policy.",
      "Run comply serve and read your policy site in the browser.",
      "Commit the folder to a private Git repository so every change has an author and a date."],
    deliver: "A small policy set in Git, with the criteria each policy satisfies and a list of gaps." },
  { id: "probo", title: "Vendor register and SoA in Probo", time: "2-3 hours", mods: ["m6", "m3"],
    tool: "Probo (MIT)", u: "https://github.com/getprobo/probo",
    why: "An open-source GRC platform for engineering teams: risks, controls, vendors, a Statement of Applicability and document sign-off.",
    steps: ["Follow the self-hosting guide to run Probo with Docker Compose.",
      "Add five vendors a managed SOC would use: SIEM platform, cloud host, ticketing tool, HR system, OT monitoring tool.",
      "Tier each vendor as critical, high, medium or low using Module 6's criteria.",
      "For the SIEM vendor, record the SOC 2 report period, opinion, exceptions and the CUECs you must operate.",
      "Create a Statement of Applicability for ISO 27001 and mark five controls as not applicable with a real justification.",
      "Send one policy through the approval workflow and look at the signed record."],
    deliver: "A tiered vendor register and a partial SoA with justifications." },
  { id: "quant", title: "Put rupees on your top three risks", time: "1-2 hours", mods: ["m2", "m10"],
    tool: "A spreadsheet (optional: Netflix riskquant, Apache-2.0)", u: "https://github.com/Netflix-Skunkworks/riskquant",
    why: "Boards act on money. A rough range is far better than a colour.",
    steps: ["Pick three risks from Lab 1 or the field guide's risk register.",
      "For each, estimate the cost of one event as low, most likely and high (in rupees), and how often it could happen per year (low, likely, high).",
      "Calculate ALE = SLE x ARO for the most likely values, then the best and worst cases.",
      "Optional: run a simple Monte Carlo in the spreadsheet (1,000 rows of random values between low and high) and read the 90th percentile.",
      "For one risk, price a control and show the yearly saving."],
    deliver: "A one-page table you could put in a Board report: risk, annual loss range, proposed control, saving." },
  { id: "skills", title: "Practise with Claude Skills for GRC", time: "1 hour", mods: ["m7", "m3"],
    tool: "Claude Skills for GRC by Hemant Naik (MIT)", u: "https://github.com/Sushegaad/Claude-Skills-Governance-Risk-and-Compliance",
    why: "36 GRC skills, including India's DPDPA, ISO 27001, SOC 2 and third-party risk. The same reference notes are in this site's Library.",
    steps: ["Download dpdpa.skill and iso27001.skill from the repository and add them to Claude.",
      "Ask: 'We run a managed SOC that processes client logs containing personal data. Are we a Data Fiduciary or a Data Processor under DPDP, and what must our contracts say?'",
      "Ask: 'Draft a Statement of Applicability entry for ISO 27001 control 5.23 for a managed SOC using a public cloud SIEM.'",
      "Check every answer against the Library and the lessons. Note anything you would phrase differently with a client."],
    deliver: "Two short answers you have checked and corrected yourself." },
  { id: "portfolio", title: "Build a GRC portfolio", time: "a weekend", mods: ["m10"],
    tool: "Your own GitHub (ideas: Cybersecurity-Projects roadmaps, AGPL-3.0)", u: "https://github.com/CarterPerez-dev/Cybersecurity-Projects",
    why: "Showing real artefacts builds credibility with your team and clients faster than certificates.",
    steps: ["Create a private repository called grc-portfolio.",
      "Add: a risk register (Lab 1), a vendor register (Lab 4), one adapted policy (Lab 3), a quantified risk table (Lab 5) and a one-page Board report (Module 10).",
      "Use only sample data. Never put employer or client information in it.",
      "Write a README explaining what each artefact shows and which framework it maps to."],
    deliver: "A tidy repository of GRC artefacts you can talk through." }
];
/* Audit toolkit written for LearNtime: a PBC list for a SOC 2 Type II and ISO 27001 audit of a managed SOC service.
   Illustrative: adapt the items, owners and dates to the real audit scope. */
window.GRC_PBC = {
  cols: ["#", "Area", "Evidence requested", "SOC 2", "ISO 27001:2022", "Period / sample", "Owner", "Format"],
  rows: [
    [1, "Governance", "Information security policy set, with approval record and last review date", "CC1.1, CC5.3", "5.1, 5.37", "Current version", "GRC", "PDF + approval email or minutes"],
    [2, "Governance", "Organisation chart and security roles (RACI)", "CC1.3", "5.2, 5.3", "As at period end", "HR / GRC", "PDF"],
    [3, "Governance", "Steering committee and management review minutes", "CC1.2, CC4.2", "Clause 9.3", "All meetings in the period", "GRC", "Minutes with attendees and actions"],
    [4, "Governance", "ISMS scope, Statement of Applicability, risk treatment plan", "CC3.1", "Clauses 4.3, 6.1.3", "Current version", "GRC", "Approved documents"],
    [5, "Risk", "Risk assessment and risk register with owners and treatment status", "CC3.2, CC3.3", "Clause 6.1.2, 8.2", "Latest assessment", "GRC", "Register export"],
    [6, "Risk", "Signed risk acceptances and policy exceptions with expiry dates", "CC3.4", "Clause 6.1.3", "All in the period", "GRC", "Signed forms"],
    [7, "People", "Joiners list from HR; background check evidence", "CC1.4", "6.1", "Sample of 25 joiners", "HR", "System export + check reports"],
    [8, "People", "Signed confidentiality agreements and code of conduct", "CC1.1", "6.2, 6.6", "Same 25 joiners", "HR", "Signed copies"],
    [9, "People", "Security awareness training completion", "CC2.2", "6.3", "All staff; completion report", "GRC / HR", "LMS export"],
    [10, "Access", "Complete user list for the SIEM, ticketing and cloud consoles", "CC6.1", "5.15, 5.18", "As at a date in the period", "SOC / IT", "System export with timestamp"],
    [11, "Access", "Access requests and approvals for new users", "CC6.2", "5.18", "Sample of 25", "IT", "Tickets"],
    [12, "Access", "Leavers list and evidence of timely access removal", "CC6.2, CC6.3", "5.18, 6.5", "Sample of 25 leavers", "HR / IT", "HR export + deactivation logs"],
    [13, "Access", "Quarterly user access reviews with sign-off and actions", "CC6.3", "5.18", "2 of 4 quarters", "SOC manager", "Signed review + removal tickets"],
    [14, "Access", "Privileged account list, MFA configuration, session recording", "CC6.1, CC6.6", "8.2, 8.5", "As at a date", "IT", "Screenshots with date + config export"],
    [15, "Operations", "Asset inventory and configuration baselines (CIS)", "CC6.1, CC7.1", "5.9, 8.9", "Current", "IT", "CMDB export"],
    [16, "Operations", "Vulnerability scan reports and remediation within SLA", "CC7.1", "8.8", "Monthly reports; sample of 10 criticals", "SOC", "Reports + tickets"],
    [17, "Operations", "Patch compliance reports", "CC7.1", "8.8", "Sample of 3 months", "IT", "Report"],
    [18, "Operations", "EDR coverage against the asset inventory", "CC6.8", "8.7", "As at a date", "IT", "Console export"],
    [19, "Operations", "Log sources onboarded to the SIEM; 180-day retention setting", "CC7.2", "8.15, 8.16", "As at a date", "SOC", "Config export"],
    [20, "Operations", "Backup schedule, job reports and a restore test", "A1.2, A1.3", "8.13", "Sample of 5 days + latest restore test", "IT", "Job logs + test record"],
    [21, "Change", "Complete list of changes in the period", "CC8.1", "8.32", "Full population", "IT", "ITSM export"],
    [22, "Change", "Approval, testing and deployment evidence per change", "CC8.1", "8.32", "Sample of 25 (incl. emergency)", "IT", "Change tickets"],
    [23, "Incidents", "Incident response plan and its last test", "CC7.3, CC7.4", "5.24, 5.26", "Current + latest test", "SOC", "Plan + test report"],
    [24, "Incidents", "Security incident log, with CERT-In and client notifications", "CC7.4, CC7.5", "5.25, 5.26, 6.8", "Full population; sample of 5", "SOC / GRC", "Register + notifications"],
    [25, "Incidents", "Post-incident reviews and tracked actions", "CC7.5", "5.27", "All major incidents", "SOC", "Review reports"],
    [26, "Continuity", "BIA, BCP/DR plans and the latest DR test against RTO/RPO", "A1.2, A1.3", "5.29, 5.30", "Current + latest test", "IT / GRC", "Plans + test results"],
    [27, "Vendors", "Vendor inventory with risk tiers", "CC9.2", "5.19", "Current", "GRC / Procurement", "Register export"],
    [28, "Vendors", "Due diligence for critical vendors: SOC 2 reports, ISO certificates, reviews", "CC9.2", "5.19, 5.22", "All critical vendors", "GRC", "Reports + review notes"],
    [29, "Vendors", "Contracts with security, breach notice and audit clauses", "CC9.2", "5.20", "Sample of 5", "Legal", "Contract extracts"],
    [30, "Monitoring", "Internal audit report and corrective action tracker", "CC4.1, CC4.2", "Clause 9.2, 10.2", "Latest audit", "GRC", "Report + tracker"],
    [31, "Privacy", "Record of processing, privacy notice, DPDP processor clauses", "P-series (if in scope)", "5.34", "Current", "DPO / Legal", "Documents"],
    [32, "Physical", "Data centre / SOC floor access list and visitor log review", "CC6.4", "7.1, 7.2", "Sample of 2 months", "Facilities", "Access export + log"]
  ],
  how: [
    "Send it early. Ask the auditor for their own PBC list 6 to 8 weeks before fieldwork and merge it with this one, keeping their numbering.",
    "One owner and one due date per row. Add Status (not started, in progress, submitted, accepted) and Auditor comments columns when you track it.",
    "Population first, samples second. For every sampled item, give the auditor the complete population from the system; they pick the sample, not you.",
    "Evidence must be dated, show who did it and the result, and fall inside the audit period.",
    "Name files by PBC number and control, for example 13_CC6.3_Q2-access-review.pdf, and keep one shared folder per audit.",
    "Review every item before it goes to the auditor. A weak screenshot sent early causes more questions than a strong export sent a day later."
  ]
};
/* Reading room: written for LearNtime. Facts (titles, authors, years, what each framework is) with our own summaries. */
window.GRC_READING_ROOM = [
  { id: "start", title: "Where to start (first 30 days)", items: [
    ["Week 1", "Read ISO 31000 principles (Module 2) and NIST CSF 2.0's Govern function. Together they explain why risk decisions belong to the business, not the security team."],
    ["Week 2", "Skim ISO/IEC 27005:2022 for the risk method and NIST SP 800-30 Rev. 1 for a worked risk assessment. Then write five risks for a managed SOC in cause, event, consequence form."],
    ["Week 3", "Read the first half of 'How to Measure Anything in Cybersecurity Risk'. Put rupee ranges on your top three risks (Lab 5)."],
    ["Week 4", "Read 'The Cybersecurity Manager's Guide' for the people side, and follow two practitioners from the list below for daily examples."]] },
  { id: "frameworks", title: "Risk management frameworks", items: [
    ["ISO 31000:2018 Risk management", "The principles and process behind every other risk method: scope and context, assess, treat, monitor, with communication throughout. Short and readable. Start here."],
    ["IEC 31010:2019 Risk assessment techniques", "A catalogue of about 40 techniques (bow-tie, FMEA, scenario analysis, Monte Carlo) and when to use each. Use it as a reference, not a cover-to-cover read."],
    ["ISO/IEC 27005:2022", "Applies ISO 31000 to information security and fits the ISO 27001 risk clauses. It describes event-based and asset-based approaches, which helps when auditors ask how your method works."],
    ["COSO ERM (2017)", "Enterprise risk management linked to strategy and performance. Your CFO and internal audit think in COSO terms, so knowing it helps you speak their language."],
    ["NIST SP 800-37 Rev. 2 (RMF)", "The seven-step Risk Management Framework: prepare, categorise, select, implement, assess, authorise, monitor. Useful structure even outside US government."],
    ["NIST SP 800-39", "Risk at three levels: organisation, mission or business process, and system. Good for explaining why a server risk can matter to the Board."],
    ["NIST SP 800-30 Rev. 1", "How to run a risk assessment, with example tables for threat sources, likelihood and impact you can adapt."],
    ["NIST SP 800-53A Rev. 5", "How to assess controls: examine, interview and test. The same logic as SOC 2 testing and our control workbench."],
    ["NIST SP 800-161 Rev. 1", "Supply chain risk management; pairs with Module 6."],
    ["FAIR (Factor Analysis of Information Risk)", "Breaks risk into loss event frequency and loss magnitude, estimated as ranges. The standard way to put money on cyber risk."],
    ["OCTAVE (Carnegie Mellon SEI)", "A workshop-based, self-directed risk method focused on critical assets; good for small teams."],
    ["Mozilla Rapid Risk Assessment", "A 30 to 60 minute structured conversation for new services. Ideal for quick decisions on new tools."],
    ["MITRE TARA", "An engineering method to identify cyber vulnerabilities and choose countermeasures, using threat catalogues."]] },
  { id: "tools", title: "Free tools to practise with", items: [
    ["CISO Assistant (community edition)", "Free, open source GRC platform with 200+ frameworks including ISO 27001, DPDPA and the RBI direction. Runs with Docker on your laptop. See Lab 1."],
    ["Eramba community", "A long-standing free GRC tool for risks, controls, policies and audits."],
    ["Probo", "Open source GRC for engineering teams: risks, controls, vendors, a Statement of Applicability. See Lab 4."],
    ["Comply (strongDM)", "SOC 2 policies kept as Markdown in Git; its templates are in our Library. See Lab 3."],
    ["Netflix riskquant", "A small Python library for loss estimates and loss exceedance curves. See Lab 5."],
    ["MISP and OpenCTI", "Free threat intelligence platforms; the kind of tool behind control RSK-02."]] },
  { id: "books", title: "Books worth reading", items: [
    ["Security Risk Management - Evan Wheeler (2011)", "A practical, still-relevant guide to building a risk programme; each chapter ends with actions you can apply."],
    ["Measuring and Managing Information Risk: A FAIR Approach - Jack Freund and Jack Jones (2014)", "The FAIR book. Read it when you are ready to quantify risks properly."],
    ["How to Measure Anything in Cybersecurity Risk - Douglas Hubbard and Richard Seiersen (2016; 2nd ed. 2023)", "Shows that you have more data than you think and need less than you think. The best introduction to quantitative risk."],
    ["The Cybersecurity Manager's Guide - Todd Barnum (2021)", "Leading a security programme when few people care or understand: documentation, governance, architecture and communication."],
    ["ISO 27001 Controls: A Guide to Implementing and Auditing - Bridget Kenyon", "Goes through Annex A control by control: how to implement and how to audit each one. Ideal alongside our Framework map."],
    ["IT Auditing: Using Controls to Protect Information Assets - Davis, Schiller and Wheeler", "How auditors test data centres, networks, applications and cloud. Helps you understand what auditors will ask."],
    ["Transformational Security Awareness - Perry Carpenter (2019)", "Behaviour science and marketing applied to awareness; useful because GRC teams often own training."],
    ["Foundations of Information Security - Jason Andress (2019)", "A short tour of security basics; useful for colleagues new to the field."],
    ["A Leader's Guide to Cybersecurity - Thomas Parenty and Jack Domet (2019)", "Security explained for business leaders; useful for Board conversations."],
    ["Rational Cybersecurity for Business - Dan Blum (2020)", "Aligning security with the business; available free as an open-access book from Apress."]] },
  { id: "people", title: "People and teams to learn from", items: [
    ["Phil Venables", "Long-time CISO (Goldman Sachs, Google Cloud). His blog on compliance versus security and on scaling security programmes is essential reading."],
    ["Ryan McGeehan", "Writes on risk forecasting and simple risk programmes for start-ups and scale-ups."],
    ["Adobe Common Controls Framework (CCF)", "Adobe published its open common control set, the same idea as our control workbench, mapping one control to many standards."],
    ["Atlassian risk and compliance", "Writing on compliance inside fast DevOps pipelines: obligations, control objectives and automation."],
    ["On LinkedIn", "Troy Fine and AJ Yawn (SOC 2 and general GRC), Aron Lange (ISO 27001), Jacob Horne (NIST and CMMC), Ayoub Fandi (cloud-native GRC and the GRC Engineer newsletter)."]] },
  { id: "certs", title: "Certifications for a GRC manager", items: [
    ["CISSP (ISC2)", "Broad security management knowledge; the other branch of this site."],
    ["CISA (ISACA)", "IT audit. Very useful for running audits and understanding auditors."],
    ["CRISC (ISACA)", "IT risk management; closest match to the risk side of the role."],
    ["CISM (ISACA)", "Security management and programme governance."],
    ["ISO/IEC 27001 Lead Implementer or Lead Auditor", "Practical ISMS implementation or certification auditing."],
    ["CIPM or CIPP (IAPP)", "Privacy programme management; pair with DPDP knowledge."],
    ["ISA/IEC 62443 certificates", "For OT and critical infrastructure clients such as airports and power."],
    ["CCSK (Cloud Security Alliance)", "Cloud security fundamentals for cloud vendor and shared responsibility questions."]] }
];

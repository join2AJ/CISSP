/* LearNtime - regulators, laws and standards, and a spending guide for leaders. Written for LearNtime.
   Status: law = mandatory by law for anyone in scope; sector = mandatory if you are in that regulated sector;
   client = not law, but clients, contracts or card schemes require it; voluntary = good practice you choose. */
window.GRC_LANDSCAPE = [
{ id: "regulators", t: "Indian regulators and agencies", sub: "Who can inspect you, ask for reports or fine you.", items: [
  ["MeitY", "Ministry of Electronics and IT", "law", "Everyone", "Owns the IT Act and the DPDP Act; CERT-In reports to it.", "https://www.meity.gov.in/"],
  ["CERT-In", "Indian Computer Emergency Response Team", "law", "Every organisation and service provider in India", "Receives incident reports within 6 hours; issues directions and advisories; empanels security auditors.", "https://www.cert-in.org.in/"],
  ["Data Protection Board of India", "Set up under the DPDP Act", "law", "Anyone processing personal data of people in India", "Hears complaints and breach cases, can fine up to ₹250 crore per breach.", "https://www.meity.gov.in/data-protection-framework"],
  ["NCIIPC", "National Critical Information Infrastructure Protection Centre", "sector", "Operators of notified critical information infrastructure (power, banking, telecom, transport, government, strategic)", "Sets protection requirements for 'protected systems' and receives their incident reports.", "https://nciipc.gov.in/"],
  ["RBI", "Reserve Bank of India", "sector", "Banks, NBFCs, payment system operators, credit bureaus", "IT governance, cyber security and outsourcing directions, inspections and penalties.", "https://www.rbi.org.in/"],
  ["SEBI", "Securities and Exchange Board of India", "sector", "Stock exchanges, depositories, brokers, mutual funds, other market entities", "Cybersecurity and Cyber Resilience Framework (CSCRF), audits, reporting.", "https://www.sebi.gov.in/"],
  ["IRDAI", "Insurance Regulatory and Development Authority of India", "sector", "Insurers and insurance intermediaries", "Information and Cyber Security Guidelines (2023), yearly audits, incident reporting.", "https://irdai.gov.in/"],
  ["PFRDA", "Pension Fund Regulatory and Development Authority", "sector", "Pension funds and intermediaries", "Cyber security policy requirements for pension entities.", "https://www.pfrda.org.in/"],
  ["DoT and TRAI", "Department of Telecommunications; Telecom Regulatory Authority of India", "sector", "Telecom operators and telecom entities", "Telecom Cyber Security Rules 2024 under the Telecommunications Act 2023.", "https://dot.gov.in/"],
  ["CEA", "Central Electricity Authority", "sector", "Power generation, transmission and distribution companies", "Cyber security rules and guidelines for the power sector, including OT.", "https://cea.nic.in/"],
  ["DGCA, BCAS and AAI", "Aviation regulator, aviation security regulator, Airports Authority of India", "sector", "Airlines, airports and their service providers", "Safety, security programmes and IT and OT security expectations at airports.", "https://www.dgca.gov.in/"]
]},
{ id: "laws", t: "Indian laws and rules", sub: "These apply because of what you do, not because you chose them.", items: [
  ["DPDP Act 2023 and DPDP Rules 2025", "MeitY; enforced by the Data Protection Board", "law", "Anyone processing digital personal data of people in India", "Notice and consent, security safeguards, breach notice to the Board and to affected people, rights of individuals, extra duties for Significant Data Fiduciaries. Rules phase in until May 2027. Penalties up to ₹250 crore per breach.", "https://www.meity.gov.in/data-protection-framework"],
  ["CERT-In Directions (April 2022)", "CERT-In under the IT Act", "law", "Every organisation in India", "Report listed incidents within 6 hours, keep logs for 180 days in India, sync clocks to Indian time servers, name a point of contact.", "https://www.cert-in.org.in/"],
  ["IT Act 2000", "MeitY", "law", "Everyone", "Section 43A (compensation for failing to protect sensitive data), 72A (disclosure in breach of contract), 70 (protected systems), 70B (CERT-In powers).", "https://www.indiacode.nic.in/"],
  ["Companies Act 2013: internal financial controls", "Ministry of Corporate Affairs", "law", "Companies", "Directors confirm internal financial controls are adequate and working; auditors report on them. IT controls over finance systems are part of it.", "https://www.mca.gov.in/"],
  ["Telecommunications Act 2023 and Telecom Cyber Security Rules 2024", "DoT", "sector", "Telecom entities", "Security policies, incident reporting and cooperation with the government.", "https://dot.gov.in/"],
  ["Protected System rules (2018)", "MeitY / NCIIPC", "sector", "Organisations with notified protected systems", "ISMS, audits and access controls for systems declared critical.", "https://nciipc.gov.in/"]
]},
{ id: "sector", t: "Sector rule books", sub: "Detailed requirements from the regulators above.", items: [
  ["RBI IT Governance Master Direction (2023)", "RBI", "sector", "Banks, NBFCs, credit bureaus and similar", "IT strategy committee, IT and information security risk management, audits, business continuity.", "https://www.rbi.org.in/"],
  ["RBI Outsourcing of IT Services Master Direction (2023)", "RBI", "sector", "RBI-regulated entities and, by contract, their IT vendors", "Due diligence, contracts with right to audit, monitoring and exit plans for IT vendors.", "https://www.rbi.org.in/"],
  ["SEBI CSCRF (2024)", "SEBI", "sector", "SEBI-regulated entities", "Governance, identify-protect-detect-respond-recover controls, cyber audits, SOC monitoring, graded by entity size.", "https://www.sebi.gov.in/"],
  ["IRDAI Information and Cyber Security Guidelines (2023)", "IRDAI", "sector", "Insurers and intermediaries", "Information security policy, CISO, audits, 6-hour incident reporting.", "https://irdai.gov.in/"],
  ["CEA power sector cyber security", "CEA", "sector", "Power sector utilities", "Cyber security policy, CISO, OT network separation, audits, incident reporting.", "https://cea.nic.in/"]
]},
{ id: "standards", t: "Standards you can be certified or audited against", sub: "Voluntary by law, but clients and tenders often demand them.", items: [
  ["ISO/IEC 27001:2022", "ISO and IEC", "client", "Any organisation", "Information security management system with 93 Annex A controls; three-year certificate with yearly surveillance audits.", "https://www.iso.org/standard/27001"],
  ["SOC 2 (Type I and Type II)", "AICPA (US)", "client", "Service providers, especially selling to US clients", "Independent auditor's report on controls against the Trust Services Criteria; Type II covers a period, usually 6 to 12 months.", "https://www.aicpa-cima.com/"],
  ["PCI DSS v4.0.1", "PCI Security Standards Council", "client", "Anyone storing, processing or transmitting card data", "Required by the card schemes through your bank contract: network security, encryption, access control, testing, script control on payment pages.", "https://www.pcisecuritystandards.org/"],
  ["ISO 22301", "ISO", "voluntary", "Any organisation", "Business continuity management system, certifiable.", "https://www.iso.org/standard/75106.html"],
  ["ISO/IEC 27701", "ISO and IEC", "voluntary", "Organisations handling personal data", "Privacy extension to ISO 27001; helps show DPDP and GDPR readiness.", "https://www.iso.org/standard/27701"],
  ["ISO/IEC 27017 and 27018", "ISO and IEC", "voluntary", "Cloud providers and users", "Extra cloud security controls (27017) and protection of personal data in public cloud (27018).", "https://www.iso.org/standard/43757.html"],
  ["ISO/IEC 42001", "ISO and IEC", "voluntary", "Organisations building or using AI", "AI management system, certifiable.", "https://www.iso.org/standard/81230.html"],
  ["ISO/IEC 20000-1", "ISO and IEC", "voluntary", "IT service providers", "IT service management system, certifiable.", "https://www.iso.org/standard/70636.html"],
  ["IEC 62443", "IEC", "client", "Industrial and OT asset owners, integrators, product makers", "Security for industrial automation and control systems: zones, conduits, security levels. Often asked for in OT tenders.", "https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards"],
  ["CSA STAR", "Cloud Security Alliance", "voluntary", "Cloud service providers", "Self-assessment (CAIQ) or third-party audit against the Cloud Controls Matrix.", "https://cloudsecurityalliance.org/star"]
]},
{ id: "frameworks", t: "Frameworks and guidance (not certificates)", sub: "Free to use; they shape how you run the programme.", items: [
  ["NIST CSF 2.0", "NIST (US)", "voluntary", "Any organisation", "Six functions (Govern, Identify, Protect, Detect, Respond, Recover) with maturity tiers; good for Board reporting.", "https://www.nist.gov/cyberframework"],
  ["NIST SP 800-53", "NIST (US)", "voluntary", "Any organisation; required for US federal systems", "Detailed catalogue of over 1,000 controls and enhancements.", "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"],
  ["CIS Controls v8.1", "Center for Internet Security", "voluntary", "Any organisation", "18 prioritised safeguards in three implementation groups; a practical starting point.", "https://www.cisecurity.org/controls"],
  ["ISO 31000", "ISO", "voluntary", "Any organisation", "Risk management principles and process; guidance only, not certifiable.", "https://www.iso.org/iso-31000-risk-management.html"],
  ["COSO Internal Control and ERM", "COSO (US)", "voluntary", "Any organisation; used by auditors", "Internal control and enterprise risk frameworks; the basis of SOC 2 common criteria and of financial control reviews.", "https://www.coso.org/"],
  ["COBIT 2019", "ISACA", "voluntary", "Any organisation", "Governance and management of enterprise IT.", "https://www.isaca.org/resources/cobit"],
  ["MITRE ATT&CK", "MITRE", "voluntary", "Any organisation", "Knowledge base of attacker techniques; used to check that controls cover real threats.", "https://attack.mitre.org/"],
  ["FAIR", "The FAIR Institute", "voluntary", "Any organisation", "Method to put risk in money terms, useful for CFO discussions.", "https://www.fairinstitute.org/"]
]},
{ id: "foreign", t: "Foreign laws that can reach an Indian company", sub: "Apply because of where your clients or data subjects are.", items: [
  ["GDPR (EU) and UK GDPR", "EU and UK data protection authorities", "law", "If you offer services to, or monitor, people in the EU or UK, or process their data for a client", "Lawful basis, rights, breach notice in 72 hours, transfer rules; fines up to 4% of global turnover or €20 million.", "https://commission.europa.eu/law/law-topic/data-protection_en"],
  ["NIS2 (EU)", "EU member states", "client", "EU essential and important entities; Indian suppliers through contracts", "Security measures, supply-chain security, 24-hour early warning of incidents.", "https://digital-strategy.ec.europa.eu/en/policies/nis2-directive"],
  ["DORA (EU)", "EU financial supervisors", "client", "EU financial entities; Indian ICT providers through contracts", "ICT risk management, testing, incident reporting and strict third-party contract terms.", "https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en"],
  ["HIPAA (US)", "US Department of Health and Human Services", "client", "Vendors handling US health data, through Business Associate Agreements", "Safeguards for protected health information.", "https://www.hhs.gov/hipaa/"],
  ["SOX (US)", "US SEC", "client", "US-listed companies; their Indian service providers through SOC 1 reports", "Controls over financial reporting.", "https://www.sec.gov/"]
]}
];

window.GRC_STATUS = {
  law: ["Mandatory by law", "If you are in scope, there is no choice. Penalties, prosecution or licence action."],
  sector: ["Mandatory in that sector", "Binding only if your regulator or licence says so, or a regulated client passes it to you by contract."],
  client: ["Required by clients", "Not a law for you, but contracts, tenders or card schemes make it a condition of doing business."],
  voluntary: ["Voluntary good practice", "You choose it because it improves security or efficiency."]
};

/* For the CEO and CFO */
window.GRC_SPEND = {
  tools: [
    ["Control workbench", "#/grc/controls", "The list of 53 controls the company runs, each with an owner, the evidence it produces and how it was tested.", "Are our controls actually working, and who is accountable for each one?"],
    ["Framework map", "#/grc/map/iso", "Shows which of those controls satisfy which requirement in ISO 27001, SOC 2, NIST CSF, Indian rules and IEC 62443.", "If we build a control once, how many audits and regulators does it satisfy? It stops you paying twice for the same work."],
    ["Evidence calendar", "#/grc/calendar", "A month-by-month list of the evidence each department owes, with chase dates.", "Will the audit be calm? Evidence collected through the year makes audits shorter and cheaper."],
    ["Vendor register", "#/grc/vendors", "Every supplier, the data they hold, their access, their tier and open risks.", "Which suppliers could hurt us, and are we protected by contract and controls?"],
    ["PBC list", "#/grc/pbc", "The evidence auditors will ask for, with owners and formats.", "How much staff time will the audit take?"],
    ["Risk matrix and diagrams", "#/grc/visuals/matrix", "One risk scored before and after controls, the reporting lines, data flows.", "What did our spending actually reduce?"]
  ],
  tiers: [
    { id: "must", t: "Mandatory", sub: "Spend first. The cost of not doing it is a fine, prosecution or losing a licence.", items: [
      ["DPDP readiness", "Privacy notices and consent, record of processing, breach procedure, DPAs with vendors, reasonable security safeguards.", "Penalties up to ₹250 crore per breach; ₹200 crore for failing to notify a breach."],
      ["CERT-In compliance", "180 days of logs kept in India, clocks synced, a 6-hour incident reporting process and a named contact.", "Offence under section 70B of the IT Act; also the evidence you need after any incident."],
      ["Your sector regulator's rules", "RBI, SEBI, IRDAI, CEA or others if they regulate you or your clients.", "Inspections, penalties, restrictions on business."],
      ["Internal financial controls", "Access and change controls on finance systems, with evidence.", "Auditor qualification of the accounts; directors' liability."],
      ["PCI DSS, only if you handle card data", "Scope reduction first (use a payment provider), then the controls.", "Fines from the card schemes through your bank, or losing card acceptance."]
    ]},
    { id: "essential", t: "Essential", sub: "Spend next. Protects revenue and survival; clients and insurers expect it.", items: [
      ["Basics that stop most attacks", "MFA everywhere, endpoint detection (EDR), patching to a deadline, privileged access control.", "Stolen passwords and unpatched systems cause most breaches."],
      ["Backups you have restored", "Offline or immutable copies, restore tested at least twice a year.", "The difference between a bad week and a closed business after ransomware."],
      ["ISO 27001 certification", "If clients or tenders ask for it, which they usually do for a managed SOC.", "Lost deals; longer security questionnaires."],
      ["SOC 2 Type II", "If you sell to US clients.", "US buyers often won't sign without it."],
      ["Incident response retainer and cyber insurance", "Experts on call, and cover for response costs and liability.", "Hours matter in a breach; insurers now require MFA and backups first."],
      ["Yearly VAPT and Tier 1 vendor reviews", "External testing by a CERT-In empanelled auditor; due diligence on critical vendors.", "Regulators and clients ask for both."],
      ["Security awareness", "Short training and phishing tests for all staff.", "Phishing is still the most common way in."]
    ]},
    { id: "nice", t: "Good to have", sub: "Spend when the first two are done, or when a client or regulator asks.", items: [
      ["Extra certifications", "ISO 22301 (continuity), ISO 27701 (privacy), ISO 42001 (AI).", "Useful for specific tenders and markets."],
      ["GRC automation platform", "Collects evidence and tracks controls automatically.", "Saves staff time once the programme is stable."],
      ["Risk quantification (FAIR)", "Risk expressed in rupees.", "Better budget decisions for large programmes."],
      ["Red teaming and maturity benchmarks", "Realistic attack simulation; NIST CSF maturity scoring.", "Shows how good, not just whether compliant."]
    ]}
  ],
  costs: [
    ["DPDP readiness programme (one-off, with a consultant)", "₹5 to 25 lakh"],
    ["ISO 27001: implementation help (one-off)", "₹5 to 20 lakh"],
    ["ISO 27001: certification body audits (per year)", "₹2 to 8 lakh"],
    ["SOC 2 Type II audit (per year)", "₹10 to 40 lakh"],
    ["VAPT by a CERT-In empanelled auditor (per year)", "₹2 to 15 lakh"],
    ["EDR and MFA licences (per user, per year)", "₹2,000 to 8,000"],
    ["Incident response retainer (per year)", "₹5 to 25 lakh"],
    ["Cyber insurance (per year, depends on cover and revenue)", "₹3 to 30 lakh"]
  ]
};

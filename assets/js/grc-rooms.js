/* LearNtime - Scenario rooms: timed GRC situations with an inbox, a desk of evidence, decisions and a written reply.
   Original scenarios written for LearNtime. Companies and people are fictional. */
window.GRC_ROOMS = [
{ id: "six-hours", t: "The 6-hour clock", level: "Intermediate", mins: 25, mod: "m9",
  brief: "It is 02:10. The night shift has found data leaving a client's network. You are the GRC Manager at Kavach SOC, a managed security provider. Work out who must be told, by when, and what you say when the client asks awkward questions.",
  client: "Meridian Finance (an NBFC)",
  steps: [
    { at: "02:10", inbox: [
        { from: "Ravi, SOC shift lead", subj: "Possible exfiltration at Meridian Finance", body: "SIEM alert at 01:40: 4 GB uploaded from Meridian's file server to an unknown cloud storage site. Triaged at 01:55 and confirmed as unusual. EDR also shows a new local admin account created at 01:32. Contained the server at 02:05. What do we do now?" } ],
      desk: [
        { t: "CERT-In Directions (2022)", d: "Listed incidents must be reported to CERT-In within 6 hours of noticing them." },
        { t: "Meridian contract, clause 14", d: "Kavach must tell Meridian's CISO within 2 hours of a confirmed security incident." },
        { t: "Incident response plan, step 1", d: "Open an incident record, name an incident lead, start the timeline." }],
      q: "What is your first move?",
      opts: [
        { t: "Wait until the morning, when the team can confirm what happened", s: 0, fb: "The clocks are already running: the incident was noticed at 01:55. Waiting until morning breaks the 2-hour contract clause and puts the 6-hour CERT-In deadline at risk." },
        { t: "Open the incident record, start the timeline, wake the incident lead and call Meridian's CISO", s: 2, fb: "Right. The record and timeline protect everyone later. Meridian must hear from you by 03:55 under the contract, and they own the CERT-In report for their own systems, so they need to know now." },
        { t: "File the CERT-In report yourself before doing anything else", s: 1, fb: "Fast, but not the best first step. The affected organisation, Meridian, normally reports its own incident. Agree with them who files, and don't let it slip; but first, open the record and tell the client." }] },
    { at: "03:05", inbox: [
        { from: "Anita, CISO, Meridian Finance", subj: "RE: Security incident", body: "Thanks for calling. Please don't report anything to CERT-In yet. Our legal team is in at 9 and they'll want to review every word." } ],
      desk: [
        { t: "Timeline", d: "Noticed 01:55. The 6-hour CERT-In deadline is 07:55. Legal arrives at 09:00." },
        { t: "CERT-In FAQ", d: "An initial report with the facts known so far is acceptable; details can follow." }],
      q: "How do you answer Anita?",
      opts: [
        { t: "Agree to wait for legal; it's their call", s: 0, fb: "Waiting until 09:00 misses the deadline by an hour. Being agreeable here leaves both companies exposed." },
        { t: "Explain the 07:55 deadline and offer to draft a short initial report with the known facts for her approval by 06:30", s: 2, fb: "Right. You respect that it is her report, but you make the deadline impossible to miss and remove the work from her plate. Legal can add detail in the follow-up." },
        { t: "File the report on Meridian's behalf without telling her", s: 0, fb: "This breaks trust and probably your contract. Push hard, but stay in the open." }] },
    { at: "04:20", inbox: [
        { from: "Ravi, SOC shift lead", subj: "What was taken", body: "Forensics on the upload: KYC folders. Scans of PAN and Aadhaar cards and loan forms for about 12,000 customers." } ],
      desk: [
        { t: "DPDP Act and Rules", d: "A Data Fiduciary must tell the Data Protection Board and each affected person about a personal data breach." },
        { t: "RBI directions", d: "Regulated entities must report cyber incidents to the RBI." }],
      q: "Personal data is involved. What else is now triggered?",
      opts: [
        { t: "DPDP breach notices to the Data Protection Board and to the 12,000 customers, plus reporting to the RBI. Meridian owns these; Kavach supports with facts", s: 2, fb: "Right. Meridian is the Data Fiduciary and the RBI-regulated entity. Your job is to give them accurate facts quickly and keep the timeline straight." },
        { t: "Nothing more; the CERT-In report covers it", s: 0, fb: "CERT-In is one regulator. DPDP and the RBI have their own duties, and the customers have a right to be told." },
        { t: "Put a notice on Kavach's own website", s: 0, fb: "It is Meridian's data and Meridian's customers. Public statements are theirs to make, with legal advice." }] },
    { at: "06:40", inbox: [
        { from: "Anita, CISO, Meridian Finance", subj: "Draft report?", body: "Okay, send me the draft. Keep it short." } ],
      desk: [
        { t: "What you know", d: "Times, affected server, the new admin account, the destination of the upload, containment at 02:05, data types involved." },
        { t: "What you don't know yet", d: "How the attacker got in; whether other servers are affected." }],
      q: "What goes into the initial CERT-In report?",
      opts: [
        { t: "Wait until the root cause is known so the report is complete", s: 0, fb: "That could take days. The rule is about speed; mark it initial and update later." },
        { t: "The facts known so far, affected systems, indicators, actions taken and a contact, clearly marked as an initial report", s: 2, fb: "Right. Clear, factual, and honest about what is still unknown." },
        { t: "Attach the raw SIEM export and let CERT-In work it out", s: 1, fb: "Evidence helps, but a dump without a summary is hard to act on. Lead with a clear summary; offer logs on request." }] },
    { at: "Next day, 10:00", inbox: [
        { from: "Anita, CISO, Meridian Finance", subj: "For the Board", body: "Our Board meets at noon. Can you confirm in writing that your SOC detected this within the SLA?" } ],
      desk: [
        { t: "Upload alert", d: "Fired 01:40, triaged 01:55: within the 15-minute SLA for critical alerts." },
        { t: "Admin-account rule", d: "Should have fired at 01:32. It had been switched off during tuning last week. No approved change ticket.", flag: true }],
      q: "What do you confirm?",
      opts: [
        { t: "Confirm the SLA was met and leave out the disabled rule", s: 0, fb: "Technically true and badly misleading. When it comes out, and it will, trust in Kavach is gone." },
        { t: "Confirm the upload alert met the SLA, and say plainly that the admin-account rule had been disabled without approval, with what you are doing about it", s: 2, fb: "Right. Clients forgive mistakes they hear about from you. They don't forgive ones they discover." },
        { t: "Point out that Meridian's weak passwords caused the incident", s: 0, fb: "Maybe partly true, but it is not the question, and it reads as deflection on the worst day of their year." }] }
  ],
  reply: { to: "Anita, CISO, Meridian Finance", subj: "Detection timeline for your Board", prompt: "Pick the sentences for your written reply. Choose what is true and useful; leave out anything that misleads.",
    parts: [
      { t: "Our SIEM alert for the data upload fired at 01:40 and was triaged at 01:55, within the 15-minute SLA.", good: true },
      { t: "The rule that should have caught the new admin account at 01:32 had been switched off during tuning without an approved change. That was our failure.", good: true },
      { t: "We have switched the rule back on, are reviewing every rule change from the last 90 days, and will share the review with you by Friday.", good: true },
      { t: "The initial CERT-In report went in at 07:30, and we will give you whatever facts you need for the DPDP and RBI notices.", good: true },
      { t: "Our monitoring worked exactly as designed throughout.", good: false, why: "Not true: a rule was off without approval." },
      { t: "No SOC could have detected this attack any earlier.", good: false, why: "The disabled rule would have caught it 8 minutes earlier." },
      { t: "We suggest you don't tell customers until the investigation is finished.", good: false, why: "DPDP requires telling affected people; delay is a legal risk for Meridian." }] },
  debrief: ["The clock starts when an incident is noticed, not when it is convenient.", "The affected organisation owns its regulatory reports; the service provider makes them easy and on time.", "Personal data triggers DPDP duties on top of CERT-In and the sector regulator.", "A change made without approval (here, a disabled rule) is a control failure: record it, fix it, review similar changes."],
  links: [["Module 9: Incidents and continuity", "#/grc/m9"], ["Module 7: DPDP and CERT-In", "#/grc/m7"], ["INC-02 Incident logging and regulatory notification", "#/grc/controls/INC-02"], ["CHG-01 Change management", "#/grc/controls/CHG-01"]] },

{ id: "friday-signing", t: "Signed by Friday", level: "Beginner", mins: 20, mod: "m6",
  brief: "Marketing wants a new AI chatbot on the website by Friday. The contract is ready to sign. You have three days to decide whether it is safe, and on what terms.",
  client: "Kavach SOC (your own company)",
  steps: [
    { at: "Tuesday 09:30", inbox: [
        { from: "Neha, Head of Marketing", subj: "Quick sign-off needed", body: "We're adding ChatLeaf to the website so visitors can ask questions. It saves the chats to train answers. Legal says it's fine if security agrees. Can you approve by Friday?" } ],
      desk: [
        { t: "ChatLeaf set-up", d: "A script on every page of our website. Stores chat transcripts, which may include names, emails and phone numbers." },
        { t: "Vendor tiering rule", d: "Personal data plus code running on our site = Tier 1 (full due diligence)." }],
      q: "Which tier is ChatLeaf?",
      opts: [
        { t: "Tier 3: it's a marketing tool and costs little", s: 0, fb: "Cost doesn't set the tier; data and access do. A script on every page that stores personal data is high risk, as the OPTIMJACK attack showed." },
        { t: "Tier 1: it holds personal data and runs code on our website", s: 2, fb: "Right. That means full due diligence before signing." },
        { t: "No tier needed; Legal has already agreed", s: 0, fb: "Legal reviewed the contract terms, not the security risk. Every vendor gets a tier." }] },
    { at: "Wednesday 11:00", inbox: [
        { from: "ChatLeaf sales", subj: "Your security questions", body: "Attached: our SOC 2 Type I report from last March, our standard terms, and our sub-processor list." } ],
      desk: [
        { t: "SOC 2 Type I", d: "Describes controls at one point in time, 18 months ago. It doesn't show they worked over a period.", flag: true },
        { t: "Standard terms", d: "Breach notice within 72 hours. No data processing agreement (DPA). Governing law: Delaware, USA.", flag: true },
        { t: "Sub-processors", d: "Chats are stored with a cloud provider in Singapore." }],
      q: "Which finding matters most for us?",
      opts: [
        { t: "No DPA and a 72-hour breach notice, while we must report to CERT-In within 6 hours and protect personal data under DPDP", s: 2, fb: "Right. Without a DPA you have no binding control over what they do with the data, and 72 hours makes our own deadlines impossible." },
        { t: "The sub-processor is in Singapore", s: 1, fb: "Worth noting and disclosing in our privacy notice, but DPDP allows transfers except to countries the government restricts. The contract gaps are bigger." },
        { t: "The SOC 2 report is Type I", s: 1, fb: "A real gap: ask for a Type II or a bridge letter. But the missing DPA and slow breach notice are more serious." }] },
    { at: "Thursday 10:00", inbox: [
        { from: "Neha, Head of Marketing", subj: "Are we good?", body: "The launch campaign is booked for Monday. Please tell me we can sign." } ],
      desk: [
        { t: "Options", d: "Accept as is; fix before signing; sign with compensating controls; reject." },
        { t: "Risk appetite", d: "Personal data: medium residual risk or below." }],
      q: "What do you recommend?",
      opts: [
        { t: "Accept as is to protect the launch", s: 0, fb: "That leaves high residual risk on personal data, outside the appetite. The launch date isn't a control." },
        { t: "Sign only once there is a DPA with 24-hour breach notice, and add controls: mask phone and email before chats are stored, allow-list the script in our CSP, and ask for SOC 2 Type II within 6 months", s: 2, fb: "Right. Fixes the contract gap and adds compensating controls for what can't be fixed by Friday. Residual risk drops to medium." },
        { t: "Reject ChatLeaf outright", s: 1, fb: "Safe, but GRC's job is to enable the business safely. There is a workable path here, so offer it first." }] },
    { at: "Thursday 16:00", inbox: [
        { from: "ChatLeaf sales", subj: "DPA", body: "We can sign our standard DPA with 24-hour breach notice, but we can't change the governing law." } ],
      desk: [
        { t: "Vendor register", d: "New entry needed: data, access, tier, risks, controls, review date." }],
      q: "Governing law stays Delaware. What do you do?",
      opts: [
        { t: "Record it as an accepted risk, signed by the Head of Marketing as risk owner, and review at renewal", s: 2, fb: "Right. Not every gap is a deal-breaker. Make the decision visible, owned and time-limited." },
        { t: "Ignore it; nobody reads governing law", s: 0, fb: "If there is ever a dispute, it matters a lot. Unrecorded risk is the kind auditors find." },
        { t: "Cancel the deal over it", s: 1, fb: "Possible, but out of proportion for a low-value marketing tool with masking in place." }] }
  ],
  reply: { to: "Neha, Head of Marketing", subj: "ChatLeaf: approved with conditions", prompt: "Pick the sentences for your approval email.",
    parts: [
      { t: "ChatLeaf can go live once the DPA with 24-hour breach notice is signed.", good: true },
      { t: "Before launch, the team will mask phone numbers and emails before chats are stored, and add the ChatLeaf script to our Content Security Policy.", good: true },
      { t: "Because the contract stays under US law, I need you, as risk owner, to sign the risk acceptance; we review it at renewal.", good: true },
      { t: "We'll ask ChatLeaf for a SOC 2 Type II report within six months.", good: true },
      { t: "Security has no concerns, go ahead.", good: false, why: "Not true, and it hides conditions she must meet." },
      { t: "It's approved, but if anything goes wrong it's Marketing's problem.", good: false, why: "Risk ownership is a shared, signed decision, not a threat." }] },
  debrief: ["Tier by data and access, never by price.", "A SOC 2 Type I is a snapshot; ask for Type II or a bridge letter.", "The contract must let you meet your own deadlines (6-hour CERT-In, DPDP).", "When you can't fix everything, add compensating controls and get a named owner to accept what is left."],
  links: [["Module 6: Third-party risk", "#/grc/m6"], ["Vendor register", "#/grc/vendors"], ["TPR-03 Security clauses in supplier contracts", "#/grc/controls/TPR-03"], ["Briefing: OPTIMJACK", "#/grc/briefings/optimjack"]] },

{ id: "audit-week", t: "Audit week", level: "Intermediate", mins: 20, mod: "m4",
  brief: "Fieldwork for your SOC 2 Type II audit is under way. The auditor has tested leavers, and the results are not good. Handle the exception the way an experienced GRC Manager would.",
  client: "Kavach SOC (your own company)",
  steps: [
    { at: "Monday 15:10", inbox: [
        { from: "Priya, external auditor", subj: "Leaver testing: exceptions", body: "We sampled 25 leavers. For 3 of them, access to the client portal was removed 9, 17 and 40 days after their last day. Please explain." } ],
      desk: [
        { t: "Control IAM-02", d: "Leaver access removed within 1 business day of the last working day." },
        { t: "HR leaver report", d: "Sent to IT by email every Friday." }],
      q: "What is your first step?",
      opts: [
        { t: "Ask the auditor to swap those 3 for different samples", s: 0, fb: "Never. Asking to change samples is a red flag that damages the whole audit." },
        { t: "Check the 3 cases yourself against HR and system records and confirm the facts to the auditor", s: 2, fb: "Right. Verify before you explain, and never argue with evidence you haven't checked." },
        { t: "Tell the auditor the control is fine and the dates are wrong", s: 0, fb: "You don't know that yet. If the dates are right, you've just lost credibility." }] },
    { at: "Tuesday 10:00", inbox: [
        { from: "Arjun, IT manager", subj: "Leavers", body: "The dates are right. HR's Friday email sometimes reaches us a week late, and one leaver was missed entirely. Also: the 40-day one logged in on day 12 after leaving." } ],
      desk: [
        { t: "Login record", d: "Former employee logged in on day 12 and downloaded two client reports.", flag: true }],
      q: "A former employee logged in after leaving. What now?",
      opts: [
        { t: "Fix the control; the login doesn't matter now", s: 0, fb: "It matters a lot: client data may have left the company. This is a possible incident, not just an audit finding." },
        { t: "Treat it as a possible security incident: open an incident record, find out what was downloaded and why, and assess whether clients must be told", s: 2, fb: "Right. The audit exception just uncovered a real event. It now runs through the incident process, including contract and DPDP checks." },
        { t: "Ask the auditor not to mention the login", s: 0, fb: "Never ask an auditor to leave something out. It is also likely to be found anyway." }] },
    { at: "Wednesday 12:00", inbox: [
        { from: "Priya, external auditor", subj: "Root cause?", body: "What is the root cause, and what will management say in the report?" } ],
      desk: [
        { t: "Facts", d: "HR's report is weekly and manual; IT works from email; nobody checks that every leaver was processed." }],
      q: "What is the root cause?",
      opts: [
        { t: "Human error by IT", s: 0, fb: "That is a symptom. The process relied on a weekly manual email with no completeness check, so errors were bound to happen." },
        { t: "The design: a weekly manual hand-off with no check that every leaver was processed", s: 2, fb: "Right. Design causes need design fixes: an automatic feed from HR and a monthly reconciliation of leavers against active accounts." },
        { t: "HR doesn't care about security", s: 0, fb: "Blame doesn't fix anything and won't read well in a report the client sees." }] }
  ],
  reply: { to: "Priya, external auditor", subj: "Management response: leaver access", prompt: "Pick the sentences for the management response that will appear in the SOC 2 report.",
    parts: [
      { t: "Management agrees with the exception: for 3 of 25 leavers, access was removed later than one business day.", good: true },
      { t: "The cause was a weekly manual hand-off from HR with no completeness check.", good: true },
      { t: "From 1 January, leavers will be disabled automatically from the HR system on their last day, and IT will reconcile leavers against active accounts every month.", good: true },
      { t: "One former employee accessed two reports after leaving; this was handled as a security incident and the affected client was informed.", good: true },
      { t: "The exceptions were caused by one careless IT employee, who has been warned.", good: false, why: "Blames a person for a design failure and doesn't fix anything." },
      { t: "Management considers these exceptions immaterial.", good: false, why: "Not credible when one leads to a login and data download." }] },
  debrief: ["Never ask to change samples or leave things out; verify, then explain.", "An audit exception can uncover a real incident; route it through incident response.", "Find the design cause, not the person to blame.", "A good management response agrees with the facts, names the cause, and commits to dated fixes."],
  links: [["Module 4: SOC 1 and SOC 2", "#/grc/m4"], ["IAM-02 Leaver access removal", "#/grc/controls/IAM-02"], ["PBC list", "#/grc/pbc"], ["Mistakes log", "#/grc/log"]] }
];

window.GRC_FAVS_SEED = [
  { t: "GRC Engineer", u: "https://grcengineer.com/", n: "Ayoub Fandi's newsletter on GRC engineering. Start with: The GRC work CISOs would keep isn't the work you're doing.", a: "https://grcengineer.com/p/the-grc-work-cisos-would-keep-isn-t-the-work-you-re-doing/" },
  { t: "GRC Playground", u: "https://grcplayground.com/", n: "Free GRC practice by Ashley Pearce: browser scenarios (RMF, FIPS 199, vendor reviews, authorisations) and hands-on builds with Trivy, Gatekeeper and Terraform in your own repo." }
];

/* LearNtime - GRC briefings. Written for LearNtime in our own words. News facts are summarised from the linked reports;
   MITRE ATT&CK® is a registered trademark of The MITRE Corporation, used here with attribution under its terms of use. */
window.GRC_BRIEFINGS = [
{ id: "geopolitics", kicker: "Third-party risk · geopolitics", date: "2026-11-26", mins: 9,
  t: "What if your cloud vendor gets political?",
  sum: "Sanctions can switch off a service you pay for, even when your own company has done nothing wrong. How to find that exposure, check your contracts and build a way out before you need it.",
  html: `
<p class="lede-s">Most vendor risk reviews ask whether a supplier is secure. Fewer ask whether the supplier is <b>allowed</b> to keep serving you. Sanctions, export controls and court orders sit outside your security controls, but they can stop email, storage or a SIEM overnight.</p>
<div class="bf-case"><b>It has happened in India.</b> In July 2025 Microsoft suspended email and Teams access for Nayara Energy, an Indian refiner 49% owned by Russia's Rosneft, after the EU added Nayara to a sanctions list. India had not sanctioned anyone; the vendor was applying EU rules to an Indian customer. Nayara went to the Delhi High Court and Microsoft restored access just before the hearing, but for days a large company had lost its everyday tools. In September 2026 the Delhi High Court also directed SAP India to restore software and support services to Nayara. In 2022 many Western SaaS providers stopped serving Russian customers within weeks.</div>
<h2>1. Run a "sanctions shadow" assessment</h2>
<p>The shadow is the sanctions risk you inherit from your vendors and their owners, even if you are not a target yourself.</p>
<ol>
<li><b>List every vendor that runs something you can't work without:</b> email and collaboration, cloud hosting, storage and backup, identity (SSO), the SIEM and EDR, payments, payroll. Use the <a href="#/grc/vendors">vendor register</a>.</li>
<li><b>Find the parent company and where it is incorporated.</b> A local-looking reseller can be owned by a group abroad. Look at the contract's legal entity, the annual report and the ultimate beneficial owner.</li>
<li><b>Check which regimes can bind each vendor:</b> US (OFAC lists and export controls), EU, UK (OFSI) and UN sanctions. A US-owned provider must follow US rules worldwide; an EU provider follows EU rules.</li>
<li><b>Check your own links:</b> do you, your parent or a major shareholder have owners, customers or projects in a sanctioned country or sector (energy, defence, shipping)? That is what makes a vendor nervous.</li>
<li><b>Score it.</b> Exposure is high when a critical service comes from a foreign-parented vendor <i>and</i> your group has any sanctioned-country link. Put it in the risk register with the business owner as risk owner.</li>
</ol>
<h2>2. Review your contracts</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Look for</th><th>Why</th><th>What good looks like</th></tr></thead><tbody>
<tr><td>Sanctions and compliance clause</td><td>Most standard cloud terms let the vendor suspend or end service at once if continuing would break a law that applies to it</td><td>You can't remove it, but you can add notice and a wind-down period</td></tr>
<tr><td>Advance notice and grace period</td><td>Gives you time to export data and switch</td><td>Written notice and at least 30 days of read-only access to export, where the law allows</td></tr>
<tr><td>Data return and export</td><td>Data you can't get out is the real lock-in</td><td>Export in a standard format at any time, at no extra cost, plus deletion certificate</td></tr>
<tr><td>Governing law and courts</td><td>Decides where you can fight a suspension</td><td>Indian law and Indian courts or arbitration seated in India, as Nayara relied on</td></tr>
<tr><td>Data location</td><td>Data held abroad is harder to reach in a dispute</td><td>India region for primary data; know where backups sit</td></tr>
</tbody></table></div>
<h2>3. Build preventive controls</h2>
<ul>
<li><b>A second route for mission-critical tools.</b> Not full multi-cloud for everything, which is expensive, but a tested fallback for the few services you can't lose: a backup email domain on a different provider, a second storage location, break-glass accounts outside the main identity provider.</li>
<li><b>Data escrow or export automation.</b> A scheduled job that exports mail, files and key SaaS data to storage you control, and a yearly test that you can restore it somewhere else.</li>
<li><b>A "SaaS blackout" runbook.</b> Who decides, how staff and clients are told, which fallback is switched on first, and how the SOC keeps monitoring if the SIEM vendor is the one that disappears.</li>
<li><b>Board visibility.</b> One line in the quarterly risk report: number of critical services exposed to a single foreign jurisdiction, and the status of their fallbacks.</li>
</ul>
<h3>Runbook template: SaaS blackout</h3>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Step</th><th>Who</th><th>Within</th></tr></thead><tbody>
<tr><td>Confirm the suspension with the vendor and legal; record time and scope</td><td>IT head, legal</td><td>1 hour</td></tr>
<tr><td>Invoke the continuity plan; tell the CISO, CEO and affected clients</td><td>Crisis lead</td><td>2 hours</td></tr>
<tr><td>Switch to the fallback (backup mail domain, secondary storage, break-glass identity)</td><td>IT operations</td><td>4 hours</td></tr>
<tr><td>Restore the latest export to the fallback</td><td>IT operations</td><td>24 hours</td></tr>
<tr><td>Check regulatory and client notification duties (CERT-In, RBI, contracts)</td><td>GRC Manager</td><td>6 hours</td></tr>
<tr><td>Decide: legal challenge, negotiate, or migrate for good</td><td>Risk owner with legal</td><td>5 days</td></tr>
</tbody></table></div>
<p class="bf-try"><b>Try it:</b> open the <a href="#/grc/vendors">vendor register</a>, load the example vendors and look at the "sanctions shadow" column on the dashboard. Then read Module 6 on third-party risk and Module 9 on continuity.</p>
<p class="bf-src">Sources: <a href="https://theprint.in/economy/microsoft-restores-services-to-nayara-lawsuit-disposed-of/2707726" target="_blank" rel="noopener">ThePrint on Microsoft and Nayara</a> (July 2025); <a href="https://www.business-standard.com/india-news/sap-restore-nayara-energy-services-delhi-hc-eu-sanctions-126092200448_1.html" target="_blank" rel="noopener">Business Standard on SAP and Nayara</a> (Sept 2026); <a href="https://ofac.treasury.gov/" target="_blank" rel="noopener">US OFAC</a>; <a href="https://www.sanctionsmap.eu/" target="_blank" rel="noopener">EU sanctions map</a>; <a href="https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation" target="_blank" rel="noopener">UK OFSI</a>; <a href="https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list" target="_blank" rel="noopener">UN consolidated list</a>.</p>` },

{ id: "attack", kicker: "Threat-informed GRC", date: "2026-11-26", mins: 10,
  t: "MITRE ATT&CK: the philosophy, and how a GRC Manager uses it",
  sum: "ATT&CK lists what real attackers do, step by step. GRC uses it to check that controls stop or spot the techniques that matter to you, instead of ticking every box in a standard.",
  html: `
<p class="lede-s"><b>MITRE ATT&CK</b> is a free, public knowledge base of how attackers behave, built from real incidents. ISO 27001 and SOC 2 tell you which controls to have. ATT&CK tells you what those controls are up against.</p>
<h2>The philosophy</h2>
<ul>
<li><b>Behaviour, not tools.</b> Attackers change malware and IP addresses every week; their behaviour (phishing, stealing passwords, moving to other machines) changes slowly. Defend against behaviour and your controls stay useful longer.</li>
<li><b>Tactics are the "why", techniques are the "how".</b> A tactic is the attacker's goal at a stage, such as Initial Access or Exfiltration. A technique is the way they achieve it, such as Phishing (T1566). Procedures are what a specific group actually did.</li>
<li><b>Observed in the wild.</b> Techniques are added because they were seen in real attacks, so it is evidence, not theory.</li>
<li><b>Assume breach.</b> It covers the whole attack, not just the front door. Good defence can catch an attacker at many stages.</li>
<li><b>Not a checklist to finish.</b> There are hundreds of techniques. Nobody covers them all; you cover the ones your likely attackers use.</li>
</ul>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tactic (goal)</th><th>Example technique</th><th>In plain words</th></tr></thead><tbody>
<tr><td>Initial Access</td><td>T1566 Phishing</td><td>A crafted email gets someone to click or log in</td></tr>
<tr><td>Initial Access</td><td>T1190 Exploit Public-Facing Application</td><td>An unpatched VPN or web app is broken into</td></tr>
<tr><td>Persistence / Defense Evasion</td><td>T1078 Valid Accounts</td><td>Stolen real usernames and passwords are used</td></tr>
<tr><td>Credential Access</td><td>T1003 OS Credential Dumping</td><td>Passwords are pulled from a compromised machine</td></tr>
<tr><td>Lateral Movement</td><td>T1021 Remote Services</td><td>RDP or SSH is used to hop to other systems</td></tr>
<tr><td>Exfiltration</td><td>T1567 Exfiltration Over Web Service</td><td>Data is uploaded to a cloud storage site</td></tr>
<tr><td>Impact</td><td>T1486 Data Encrypted for Impact</td><td>Ransomware</td></tr>
<tr><td>Initial Access</td><td>T1195 Supply Chain Compromise</td><td>A trusted vendor's software or script is poisoned</td></tr>
</tbody></table></div>
<p>There are three matrices: <b>Enterprise</b> (Windows, Linux, cloud, SaaS), <b>Mobile</b> and <b>ICS</b> for industrial control systems, which matters for airports, power and the OT module of this course.</p>
<h2>How to use it in GRC, step by step</h2>
<ol>
<li><b>Choose your threats.</b> Pick 3 to 5 groups or campaigns that target your sector and region; CERT-In advisories and your SOC's own incidents are good sources. For a managed SOC serving airports and utilities, think ransomware crews, state-linked groups targeting infrastructure, and supply-chain attackers.</li>
<li><b>List their techniques.</b> ATT&CK's group pages list the techniques each group has used. Keep the 20 to 30 that come up most.</li>
<li><b>Map your controls.</b> For each technique, write which control prevents it and which detects it. Use the <a href="#/grc/controls">control workbench</a> IDs.</li>
<li><b>Rate coverage honestly:</b> prevented and detected, only detected, only on paper, or none. "Only on paper" means a policy exists but nobody tested it.</li>
<li><b>Draw the heat map</b> in the free ATT&CK Navigator, colouring each technique by coverage. It is the clearest picture you can put in front of a Board.</li>
<li><b>Feed it back into GRC.</b> Gaps become risks in the register; high-value techniques decide which controls you test first; detection gaps become SOC use cases.</li>
<li><b>Repeat</b> every six months, or after a major advisory or incident.</li>
</ol>
<h3>Worked example: coverage table</h3>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Technique</th><th>Prevent</th><th>Detect</th><th>Coverage</th></tr></thead><tbody>
<tr><td>T1566 Phishing</td><td>Mail filtering, awareness training</td><td>SIEM rule on suspicious sign-ins after a click</td><td><span class="vz-tag c1">Good</span></td></tr>
<tr><td>T1078 Valid Accounts</td><td><a href="#/grc/controls/IAM-05">IAM-05</a> MFA</td><td>Impossible-travel and new-device alerts</td><td><span class="vz-tag c1">Good</span></td></tr>
<tr><td>T1190 Exploit Public-Facing App</td><td>Patch SLA for internet-facing systems</td><td>WAF and IDS alerts</td><td><span class="vz-tag c2">Partial</span>: patch SLA missed twice</td></tr>
<tr><td>T1195 Supply Chain Compromise</td><td><a href="#/grc/controls/TPR-02">TPR-02</a> vendor due diligence</td><td>None for third-party scripts</td><td><span class="vz-tag c3">Weak</span></td></tr>
<tr><td>T1486 Ransomware</td><td>EDR, <a href="#/grc/controls/IAM-04">IAM-04</a> privileged access</td><td>EDR behaviour alerts; <a href="#/grc/controls/OPS-05">OPS-05</a> restore tested</td><td><span class="vz-tag c1">Good</span></td></tr>
<tr><td>T0886 Remote Services (ICS)</td><td><a href="#/grc/controls/OT-02">OT-02</a> vendor remote access</td><td>Session recording on the jump host</td><td><span class="vz-tag c2">Partial</span></td></tr>
</tbody></table></div>
<p>Reading the table: phishing and stolen accounts are well covered; supply chain is the gap, which matches the news briefing on the Optimizely attack. The GRC action is a new risk, an owner, and a plan to monitor third-party scripts.</p>
<h3>Common mistakes</h3>
<ul>
<li>Claiming coverage because a tool vendor's brochure says so. Coverage needs a test or a real alert.</li>
<li>Trying to colour the whole matrix green. Focus beats completeness.</li>
<li>Keeping it inside the SOC. The value for GRC is linking techniques to controls, risks and evidence.</li>
</ul>
<p class="bf-src">Links: <a href="https://attack.mitre.org/" target="_blank" rel="noopener">MITRE ATT&CK</a> · <a href="https://attack.mitre.org/matrices/ics/" target="_blank" rel="noopener">ATT&CK for ICS</a> · <a href="https://mitre-attack.github.io/attack-navigator/" target="_blank" rel="noopener">ATT&CK Navigator</a> · <a href="https://ctid.mitre.org/" target="_blank" rel="noopener">Center for Threat-Informed Defense</a> (free mappings of controls to ATT&CK, including NIST 800-53). MITRE ATT&CK® is a registered trademark of The MITRE Corporation.</p>` },

{ id: "optimjack", kicker: "News briefing · 26 November 2026", date: "2026-11-26", mins: 8,
  t: "OPTIMJACK: when a trusted website script turns on you",
  sum: "On 16 November 2026 attackers put malicious JavaScript into an Optimizely service used by many large websites, so visitors' browsers ran it. What happened, why it is a third-party risk problem, and what to ask your own vendors.",
  html: `
<p class="lede-s">A supply-chain attack doesn't need to break into you. It breaks into something you trust and lets your own website deliver the attack.</p>
<h2>What happened</h2>
<ul>
<li>On <b>16 November 2026</b>, attackers abused a flaw in Optimizely's Web Experimentation service, a tool companies add to their sites to test page changes, and wrote malicious JavaScript into customer projects.</li>
<li>Because those sites load Optimizely's script for every visitor, the malicious code ran in visitors' browsers. Researchers counted about <b>178 organisations</b> affected, with names reported including Zoom, the BBC, CNN, HSBC and IKEA. Researchers have called the campaign <b>OPTIMJACK</b>.</li>
<li>Reported behaviour included swapping cryptocurrency wallet addresses, skimming card details and stealing browser data. The exposure window was reportedly under a day.</li>
<li>Optimizely said it fixed the vulnerability, removed the code and secured affected accounts. Reports differ on exact timings, numbers and the entry point, so treat these figures as early reporting.</li>
</ul>
<h2>Why it is a GRC problem, not just a SOC problem</h2>
<ul>
<li><b>The vendor wasn't on most risk registers as critical.</b> Marketing and analytics scripts are often bought by marketing on a card, never tiered, and never reviewed by security.</li>
<li><b>The data flow was invisible.</b> Nobody had drawn "visitor's browser runs code from a third party" on a data-flow diagram, so nobody owned it.</li>
<li><b>Your customers see your brand, not the vendor's.</b> The harm and the regulatory questions land on you.</li>
<li><b>Payment pages are regulated.</b> PCI DSS v4.0 requirements 6.4.3 and 11.6.1 already require an inventory of scripts on payment pages, a reason for each, and a way to detect unauthorised changes.</li>
</ul>
<h3>ATT&CK view</h3>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Technique</th><th>Here</th></tr></thead><tbody>
<tr><td>T1195.002 Compromise Software Supply Chain</td><td>The vendor's service was used to deliver code</td></tr>
<tr><td>T1189 Drive-by Compromise</td><td>Visitors were hit just by opening a trusted page</td></tr>
<tr><td>T1059.007 JavaScript</td><td>The payload ran as JavaScript in the browser</td></tr>
<tr><td>T1657 Financial Theft</td><td>Wallet swapping and card skimming</td></tr>
</tbody></table></div>
<h2>What to do this week</h2>
<ol>
<li><b>Inventory third-party scripts</b> on your public sites and client portals: who added each, why, and which pages. Add each provider to the <a href="#/grc/vendors">vendor register</a> with access "runs code on our site".</li>
<li><b>Tier them properly.</b> A script that runs on login or payment pages is Tier 1, whatever it costs.</li>
<li><b>Technical controls to ask for:</b> a Content Security Policy that lists allowed script sources, Subresource Integrity where scripts don't change, self-hosting of stable scripts, and client-side change monitoring.</li>
<li><b>Contract:</b> breach notice within hours, not days, so you can meet the CERT-In 6-hour rule; right to audit; named security contact.</li>
<li><b>Board line:</b> "We found N third-party scripts on customer-facing pages; M were on payment or login pages; all are now owned, tiered and monitored, or removed."</li>
</ol>
<h3>Questions for your vendors</h3>
<ul>
<li>If your platform is compromised, how could code reach our visitors, and how fast would you tell us?</li>
<li>Can we pin or self-host your script, or use Subresource Integrity?</li>
<li>Who at your company can change what runs on our site, and is that protected with MFA and approval?</li>
<li>When did your last SOC 2 report cover change management for customer-delivered code?</li>
</ul>
<h3>Also this month in India</h3>
<ul>
<li>The RBI reportedly directed non-bank payment system operators to report cyber incidents to the RBI and CERT-In within 6 hours, and asked lenders for security audits after a rise in AI-assisted attacks.</li>
<li>CERT-In issued an advisory on AI-driven attacks on banks, NBFCs and fintechs, and published AI security auditing guidelines.</li>
</ul>
<p class="hint">These Indian items come from press reports; check the RBI and CERT-In websites for the official texts before relying on them.</p>
<p class="bf-src">Sources: <a href="https://www.bleepingcomputer.com/news/security/optimizely-supply-chain-attack-infects-major-brands-sites-with-malware" target="_blank" rel="noopener">BleepingComputer</a> · <a href="https://www.darkreading.com/cyber-risk/optimizely-malware-attacks-third-party-vendor-risks" target="_blank" rel="noopener">Dark Reading</a> · <a href="https://www.bitsight.com/blog/cve-2026-132224-optimizely-third-party-supply-chain-attack" target="_blank" rel="noopener">Bitsight</a> · <a href="https://socket.dev/blog/optimizely-supply-chain-attack" target="_blank" rel="noopener">Socket</a> · <a href="https://www.cmswire.com/digital-experience/optimizely-works-through-web-experimentation-security-incident/" target="_blank" rel="noopener">CMSWire</a> · <a href="https://www.medianama.com/2026/11/223-rbi-bankers-ai-cyber-attacks-security-audits/" target="_blank" rel="noopener">MediaNama on RBI</a> · <a href="https://www.etvbharat.com/en/business/digital-payment-fraud-rbi-introduces-stricter-cybersecurity-rules-what-is-the-6-hour-reporting-deadline-enn26111602271" target="_blank" rel="noopener">ETV Bharat on the 6-hour rule</a> · <a href="https://www.medianama.com/2026/11/223-cert-in-ai-security-auditing-guidelines-dead-arrival/" target="_blank" rel="noopener">MediaNama on CERT-In guidelines</a></p>` }
];

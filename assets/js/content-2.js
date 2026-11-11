/* The CISSP Reader — chapter content, Domains 5–8 */
window.DOMAINS = window.DOMAINS || [];

window.DOMAINS.push({
  id: "d5", n: 5, weight: 13, priority: "medium",
  title: "Identity and Access Management (IAM)",
  short: "Identity & Access",
  sybex: "Ch 13 Managing Identity & Authentication · Ch 14 Controlling & Monitoring Access",
  lede: "Who are you, how do you prove it, what may you do, and can we prove afterwards what you did? IAM is the new perimeter.",
  intro: "In a world of cloud services and remote work, identity has replaced the network edge as the main control point. This domain covers how identities are created and proven, how access decisions are modelled, how federation lets one identity work across many systems, and how the identity lifecycle keeps access correct over time. Protocol questions (Kerberos, SAML, OAuth, OIDC) are where most candidates lose marks, so give them extra time.",
  memorise: [
    "Factors: something you know, have, are. Two of the same type (password + PIN) is not multi-factor.",
    "Type I error = false rejection (FRR). Type II error = false acceptance (FAR), the more dangerous one. CER/EER is where they cross; lower is better.",
    "DAC: owner decides. MAC: labels and clearances, system decides. RBAC: job role. ABAC: attributes and context. Rule-based: global rules (e.g. firewall).",
    "SAML: XML assertions for web SSO (IdP → SP). OAuth 2.0: delegated authorisation (tokens, not identity). OIDC: authentication layer on OAuth 2.0 (ID token, JWT).",
    "Kerberos: KDC = AS + TGS; TGT then service tickets; symmetric keys; needs synchronised clocks (default 5 min skew).",
    "RADIUS: UDP, encrypts only the password, combines authN and authZ. TACACS+: TCP 49, encrypts the whole payload, separates AAA.",
    "Access reviews catch privilege creep. Remove access at termination immediately.",
    "NIST SP 800-63B: favour length, block known-breached passwords, no forced periodic changes or composition rules."
  ],
  sections: [
    { id: "aaa", title: "Identification, authentication and the factors",
      body: `<p><strong>Identification</strong> is a claim (a username, an email, a badge). <strong>Authentication</strong> proves it. <strong>Authorisation</strong> grants rights. <strong>Accountability</strong> ties actions to the identity through logs, and depends on each identity being unique and not shared.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Factor</th><th>Examples</th><th>Weakness</th></tr></thead><tbody>
      <tr><td>Type 1 — something you know</td><td>Password, PIN, passphrase, security questions</td><td>Guessing, phishing, reuse</td></tr>
      <tr><td>Type 2 — something you have</td><td>Smart card, hardware key, authenticator app (TOTP/HOTP), phone</td><td>Loss, theft, SIM swap for SMS</td></tr>
      <tr><td>Type 3 — something you are</td><td>Fingerprint, face, iris, voice, keystroke dynamics</td><td>Cannot be changed if compromised; privacy</td></tr>
      <tr><td>Context</td><td>Somewhere you are (location), something you do (behaviour)</td><td>Supporting signals, not primary factors</td></tr>
      </tbody></table></div>
      <h3>Biometrics</h3>
      <p>A <strong>false rejection</strong> (Type I) locks out a legitimate user. A <strong>false acceptance</strong> (Type II) lets an impostor in, which is worse for security. Tightening sensitivity lowers FAR and raises FRR. The <strong>crossover error rate (CER)</strong>, also called equal error rate, is where the two lines meet; use it to compare devices. Lower is more accurate. Iris and retina scans are among the most accurate; retina scans are intrusive and can reveal health data.</p>
      <div class="note latest"><p><strong>Passkeys</strong> (FIDO2 / WebAuthn) replace passwords with a device-bound or synced key pair unlocked by biometrics or PIN. They are phishing-resistant because the key is bound to the real site’s origin. <strong>NIST SP 800-63-4</strong> (final in 2025) recognises syncable authenticators and requires phishing-resistant options at higher assurance levels. SMS one-time codes are “restricted” because of SIM-swap and interception risk.</p></div>`,
      exam: "Recognising true multi-factor, Type I versus Type II, and reading a CER chart." },
    { id: "models", title: "Access control models",
      body: `<div class="tbl-wrap"><table><thead><tr><th>Model</th><th>Who decides</th><th>Typical use</th></tr></thead><tbody>
      <tr><td>DAC (discretionary)</td><td>The object owner, through ACLs</td><td>File shares, Windows/NTFS permissions</td></tr>
      <tr><td>MAC (mandatory)</td><td>The system, comparing subject clearance with object labels; users cannot change</td><td>Military, SELinux, high-assurance systems</td></tr>
      <tr><td>RBAC (role-based)</td><td>Administrators assign permissions to roles, users to roles</td><td>Enterprises with stable job functions; supports least privilege</td></tr>
      <tr><td>Rule-based</td><td>Global rules applied to all subjects</td><td>Firewalls, time-of-day restrictions</td></tr>
      <tr><td>ABAC (attribute-based)</td><td>Policies evaluating user, resource, action and environment attributes</td><td>Cloud, zero trust, fine-grained context-aware access</td></tr>
      <tr><td>Risk-based / adaptive</td><td>A risk score from context (location, device, behaviour)</td><td>Step-up MFA for unusual logins</td></tr>
      </tbody></table></div>
      <p>MAC systems can be <em>hierarchical</em> (levels), <em>compartmentalised</em> (need-to-know categories) or hybrid. A <strong>constrained interface</strong> limits what users can see or do (menus, greyed-out options). A <strong>content-dependent</strong> control restricts by the data itself (a view showing only salary bands), while <strong>context-dependent</strong> controls look at circumstances (time, location, sequence).</p>
      <div class="note memory"><p><strong>D</strong>AC = <strong>D</strong>ata owner decides. <strong>M</strong>AC = <strong>M</strong>andatory labels, users can’t change. <strong>R</strong>BAC = <strong>R</strong>ole. <strong>A</strong>BAC = <strong>A</strong>ttributes, the most granular.</p></div>`,
      exam: "Identifying the model from a short scenario." },
    { id: "federation", title: "Single sign-on and federation",
      body: `<p><strong>Single sign-on (SSO)</strong> lets one authentication give access to many systems inside one organisation. <strong>Federated identity</strong> extends that across organisations: an <strong>identity provider (IdP)</strong> authenticates the user, and a <strong>service provider (SP)</strong> or <em>relying party</em> trusts the IdP’s assertion. The convenience is matched by risk: one compromised identity opens everything, so SSO must be paired with strong MFA.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Standard</th><th>Purpose</th><th>Format</th><th>Typical use</th></tr></thead><tbody>
      <tr><td>SAML 2.0</td><td>Authentication and attribute exchange</td><td>XML assertions</td><td>Enterprise web SSO to SaaS</td></tr>
      <tr><td>OAuth 2.0</td><td><em>Authorisation</em>: delegated access to an API without sharing the password</td><td>Access tokens (often JWT)</td><td>“Allow this app to read your calendar”</td></tr>
      <tr><td>OpenID Connect</td><td>Authentication on top of OAuth 2.0</td><td>ID token (JWT)</td><td>“Sign in with…” for web and mobile</td></tr>
      <tr><td>WS-Federation, Shibboleth</td><td>Older/academic federation</td><td>XML</td><td>Legacy and universities</td></tr>
      </tbody></table></div>
      <p>OAuth roles: <em>resource owner</em> (user), <em>client</em> (the app), <em>authorisation server</em> (issues tokens), <em>resource server</em> (the API). Use the authorisation code flow with <strong>PKCE</strong> for public clients; the implicit flow is deprecated.</p>
      <div class="note trap"><p>OAuth on its own is not an authentication protocol. If the question is about proving who the user is, look for SAML or OpenID Connect.</p></div>
      <p>Identity can be <strong>on-premises</strong>, <strong>cloud</strong> (IDaaS) or <strong>hybrid</strong>, typically synchronising a directory such as Active Directory to a cloud IdP. <strong>SCIM</strong> automates provisioning across SaaS apps.</p>`,
      exam: "SAML versus OAuth versus OIDC, and IdP versus SP roles." },
    { id: "kerberos", title: "Kerberos, RADIUS, TACACS+ and directories",
      body: `<p><strong>Kerberos</strong> is a ticket-based SSO protocol using symmetric cryptography, the default in Active Directory.</p>
      <ol>
        <li>The user authenticates to the <strong>Authentication Service (AS)</strong> of the <strong>KDC</strong>.</li>
        <li>The AS returns a <strong>ticket-granting ticket (TGT)</strong>, encrypted with the TGS’s key, plus a session key.</li>
        <li>When the user needs a service, it presents the TGT to the <strong>Ticket-Granting Service (TGS)</strong>.</li>
        <li>The TGS issues a <strong>service ticket</strong> for that server.</li>
        <li>The user presents the service ticket to the server, which validates it with its own key.</li>
      </ol>
      <p>Weaknesses: the KDC is a single point of failure and a high-value target; clocks must be in sync (timestamps prevent replay); and attacks such as <em>pass-the-ticket</em>, <em>Kerberoasting</em> (cracking service-account tickets offline) and <em>golden tickets</em> (forging TGTs with the stolen KRBTGT key) abuse it.</p>
      <h3>AAA protocols</h3>
      <div class="tbl-wrap"><table><thead><tr><th></th><th>RADIUS</th><th>TACACS+</th><th>Diameter</th></tr></thead><tbody>
      <tr><td>Transport</td><td>UDP</td><td>TCP 49</td><td>TCP/SCTP</td></tr>
      <tr><td>Encryption</td><td>Password only</td><td>Entire payload</td><td>TLS/IPsec</td></tr>
      <tr><td>AAA</td><td>Combines authN and authZ</td><td>Separates all three</td><td>Successor to RADIUS</td></tr>
      <tr><td>Typical use</td><td>Network access, Wi-Fi 802.1X, VPN</td><td>Device administration (Cisco)</td><td>Mobile networks</td></tr>
      </tbody></table></div>
      <p><strong>LDAP</strong> queries directories (port 389, LDAPS 636). Directories follow X.500 naming (CN, OU, DC).</p>`,
      exam: "Kerberos flow, its weak points, and RADIUS versus TACACS+." },
    { id: "lifecycle", title: "The identity and access lifecycle",
      body: `<p>Access must be right on day one, stay right while roles change, and disappear at exit.</p>
      <ul>
        <li><strong>Provisioning</strong> (onboarding / enrolment): verify identity proportionate to risk (identity proofing), create the account, assign access by role with the data owner’s approval.</li>
        <li><strong>Role changes</strong>: transfers are where <strong>privilege creep</strong> happens: new access is granted but old access is never removed.</li>
        <li><strong>Access reviews / recertification</strong>: managers and data owners periodically confirm each user still needs each right.</li>
        <li><strong>Deprovisioning</strong>: disable at termination, then remove after a retention period, so audit trails still resolve to a person.</li>
        <li><strong>Service accounts</strong> need owners, vaulted credentials and rotation; they are a favourite attacker target.</li>
      </ul>
      <h3>Privileged access management (PAM)</h3>
      <p>Administrator accounts are separated from daily accounts, stored in a vault, checked out for limited time (<strong>just-in-time</strong> access), and their sessions are recorded. <strong>Break-glass</strong> accounts exist for emergencies and are tightly monitored.</p>
      <h3>Sessions and credentials</h3>
      <p>Session controls include timeouts, re-authentication for sensitive actions, secure cookie flags and token revocation. Credential management systems (password vaults) store secrets centrally. Account lockout reduces online guessing but can enable denial of service, so throttling is often preferred.</p>
      <div class="note manager"><p>When a scenario describes a user with access from three old jobs, the answer is a periodic access review process, not just removing that one user’s rights. Fix the process, not only the instance.</p></div>`,
      exam: "Privilege creep, access reviews, and what to do at termination." },
    { id: "attacks", title: "Attacks on identity",
      body: `<div class="tbl-wrap"><table><thead><tr><th>Attack</th><th>Defence</th></tr></thead><tbody>
      <tr><td>Brute force / dictionary</td><td>Length, throttling, lockout, MFA</td></tr>
      <tr><td>Password spraying (one common password across many accounts)</td><td>Breached-password lists, MFA, smart lockout</td></tr>
      <tr><td>Credential stuffing (reused leaked passwords)</td><td>MFA, breach monitoring, passkeys</td></tr>
      <tr><td>Rainbow tables</td><td>Salting and slow hashing</td></tr>
      <tr><td>Pass-the-hash / pass-the-ticket</td><td>Credential Guard, tiered admin, no local admin reuse</td></tr>
      <tr><td>MFA fatigue (push bombing)</td><td>Number matching, phishing-resistant MFA</td></tr>
      <tr><td>Adversary-in-the-middle phishing (session cookie theft)</td><td>FIDO2/passkeys, token binding, conditional access</td></tr>
      <tr><td>Spoofing / impersonation</td><td>Mutual authentication, verification call-backs</td></tr>
      </tbody></table></div>`,
      exam: "Matching an identity attack to its best defence." }
  ],
  questions: [
    { q: "A user logs into a corporate laptop and can then reach email, file shares and the intranet without logging in again. Tickets are issued by a central server and clocks must be synchronised. Which technology is this?",
      options: ["SAML", "Kerberos", "RADIUS", "OAuth 2.0"],
      answer: 1,
      why: "Tickets from a central KDC and the need for time synchronisation identify Kerberos." },
    { q: "A mobile app needs to read a user’s photos from a cloud service without ever seeing the user’s password. Which standard is designed for this?",
      options: ["OAuth 2.0", "SAML", "LDAP", "TACACS+"],
      answer: 0,
      why: "OAuth 2.0 delegates authorisation via access tokens so the client never handles the password." },
    { q: "A biometric system is tuned so that impostors are almost never accepted. What is the MOST likely side effect?",
      options: ["The false acceptance rate rises", "The false rejection rate rises", "The crossover error rate falls to zero", "Enrolment becomes faster"],
      answer: 1,
      why: "Lowering FAR (Type II) by increasing sensitivity raises FRR (Type I): more legitimate users get rejected." },
    { q: "An internal audit finds that several employees who changed departments still hold access from their previous roles. What is the BEST long-term fix?",
      options: ["Remove the extra access for those users", "Implement periodic access reviews by managers and data owners, tied to role changes", "Switch to mandatory access control", "Require MFA for all users"],
      answer: 1,
      why: "This is privilege creep. Removing access fixes the instance; periodic reviews and joiner-mover-leaver processes fix the cause." }
  ]
});

window.DOMAINS.push({
  id: "d6", n: 6, weight: 12, priority: "strong",
  title: "Security Assessment and Testing",
  short: "Assessment & Testing",
  sybex: "Ch 15 Security Assessment & Testing",
  lede: "Trust, but verify. This domain is about producing evidence that controls work, and turning that evidence into decisions.",
  intro: "People with an audit background often find this domain natural. The exam focuses on choosing the right kind of test for a question, understanding what each technique can and cannot show, the reports that come from third-party audits, and the way results feed back to management. The trap is technical detail on testing tools, so make sure you know the vocabulary of code testing as well as audit.",
  memorise: [
    "Vulnerability scan: automated, finds known weaknesses. Penetration test: exploits them to prove impact, under written authorisation.",
    "Pen test phases: planning (rules of engagement) → discovery → attack → reporting.",
    "Black box: no knowledge. White box: full knowledge. Grey box: partial knowledge.",
    "SAST: source code, no execution, early. DAST: running app, black-box. IAST: agent inside running app. SCA: third-party components.",
    "Fuzzing: mutation (alter valid input) or generation (build input from a model of the protocol).",
    "SOC 1: financial reporting controls. SOC 2: Trust Services Criteria (security, availability, processing integrity, confidentiality, privacy). SOC 3: public summary.",
    "Type I: design at a point in time. Type II: operating effectiveness over a period (usually 6–12 months).",
    "Synthetic transactions are scripted and proactive; real user monitoring is passive and reactive."
  ],
  sections: [
    { id: "strategy", title: "Assessment strategy and audit types",
      body: `<p>An assessment programme answers: are controls designed well, are they working, and are we compliant? It covers <strong>tests</strong> (verify a control with a procedure), <strong>assessments</strong> (broad review of a system’s security), and <strong>audits</strong> (formal, independent, against a defined standard).</p>
      <div class="tbl-wrap"><table><thead><tr><th>Audit</th><th>Performed by</th><th>Purpose</th></tr></thead><tbody>
      <tr><td>Internal</td><td>The organisation’s own audit staff</td><td>Management assurance; must be independent of the area audited</td></tr>
      <tr><td>External</td><td>An outside firm engaged by the organisation</td><td>Independent assurance to the board, regulators, customers</td></tr>
      <tr><td>Third-party</td><td>On behalf of another party (a customer, regulator)</td><td>Assurance about you, for someone else</td></tr>
      </tbody></table></div>
      <p>The 2024 outline also asks about the <strong>location</strong> of audits: on-premises, cloud and hybrid. In cloud, you usually cannot audit the provider directly, so you rely on its attestation reports and certifications, and you test your own configuration.</p>
      <div class="note manager"><p>The audit report goes to the people who commissioned it, typically senior management or the audit committee. Findings are their decision to remediate or accept.</p></div>`,
      exam: "Internal versus external versus third-party audit, and audit independence." },
    { id: "vuln-pen", title: "Vulnerability assessment and penetration testing",
      body: `<p><strong>Vulnerability scanning</strong> is automated and repeatable. <em>Credentialed</em> (authenticated) scans log in and see much more, with fewer false positives. <em>Non-credentialed</em> scans show the attacker’s view. Scans produce false positives (reported but not real) and false negatives (real but missed); false negatives are the more dangerous.</p>
      <p>Findings are scored with <strong>CVSS</strong> (Common Vulnerability Scoring System) and identified by <strong>CVE</strong> numbers. <strong>SCAP</strong> is the NIST suite that standardises this automation (CVE, CVSS, CPE, CCE, XCCDF, OVAL).</p>
      <div class="note latest"><p><strong>CVSS v4.0</strong> (released November 2023) adds supplemental metrics and splits scoring into Base, Threat, Environmental and Supplemental groups. Many organisations now also use CISA’s <strong>Known Exploited Vulnerabilities (KEV)</strong> catalogue and <strong>EPSS</strong> (exploit prediction scores) to prioritise patching by real-world exploitation, not severity alone.</p></div>
      <h3>Penetration testing</h3>
      <p>A pen test simulates an attacker to show real impact. It must have <strong>written authorisation from senior management</strong> and agreed <strong>rules of engagement</strong>: scope, timing, techniques allowed, contacts, data handling. Phases: <em>planning</em> → <em>discovery</em> (reconnaissance, scanning) → <em>attack</em> (gain access, escalate, move laterally) → <em>reporting</em>.</p>
      <ul>
        <li><strong>Black box / zero knowledge</strong>: tester knows nothing; most realistic for an outsider; slowest.</li>
        <li><strong>White box / full knowledge</strong>: tester has documentation and code; most thorough.</li>
        <li><strong>Grey box / partial knowledge</strong>: a balance.</li>
      </ul>
      <p><strong>Red team</strong> attacks, <strong>blue team</strong> defends, <strong>purple team</strong> works together to improve detection. <strong>Breach and attack simulation</strong> tools run attack techniques continuously. <strong>Bug bounties</strong> invite external researchers under defined rules.</p>
      <div class="note trap"><p>The first step of a pen test is never “start scanning”. It is getting signed authorisation and defining scope.</p></div>`,
      exam: "Scan versus pen test, knowledge levels, and authorisation first." },
    { id: "software-testing", title: "Testing software and systems",
      body: `<div class="tbl-wrap"><table><thead><tr><th>Technique</th><th>What it is</th><th>When</th></tr></thead><tbody>
      <tr><td>Code review (manual)</td><td>Peers read the code; Fagan inspection is the formal version</td><td>Before merge</td></tr>
      <tr><td>SAST (static)</td><td>Analyses source or binaries without running them</td><td>Early, in the IDE or pipeline</td></tr>
      <tr><td>DAST (dynamic)</td><td>Attacks the running application from outside</td><td>Test / staging</td></tr>
      <tr><td>IAST</td><td>Agent inside the running app watches data flow during tests</td><td>Test</td></tr>
      <tr><td>SCA</td><td>Finds known-vulnerable and licence-risky third-party components</td><td>Continuous</td></tr>
      <tr><td>Fuzzing</td><td>Sends malformed or random input to find crashes</td><td>Test</td></tr>
      <tr><td>Misuse case testing</td><td>Tests what an attacker would try (abuse cases)</td><td>Design and test</td></tr>
      <tr><td>Interface testing</td><td>Tests APIs, user interfaces and physical interfaces</td><td>Integration</td></tr>
      <tr><td>Regression testing</td><td>Confirms changes did not break existing function</td><td>After every change</td></tr>
      <tr><td>Test coverage analysis</td><td>Tested use cases ÷ total use cases</td><td>Reporting</td></tr>
      </tbody></table></div>
      <p>Coverage can be measured by branch, condition, function, loop or statement. <strong>Mutation fuzzing</strong> (dumb) alters valid inputs; <strong>generational fuzzing</strong> (intelligent) builds inputs from a model of the expected format.</p>
      <h3>Monitoring as testing</h3>
      <p><strong>Synthetic transactions</strong> run scripted actions against a system to check it works (proactive). <strong>Real user monitoring (RUM)</strong> passively records what actual users experience (reactive). <strong>Log reviews</strong>, <strong>account management reviews</strong> and <strong>backup verification</strong> (actually restoring) are routine tests too.</p>`,
      exam: "Choosing SAST/DAST/fuzzing/misuse case for a scenario; synthetic vs RUM." },
    { id: "reports", title: "SOC reports, attestation and certification",
      body: `<p>Under <strong>SSAE 18</strong> (US) and <strong>ISAE 3402</strong> (international), service organisations get independent reports on their controls:</p>
      <div class="tbl-wrap"><table><thead><tr><th>Report</th><th>Covers</th><th>Audience</th></tr></thead><tbody>
      <tr><td>SOC 1</td><td>Controls relevant to customers’ financial reporting (ICFR)</td><td>Customers’ auditors; restricted</td></tr>
      <tr><td>SOC 2</td><td>Trust Services Criteria: security (always), availability, processing integrity, confidentiality, privacy</td><td>Customers and partners under NDA; detailed</td></tr>
      <tr><td>SOC 3</td><td>Same criteria as SOC 2, summarised</td><td>Public; marketing</td></tr>
      </tbody></table></div>
      <p><strong>Type I</strong> reports describe control design at one point in time. <strong>Type II</strong> reports test operating effectiveness over a period. For vendor due diligence, a <strong>SOC 2 Type II</strong> is usually the answer.</p>
      <p>Other assurance: ISO/IEC 27001 certification (the ISMS), PCI DSS Reports on Compliance by a QSA, FedRAMP for US government cloud, and CSA STAR for cloud providers.</p>`,
      exam: "Choosing the right report for a vendor-risk question; Type I versus Type II." },
    { id: "metrics", title: "Security process data, metrics and reporting",
      body: `<p>Assessment is only useful if results drive decisions. Collect process data from account management, management reviews, backup verification, training and awareness, DR and BC tests, and KPIs.</p>
      <ul>
        <li><strong>KPIs</strong> (key performance indicators) measure how well a process works (e.g. mean time to patch critical vulnerabilities).</li>
        <li><strong>KRIs</strong> (key risk indicators) warn that risk is rising (e.g. number of unpatched internet-facing systems).</li>
      </ul>
      <p>Analyse the output, report to the right audience in business language, and track remediation. Exceptions need documented risk acceptance by the owner. <strong>Ethical disclosure</strong> covers what to do when you find a vulnerability in someone else’s product: coordinated (responsible) disclosure to the vendor first, with a reasonable deadline.</p>
      <h3>Testing DR and BC plans</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Test</th><th>What happens</th><th>Disruption</th></tr></thead><tbody>
      <tr><td>Read-through / checklist</td><td>Each person reviews the plan</td><td>None</td></tr>
      <tr><td>Structured walk-through / tabletop</td><td>Team talks through a scenario</td><td>None</td></tr>
      <tr><td>Simulation</td><td>Rehearse response to a scenario, may involve some systems</td><td>Low</td></tr>
      <tr><td>Parallel</td><td>Bring up the alternate site and process alongside production</td><td>Low</td></tr>
      <tr><td>Full interruption</td><td>Shut down primary and fail over for real</td><td>High; needs senior approval</td></tr>
      </tbody></table></div>`,
      exam: "KPI versus KRI, disclosure, and ordering DR test types by disruption." }
  ],
  questions: [
    { q: "A company wants independent assurance that a SaaS provider’s security controls actually operated effectively over the last year. Which report should it request?",
      options: ["SOC 1 Type I", "SOC 2 Type I", "SOC 2 Type II", "SOC 3"],
      answer: 2,
      why: "SOC 2 covers security; Type II tests operating effectiveness over a period. SOC 3 is a public summary without the detail." },
    { q: "Before a penetration tester begins any activity, what is MOST important?",
      options: ["Running a full vulnerability scan", "Obtaining written authorisation and agreeing rules of engagement with senior management", "Selecting exploit tools", "Informing all employees"],
      answer: 1,
      why: "Without written authorisation, testing may be illegal. Scope and rules of engagement come first." },
    { q: "Developers want to find security bugs in source code as early as possible, before the application is ever run. Which technique fits?",
      options: ["DAST", "Fuzzing", "SAST", "Real user monitoring"],
      answer: 2,
      why: "Static analysis examines code without executing it and can run in the IDE or build pipeline." },
    { q: "Which DR test is MOST disruptive and therefore needs explicit senior management approval?",
      options: ["Tabletop exercise", "Parallel test", "Simulation", "Full interruption test"],
      answer: 3,
      why: "A full interruption test shuts down the primary site and can cause a real outage." }
  ]
});

window.DOMAINS.push({
  id: "d7", n: 7, weight: 13, priority: "strong",
  title: "Security Operations",
  short: "Security Operations",
  sybex: "Ch 16 Managing Security Operations · Ch 17 Preventing & Responding to Incidents · Ch 18 Disaster Recovery Planning · Ch 19 Investigations & Ethics",
  lede: "Where policy meets the night shift. Monitoring, incidents, investigations, change, recovery and the people who keep the lights on.",
  intro: "Anyone who has worked in operations, a SOC or a control room will recognise much of this domain. It is broad: foundational operating principles, logging and monitoring, configuration and change, incident response, investigations and evidence, recovery strategies, disaster recovery and personnel safety. Expect process-ordering questions (what comes first) and evidence questions.",
  memorise: [
    "Incident response (Sybex): Detection → Response → Mitigation → Reporting → Recovery → Remediation → Lessons learned.",
    "NIST SP 800-61: Preparation → Detection & Analysis → Containment, Eradication & Recovery → Post-incident activity. (Rev. 3, 2025, maps IR onto CSF 2.0.)",
    "Order of volatility: CPU registers/cache → memory/routing & ARP tables/processes → temp files → disk → remote logs → archives.",
    "Admissible evidence: relevant, material, competent (legally obtained). Keep chain of custody.",
    "Full backup copies everything and clears archive bits. Incremental copies changes since last backup and clears bits (fast backup, slow restore). Differential copies changes since last full, does not clear bits (slower backup, faster restore).",
    "Hot site: ready in hours. Warm: days. Cold: weeks (space and power only).",
    "RAID 0 striping (no redundancy), 1 mirroring, 5 striping with parity (one disk can fail), 6 double parity, 10 mirror + stripe.",
    "Change management: request → review → approve → test → schedule → implement → document. Emergency changes are still documented after the fact."
  ],
  sections: [
    { id: "foundations", title: "Foundational operations concepts",
      body: `<p>Operations security applies Domain 1 principles every day.</p>
      <ul>
        <li><strong>Need to know</strong> and <strong>least privilege</strong>: minimum information and minimum rights.</li>
        <li><strong>Separation of duties</strong> and <strong>two-person control</strong> for critical tasks (key ceremonies, large payments).</li>
        <li><strong>Job rotation</strong> and <strong>mandatory vacations</strong>: detect fraud.</li>
        <li><strong>Privileged account management</strong>: monitor and restrict administrative actions.</li>
        <li><strong>Service level agreements</strong> with providers, plus OLAs internally.</li>
      </ul>
      <p>Asset management continues here: hardware and software inventories, licence tracking, media management (labelling, storage, secure transport and destruction), and protecting <strong>configuration items</strong> through a configuration management database (CMDB).</p>`,
      exam: "Choosing the operating principle that fits a scenario." },
    { id: "monitoring", title: "Logging, monitoring and detection",
      body: `<p>You cannot respond to what you do not see. Logs must be generated, collected centrally, time-synchronised (NTP), protected from tampering (write-once storage, hashing), retained per policy and reviewed.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Capability</th><th>What it does</th></tr></thead><tbody>
      <tr><td>SIEM</td><td>Aggregates and correlates logs, raises alerts, supports investigation and compliance reporting</td></tr>
      <tr><td>SOAR</td><td>Automates and orchestrates response playbooks across tools</td></tr>
      <tr><td>UEBA</td><td>Baselines normal user/entity behaviour and flags anomalies (insider threat, compromised accounts)</td></tr>
      <tr><td>EDR / XDR</td><td>Endpoint (and extended) detection and response: telemetry, isolation, rollback</td></tr>
      <tr><td>Egress monitoring / DLP</td><td>Watches data leaving, including steganography and covert channels</td></tr>
      <tr><td>Threat intelligence</td><td>Feeds of indicators and adversary TTPs (STIX/TAXII for sharing)</td></tr>
      <tr><td>Threat hunting</td><td>Proactive, hypothesis-driven search for attackers who evaded alerts</td></tr>
      </tbody></table></div>
      <p>Other preventive and detective measures in the outline: firewalls, IDS/IPS, allow-listing and deny-listing, third-party security services (MSSP, MDR), sandboxing, honeypots and honeynets (watch for entrapment versus enticement: enticement is legal, entrapment is not), anti-malware, and machine-learning-based tools.</p>
      <div class="note latest"><p>The 2024 outline explicitly includes <strong>machine learning and AI-based tools</strong> for detection. Know their strength (finding unknown patterns at scale) and their weaknesses (false positives, model drift, adversarial evasion, data quality).</p></div>`,
      exam: "SIEM versus SOAR versus UEBA; enticement versus entrapment." },
    { id: "change", title: "Configuration, change and patch management",
      body: `<p><strong>Configuration management</strong> establishes and maintains secure baselines (hardened images, CIS Benchmarks), detects drift, and uses automation (infrastructure as code). <strong>Change management</strong> ensures changes are requested, assessed for risk and security impact, approved by a change advisory board (CAB), tested, scheduled, implemented with a back-out plan, and documented. Unauthorised change is one of the largest causes of outages and security gaps.</p>
      <p><strong>Patch and vulnerability management</strong> is a cycle: identify (inventory and scanning), prioritise (risk, exploitation), test, deploy, verify. Emergency patches still follow change management, documented afterwards.</p>
      <div class="note manager"><p>When a scenario says a change broke production, the best answer is usually the process control (change management with testing and rollback), not the technical fix for this one change.</p></div>`,
      exam: "Change management steps, and baseline and drift control." },
    { id: "incidents", title: "Incident management",
      body: `<p>An <strong>event</strong> is any observable occurrence. An <strong>incident</strong> is an event that harms or threatens confidentiality, integrity or availability. A <strong>breach</strong> confirms data was disclosed.</p>
      <h3>The ISC2 / Sybex model</h3>
      <ol>
        <li><strong>Detection</strong>: monitoring, alerts, user reports.</li>
        <li><strong>Response</strong>: activate the CSIRT, triage and preserve evidence.</li>
        <li><strong>Mitigation</strong>: contain the incident to stop it spreading (isolate the host).</li>
        <li><strong>Reporting</strong>: inside the organisation and to regulators and customers as required.</li>
        <li><strong>Recovery</strong>: restore systems to normal operation.</li>
        <li><strong>Remediation</strong>: root-cause analysis and fixing the underlying weakness.</li>
        <li><strong>Lessons learned</strong>: improve the process.</li>
      </ol>
      <div class="note latest"><p><strong>NIST SP 800-61 Rev. 3</strong> (April 2025) replaced the old four-phase lifecycle with a model built on the CSF 2.0 functions, treating incident response as part of overall risk management. The exam outline still uses classic terms, so recognise both.</p></div>
      <div class="note trap"><p>Containment comes before eradication. Do not wipe and rebuild a compromised server before you have contained it and preserved the evidence you need.</p></div>`,
      exam: "Ordering the steps; what to do first on discovery; containment before eradication." },
    { id: "investigations", title: "Investigations and digital forensics",
      body: `<p>Forensics must preserve evidence so it stays admissible. The core steps are identification, preservation, collection, examination, analysis and presentation.</p>
      <ul>
        <li>Image drives with a <strong>write blocker</strong>; work on copies, never the original; verify with hashes.</li>
        <li>Capture in <strong>order of volatility</strong> (RFC 3227): registers and cache, then RAM, routing and ARP tables, process lists, then temporary files, disk, remote logs, physical configuration and archival media.</li>
        <li>Maintain a <strong>chain of custody</strong>: who handled the evidence, when, where, and why.</li>
      </ul>
      <h3>Evidence types</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Meaning</th></tr></thead><tbody>
      <tr><td>Real</td><td>Physical objects (a laptop)</td></tr>
      <tr><td>Documentary</td><td>Written items, including logs; best evidence rule wants the original</td></tr>
      <tr><td>Testimonial</td><td>Witness statements; expert opinion</td></tr>
      <tr><td>Direct / circumstantial</td><td>Proves a fact itself / implies it</td></tr>
      <tr><td>Corroborative</td><td>Supports other evidence</td></tr>
      <tr><td>Hearsay</td><td>Second-hand; usually inadmissible (business records exception for routine logs)</td></tr>
      </tbody></table></div>
      <p>To be admissible, evidence must be <strong>relevant</strong>, <strong>material</strong> and <strong>competent</strong> (obtained legally). Locard’s exchange principle: every contact leaves a trace. Investigative techniques include interviews (not interrogations, unless by law enforcement), and evidence may be obtained by voluntary surrender, subpoena, or search warrant.</p>
      <div class="note manager"><p>If you suspect a crime, contact legal counsel before law enforcement. Involving police has consequences (public records, loss of control over evidence) that management must decide on.</p></div>`,
      exam: "Order of volatility, chain of custody, and admissibility." },
    { id: "recovery", title: "Recovery strategies and disaster recovery",
      body: `<h3>Backups</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Copies</th><th>Archive bit</th><th>Restore needs</th></tr></thead><tbody>
      <tr><td>Full</td><td>Everything</td><td>Cleared</td><td>Last full only</td></tr>
      <tr><td>Incremental</td><td>Changes since last backup of any kind</td><td>Cleared</td><td>Last full + every incremental since</td></tr>
      <tr><td>Differential</td><td>Changes since last full</td><td>Not cleared</td><td>Last full + latest differential</td></tr>
      </tbody></table></div>
      <p>Follow <strong>3-2-1</strong> (three copies, two media, one off-site) and keep at least one copy <strong>immutable or offline</strong> to survive ransomware. Test restores regularly.</p>
      <h3>Sites</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Site</th><th>Ready in</th><th>Cost</th></tr></thead><tbody>
      <tr><td>Mirrored / redundant</td><td>Immediate</td><td>Highest</td></tr>
      <tr><td>Hot</td><td>Hours</td><td>High</td></tr>
      <tr><td>Warm</td><td>Days</td><td>Medium</td></tr>
      <tr><td>Cold</td><td>Weeks</td><td>Low</td></tr>
      <tr><td>Mobile / cloud</td><td>Varies</td><td>Varies; cloud DR is now common</td></tr>
      </tbody></table></div>
      <p><strong>Reciprocal agreements</strong> with another organisation are cheap but rarely enforceable. Resilience comes from redundancy (RAID, clustering, multiple power feeds and ISPs), high availability and fault tolerance.</p>
      <h3>The DR process</h3>
      <p>Response → personnel (roles and contact lists) → communications (internal, external, media through one spokesperson) → assessment → restoration → training and awareness → lessons learned. Return to the primary site starting with the <strong>least critical</strong> systems, to prove the site is stable before moving the critical ones.</p>`,
      exam: "Backup types and restore order, choosing a site, and failback order." },
    { id: "physical-personnel", title: "Physical security operations and personnel safety",
      body: `<p>Operate the physical controls designed in Domain 3: perimeter and internal security, visitor management and escorts, CCTV and alarm monitoring, guard procedures.</p>
      <p>Personnel safety and security covers <strong>travel</strong> (clean devices for high-risk regions, VPN use, awareness of hotel and border risks), <strong>security training and awareness</strong>, <strong>emergency management</strong> (evacuation, shelter in place, occupant emergency plans), and <strong>duress</strong> (silent alarms, duress codes that look like normal log-ins but alert security).</p>
      <div class="note manager"><p>The safety of people always comes first: before data, before equipment, before evidence.</p></div>`,
      exam: "Duress systems, travel risk, and life safety first." }
  ],
  questions: [
    { q: "A security analyst confirms that a workstation is infected with ransomware that is spreading to file shares. What should be done FIRST?",
      options: ["Restore the workstation from backup", "Isolate the workstation from the network", "Notify law enforcement", "Run a full antivirus scan"],
      answer: 1,
      why: "Containment (mitigation) comes immediately after detection and response, to stop the spread. Restoration and reporting follow." },
    { q: "When collecting evidence from a running server, which should be captured FIRST?",
      options: ["Hard disk image", "Contents of RAM", "Backup tapes", "Remote syslog server records"],
      answer: 1,
      why: "Order of volatility: memory is lost when power is removed; disks, remote logs and archives persist longer." },
    { q: "Backups run fully on Sunday and differentially Monday to Saturday. The server fails on Thursday. Which backups are needed for restore?",
      options: ["Sunday full only", "Sunday full and Wednesday differential", "Sunday full and Monday–Wednesday differentials", "Wednesday differential only"],
      answer: 1,
      why: "Each differential contains all changes since the last full, so you need the full and the most recent differential." },
    { q: "After a disaster, the primary site is repaired. Which systems should move back FIRST?",
      options: ["The most critical systems", "The least critical systems", "All systems at once", "Systems with the newest hardware"],
      answer: 1,
      why: "Moving the least critical systems first proves the primary site is stable before risking critical operations." }
  ]
});

window.DOMAINS.push({
  id: "d8", n: 8, weight: 10, priority: "weak",
  title: "Software Development Security",
  short: "Software Security",
  sybex: "Ch 20 Software Development Security · Ch 21 Malicious Code & Application Attacks",
  lede: "Security that is designed in costs a fraction of security that is bolted on. This domain is about building that into how software is planned, written, bought and run.",
  intro: "You do not need to write code to pass this domain; you need to understand how software gets built and where security belongs at each stage. Learn the lifecycle and methodologies, the maturity models, the controls in a modern development pipeline, the common vulnerabilities and their fixes, database security concepts, and how to assess software you buy rather than build. Keep it at the concept level.",
  memorise: [
    "Security is cheapest when built in early: requirements and design, not testing or production.",
    "SDLC: initiation → requirements → design → development → testing → deployment → operations & maintenance → disposal.",
    "Waterfall: sequential, hard to change. Agile: iterative sprints. Spiral: iterative, risk-driven. DevSecOps: security automated in the CI/CD pipeline.",
    "CMMI/SW-CMM levels: 1 Initial, 2 Repeatable/Managed, 3 Defined, 4 Quantitatively managed, 5 Optimising.",
    "Input validation (server-side, allow-list) and parameterised queries stop injection. Output encoding stops XSS.",
    "XSS abuses the user’s trust in a site. CSRF abuses the site’s trust in the user’s browser.",
    "Aggregation: combining low-sensitivity data to reveal sensitive information. Inference: deducing it. Polyinstantiation prevents inference by storing different versions per clearance.",
    "ACID: Atomicity, Consistency, Isolation, Durability.",
    "Know the OWASP Top 10 categories; Broken Access Control is #1."
  ],
  sections: [
    { id: "sdlc", title: "The development lifecycle and methodologies",
      body: `<p>The system development lifecycle (SDLC) gives places to insert security: <strong>initiation</strong> (sensitivity, legal needs), <strong>requirements</strong> (security and privacy requirements, abuse cases), <strong>design</strong> (threat modelling, architecture review), <strong>development</strong> (secure coding, code review, SAST), <strong>testing</strong> (DAST, pen testing, user acceptance), <strong>deployment</strong> (hardening, certification and accreditation), <strong>operations and maintenance</strong> (patching, change management, monitoring), and <strong>disposal</strong> (data sanitisation).</p>
      <div class="tbl-wrap"><table><thead><tr><th>Methodology</th><th>Shape</th><th>Security note</th></tr></thead><tbody>
      <tr><td>Waterfall</td><td>Linear phases, each finished before the next</td><td>Clear sign-offs; late changes are expensive</td></tr>
      <tr><td>V-model</td><td>Waterfall with a test phase matched to each build phase</td><td>Strong verification</td></tr>
      <tr><td>Spiral</td><td>Repeated loops, each with risk analysis</td><td>Risk-driven; suits large projects</td></tr>
      <tr><td>Agile (Scrum, Kanban)</td><td>Short iterations, working software, changing requirements</td><td>Security must be in the definition of done and backlog (security user stories)</td></tr>
      <tr><td>Rapid application development / prototyping</td><td>Fast prototypes refined with users</td><td>Prototypes must not slip into production</td></tr>
      <tr><td>DevOps / DevSecOps</td><td>Development and operations merged; continuous integration and delivery</td><td>Security automated in the pipeline (“shift left”)</td></tr>
      </tbody></table></div>
      <p>An <strong>integrated product team (IPT)</strong> brings together all stakeholders, including security, from the start. Development and production must be separated, and developers should not have unrestricted access to production.</p>`,
      exam: "Where security belongs in each phase; matching methodology to description." },
    { id: "maturity", title: "Maturity models and change control",
      body: `<p>Maturity models measure how reliable a development process is.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Level</th><th>CMM / CMMI</th><th>Meaning</th></tr></thead><tbody>
      <tr><td>1</td><td>Initial</td><td>Ad hoc, heroics</td></tr>
      <tr><td>2</td><td>Repeatable / Managed</td><td>Basic project management, reuse</td></tr>
      <tr><td>3</td><td>Defined</td><td>Documented standard processes</td></tr>
      <tr><td>4</td><td>Quantitatively managed</td><td>Measured with metrics</td></tr>
      <tr><td>5</td><td>Optimising</td><td>Continuous improvement</td></tr>
      </tbody></table></div>
      <p>Security-specific models: <strong>OWASP SAMM</strong> (Software Assurance Maturity Model: governance, design, implementation, verification, operations) and <strong>BSIMM</strong> (descriptive: observes what real firms do). The <strong>IDEAL</strong> model (Initiating, Diagnosing, Establishing, Acting, Learning) guides process improvement.</p>
      <p>Software <strong>change management</strong> has three parts: <em>request control</em> (users ask, managers prioritise), <em>change control</em> (developers build and test in a controlled way), and <em>release control</em> (approved changes go to production, with acceptance testing). <strong>Software configuration management</strong> tracks versions and builds so that any release can be reproduced.</p>`,
      exam: "Naming a maturity level from its description; the three parts of change management." },
    { id: "pipeline", title: "Security in the development ecosystem",
      body: `<p>The 2024 outline lists the parts of the development ecosystem you should secure: programming languages, libraries, tool sets, IDEs, runtime, CI/CD pipelines, software configuration management, code repositories and application security testing.</p>
      <ul>
        <li><strong>Code repositories</strong>: protect branches, require reviews, sign commits, keep secrets out (secret scanning).</li>
        <li><strong>CI/CD</strong>: least-privilege build agents, signed artefacts, separate build and deploy credentials, automated SAST/SCA/DAST gates.</li>
        <li><strong>Libraries and dependencies</strong>: track them in an <strong>SBOM</strong>, use SCA to find known vulnerabilities, pin versions, beware typosquatting and dependency confusion.</li>
        <li><strong>Runtime</strong>: sandboxing, managed code (garbage collection, type safety), memory-safe languages.</li>
        <li><strong>Infrastructure as code</strong>: scan templates for misconfiguration before deployment.</li>
      </ul>
      <div class="note latest"><p>Supply-chain frameworks have moved to the centre: the <strong>NIST SSDF</strong> (SP 800-218), <strong>SLSA</strong> build provenance levels, artefact signing (e.g. Sigstore), and SBOM formats such as SPDX and CycloneDX. Governments now increasingly require secure-development attestations from software suppliers, and push “secure by design” and memory-safe languages.</p></div>`,
      exam: "Choosing the control that protects a pipeline stage; what an SBOM is for." },
    { id: "vulns", title: "Source-code vulnerabilities and secure coding",
      body: `<div class="tbl-wrap"><table><thead><tr><th>Weakness</th><th>What happens</th><th>Fix</th></tr></thead><tbody>
      <tr><td>Buffer overflow</td><td>Input exceeds allocated memory and overwrites adjacent memory, possibly code execution</td><td>Bounds checking, memory-safe languages, ASLR, DEP/NX, stack canaries</td></tr>
      <tr><td>SQL / command injection</td><td>Input is interpreted as code by a database or shell</td><td>Parameterised queries, stored procedures, server-side allow-list validation, least-privilege DB accounts</td></tr>
      <tr><td>Cross-site scripting (XSS)</td><td>Attacker script runs in another user’s browser (reflected, stored, DOM)</td><td>Output encoding, input validation, Content Security Policy, HttpOnly cookies</td></tr>
      <tr><td>Cross-site request forgery (CSRF)</td><td>A logged-in user’s browser is tricked into sending an action</td><td>Anti-CSRF tokens, SameSite cookies, re-authentication</td></tr>
      <tr><td>Insecure direct object reference / broken access control</td><td>User changes an ID to reach another’s data</td><td>Server-side authorisation checks on every request</td></tr>
      <tr><td>Race condition (TOCTOU)</td><td>State changes between check and use</td><td>Atomic operations, locking</td></tr>
      <tr><td>Insecure deserialisation</td><td>Untrusted serialised objects execute code</td><td>Don’t deserialise untrusted data; integrity checks</td></tr>
      <tr><td>SSRF</td><td>Server is made to fetch attacker-chosen URLs (e.g. cloud metadata)</td><td>Allow-list destinations, block internal ranges</td></tr>
      <tr><td>Backdoors / maintenance hooks</td><td>Hidden access paths</td><td>Code review, remove before release</td></tr>
      </tbody></table></div>
      <p>Other secure coding practices: fail securely with generic error messages (no stack traces to users), log security events, avoid hard-coded secrets, use vetted crypto libraries rather than writing your own, and validate on the server because client-side checks can be bypassed.</p>
      <h3>APIs</h3>
      <p>APIs need authentication (OAuth 2.0 tokens, API keys as identifiers not secrets), authorisation on every object, rate limiting, input validation and an inventory. The <strong>OWASP API Security Top 10</strong> leads with broken object-level authorisation.</p>
      <div class="note memory"><p><strong>XSS: the user trusts the site. CSRF: the site trusts the user’s browser.</strong></p></div>`,
      exam: "Recognising a vulnerability from its description and naming the best fix." },
    { id: "owasp", title: "OWASP Top 10 and malicious code",
      body: `<p>The OWASP Top 10 is the most-cited list of web application risks. The 2021 list:</p>
      <ol>
        <li>Broken Access Control</li><li>Cryptographic Failures</li><li>Injection (now including XSS)</li><li>Insecure Design</li><li>Security Misconfiguration</li><li>Vulnerable and Outdated Components</li><li>Identification and Authentication Failures</li><li>Software and Data Integrity Failures</li><li>Security Logging and Monitoring Failures</li><li>Server-Side Request Forgery</li>
      </ol>
      <div class="note latest"><p>OWASP released a <strong>2025 edition</strong>. Broken Access Control stays first; Security Misconfiguration rises; <strong>Software Supply Chain Failures</strong> expands the old outdated-components category; and <strong>Mishandling of Exceptional Conditions</strong> is new. For generative AI there is a separate <strong>OWASP Top 10 for LLM Applications</strong>, led by <strong>prompt injection</strong>. Exam items are written to the 2024 outline, so know the concepts more than the rank numbers.</p></div>
      <h3>Malicious code</h3>
      <p>Virus (needs a host and user action), worm (self-propagating), Trojan (disguised as useful), logic bomb (triggers on a condition), ransomware, rootkit (hides at kernel or firmware level), spyware, botnets, fileless malware (lives in memory and abuses legitimate tools). Defences: anti-malware, allow-listing, least privilege, patching, user awareness, EDR, and code signing.</p>`,
      exam: "Recognising Top 10 categories and malware types." },
    { id: "databases", title: "Databases and data integrity",
      body: `<p>Relational databases hold tables (relations) of rows (tuples) and columns (attributes). A <strong>primary key</strong> uniquely identifies a row; a <strong>foreign key</strong> links tables and enforces <em>referential integrity</em>. <strong>Views</strong> restrict what users see, a form of constrained interface.</p>
      <p>Transactions must be <strong>ACID</strong>: <em>Atomicity</em> (all or nothing), <em>Consistency</em> (rules always hold), <em>Isolation</em> (concurrent transactions don’t interfere), <em>Durability</em> (committed data survives failure). Concurrency control uses locking; a <em>commit</em> saves, a <em>rollback</em> undoes.</p>
      <ul>
        <li><strong>Aggregation</strong>: combining many low-sensitivity items reveals something sensitive (troop counts per base add up to an order of battle).</li>
        <li><strong>Inference</strong>: deducing sensitive facts from accessible data. Defences: <em>polyinstantiation</em> (multiple records at different classifications with the same key), cell suppression, noise and perturbation, partitioning.</li>
      </ul>
      <p>Other terms: data warehouses and data mining, metadata, NoSQL stores (key-value, document, graph) which often lack built-in access control, and ODBC/JDBC connectors.</p>`,
      exam: "Aggregation versus inference and how polyinstantiation helps; ACID." },
    { id: "acquired", title: "Assessing acquired software",
      body: `<p>Most software is bought, not built. The 2024 outline asks you to assess the security impact of:</p>
      <ul>
        <li><strong>Commercial off-the-shelf (COTS)</strong>: you cannot see the code; rely on vendor assurance, certifications, testing, and contract terms. Source-code escrow protects you if the vendor fails.</li>
        <li><strong>Open source</strong>: code is visible but maintenance may be thin; use SCA, track licences, watch project health.</li>
        <li><strong>Third-party / outsourced development</strong>: contractual security requirements, right to audit, code review and testing on delivery.</li>
        <li><strong>Managed services</strong> (SaaS, IaaS, PaaS): shared responsibility, SOC 2 reports, configuration management, data location and exit plans.</li>
      </ul>
      <p>Assess software security effectiveness through auditing and logging of changes, and risk analysis and mitigation, before and after deployment.</p>`,
      exam: "Choosing the assurance step for COTS, open source, outsourced and SaaS." }
  ],
  questions: [
    { q: "At which SDLC phase is it MOST cost-effective to address security?",
      options: ["Testing", "Requirements and design", "Deployment", "Maintenance"],
      answer: 1,
      why: "Defects fixed in requirements and design cost a small fraction of the same defects found in testing or production." },
    { q: "A web application lets users enter a comment that is later displayed to other users, who then have attacker script run in their browsers. Which vulnerability is this, and what is the primary fix?",
      options: ["CSRF; anti-CSRF tokens", "Stored XSS; output encoding with input validation", "SQL injection; parameterised queries", "Buffer overflow; bounds checking"],
      answer: 1,
      why: "Script stored and later rendered to other users is stored (persistent) XSS. Encoding output for its context is the primary defence." },
    { q: "Users with low clearance can query individual non-sensitive records and combine them to learn a classified fact. Which control is designed to prevent this inference?",
      options: ["Polyinstantiation", "Referential integrity", "Atomicity", "Normalisation"],
      answer: 0,
      why: "Polyinstantiation stores different versions of a record at different classification levels, so lower-cleared users cannot infer the protected value." },
    { q: "An organisation uses many open-source libraries and wants to know quickly which applications are affected when a new library vulnerability is announced. What is the BEST control?",
      options: ["Annual penetration tests", "A maintained SBOM for each application, monitored with software composition analysis", "Code signing", "A WAF in front of every application"],
      answer: 1,
      why: "An SBOM lists every component; SCA matches those components against vulnerability data, so impact can be found in minutes." }
  ]
});

/* LearNtime - set-up guide: CISO Assistant Community on Oracle Cloud Always Free.
   Written for LearNtime. Commands follow CISO Assistant's own docker-compose.sh and docker-compose.yml (AGPL-3.0 project, linked, not copied). */
window.GRC_ORACLE = {
  intro: "CISO Assistant Community is a free, open-source GRC platform (AGPL-3.0). It needs a server, so it can't run inside LearNtime. Oracle Cloud's Always Free tier gives you a server that costs nothing. Total time: about 45 minutes, most of it waiting.",
  need: ["An email address and a phone number", "A debit or credit card (Oracle uses it to verify you; the free tier doesn't charge it)", "A computer with a terminal: PowerShell on Windows, Terminal on macOS or Linux"],
  links: [
    ["Oracle Cloud sign-up", "https://www.oracle.com/cloud/free/"],
    ["What Always Free includes (Oracle docs)", "https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm"],
    ["CISO Assistant Community on GitHub", "https://github.com/intuitem/ciso-assistant-community"],
    ["CISO Assistant documentation", "https://intuitem.gitbook.io/ciso-assistant"],
    ["Docker install script", "https://get.docker.com"],
    ["sslip.io (free web address from an IP)", "https://sslip.io"]
  ],
  steps: [
    { id: "account", t: "Create the Oracle Cloud account", body: `
<ol>
<li>Open <a href="https://www.oracle.com/cloud/free/" target="_blank" rel="noopener">oracle.com/cloud/free</a> and choose <b>Start for free</b>.</li>
<li>Pick your <b>home region</b> carefully, because it can't be changed later. From India choose <b>India West (Mumbai)</b> or <b>India South (Hyderabad)</b>.</li>
<li>Finish the card check. Oracle places a small temporary hold and releases it.</li>
<li>Stay on the free tier. Don't upgrade to Pay As You Go unless step 2 tells you to.</li>
</ol>
<div class="note tests"><p><b>Safety net.</b> In the console search for <b>Budgets</b> → <b>Create budget</b>, amount <b>₹1</b>, alert at 100% to your email. If anything ever started to cost money, you would hear about it at once.</p></div>` },
    { id: "vm", t: "Create the free machine", body: `
<p>Console menu → <b>Compute</b> → <b>Instances</b> → <b>Create instance</b>, then:</p>
<table><thead><tr><th>Setting</th><th>Choose</th></tr></thead><tbody>
<tr><td>Name</td><td><code>ciso-assistant</code></td></tr>
<tr><td>Image</td><td><b>Canonical Ubuntu 24.04</b> (click <i>Change image</i>)</td></tr>
<tr><td>Shape</td><td><i>Change shape</i> → <b>Ampere</b> → <b>VM.Standard.A1.Flex</b>, <b>2 OCPUs, 12 GB memory</b>. The free allowance is 4 OCPUs and 24 GB in total.</td></tr>
<tr><td>Networking</td><td>Create a new virtual cloud network with a <b>public subnet</b>; <b>Assign a public IPv4 address: Yes</b></td></tr>
<tr><td>SSH keys</td><td><b>Generate a key pair for me</b> → <b>Save private key</b>. Keep this file safe: it is your login.</td></tr>
<tr><td>Boot volume</td><td>Leave the default (about 47 GB; up to 200 GB is free)</td></tr>
</tbody></table>
<p>Click <b>Create</b>. After a minute or two the state turns green (<b>Running</b>). Copy the <b>Public IP address</b>, for example <code>140.238.1.2</code>.</p>
<div class="note tests"><p><b>"Out of capacity"?</b> Ampere machines are popular. Try another <i>Availability domain</i> on the same page, or try later in the day. If it keeps failing, upgrading the account to Pay As You Go usually fixes it and Always Free resources stay free. Keep the ₹1 budget alert on.</p></div>` },
    { id: "login", t: "Log in to the machine", body: `
<p>On your computer, open a terminal in the folder where you saved the key. Replace <code>KEY_FILE</code> with the key's file name and <code>PUBLIC_IP</code> with your address.</p>
<pre data-copy>chmod 600 KEY_FILE</pre>
<pre data-copy>ssh -i KEY_FILE ubuntu@PUBLIC_IP</pre>
<p>Example: <code>ssh -i ssh-key-2026-11-26.key ubuntu@140.238.1.2</code>. Type <code>yes</code> the first time. The prompt changes to <code>ubuntu@ciso-assistant</code>: you are on the server.</p>
<p class="hint">On Windows PowerShell, skip <code>chmod</code>. If ssh complains about permissions, right-click the key → Properties → Security and leave only your own user with access.</p>` },
    { id: "docker", t: "Install Docker", body: `
<pre data-copy>sudo apt-get update && sudo apt-get -y upgrade</pre>
<pre data-copy>curl -fsSL https://get.docker.com | sudo sh</pre>
<pre data-copy>sudo usermod -aG docker ubuntu</pre>
<p>Type <code>exit</code>, then log in again with the same ssh command so the new permission applies. Check it worked:</p>
<pre data-copy>docker compose version</pre>
<p>Optional but helpful: a 4 GB swap file so the machine never runs out of memory.</p>
<pre data-copy>sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab</pre>` },
    { id: "install", t: "Install CISO Assistant", body: `
<p>These are the project's own quick-start steps. Its ready-made images include ARM builds, so they run on Oracle's Ampere machines.</p>
<pre data-copy>git clone --single-branch -b main https://github.com/intuitem/ciso-assistant-community.git</pre>
<pre data-copy>cd ciso-assistant-community && ./docker-compose.sh</pre>
<p>The script downloads everything and starts it; the first start can take 2 to 5 minutes. Then it asks you to create the <b>first admin user</b>: give your email and a strong password. When it prints <i>Initialization complete</i>, CISO Assistant is running.</p>` },
    { id: "private", t: "Open it the private way (recommended)", body: `
<p>Nothing extra is exposed to the internet: you reach it through your ssh login, like a private tunnel. On <b>your computer</b>, in a new terminal:</p>
<pre data-copy>ssh -i KEY_FILE -N -L 8443:localhost:8443 ubuntu@PUBLIC_IP</pre>
<p>Leave that window open and visit <a href="https://localhost:8443" target="_blank" rel="noopener">https://localhost:8443</a>. The browser warns about the certificate because CISO Assistant makes its own: choose <i>Advanced</i> → <i>Proceed</i>. Sign in with the admin user from the last step.</p>
<p>This is all you need for the GRC labs. Close the terminal window to close the tunnel.</p>` },
    { id: "public", t: "Optional: a public web address", body: `
<p>Only if you want a normal link, for example to put in LearNtime. It uses a free address from <a href="https://sslip.io" target="_blank" rel="noopener">sslip.io</a> (no sign-up) and a real HTTPS certificate from Let's Encrypt. If your IP is <code>140.238.1.2</code>, your address is <code>ciso.140-238-1-2.sslip.io</code>.</p>
<p><b>a) Open ports 80 and 443 in Oracle.</b> Console → <b>Networking</b> → <b>Virtual cloud networks</b> → your network → <b>Subnets</b> → the public subnet → <b>Security</b> (or <i>Security lists</i>) → default list → <b>Add ingress rules</b>: source <code>0.0.0.0/0</code>, TCP, destination port <code>80</code>; then the same for <code>443</code>.</p>
<p><b>b) Open them on the machine too.</b> Oracle's Ubuntu image blocks them by default.</p>
<pre data-copy>sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT && sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT && sudo netfilter-persistent save</pre>
<p><b>c) Tell CISO Assistant its address.</b> In the <code>ciso-assistant-community</code> folder create a file:</p>
<pre data-copy>nano docker-compose.public.yml</pre>
<p>Paste this, replacing <code>ciso.140-238-1-2.sslip.io</code> everywhere with your own address. Save with <code>Ctrl+O</code>, <code>Enter</code>, <code>Ctrl+X</code>.</p>
<pre data-copy>services:
  backend:
    environment:
      - ALLOWED_HOSTS=backend,localhost,ciso.140-238-1-2.sslip.io
      - CISO_ASSISTANT_URL=https://ciso.140-238-1-2.sslip.io
      - DJANGO_DEBUG=False
  huey:
    environment:
      - ALLOWED_HOSTS=backend,localhost,ciso.140-238-1-2.sslip.io
      - CISO_ASSISTANT_URL=https://ciso.140-238-1-2.sslip.io
  frontend:
    environment:
      - PUBLIC_BACKEND_API_EXPOSED_URL=https://ciso.140-238-1-2.sslip.io/api
  caddy:
    environment:
      - CISO_ASSISTANT_URL=https://ciso.140-238-1-2.sslip.io
    ports:
      - "80:80"
      - "443:443"
    command: |
      sh -c 'echo $$CISO_ASSISTANT_URL "{
      reverse_proxy /api/* backend:8000
      reverse_proxy /* frontend:3000
      }" > Caddyfile && caddy run'</pre>
<p>Restart with both files:</p>
<pre data-copy>docker compose -f docker-compose.yml -f docker-compose.public.yml up -d</pre>
<p>After a minute open <code>https://ciso.140-238-1-2.sslip.io</code> (with your numbers). No certificate warning this time. From now on add <code>-f docker-compose.yml -f docker-compose.public.yml</code> after <code>docker compose</code> in every command.</p>
<div class="note tests"><p>Anyone can reach the sign-in page now. Use a strong admin password and don't create accounts you don't need.</p></div>` },
    { id: "daily", t: "Everyday commands", body: `
<p>Run these on the server, inside the <code>ciso-assistant-community</code> folder.</p>
<table><thead><tr><th>What</th><th>Command</th></tr></thead><tbody>
<tr><td>See what is running</td><td><code>docker compose ps</code></td></tr>
<tr><td>Stop it</td><td><code>docker compose down</code></td></tr>
<tr><td>Start it again</td><td><code>docker compose up -d</code></td></tr>
<tr><td>Update to the latest version</td><td><code>docker compose pull && docker compose up -d</code></td></tr>
<tr><td>Back up your data</td><td><code>tar czf ~/ciso-backup-$(date +%F).tgz db</code></td></tr>
<tr><td>See recent errors</td><td><code>docker compose logs --tail=100 backend</code></td></tr>
</tbody></table>
<p>To copy a backup to your computer, run this <b>on your computer</b>:</p>
<pre data-copy>scp -i KEY_FILE ubuntu@PUBLIC_IP:~/ciso-backup-*.tgz .</pre>` },
    { id: "know", t: "Things to know", body: `
<ul>
<li><b>Idle machines.</b> Oracle may stop an Always Free machine that has been almost unused for 7 days. Your data stays on the disk: start it again from Compute → Instances → <b>Start</b>. Using CISO Assistant weekly avoids it.</li>
<li><b>Licence.</b> The Community edition is AGPL-3.0. Running it unchanged for yourself is fine. If you change its code and let other people use it over the web, you must offer them your changed source code.</li>
<li><b>Real client data.</b> This set-up is for learning. Don't upload real audit evidence or personal data unless your employer has approved the hosting.</li>
<li><b>Removing everything.</b> Compute → Instances → your instance → <b>Terminate</b>, ticking <i>delete boot volume</i>.</li>
</ul>` },
    { id: "first", t: "What to do first in CISO Assistant", body: `
<ol>
<li><b>Catalog → Frameworks:</b> load <i>ISO/IEC 27001:2022</i>, and <i>SOC 2</i> if you like.</li>
<li><b>Organization → Domains:</b> create a domain, for example <code>Managed SOC</code>.</li>
<li><b>Assets:</b> add three or four, for example <i>SIEM platform</i>, <i>Client log pipeline</i>, <i>Analyst laptops</i>.</li>
<li><b>Compliance → Audits:</b> create an ISO 27001 audit on your domain and answer ten requirements. Write a one-line reason for every "partially compliant".</li>
<li><b>Risk → Risk assessments:</b> add five risks in cause, event, consequence form, for example <i>"Because log sources are onboarded by hand, a client firewall may be left out, so an intrusion goes unseen and we breach the contract."</i> Link each to the controls that reduce it.</li>
</ol>
<p>Then continue with <a href="#/grc/labs">the hands-on labs</a>.</p>` }
  ]
};

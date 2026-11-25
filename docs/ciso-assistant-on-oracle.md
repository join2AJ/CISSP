# Run CISO Assistant free on Oracle Cloud

This guide puts CISO Assistant Community (free, open source, AGPL-3.0) on an Oracle Cloud "Always Free"
virtual machine, using the project's own Docker setup. Total time: about 45 minutes, most of it waiting.

You need: an email address, a phone number and a debit or credit card (Oracle uses it to verify you and
does not charge it on the free tier), and a computer with a terminal (Windows: PowerShell, macOS/Linux: Terminal).

---

## 1. Create the Oracle Cloud account

1. Go to **cloud.oracle.com** and choose **Sign up** (Free Tier).
2. Pick your **home region** carefully: it can't be changed later. Choose the one nearest you, for
   example **India West (Mumbai)** or **India South (Hyderabad)**.
3. Finish the card check. Oracle places a small temporary hold and releases it.
4. Stay on the free tier. Don't upgrade to "Pay As You Go" unless step 4 below tells you to.

**Set a safety net:** in the console search for **Budgets** → **Create budget** → amount **₹1** (or $1), alert
at 100% to your email. If anything ever started costing money you would hear about it at once.

## 2. Create the virtual machine

Console menu → **Compute** → **Instances** → **Create instance**.

| Setting | Choose |
|---|---|
| Name | `ciso-assistant` |
| Image | **Canonical Ubuntu 24.04** (click *Change image*) |
| Shape | *Change shape* → **Ampere** → **VM.Standard.A1.Flex**, **2 OCPUs, 12 GB memory** (the free allowance is 4 OCPUs and 24 GB in total) |
| Networking | *Create new virtual cloud network*, *public subnet*, **Assign a public IPv4 address: Yes** |
| SSH keys | **Generate a key pair for me** → **Save private key** (keep this file safe, it is your login) |
| Boot volume | leave the default (about 47 GB; up to 200 GB is free) |

Click **Create**. After a minute or two the state turns green (**Running**). Copy the **Public IP address**.

> If you see **"Out of capacity"**: Ampere machines are popular. Try a different *Availability domain* on
> the same page, or try again later in the day. If it keeps failing, upgrading the account to Pay As You
> Go usually fixes it and Always Free resources stay free, but keep the ₹1 budget alert on.

## 3. Log in to the machine

On your computer, open a terminal in the folder where you saved the key. Replace `KEY_FILE` and `PUBLIC_IP`:

```bash
chmod 600 KEY_FILE
```

```bash
ssh -i KEY_FILE ubuntu@PUBLIC_IP
```

Type `yes` the first time. You are now on the server (the prompt shows `ubuntu@ciso-assistant`).

## 4. Install Docker

```bash
sudo apt-get update && sudo apt-get -y upgrade
```

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker ubuntu
```

Log out (`exit`) and log in again with the same `ssh` command, so the new permission applies. Check:

```bash
docker compose version
```

Optional but helpful, a 4 GB swap file so builds never run out of memory:

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 5. Install CISO Assistant

These are the project's own quick-start steps. The ready-made images include ARM builds, so they run on Ampere.

```bash
git clone --single-branch -b main https://github.com/intuitem/ciso-assistant-community.git
```

```bash
cd ciso-assistant-community && ./docker-compose.sh
```

The script downloads the images, starts everything (the first start can take 2 to 5 minutes) and then
asks you to create the **first admin user**: enter your email and a strong password. When it says
*Initialization complete*, CISO Assistant is running on the server.

## 6. Open it: private way (recommended)

Nothing extra is exposed to the internet. You reach it through your SSH login, like a private tunnel.
On **your computer**, in a new terminal:

```bash
ssh -i KEY_FILE -N -L 8443:localhost:8443 ubuntu@PUBLIC_IP
```

Leave that window open, then open **https://localhost:8443** in your browser. The browser warns about the
certificate (CISO Assistant makes its own): choose *Advanced* → *Proceed*. Sign in with the admin user
from step 5.

This is all you need to do the GRC labs. Close the terminal window to close the tunnel.

## 7. Open it: public web address (optional)

Do this only if you want a normal link, for example to put in LearNtime. It gets a real HTTPS certificate
using a free address from **sslip.io**, which needs no sign-up: if your IP is `140.238.1.2`, your address
is `ciso.140-238-1-2.sslip.io`.

**a) Open ports 80 and 443 in Oracle.** Console → **Networking** → **Virtual cloud networks** → your
network → **Subnets** → the public subnet → **Security** (or *Security lists*) → the default list →
**Add ingress rules**: source `0.0.0.0/0`, TCP, destination port `80`; and again for `443`.

**b) Open them on the machine too** (Oracle's Ubuntu image blocks them by default):

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT && sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT && sudo netfilter-persistent save
```

**c) Tell CISO Assistant its address.** In the `ciso-assistant-community` folder, create
`docker-compose.public.yml` (replace `ciso.140-238-1-2.sslip.io` everywhere with yours):

```bash
nano docker-compose.public.yml
```

```yaml
services:
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
      }" > Caddyfile && caddy run'
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`. Then restart with both files:

```bash
docker compose -f docker-compose.yml -f docker-compose.public.yml up -d
```

After a minute, open `https://ciso.140-238-1-2.sslip.io`. The certificate is a real one from Let's Encrypt,
so there is no warning. From now on always use both `-f` files in the commands below.

Anyone can reach the sign-in page now, so keep a strong admin password and don't create accounts you don't need.

## 8. Everyday commands

Run these in the `ciso-assistant-community` folder (add `-f docker-compose.yml -f docker-compose.public.yml`
after `docker compose` if you did step 7).

| What | Command |
|---|---|
| See what is running | `docker compose ps` |
| Stop it | `docker compose down` |
| Start it again | `docker compose up -d` |
| Update to the latest version | `docker compose pull && docker compose up -d` |
| Back up your data | `tar czf ~/ciso-backup-$(date +%F).tgz db` |
| Look at errors | `docker compose logs --tail=100 backend` |

To copy a backup to your computer, run this on your computer:

```bash
scp -i KEY_FILE ubuntu@PUBLIC_IP:~/ciso-backup-*.tgz .
```

## 9. Things to know

- **Idle machines:** Oracle may stop an Always Free machine that sits almost unused for 7 days. Your data
  stays on the disk; start it again from **Compute → Instances → Start**. Using CISO Assistant weekly is enough.
- **Licence:** the Community edition is AGPL-3.0. Running it unchanged for yourself is fine. If you change
  its code and let other people use it over the web, you must offer them your changed source code.
- **Real client data:** this setup is for learning. Don't upload real audit evidence or personal data to it
  unless your employer has approved the hosting.
- **Remove everything:** Compute → Instances → your instance → **Terminate** (tick *delete boot volume*).

## 10. What to do first in CISO Assistant

1. **Catalog → Frameworks:** load *ISO/IEC 27001:2022* (and *SOC 2* if you like).
2. **Organization → Domains:** create a domain, for example `Managed SOC`.
3. **Assets:** add three or four, for example *SIEM platform*, *Client log pipeline*, *Analyst laptops*.
4. **Compliance → Audits:** create an audit of ISO 27001 on your domain and answer ten requirements.
5. **Risk → Risk assessments:** add five risks in cause, event, consequence form and link controls to them.

The **Hands-on labs** in LearNtime (Learn GRC → Practise → Hands-on labs) walk through these in more detail.

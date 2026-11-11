/* StudyCISSP — small step-by-step animations for hard topics.
   Place <div class="anim" data-anim="osi"></div> in content; Anim.mountAll(root) brings it to life.
   Each animation is a list of states; CSS transitions do the moving. */
(function () {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const center = (el, stage) => { const a = el.getBoundingClientRect(), b = stage.getBoundingClientRect(); return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 }; };
  const place = (tok, el) => { const p = center(el, tok.offsetParent || tok.parentElement); tok.style.left = p.x + "px"; tok.style.top = p.y + "px"; };

  const OSI = ["Application", "Presentation", "Session", "Transport", "Network", "Data link", "Physical"];
  const H = t => `<i>${t}</i>`;
  const osiFrames = [
    ["s", 7, "Data", "Application: your browser creates an HTTP request. At this point it is just data."],
    ["s", 6, "Data", "Presentation: the data is formatted and encoded (encryption formats are often placed here)."],
    ["s", 5, "Data", "Session: the conversation between the two computers is set up and tracked."],
    ["s", 4, H("TCP") + "Data", "Transport: a TCP header with port numbers is added. Now it’s a segment."],
    ["s", 3, H("IP") + H("TCP") + "Data", "Network: an IP header with source and destination addresses is added. Now it’s a packet."],
    ["s", 2, H("MAC") + H("IP") + H("TCP") + "Data" + H("FCS"), "Data link: a MAC header and an error-check trailer (FCS) are added. Now it’s a frame."],
    ["s", 1, "1011 0110 0101…", "Physical: the frame becomes electrical, light or radio signals: bits."],
    ["r", 1, "1011 0110 0101…", "The bits cross the cable or the air to the receiver."],
    ["r", 2, H("MAC") + H("IP") + H("TCP") + "Data" + H("FCS"), "Data link: the frame is checked (FCS) and its MAC header removed."],
    ["r", 3, H("IP") + H("TCP") + "Data", "Network: the IP header is read and removed."],
    ["r", 4, H("TCP") + "Data", "Transport: the port says which application should get it; TCP header removed."],
    ["r", 5, "Data", "Session: the data is handed to the right conversation."],
    ["r", 6, "Data", "Presentation: the data is decoded (and decrypted) into a usable format."],
    ["r", 7, "Data", "Application: the web server gets the original request. Each layer only ever read its own header. That is encapsulation."]
  ];

  const DEF = {
    osi: {
      title: "Encapsulation: down the stack, across, and up",
      html: `<div class="osi-anim"><div class="osi-col" data-side="s"><div class="osi-h">Sender</div>${OSI.map((n, i) => `<div class="osi-l" data-l="${7 - i}"><b>${7 - i}</b>${n}</div>`).join("")}</div>
        <div class="osi-wire"><span></span></div>
        <div class="osi-col" data-side="r"><div class="osi-h">Receiver</div>${OSI.map((n, i) => `<div class="osi-l" data-l="${7 - i}"><b>${7 - i}</b>${n}</div>`).join("")}</div>
        <div class="tok pkt"></div></div>`,
      steps: osiFrames.length,
      show(st, i) {
        const [side, l, label, cap] = osiFrames[i];
        st.querySelectorAll(".osi-l").forEach(e => e.classList.remove("on"));
        const row = st.querySelector(`.osi-col[data-side="${side}"] .osi-l[data-l="${l}"]`); row.classList.add("on");
        const t = st.querySelector(".pkt"); t.innerHTML = label; place(t, row);
        return cap;
      }
    },
    handshake: {
      title: "The TCP three-way handshake",
      html: `<div class="hs"><div class="hs-end"><b>Client</b></div><div class="hs-mid">
        <div class="hs-a r" data-k="1"><span>SYN · seq = x</span></div>
        <div class="hs-a l" data-k="2"><span>SYN-ACK · seq = y, ack = x+1</span></div>
        <div class="hs-a r" data-k="3"><span>ACK · ack = y+1</span></div>
        <div class="hs-ok" data-k="4">Connection established ✓</div></div><div class="hs-end"><b>Server</b></div></div>`,
      steps: 5,
      caps: ["A client wants a reliable TCP connection to a server on, say, port 443.",
        "Step 1, SYN: “I’d like to talk. My sequence numbers start at x.”",
        "Step 2, SYN-ACK: “Agreed. I got your x; mine start at y.” The server now holds a half-open connection.",
        "Step 3, ACK: “Got your y.” Both sides agree on sequence numbers.",
        "Data can flow. A SYN flood sends step 1 thousands of times and never step 3, filling the server with half-open connections."],
      show(st, i) { st.querySelectorAll("[data-k]").forEach(e => e.classList.toggle("on", +e.dataset.k <= i)); return this.caps[i]; }
    },
    models: {
      title: "Bell–LaPadula vs Biba: who can read and write where",
      html: `<div class="mv">${[["blp", "Bell–LaPadula", "Confidentiality", ["Top Secret", "Secret", "Unclassified"]], ["biba", "Biba", "Integrity", ["High integrity", "Medium", "Low integrity"]]].map(([k, n, g, lv]) => `
        <div class="mv-p" data-m="${k}"><div class="mv-t"><b>${n}</b><small>${g}</small></div>
          ${lv.map((x, j) => `<div class="mv-lv ${j === 1 ? "me" : ""}">${x}${j === 1 ? " <em>you are here</em>" : ""}</div>`).join("")}
          <div class="mv-ar"><span class="lbl"></span></div><div class="mv-v"></div></div>`).join("")}</div>`,
      steps: 5,
      ops: [null, ["up", "Read up"], ["down", "Read down"], ["up", "Write up"], ["down", "Write down"]],
      verdict: { blp: [null, 0, 1, 1, 0], biba: [null, 1, 0, 0, 1] },
      caps: ["A subject cleared at the middle level tries four operations under each model.",
        "Read up: Bell–LaPadula says no (you can’t read secrets above you). Biba says yes (reading cleaner data is safe).",
        "Read down: Bell–LaPadula allows it. Biba blocks it, because low-integrity data could contaminate you.",
        "Write up: Bell–LaPadula allows it (it can’t leak secrets). Biba blocks it (you’d contaminate cleaner data).",
        "Write down: Bell–LaPadula blocks it (that would leak secrets). Biba allows it. The two models are mirror images."],
      show(st, i) {
        const op = this.ops[i];
        st.querySelectorAll(".mv-p").forEach(p => {
          const ar = p.querySelector(".mv-ar"), v = p.querySelector(".mv-v");
          ar.className = "mv-ar" + (op ? " on " + op[0] : ""); ar.querySelector(".lbl").textContent = op ? op[1] : "";
          const ok = op ? this.verdict[p.dataset.m][i] : null;
          v.className = "mv-v" + (op ? (ok ? " ok" : " no") : ""); v.textContent = op ? (ok ? "✓ allowed" : "✗ denied") : "";
        });
        return this.caps[i];
      }
    },
    kerberos: {
      title: "Kerberos: tickets, not passwords, travel the network",
      html: `<div class="kb"><div class="kb-n" data-n="c"><b>You</b><small>client</small></div>
        <div class="kb-kdc"><span>KDC</span><div class="kb-n" data-n="as"><b>AS</b><small>Authentication Service</small></div><div class="kb-n" data-n="tgs"><b>TGS</b><small>Ticket-Granting Service</small></div></div>
        <div class="kb-n" data-n="s"><b>File server</b><small>the service</small></div><div class="tok kt"></div></div>`,
      flow: [["c", "", "You type your password once. It never crosses the network; it unlocks a key on your machine."],
        ["as", "Request", "Your client asks the Authentication Service for a ticket, proving it knows your key with a timestamp."],
        ["c", "🎫 TGT", "The AS returns a ticket-granting ticket (TGT), sealed with the TGS’s key. You can carry it but not read it."],
        ["tgs", "🎫 TGT", "Later you need the file server. Your client shows the TGT to the Ticket-Granting Service."],
        ["c", "🎟 Ticket", "The TGS issues a service ticket for that one server."],
        ["s", "🎟 Ticket", "You present the service ticket. The server checks it with its own key: access granted, no password sent."],
        ["s", "✓", "Clocks must agree within about five minutes, or the timestamps fail. That’s why time sync matters for Kerberos."]],
      get steps() { return this.flow.length; },
      show(st, i) {
        const [n, lbl, cap] = this.flow[i];
        st.querySelectorAll(".kb-n").forEach(e => e.classList.toggle("on", e.dataset.n === n));
        const t = st.querySelector(".kt"); t.textContent = lbl; t.style.opacity = lbl ? 1 : 0;
        place(t, st.querySelector(`.kb-n[data-n="${n}"]`));
        return cap;
      }
    },
    signature: {
      title: "A digital signature, step by step",
      html: `<div class="sg">${[["📄", "Message"], ["#", "Hash it"], ["🔏", "Encrypt hash with Alice’s private key"], ["✉", "Send message + signature"], ["🔓", "Decrypt with Alice’s public key"], ["⇄", "Compare hashes"]].map(([ic, t], k) => `<div class="sg-s" data-k="${k}"><span>${ic}</span><small>${t}</small></div>`).join('<i class="sg-arrow"></i>')}</div>`,
      steps: 6,
      caps: ["Alice wants Bob to know a message really came from her and wasn’t changed.",
        "She hashes the message: a short, fixed-length fingerprint.",
        "She encrypts the hash with her private key. That encrypted hash is the signature. Only Alice could have made it.",
        "She sends the message with the signature. Note: the message itself isn’t secret; signatures don’t give confidentiality.",
        "Bob decrypts the signature with Alice’s public key to recover her hash, and hashes the message himself.",
        "If the two hashes match: integrity ✓, authenticity ✓, non-repudiation ✓."],
      show(st, i) { st.querySelectorAll(".sg-s").forEach(e => { const k = +e.dataset.k; e.classList.toggle("on", k <= i); e.classList.toggle("now", k === i); }); st.querySelectorAll(".sg-arrow").forEach((a, k) => a.classList.toggle("on", k < i)); return this.caps[i]; }
    },
    backup: {
      title: "Incremental vs differential backups",
      html: `<div class="bk"><div></div>${["Sun", "Mon", "Tue", "Wed", "Thu"].map(d => `<div class="bk-d">${d}</div>`).join("")}
        ${[["inc", "Incremental", ["Full", "Mon", "Tue", "Wed", "Thu"]], ["dif", "Differential", ["Full", "Mon", "Mon–Tue", "Mon–Wed", "Mon–Thu"]]].map(([k, n, cells]) => `<div class="bk-n">${n}</div>${cells.map((c, j) => `<div class="bk-c ${j === 0 ? "full" : ""}" data-r="${k}" data-j="${j}" style="--w:${j === 0 ? 100 : k === "inc" ? 22 : 18 + j * 18}%"><i></i><span>${c}</span></div>`).join("")}`).join("")}</div>`,
      steps: 7,
      caps: ["Two strategies, both starting with a full backup on Sunday.",
        "Sunday: a full backup copies everything (and clears the archive bit).",
        "Monday: both copy Monday’s changes.",
        "Tuesday: incremental copies only Tuesday’s changes; differential copies everything since Sunday, so it grows.",
        "By Thursday, incremental backups stay small and fast. Differentials keep growing.",
        "Disaster on Friday. Incremental restore needs Sunday’s full plus every incremental: five sets, in order.",
        "Differential restore needs only Sunday’s full plus Thursday’s differential: two sets. Slower backups, faster restore."],
      show(st, i) {
        st.querySelectorAll(".bk-c").forEach(c => {
          const j = +c.dataset.j, r = c.dataset.r;
          c.classList.toggle("on", i >= 1 && j <= Math.min(i - 1, 4) || i >= 5);
          const need = (i === 5 && r === "inc") || (i === 6 && r === "dif" && (j === 0 || j === 4));
          c.classList.toggle("need", need); c.classList.toggle("dim", (i === 5 && r === "dif") || (i === 6 && !need));
        });
        return this.caps[i];
      }
    },
    ale: {
      title: "Annualised loss expectancy, worked through",
      html: `<div class="ale">
        <div class="ale-r" data-k="1"><span class="v">AV $100,000</span><span class="op">×</span><span class="v">EF 40%</span><span class="op">=</span><span class="v res">SLE $40,000</span></div>
        <div class="ale-r" data-k="2"><span class="v">SLE $40,000</span><span class="op">×</span><span class="v">ARO 0.05</span><span class="op">=</span><span class="v res big">ALE $2,000 / yr</span></div>
        <div class="ale-r" data-k="3"><span class="v">Control costs $5,000 / yr</span><span class="op">&gt;</span><span class="v">saves ≤ $2,000 / yr</span><span class="op">→</span><span class="v res no">Not justified on cost</span></div></div>`,
      steps: 4,
      caps: ["A $100,000 server in a flood-prone building.",
        "One flood would destroy 40% of its value: the single loss expectancy is $40,000.",
        "A flood is expected once every 20 years (ARO 0.05), so the expected yearly loss is $2,000.",
        "A $5,000-a-year control to stop a $2,000-a-year loss costs more than it saves. Insurance or acceptance may make more sense."],
      show(st, i) { st.querySelectorAll("[data-k]").forEach(e => e.classList.toggle("on", +e.dataset.k <= i)); return this.caps[i]; }
    }
  };

  function frame(id, def) {
    const n = def.steps;
    return `<figure class="anim-box" data-anim-id="${id}">
      <figcaption><span class="anim-k">See it move</span><b>${def.title}</b>
        <span class="anim-ctl"><button data-a="prev" aria-label="Previous step">‹</button><button data-a="play" aria-label="Pause">❚❚</button><button data-a="next" aria-label="Next step">›</button><button data-a="replay" aria-label="Replay">↺</button></span></figcaption>
      <div class="anim-stage">${def.html}</div>
      <p class="anim-cap" aria-live="polite"></p>
      <div class="anim-dots">${Array.from({ length: n }, (_, k) => `<button data-a="go" data-i="${k}" aria-label="Step ${k + 1}"></button>`).join("")}</div>
    </figure>`;
  }

  function mount(el) {
    const id = el.dataset.anim, def = DEF[id]; if (!def) return;
    const wrap = document.createElement("div"); wrap.innerHTML = frame(id, def);
    const fig = wrap.firstElementChild; el.replaceWith(fig);
    const st = fig.querySelector(".anim-stage"), cap = fig.querySelector(".anim-cap"), play = fig.querySelector('[data-a="play"]');
    let i = 0, timer = null, playing = false, seen = false;
    const show = (k) => { i = (k + def.steps) % def.steps; cap.textContent = def.show(st, i); fig.querySelectorAll(".anim-dots button").forEach((d, j) => d.classList.toggle("on", j === i)); };
    const tick = () => { if (i === def.steps - 1) { stop(); return; } show(i + 1); };
    const start = () => { if (playing) return; playing = true; play.textContent = "❚❚"; play.setAttribute("aria-label", "Pause"); timer = setInterval(tick, 2600); };
    const stop = () => { playing = false; clearInterval(timer); play.textContent = "▶"; play.setAttribute("aria-label", "Play"); };
    fig.addEventListener("click", e => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a;
      if (a === "play") { if (playing) stop(); else { if (i === def.steps - 1) show(0); start(); } }
      if (a === "next") { stop(); show(i + 1); }
      if (a === "prev") { stop(); show(i - 1); }
      if (a === "replay") { show(0); start(); }
      if (a === "go") { stop(); show(+b.dataset.i); }
    });
    requestAnimationFrame(() => { show(0); stop(); });
    addEventListener("resize", () => show(i));
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting && !seen) { seen = true; setTimeout(start, 600); }
        else if (!en.isIntersecting && playing) stop();
      }), { threshold: 0.5 }).observe(fig);
    }
  }

  window.Anim = { mountAll(root) { (root || document).querySelectorAll(".anim[data-anim]").forEach(mount); }, ids: Object.keys(DEF) };
})();

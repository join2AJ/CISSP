/* LearNtime - PDF metadata check: read-only. Shows each PDF's document properties, XMP data, structure signals and a SHA-256
   fingerprint, and compares several PDFs side by side. Uses PDF.js (Mozilla, Apache-2.0) plus a light scan of the raw file.
   Everything happens in the browser; files are not uploaded or changed. */
(function () {
  "use strict";
  const A = window.App, { esc, $, $$ } = A;
  let pdfjs = null, docs = [], busy = "", saved = null, focus = -1;
  async function savedList() {
    const out = [];
    try { if (A.db && A.db.mode === "cloud" && A.db.user) (await A.db.resources()).filter(r => r.kind === "file" && /\.pdf$/i.test(r.storage_path || r.title || "")).forEach(r => out.push({ key: "s:" + r.id, src: "online", name: r.title, tags: r.tags || [], up: r.created_at ? new Date(r.created_at) : null, r })); } catch (e) {}
    try { if (window.GRC_FOLDERS) { const { folders, files } = await window.GRC_FOLDERS.list(); files.filter(f => /\.pdf$/i.test(f.name)).forEach(f => out.push({ key: "f:" + f.id, src: (folders.find(x => x.id === f.folder) || { name: "folder" }).name, name: f.name, tags: f.tags || [], up: f.added ? new Date(f.added) : null, f })); } } catch (e) {}
    return out.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  }
  const load = async () => { if (!pdfjs) { pdfjs = await import(new URL("assets/vendor/pdfjs/pdf.min.mjs", location.href).href); pdfjs.GlobalWorkerOptions.workerSrc = new URL("assets/vendor/pdfjs/pdf.worker.min.mjs", location.href).href; } return pdfjs; };
  const size = b => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
  // PDF dates look like D:20261027101500+05'30'
  const pdfDate = s => { if (!s) return null; const m = String(s).match(/D?:?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Zz+\-])?(\d{2})?'?(\d{2})?/); if (!m) return null;
    const [, y, mo = "01", d = "01", h = "00", mi = "00", se = "00", z, zh, zm] = m; const off = !z || z === "Z" || z === "z" ? "Z" : `${z}${zh || "00"}:${zm || "00"}`;
    const t = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}${off}`); return isNaN(t) ? null : t; };
  const showDate = t => t ? t.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

  async function analyse(file) {
    const buf = await file.arrayBuffer(), u8 = new Uint8Array(buf);
    const sha = hex(await crypto.subtle.digest("SHA-256", buf));
    // light raw scan (latin1 keeps byte positions)
    let raw = ""; const step = 1 << 20; for (let i = 0; i < u8.length; i += step) raw += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + step, u8.length)));
    const count = re => (raw.match(re) || []).length;
    const head = (raw.slice(0, 1024).match(/%PDF-(\d\.\d)/) || [, "?"])[1];
    const scan = { header: head, eofs: count(/%%EOF/g), xrefs: count(/startxref/g), sigs: count(/\/ByteRange\s*\[/g), js: count(/\/(JavaScript|JS)\b/g) > 0,
      embedded: count(/\/EmbeddedFile\b/g) > 0, forms: /\/AcroForm\b/.test(raw), encrypted: /\/Encrypt\b/.test(raw), incr: Math.max(0, count(/%%EOF/g) - 1) };
    const out = { name: file.name, size: file.size, sha, scan, info: {}, xmp: {}, pages: 0, pageSize: "", error: "" };
    try {
      const { getDocument } = await load();
      const doc = await getDocument({ data: u8.slice(), isEvalSupported: false, stopAtErrors: false }).promise;
      out.pages = doc.numPages;
      const md = await doc.getMetadata(); out.info = md.info || {};
      if (md.metadata) { try { out.xmp = md.metadata.getAll ? md.metadata.getAll() : {}; } catch (e) {} }
      try { const p1 = await doc.getPage(1), vp = p1.getViewport({ scale: 1 }); out.pageSize = `${Math.round(vp.width * 25.4 / 72)} × ${Math.round(vp.height * 25.4 / 72)} mm`; } catch (e) {}
      await doc.destroy();
    } catch (e) { out.error = /password/i.test(e && e.message) ? "Password protected: only the raw details below could be read." : "PDF.js couldn't read this file fully; it may be damaged."; }
    out.created = pdfDate(out.info.CreationDate || out.xmp["xmp:createdate"]); out.modified = pdfDate(out.info.ModDate || out.xmp["xmp:modifydate"]);
    if (!out.created && out.xmp["xmp:createdate"]) out.created = new Date(out.xmp["xmp:createdate"]);
    if (!out.modified && out.xmp["xmp:modifydate"]) out.modified = new Date(out.xmp["xmp:modifydate"]);
    return out;
  }

  function signals(d) {
    const s = [], gap = d.created && d.modified ? (d.modified - d.created) / 60000 : 0;
    if (d.scan.incr > 0) s.push(["warn", `Saved over ${d.scan.incr} time${d.scan.incr > 1 ? "s" : ""} after it was first written (incremental updates). Common after form filling, signing or editing.`]);
    if (gap > 2) s.push(["warn", `Modified ${gap > 1440 ? Math.round(gap / 1440) + " days" : gap > 60 ? Math.round(gap / 60) + " hours" : Math.round(gap) + " minutes"} after it was created.`]);
    if (!d.info.Producer && !d.info.Creator && !Object.keys(d.xmp).length) s.push(["info", "No producer, creator or XMP data: the metadata may have been removed."]);
    if (d.scan.sigs) s.push(["good", `${d.scan.sigs} digital signature field${d.scan.sigs > 1 ? "s" : ""}. Open it in a PDF reader to check whether each signature is valid.`]);
    if (d.scan.js) s.push(["warn", "Contains JavaScript. Unusual for a normal document."]);
    if (d.scan.embedded) s.push(["info", "Has attached (embedded) files."]);
    if (d.scan.encrypted) s.push(["info", "Encrypted or has permission restrictions."]);
    if (d.info.Creator && d.info.Producer && !String(d.info.Producer).toLowerCase().includes(String(d.info.Creator).toLowerCase().split(/[ \d]/)[0])) s.push(["info", `Made with "${d.info.Creator}", written by "${d.info.Producer}".`]);
    if (!s.length) s.push(["good", "No editing signals found in the metadata or structure."]);
    return s;
  }

  const ROWS = [
    ["File", d => d.name], ["Size", d => size(d.size)], ["SHA-256", d => d.sha.slice(0, 16) + "…", d => d.sha], ["PDF version", d => d.info.PDFFormatVersion || d.scan.header],
    ["Source", d => d.from || "This device"], ["Uploaded to LearNtime", d => d.uploaded ? showDate(d.uploaded) : "Not saved (checked from this device)"], ["Date on your device", d => d.deviceDate ? showDate(d.deviceDate) : "-"], ["Tags", d => (d.tags || []).map(t => "#" + t).join(" ") || "-"], ["Pages", d => d.pages || "-"], ["Page size", d => d.pageSize || "-"], ["Title", d => d.info.Title || "-"], ["Author", d => d.info.Author || "-"], ["Subject", d => d.info.Subject || "-"],
    ["Keywords", d => d.info.Keywords || "-"], ["Creator (app)", d => d.info.Creator || d.xmp["xmp:creatortool"] || "-"], ["Producer", d => d.info.Producer || d.xmp["pdf:producer"] || "-"],
    ["Created", d => showDate(d.created)], ["Modified", d => showDate(d.modified)], ["Saved over (incremental updates)", d => d.scan.incr],
    ["Digital signatures", d => d.scan.sigs || "none"], ["Form fields", d => d.scan.forms ? "yes" : "no"], ["JavaScript", d => d.scan.js ? "yes" : "no"], ["Attached files", d => d.scan.embedded ? "yes" : "no"],
    ["Encrypted", d => d.scan.encrypted ? "yes" : "no"], ["Linearized (web-optimised)", d => d.info.IsLinearized ? "yes" : "no"],
    ["XMP document ID", d => d.xmp["xmpmm:documentid"] || "-"], ["XMP instance ID", d => d.xmp["xmpmm:instanceid"] || "-"]
  ];

  const detail = (d, i) => `<div class="tbl-wrap"><table class="tbl pm-tbl"><thead><tr><th>Property</th><th>${esc(d.name)}</th></tr></thead>
      <tbody>${ROWS.slice(1).map(([k, f, full]) => `<tr><th scope="row">${k}</th><td ${full ? `title="${esc(full(d))}"` : ""}>${esc(String(f(d)))}</td></tr>`).join("")}</tbody></table></div>
    <h2 class="h-section">What stands out</h2>${sigCard(d, i)}`;
  const sigCard = (d, i) => `<section class="card pm-one"><h3>${i + 1}. ${esc(d.name)}</h3>${d.error ? `<p class="hint">${esc(d.error)}</p>` : ""}<ul>${signals(d).map(([t, x]) => `<li class="${t}">${esc(x)}</li>`).join("")}</ul>
      <details><summary>Full SHA-256 and XMP data</summary><p class="mono pm-hash">${d.sha}</p>${Object.keys(d.xmp).length ? `<dl class="pm-xmp">${Object.entries(d.xmp).slice(0, 60).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(typeof v === "string" ? v : JSON.stringify(v))}</dd>`).join("")}</dl>` : `<p class="hint">No XMP data.</p>`}</details></section>`;
  function results() {
    const head = `<div class="btn-row"><button class="btn small" id="pmCsv">Download table (Excel)</button><button class="btn small ghost" id="pmClear">Clear all</button></div>`;
    if (focus >= 0 && docs[focus]) return `${head}<p><button class="btn small" id="pmBack">← Back to all ${docs.length} PDFs</button></p><h2 class="h-section">${esc(docs[focus].name)}</h2>${detail(docs[focus], focus)}`;
    if (docs.length === 1) return `${head}<h2 class="h-section">Details</h2>${detail(docs[0], 0)}`;
    if (docs.length === 2) return `${head}<h2 class="h-section">Side by side</h2><p class="sub">Cells that differ from the first file are highlighted. Tap View for one file's full details.</p>
      <div class="tbl-wrap"><table class="tbl pm-tbl"><thead><tr><th>Property</th>${docs.map((d, i) => `<th>${i + 1}. ${esc(d.name)} <button class="btn small" data-pmview="${i}">View</button> <button class="pm-x" data-pmrm="${i}" aria-label="Remove ${esc(d.name)}">×</button></th>`).join("")}</tr></thead>
      <tbody>${ROWS.slice(1).map(([k, f, full]) => { const v = docs.map(d => String(f(d))); return `<tr><th scope="row">${k}</th>${v.map((x, i) => `<td class="${i > 0 && x !== v[0] ? "pm-diff" : ""}" ${full ? `title="${esc(full(docs[i]))}"` : ""}>${esc(x)}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>
      <h2 class="h-section">What stands out</h2><div class="pm-sig">${docs.map(sigCard).join("")}</div>`;
    // many files: one row per PDF; unusual values highlighted
    const most = key => { const c = {}; docs.forEach(d => { const v = key(d); c[v] = (c[v] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; };
    const prod = d => d.info.Producer || d.xmp["pdf:producer"] || "-", crea = d => d.info.Creator || d.xmp["xmp:creatortool"] || "-", ver = d => d.info.PDFFormatVersion || d.scan.header;
    const mp = most(prod), mc = most(crea), mv = most(ver);
    const flag = d => signals(d).filter(x => x[0] === "warn").length;
    return `${head}<h2 class="h-section">All ${docs.length} PDFs</h2><p class="sub">One row per PDF. Highlighted cells are unusual for this set: a different producer, app or PDF version from most files, a file saved over after it was made, or modified after it was created. Tap View for one file's full details.</p>
      <div class="tbl-wrap"><table class="tbl pm-tbl pm-list-tbl"><thead><tr><th>#</th><th>File</th><th>Uploaded to LearNtime</th><th>Created</th><th>Modified</th><th>Creator (app)</th><th>Producer</th><th>PDF</th><th>Pages</th><th>Saved over</th><th>Signatures</th><th>SHA-256</th><th>Flags</th><th><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${docs.map((d, i) => { const gap = d.created && d.modified && (d.modified - d.created) > 120000;
        return `<tr><td>${i + 1}</td><td class="pm-fn">${esc(d.name)}${(d.tags || []).length ? `<small>${d.tags.map(t => "#" + esc(t)).join(" ")}</small>` : ""}</td><td>${d.uploaded ? showDate(d.uploaded) : "Not saved"}</td>
          <td>${showDate(d.created)}</td><td class="${gap ? "pm-diff" : ""}">${showDate(d.modified)}</td><td class="${crea(d) !== mc ? "pm-diff" : ""}">${esc(crea(d))}</td><td class="${prod(d) !== mp ? "pm-diff" : ""}">${esc(prod(d))}</td>
          <td class="${ver(d) !== mv ? "pm-diff" : ""}">${esc(ver(d))}</td><td>${d.pages || "-"}</td><td class="${d.scan.incr ? "pm-diff" : ""}">${d.scan.incr}</td><td>${d.scan.sigs || "none"}</td>
          <td class="mono" title="${d.sha}">${d.sha.slice(0, 10)}…</td><td>${flag(d) ? `<span class="pm-flag">${flag(d)}</span>` : "-"}</td>
          <td><button class="btn small" data-pmview="${i}">View</button> <button class="pm-x" data-pmrm="${i}" aria-label="Remove ${esc(d.name)}">×</button></td></tr>`; }).join("")}</tbody></table></div>`;
  }
  async function view() {
    if (saved === null) saved = await savedList();
    return `<div class="page grc-pdfmeta"><a class="kicker" href="#/grc">← Learn GRC · Tools</a>
      <h1 class="h-display">PDF <em>metadata check</em></h1>
      <p class="lede">See what a PDF says about itself: which app made it, when it was created and modified, whether it was saved over afterwards, signatures, and a fingerprint (SHA-256) for your evidence records. Load several PDFs to compare them side by side. Read-only: files stay on your device and aren't changed.</p>
      <label class="up-drop" id="pmDrop"><input type="file" id="pmFiles" accept="application/pdf,.pdf" multiple hidden><span class="up-ico" aria-hidden="true">⌕</span><b>Choose PDFs</b><span>one to inspect, two or more to compare</span></label>
      ${saved.length ? `<details class="card pm-saved" ${docs.length ? "" : "open"}><summary>Or pick from your saved files (${saved.length} PDF${saved.length > 1 ? "s" : ""})</summary>
        <label class="check pm-all"><input type="checkbox" id="pmAll"><span><b>Select all</b></span></label>
        <div class="pm-list">${saved.map(x => `<label class="check"><input type="checkbox" data-pmpick="${esc(x.key)}"><span><b>${esc(x.name)}</b><small>${x.src === "online" ? "Saved online" : "My folders · " + esc(x.src)}${x.up ? " · uploaded " + showDate(x.up) : ""}${x.tags.length ? " · " + x.tags.map(t => "#" + esc(t)).join(" ") : ""}</small></span></label>`).join("")}</div>
        <div class="btn-row"><button class="btn small primary" id="pmPickGo">Check selected</button><button class="btn small" id="pmPickAll">Check all ${saved.length}</button></div></details>` : ""}
      ${busy ? `<p class="up-busy" role="status">${esc(busy)}</p>` : ""}
      ${docs.length ? results() : ""}
      <div class="card pm-how"><h3>Reading the results</h3><ul>
        <li><b>Metadata can be wrong or removed.</b> It shows how a file was made, not whether it is genuine. A clean result doesn't prove a document is authentic.</li>
        <li><b>The strongest checks</b> are a valid digital signature, or getting a fresh copy straight from the issuer and comparing fingerprints.</li>
        <li><b>For evidence:</b> record the SHA-256 when you receive a file. If the fingerprint changes later, the file changed.</li></ul></div>
      <p class="hint">Uses <a href="https://mozilla.github.io/pdf.js/" target="_blank" rel="noopener">PDF.js</a> by Mozilla (Apache-2.0).</p></div>`;
  }

  function bind() {
    const rr = () => A.rerender();
    const add = async list => { const pdfs = [...list].filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)); if (!pdfs.length) return A.toast("Choose PDF files.");
      for (let i = 0; i < pdfs.length; i++) { busy = `Reading ${pdfs[i].name} (${i + 1} of ${pdfs.length})…`; rr(); try { const d = await analyse(pdfs[i]); d.deviceDate = pdfs[i].lastModified ? new Date(pdfs[i].lastModified) : null; docs.push(d); } catch (e) { A.toast(`Couldn't read ${pdfs[i].name}.`); } }
      busy = ""; rr(); };
    const fi = $("#pmFiles"); if (fi) fi.addEventListener("change", () => add(fi.files));
    const dr = $("#pmDrop"); if (dr) { ["dragenter", "dragover"].forEach(ev => dr.addEventListener(ev, e => { e.preventDefault(); dr.classList.add("over"); })); ["dragleave", "drop"].forEach(ev => dr.addEventListener(ev, e => { e.preventDefault(); dr.classList.remove("over"); })); dr.addEventListener("drop", e => add(e.dataTransfer.files)); }
    $$("[data-pmrm]").forEach(b => b.addEventListener("click", () => { docs.splice(+b.dataset.pmrm, 1); focus = -1; rr(); }));
    $$("[data-pmview]").forEach(b => b.addEventListener("click", () => { focus = +b.dataset.pmview; rr(); scrollTo(0, 0); }));
    const bk = $("#pmBack"); if (bk) bk.addEventListener("click", () => { focus = -1; rr(); });
    const al = $("#pmAll"); if (al) al.addEventListener("change", () => $$("[data-pmpick]").forEach(c => { c.checked = al.checked; }));
    const cl = $("#pmClear"); if (cl) cl.addEventListener("click", () => { docs = []; saved = null; focus = -1; rr(); });
    const pickRun = async keys => { if (!keys.length) return A.toast("Tick at least one file."); docs = docs.filter(d => !keys.includes(d.key)); focus = -1;
      for (let i = 0; i < keys.length; i++) { const x = saved.find(y => y.key === keys[i]); busy = `Reading ${x.name} (${i + 1} of ${keys.length})…`; rr();
        try { let blob; if (x.f) blob = x.f.blob; else { const url = await A.db.fileUrl(x.r.storage_path, 120); const res = await fetch(url); if (!res.ok) throw new Error("download"); blob = await res.blob(); }
          const d = await analyse(new File([blob], x.name, { type: "application/pdf" })); d.key = x.key; d.tags = x.tags; d.uploaded = x.up; d.from = x.src === "online" ? "Saved online" : "My folders · " + x.src; docs.push(d); }
        catch (e) { A.toast(`Couldn't read ${x.name}.`); } }
      busy = ""; if (docs.length === 1) focus = -1; rr(); };
    const pg = $("#pmPickGo"); if (pg) pg.addEventListener("click", () => pickRun($$("[data-pmpick]").filter(c => c.checked).map(c => c.dataset.pmpick)));
    const pa = $("#pmPickAll"); if (pa) pa.addEventListener("click", () => pickRun(saved.map(x => x.key)));
    const cs = $("#pmCsv"); if (cs) cs.addEventListener("click", () => {
      const q = c => { c = String(c ?? ""); return /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c; };
      const rows = [ROWS.map(r => r[0])].concat(docs.map(d => ROWS.map(([, f, full]) => full ? full(d) : f(d))));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + rows.map(r => r.map(q).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })); a.download = "pdf-metadata.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }
  window.GRC_PDFMETA = { view, bind };
})();

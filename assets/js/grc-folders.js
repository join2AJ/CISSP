/* LearNtime - My folders: create folders, add files, compress a folder to ZIP or tar.gz and download it.
   Files live in this browser (IndexedDB). Compression uses the browser's built-in CompressionStream. A compressed folder can be
   saved online to the user's private folder (My shelf), up to 50 MB. */
(function () {
  "use strict";
  const A = window.App, { esc, $, $$, db } = A;
  const DBN = "learntime-files", MAX_ONLINE = 50 * 1024 * 1024;
  const size = b => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : b < 1073741824 ? (b / 1048576).toFixed(1) + " MB" : (b / 1073741824).toFixed(2) + " GB";
  const when = t => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const FMT = { zip: ["ZIP (.zip)", "application/zip", "zip"], tgz: ["tar.gz (.tar.gz)", "application/gzip", "tar.gz"] };
  let idb = null, q = "", busy = "", fmt = "zip", ftag = "";
  async function setTags(id, tags) { await tx(["files"], "readwrite", async t => { const s = t.objectStore("files"), f = await req(s.get(id)); if (f) { f.tags = tags; s.put(f); } }); }

  /* ---------- storage ---------- */
  const open = () => idb || (idb = new Promise((ok, no) => {
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("folders", { keyPath: "id" }); const f = d.createObjectStore("files", { keyPath: "id" }); f.createIndex("folder", "folder"); };
    r.onsuccess = () => ok(r.result); r.onerror = () => { idb = null; no(r.error); };
  }));
  const tx = async (stores, mode, fn) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction(stores, mode); let out; Promise.resolve(fn(t)).then(v => { out = v; }); t.oncomplete = () => ok(out); t.onerror = () => no(t.error); t.onabort = () => no(t.error || new Error("Storage full or blocked")); }); };
  const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const folders = () => tx(["folders"], "readonly", t => req(t.objectStore("folders").getAll()));
  const files = id => tx(["files"], "readonly", t => req(t.objectStore("files").index("folder").getAll(id)));
  const allFiles = () => tx(["files"], "readonly", t => req(t.objectStore("files").getAll()));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
  async function addFolder(name) { const f = { id: uid(), name: name.slice(0, 80), created: Date.now(), updated: Date.now() }; await tx(["folders"], "readwrite", t => t.objectStore("folders").put(f)); return f; }
  async function touch(id) { await tx(["folders"], "readwrite", async t => { const s = t.objectStore("folders"), f = await req(s.get(id)); if (f) { f.updated = Date.now(); s.put(f); } }); }
  async function addBlobs(folderId, list) {   // list: [{ name, path, blob }]
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
    const rows = [];
    for (const x of list) { let sha = ""; try { sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await x.blob.arrayBuffer()))].map(b => b.toString(16).padStart(2, "0")).join(""); } catch (e) {}
      rows.push({ id: uid(), folder: folderId, name: x.name, path: x.path || "", type: x.blob.type || "", size: x.blob.size, added: Date.now(), sha, tags: x.tags || [], blob: x.blob }); }
    await tx(["files"], "readwrite", t => { const s = t.objectStore("files"); rows.forEach(r => s.put(r)); });
    await touch(folderId);
  }
  async function delFolder(id) { const fs = await files(id); await tx(["files", "folders"], "readwrite", t => { fs.forEach(f => t.objectStore("files").delete(f.id)); t.objectStore("folders").delete(id); }); }
  const delFile = id => tx(["files"], "readwrite", t => t.objectStore("files").delete(id));
  async function rename(id, name) { await tx(["folders"], "readwrite", async t => { const s = t.objectStore("folders"), f = await req(s.get(id)); if (f) { f.name = name.slice(0, 80); f.updated = Date.now(); s.put(f); } }); }

  const dl = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  /* ZIP and tar.gz writers using the browser's own compression (CompressionStream). */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const squeeze = async (u, kind) => new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream(kind))).arrayBuffer());
  const canCompress = typeof CompressionStream === "function";
  const dosTime = d => ({ t: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), d: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() });
  async function makeZip(entries) {   // entries: [{ name, data: Uint8Array }]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0; const now = dosTime(new Date());
    for (const e of entries) {
      const nm = enc.encode(e.name), crc = crc32(e.data);
      let body = e.data, method = 0;
      if (canCompress && e.data.length > 64) { try { const z = await squeeze(e.data, "deflate-raw"); if (z.length < e.data.length) { body = z; method = 8; } } catch (x) {} }
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, method, true); h.setUint16(10, now.t, true); h.setUint16(12, now.d, true);
      h.setUint32(14, crc, true); h.setUint32(18, body.length, true); h.setUint32(22, e.data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nm, body);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, method, true); c.setUint16(12, now.t, true); c.setUint16(14, now.d, true);
      c.setUint32(16, crc, true); c.setUint32(20, body.length, true); c.setUint32(24, e.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + body.length;
    }
    const csize = central.reduce((n, x) => n + x.length, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
  }
  async function makeTgz(entries) {
    const enc = new TextEncoder(), chunks = [], mtime = Math.floor(Date.now() / 1000);
    const oct = (v, len) => v.toString(8).padStart(len - 1, "0") + "\0";
    for (const e of entries) {
      let name = e.name, prefix = "";
      if (enc.encode(name).length > 100) { const k = name.lastIndexOf("/", 154); if (k > 0) { prefix = name.slice(0, k); name = name.slice(k + 1); } }
      const h = new Uint8Array(512), put = (str, at, len) => h.set(enc.encode(str).slice(0, len), at);
      put(name, 0, 100); put(oct(0o644, 8), 100, 8); put(oct(0, 8), 108, 8); put(oct(0, 8), 116, 8); put(oct(e.data.length, 12), 124, 12); put(oct(mtime, 12), 136, 12);
      put("        ", 148, 8); h[156] = 48; put("ustar\0", 257, 6); put("00", 263, 2); put(prefix, 345, 155);
      put(oct(h.reduce((n, x) => n + x, 0), 7) + " ", 148, 8);
      chunks.push(h, e.data); const pad = (512 - (e.data.length % 512)) % 512; if (pad) chunks.push(new Uint8Array(pad));
    }
    chunks.push(new Uint8Array(1024));
    const tar = new Uint8Array(await new Blob(chunks).arrayBuffer());
    if (!canCompress) throw new Error("This browser can't make tar.gz files; choose ZIP.");
    return new Blob([await squeeze(tar, "gzip")], { type: "application/gzip" });
  }
  async function compress(folder, list, kind) {
    const F = FMT[kind], base = folder.name.replace(/[^\w\- ]+/g, "_").trim() || "folder";
    const entries = [];
    for (const f of list) entries.push({ name: base + "/" + (f.path ? f.path.replace(/^\/+|\/+$/g, "") + "/" : "") + f.name, data: new Uint8Array(await f.blob.arrayBuffer()) });
    const q = c => { c = String(c ?? ""); return /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c; };
    const index = [["File", "Folder path", "Size (bytes)", "Added", "SHA-256", "Tags"]].concat(list.map(f => [f.name, f.path || "", f.size, new Date(f.added).toISOString(), f.sha || "", (f.tags || []).join("; ")])).map(r => r.map(q).join(",")).join("\r\n");
    entries.push({ name: base + "/_index.csv", data: new TextEncoder().encode("\ufeff" + index) });
    const blob = kind === "tgz" ? await makeTgz(entries) : await makeZip(entries);
    return new File([blob], base + "." + F[2], { type: F[1] });
  }

  /* ---------- views ---------- */
  async function view(id) {
    let F, all;
    try { [F, all] = await Promise.all([folders(), allFiles()]); } catch (e) { return `<div class="page-narrow"><h1 class="h-display">My folders</h1><p class="lede">This browser doesn't allow local storage here (private mode or blocked site data). Try a normal window.</p></div>`; }
    let est = null; try { est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch (e) {}
    const used = all.reduce((n, f) => n + f.size, 0);
    if (!id) return `<div class="page grc-folders"><a class="kicker" href="#/grc">← Learn GRC · Tools</a>
      <h1 class="h-display">My <em>folders</em></h1>
      <p class="lede">Make folders, put files in them, then compress a folder into a ZIP or tar.gz to download or save online. Folders are kept in this browser on this device.</p>
      <form class="card fd-new" id="fdNew"><label>New folder<input name="n" required maxlength="80" placeholder="e.g. SOC 2 evidence, March"></label><button class="btn primary small">Create folder</button></form>
      <div class="fd-grid">${F.sort((a, b) => b.updated - a.updated).map(f => { const fs = all.filter(x => x.folder === f.id); return `<a class="card fd-card" href="#/grc/folders/${f.id}"><span class="fd-ico" aria-hidden="true">▤</span><b>${esc(f.name)}</b><small>${fs.length} file${fs.length === 1 ? "" : "s"} · ${size(fs.reduce((n, x) => n + x.size, 0))}</small><small>Updated ${when(f.updated)}</small></a>`; }).join("") || `<p class="sub">No folders yet. Create one above.</p>`}</div>
      <p class="hint">${size(used)} used by your folders${est && est.quota ? ` · about ${size(Math.max(0, est.quota - est.usage))} free in this browser` : ""}. Clearing your browser's site data deletes these folders, so save anything important online or download it. To unpack an archive into a folder, use <a href="#/grc/unpack">Unpack archives</a>.</p></div>`;
    const f = F.find(x => x.id === id);
    if (!f) return `<div class="page-narrow"><a class="kicker" href="#/grc/folders">← My folders</a><h1 class="h-display">Folder not found</h1><p class="lede">It may have been deleted, or it was created in another browser.</p></div>`;
    const fs = all.filter(x => x.folder === id).sort((a, b) => (a.path + a.name).localeCompare(b.path + b.name)), shown = fs.filter(x => (!q || (x.path + x.name + " " + (x.tags || []).join(" ")).toLowerCase().includes(q.toLowerCase())) && (!ftag || (x.tags || []).includes(ftag))), tot = fs.reduce((n, x) => n + x.size, 0);
    return `<div class="page grc-folders"><a class="kicker" href="#/grc/folders">← My folders</a>
      <div class="fd-head"><div><h1 class="h-display fd-title">${esc(f.name)}</h1><p class="sub">${fs.length} file${fs.length === 1 ? "" : "s"} · ${size(tot)} · created ${when(f.created)}</p></div>
        <div class="btn-row"><button class="btn small" id="fdRename">Rename</button><button class="btn small ghost" id="fdDel">Delete folder</button></div></div>
      <label class="up-drop fd-drop" id="fdDrop"><input type="file" id="fdFiles" multiple hidden><span class="up-ico" aria-hidden="true">＋</span><b>Add files</b><span>choose several at once, or drop them here</span></label>
      <div class="btn-row"><label class="btn small" for="fdDir">Add a whole folder from your device</label><input type="file" id="fdDir" webkitdirectory multiple hidden></div>
      ${busy ? `<p class="up-busy" role="status">${esc(busy)}</p>` : ""}
      ${fs.length ? `<section class="card fd-zip"><h2>Compress this folder</h2>
        <div class="form-row"><label>Format<select id="fdFmt">${Object.entries(FMT).map(([k, v]) => `<option value="${k}" ${fmt === k ? "selected" : ""}>${v[0]}</option>`).join("")}</select></label></div>
        <div class="btn-row"><button class="btn primary small" id="fdZipDl">Compress and download</button><button class="btn small" id="fdZipSave" ${db.mode === "cloud" && db.user ? "" : "disabled title='Sign in to save online'"}>Compress and save online</button></div>
        <p class="hint">ZIP opens on any computer or phone; tar.gz is common on Linux. Online copies go to <a href="#/grc/shelf">My shelf</a> (up to 50 MB), where you can delete them later.</p></section>` : ""}
      ${fs.length ? `<input type="search" id="fdQ" class="grc-libq" placeholder="Search names and tags" value="${esc(q)}" aria-label="Search this folder">
      ${(() => { const T = [...new Set(fs.flatMap(x => x.tags || []))].sort(); return T.length ? `<div class="tag-bar"><span class="sub">Tags:</span>${T.map(t => `<button type="button" class="tagchip ${ftag === t ? "on" : ""}" data-fdtag="${esc(t)}" aria-pressed="${ftag === t}">#${esc(t)}</button>`).join("")}${ftag ? `<button type="button" class="tag-edit" data-fdtag="">Show all</button>` : ""}</div>` : ""; })()}
      <div class="tbl-wrap"><table class="tbl up-tbl"><thead><tr><th>File</th><th>Size</th><th>Added</th><th>Actions</th></tr></thead><tbody>
        ${shown.map(x => `<tr><td class="up-name"><b>${esc(x.name)}</b>${x.path ? `<small>${esc(x.path)}</small>` : ""}${x.sha ? `<small title="SHA-256 ${x.sha}">SHA-256 ${x.sha.slice(0, 12)}…</small>` : ""}<div class="tag-row">${(x.tags || []).map(t => `<button type="button" class="tagchip" data-fdtag="${esc(t)}">#${esc(t)}</button>`).join("")}<button type="button" class="tag-edit" data-fdtagedit="${x.id}">${(x.tags || []).length ? "Edit tags" : "+ Add tags"}</button></div></td><td class="num">${size(x.size)}</td><td>${when(x.added)}</td>
          <td class="up-act"><button class="btn small" data-fddl="${x.id}">Download</button><button class="btn small ghost" data-fdrm="${x.id}" aria-label="Remove ${esc(x.name)}">Remove</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="sub">This folder is empty. Add files above.</p>`}
    </div>`;
  }

  function bind(id) {
    const rr = () => A.rerender();
    const nf = $("#fdNew"); if (nf) nf.addEventListener("submit", async e => { e.preventDefault(); const n = String(new FormData(nf).get("n") || "").trim(); if (!n) return; try { const f = await addFolder(n); location.hash = "#/grc/folders/" + f.id; } catch (x) { A.toast("Couldn't create the folder here."); } });
    if (!id) return;
    const add = async list => { if (!list.length) return; const tot = [...list].reduce((n, f) => n + f.size, 0); busy = `Adding ${list.length} file${list.length > 1 ? "s" : ""} (${size(tot)})…`; rr();
      try { await addBlobs(id, [...list].map(f => ({ name: f.name, path: (f.webkitRelativePath || "").split("/").slice(0, -1).join("/"), blob: f }))); busy = ""; A.toast(`Added ${list.length} file${list.length > 1 ? "s" : ""}`); }
      catch (e) { busy = ""; A.toast("Couldn't add the files: this browser may be out of storage space."); } rr(); };
    const fi = $("#fdFiles"); if (fi) fi.addEventListener("change", () => add(fi.files));
    const di = $("#fdDir"); if (di) di.addEventListener("change", () => add(di.files));
    const dr = $("#fdDrop"); if (dr) { ["dragenter", "dragover"].forEach(ev => dr.addEventListener(ev, e => { e.preventDefault(); dr.classList.add("over"); })); ["dragleave", "drop"].forEach(ev => dr.addEventListener(ev, e => { e.preventDefault(); dr.classList.remove("over"); })); dr.addEventListener("drop", e => add(e.dataTransfer.files)); }
    const rn = $("#fdRename"); if (rn) rn.addEventListener("click", async () => { const cur = $(".fd-title").textContent, n = prompt("New name for this folder", cur); if (n && n.trim()) { await rename(id, n.trim()); rr(); } });
    const dl0 = $("#fdDel"); if (dl0) dl0.addEventListener("click", async () => { if (confirm("Delete this folder and every file in it? This can't be undone.")) { await delFolder(id); location.hash = "#/grc/folders"; } });
    const qi = $("#fdQ"); if (qi) qi.addEventListener("input", () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { rr(); setTimeout(() => { const n = $("#fdQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 250); });
    $$("[data-fdtag]").forEach(b => b.addEventListener("click", () => { ftag = ftag === b.dataset.fdtag ? "" : b.dataset.fdtag; rr(); }));
    $$("[data-fdtagedit]").forEach(b => b.addEventListener("click", async () => { const fs = await files(id), x = fs.find(y => y.id === b.dataset.fdtagedit); if (!x) return; const t = A.editTags(x.tags, x.name); if (t === null) return; await setTags(x.id, t); A.toast(t.length ? "Tags saved" : "Tags removed"); rr(); }));
    $$("[data-fddl]").forEach(b => b.addEventListener("click", async () => { const fs = await files(id), x = fs.find(y => y.id === b.dataset.fddl); if (x) dl(x.blob, x.name); }));
    $$("[data-fdrm]").forEach(b => b.addEventListener("click", async () => { const fs = await files(id), x = fs.find(y => y.id === b.dataset.fdrm); if (x && confirm(`Remove ${x.name} from this folder?`)) { await delFile(x.id); await touch(id); rr(); } }));
    const fm = $("#fdFmt"); if (fm) fm.addEventListener("change", () => { fmt = fm.value; });
    const run = async (save) => { const fs = await files(id), f = (await folders()).find(x => x.id === id);
      busy = `Compressing ${fs.length} file${fs.length > 1 ? "s" : ""}…`; rr();
      try { const out = await compress(f, fs, fmt); busy = "";
        if (!save) { dl(out, out.name); A.toast(`${out.name} · ${size(out.size)}`); }
        else if (out.size > MAX_ONLINE) A.toast(`The compressed file is ${size(out.size)}; online copies are limited to 50 MB. Download it instead.`);
        else { busy = "Saving online…"; rr(); await db.addResource({ title: out.name, kind: "file", domain: "grc", note: `Folder "${f.name}", ${fs.length} files, compressed ${new Date().toLocaleDateString("en-GB")}` }, out); busy = ""; A.toast("Saved to My shelf"); }
      } catch (e) { busy = ""; A.toast(A.errMsg && e && e.message && !/archive/i.test(e.message) ? A.errMsg(e) : "Couldn't compress this folder."); }
      rr(); };
    const zd = $("#fdZipDl"); if (zd) zd.addEventListener("click", () => run(false));
    const zs = $("#fdZipSave"); if (zs) zs.addEventListener("click", () => run(true));
  }
  window.GRC_FOLDERS = { view, bind, addFolder, addBlobs, list: async () => { const [F, all] = await Promise.all([folders(), allFiles()]); return { folders: F, files: all }; } };
})();

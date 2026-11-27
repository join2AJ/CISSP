/* LearNtime - Unpack archives: open 7z, zip, rar, tar and gz files in the browser with libarchive.js (MIT, WebAssembly).
   Files are unpacked on the device. Nothing leaves the browser unless the user chooses "Save online", which stores the file
   in their private folder (the same place as "My shelf"), where it can be deleted later. */
(function () {
  "use strict";
  const A = window.App, { esc, $, $$, db } = A;
  const LIB = "assets/vendor/libarchive/libarchive.js";
  const ACCEPT = ".7z,.zip,.rar,.tar,.gz,.tgz,.bz2,.tbz2,.xz,.txz,.cab,.iso";
  const MAX_ONLINE = 50 * 1024 * 1024;
  const TYPES = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", txt: "text/plain", log: "text/plain",
    md: "text/markdown", csv: "text/csv", json: "application/json", xml: "application/xml", rtf: "application/rtf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet", odp: "application/vnd.oasis.opendocument.presentation", zip: "application/zip",
    "7z": "application/x-7z-compressed", rar: "application/vnd.rar", tar: "application/x-tar", gz: "application/gzip", tgz: "application/gzip",
    bz2: "application/x-bzip2", xz: "application/x-xz" };
  const ext = n => (String(n).toLowerCase().match(/\.([a-z0-9]+)$/) || [, ""])[1];
  const typeOf = n => TYPES[ext(n)] || "";
  const size = b => b == null ? "-" : b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : b < 1073741824 ? (b / 1048576).toFixed(1) + " MB" : (b / 1073741824).toFixed(2) + " GB";
  let lib = null, cur = null, q = "", sel = new Set(), busy = "";
  const loadLib = async () => { if (!lib) { lib = await import(new URL(LIB, location.href).href); lib.Archive.init({ workerUrl: new URL("assets/vendor/libarchive/worker-bundle.js", location.href).href }); } return lib; };
  const dl = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const online = () => db.mode === "cloud" && !!db.user;

  function view() {
    const rows = cur ? cur.entries.filter(e => !q || (e.path + e.name).toLowerCase().includes(q.toLowerCase())) : [];
    const total = cur ? cur.entries.reduce((n, e) => n + (e.size || 0), 0) : 0;
    return `<div class="page grc-unpack">
      <a class="kicker" href="#/grc">← Learn GRC · Tools</a>
      <h1 class="h-display">Unpack <em>archives</em></h1>
      <p class="lede">Open 7-Zip, ZIP, RAR, TAR and GZ files right here. Everything is unpacked on your device; nothing is uploaded unless you press <b>Save online</b>, which keeps the file in your private folder until you delete it.</p>
      ${!cur ? `<label class="up-drop" id="upDrop"><input type="file" id="upFile" accept="${ACCEPT}" hidden>
          <span class="up-ico" aria-hidden="true">⇩</span><b>Choose an archive</b><span>or drop it here · .7z .zip .rar .tar .gz .bz2 .xz</span></label>
        <ul class="up-notes"><li>Large archives (over 1 GB) may be slow or run out of memory on a phone.</li><li>Password-protected <b>ZIP</b> files are supported. Password-protected 7z and RAR files can't be opened in a browser; use 7-Zip on your computer for those.</li>
          <li>${online() ? "Saved files go to your private folder (max 50 MB each) and appear in <a href=\"#/grc/shelf\">My shelf</a>, where you can delete them." : "Saving online needs you to be signed in; downloading works anyway."}</li></ul>`
      : `<section class="card up-head"><div><span class="kicker">Open archive</span><h2>${esc(cur.name)}</h2>
          <p class="sub">${size(cur.size)} · ${cur.entries.length} file${cur.entries.length === 1 ? "" : "s"} · ${size(total)} unpacked${cur.enc ? " · password protected" : ""}</p></div>
          <div class="btn-row"><button class="btn small primary" id="upToFolder" ${cur.enc && /^(7z|rar)$/.test(ext(cur.name)) ? "disabled" : ""}>Copy all into a new folder</button><button class="btn small" id="upSaveArc" ${online() && cur.size <= MAX_ONLINE ? "" : "disabled"} title="${cur.size > MAX_ONLINE ? "Over 50 MB" : ""}">Save the archive online</button><button class="btn small ghost" id="upClose">Close</button></div></section>
        ${cur.enc && /^(7z|rar)$/.test(ext(cur.name)) ? `<div class="card up-warn" role="status"><b>This ${ext(cur.name).toUpperCase()} file is password protected.</b> The browser engine can list its files but can't decrypt ${ext(cur.name).toUpperCase()} encryption. Open it with 7-Zip on your computer, or ask the sender for a password-protected ZIP instead. You can still save the archive online as it is.</div>` : cur.enc && !cur.pw ? `<form class="card up-pw" id="upPw"><label>Password for this archive<input type="password" id="upPwIn" autocomplete="off" required></label><button class="btn primary small">Unlock</button><p class="hint">The password is used only in your browser and isn't stored.</p></form>` : ""}
        ${busy ? `<p class="up-busy" role="status">${esc(busy)}</p>` : ""}
        <div class="up-tools"><input type="search" id="upQ" class="grc-libq" placeholder="Search files" value="${esc(q)}" aria-label="Search files in the archive">
          <div class="btn-row"><button class="btn small" id="upAll">${sel.size && sel.size === rows.length ? "Clear selection" : "Select all"}</button>
            <button class="btn small primary" id="upDlSel" ${sel.size ? "" : "disabled"}>Download selected (${sel.size})</button>
            <button class="btn small" id="upSaveSel" ${sel.size && online() ? "" : "disabled"}>Save selected online</button></div></div>
        <div class="tbl-wrap"><table class="tbl up-tbl"><thead><tr><th><span class="sr-only">Select</span></th><th>File</th><th>Size</th><th>Actions</th></tr></thead><tbody>
        ${rows.slice(0, 600).map(e => { const i = cur.entries.indexOf(e), ok = !!typeOf(e.name) && (e.size || 0) <= MAX_ONLINE;
          return `<tr><td><input type="checkbox" data-upsel="${i}" ${sel.has(i) ? "checked" : ""} aria-label="Select ${esc(e.name)}"></td>
            <td class="up-name"><b>${esc(e.name)}</b>${e.path ? `<small>${esc(e.path)}</small>` : ""}</td><td class="num">${size(e.size)}</td>
            <td class="up-act"><button class="btn small" data-updl="${i}">Download</button><button class="btn small ghost" data-upsave="${i}" ${online() && ok ? "" : "disabled"} title="${!typeOf(e.name) ? "This file type can't be stored online; download it instead" : (e.size || 0) > MAX_ONLINE ? "Over 50 MB" : ""}">${e.saved ? "Saved ✓" : "Save online"}</button></td></tr>`; }).join("")}
        </tbody></table></div>
        ${rows.length > 600 ? `<p class="hint">Showing 600 of ${rows.length}; search to narrow the list.</p>` : ""}
        <p class="hint">Only common document, image, data and archive types can be saved online; programs and scripts can be downloaded but not stored. Saved files are in <a href="#/grc/shelf">My shelf</a>, where you can delete them.</p>`}
      <p class="hint" style="margin-top:20px">Unpacking uses <a href="https://github.com/nika-begiashvili/libarchivejs" target="_blank" rel="noopener">libarchive.js</a> (MIT licence), a WebAssembly build of libarchive.</p>
    </div>`;
  }

  async function open(file) {
    busy = "Opening " + file.name + "…"; A.rerender();
    try {
      const { Archive } = await loadLib();
      const ar = await Archive.open(file);
      let enc = null; try { enc = await ar.hasEncryptedData(); } catch (e) {}
      const list = await ar.getFilesArray();
      cur = { ar, file, name: file.name, size: file.size, enc: enc === true, pw: false, entries: list.map(x => ({ cf: x.file, name: x.file.name, size: x.file.size, path: x.path || "" })) };
      sel = new Set(); q = ""; busy = "";
      if (!list.length) A.toast("This archive looks empty.");
    } catch (e) { busy = ""; cur = null; A.toast("Couldn't open that file. Is it a supported, undamaged archive?"); }
    A.rerender();
  }
  async function extract(i) {
    const e = cur.entries[i]; if (e.blob) return e.blob;
    const f = await e.cf.extract(); e.blob = f; return f;
  }
  async function saveOnline(i, note) {
    const e = cur.entries[i], t = typeOf(e.name); if (!t) throw new Error("type");
    const blob = await extract(i);
    await db.addResource({ title: e.name.slice(0, 200), kind: "file", domain: "grc", note: (note || `From ${cur.name}${e.path ? " / " + e.path : ""}`).slice(0, 1000) }, new File([blob], e.name, { type: t }));
    e.saved = true;
  }

  function bind() {
    const inp = $("#upFile"), drop = $("#upDrop");
    if (inp) inp.addEventListener("change", () => { if (inp.files[0]) open(inp.files[0]); });
    if (drop) { ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
      ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
      drop.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f) open(f); }); }
    if (!cur) return;
    const rr = () => A.rerender();
    $("#upClose").addEventListener("click", () => { cur = null; sel = new Set(); rr(); });
    const pw = $("#upPw"); if (pw) pw.addEventListener("submit", async e => { e.preventDefault(); try { await cur.ar.usePassword($("#upPwIn").value); cur.pw = true; rr(); } catch (x) { A.toast("That password didn't work."); } });
    const qi = $("#upQ"); qi.addEventListener("input", () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { rr(); setTimeout(() => { const n = $("#upQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 250); });
    $$("[data-upsel]").forEach(c => c.addEventListener("change", () => { const i = +c.dataset.upsel; if (c.checked) sel.add(i); else sel.delete(i); rr(); }));
    $("#upAll").addEventListener("click", () => { const vis = cur.entries.map((e, i) => i).filter(i => !q || (cur.entries[i].path + cur.entries[i].name).toLowerCase().includes(q.toLowerCase())); if (sel.size === vis.length) sel = new Set(); else sel = new Set(vis); rr(); });
    const fail = () => A.toast(cur.enc && /^(7z|rar)$/.test(ext(cur.name)) ? "Password-protected " + ext(cur.name).toUpperCase() + " files can't be unpacked in the browser; use 7-Zip on your computer." : cur.enc ? "Couldn't unpack it. Check the password." : "Couldn't unpack that file; the archive may be damaged.");
    $$("[data-updl]").forEach(b => b.addEventListener("click", async () => { const i = +b.dataset.updl; b.disabled = true; b.textContent = "Unpacking…";
      try { dl(await extract(i), cur.entries[i].name); } catch (e) { fail(); } b.disabled = false; b.textContent = "Download"; }));
    $$("[data-upsave]").forEach(b => b.addEventListener("click", async () => { const i = +b.dataset.upsave; b.disabled = true; b.textContent = "Saving…";
      try { await saveOnline(i); A.toast("Saved to My shelf"); rr(); } catch (e) { b.disabled = false; b.textContent = "Save online"; e.message === "type" ? A.toast("That file type can't be stored online.") : A.toast(A.errMsg ? A.errMsg(e) : "Couldn't save it."); } }));
    $("#upDlSel").addEventListener("click", async () => { const list = [...sel]; busy = `Unpacking ${list.length} file${list.length > 1 ? "s" : ""}…`; rr();
      for (const i of list) { try { dl(await extract(i), cur.entries[i].name); await new Promise(z => setTimeout(z, 350)); } catch (e) { fail(); break; } }
      busy = ""; rr(); if (list.length > 1) A.toast("If only one file downloaded, allow multiple downloads for this site in your browser."); });
    $("#upSaveSel").addEventListener("click", async () => { const list = [...sel].filter(i => typeOf(cur.entries[i].name) && (cur.entries[i].size || 0) <= MAX_ONLINE), skipped = sel.size - list.length;
      let n = 0; for (const i of list) { busy = `Saving ${n + 1} of ${list.length}…`; rr(); try { if (!cur.entries[i].saved) await saveOnline(i); n++; } catch (e) { A.toast(A.errMsg ? A.errMsg(e) : "Couldn't save one of the files."); break; } }
      busy = ""; sel = new Set(); rr(); A.toast(`Saved ${n} file${n === 1 ? "" : "s"} to My shelf${skipped ? `; ${skipped} skipped (type or size)` : ""}.`); });
    $("#upToFolder").addEventListener("click", async () => {
      if (!window.GRC_FOLDERS) return A.toast("Folders aren't available here.");
      const n = cur.entries.length; let done = 0; const out = [];
      try { for (let i = 0; i < n; i++) { busy = `Unpacking ${i + 1} of ${n}…`; if (i % 5 === 0) rr(); const b = await extract(i); out.push({ name: cur.entries[i].name, path: cur.entries[i].path.replace(/\/+$/, ""), blob: b }); done++; }
        const f = await window.GRC_FOLDERS.addFolder(cur.name.replace(/\.(7z|zip|rar|tar|gz|tgz|bz2|tbz2|xz|txz|cab|iso)$/i, "").replace(/\.tar$/i, ""));
        await window.GRC_FOLDERS.addBlobs(f.id, out); busy = ""; A.toast(`Copied ${done} files into a new folder`); location.hash = "#/grc/folders/" + f.id; }
      catch (e) { busy = ""; rr(); fail(); } });
    $("#upSaveArc").addEventListener("click", async e => { const b = e.target, t = typeOf(cur.name) || "application/octet-stream"; b.disabled = true; b.textContent = "Saving…";
      try { await db.addResource({ title: cur.name.slice(0, 200), kind: "file", domain: "grc", note: `Archive, ${cur.entries.length} files` }, new File([cur.file], cur.name, { type: t })); A.toast("Archive saved to My shelf"); b.textContent = "Saved ✓"; }
      catch (x) { b.disabled = false; b.textContent = "Save the archive online"; A.toast(A.errMsg ? A.errMsg(x) : "Couldn't save the archive."); } });
  }
  window.GRC_UNPACK = { view, bind, _open: open };
})();

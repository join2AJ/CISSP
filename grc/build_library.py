"""Build assets/js/grc-library.js from openly licensed GRC material.

Usage: python3 -I grc/build_library.py <sushegaad_unzipped_dir> <comply_repo_dir> <out.js>
  - Sushegaad/Claude-Skills-Governance-Risk-and-Compliance (MIT, (c) 2026 Hemant Naik): reference files from the
    dpdpa, iso27001, soc2 and tprm skills (unzip each .skill into <dir>/<name>/).
  - strongdm/comply (Apache-2.0): example policies and procedures.
Changes made: converted from Markdown to HTML, long dashes replaced with hyphens, emoji markers replaced with words.
"""
import sys, os, re, json, html

SUS, COMPLY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

def tidy(s):
    s = s.replace("—", " - ").replace("–", "-").replace("⭐NEW", "(new)").replace("⭐", "")
    s = re.sub(r"[\U0001F300-\U0001FAFF☀-➿]️?", "", s)
    return re.sub(r"  +", " ", s)

def inline(t):
    t = re.sub(r"^\[ \]\s*", "☐ ", t); t = re.sub(r"^\[x\]\s*", "☑ ", t, flags=re.I)
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![*\w])\*([^*\n]+)\*(?![*\w])", r"<i>\1</i>", t)
    def link(m):
        u = m.group(2)
        if u.startswith("#"): return m.group(1)
        if not re.match(r"https?://", u): return m.group(1)
        return f'<a href="{html.escape(u)}" target="_blank" rel="noopener">{m.group(1)}</a>'
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, t)
    return t

def md(src):
    lines = tidy(src).split("\n"); out = []; i = 0; para = []
    def flush():
        if para: out.append("<p>" + inline(" ".join(x.strip() for x in para)) + "</p>"); para.clear()
    while i < len(lines):
        ln = lines[i]; s = ln.strip()
        if not s: flush(); i += 1; continue
        if re.match(r"^(-{3,}|\*{3,})$", s): flush(); i += 1; continue
        m = re.match(r"^(#{1,6})\s+(.*)", s)
        if m and m.group(2).strip().lower() in ("table of contents", "contents"):
            flush(); i += 1   # in-file link lists don't work on the site: skip the heading and its list
            while i < len(lines) and (not lines[i].strip() or re.match(r"^\s*([-*+]|\d+\.)\s", lines[i])): i += 1
            continue
        if m:
            flush(); lvl = min(4, max(2, len(m.group(1)) + 1)); out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>"); i += 1; continue
        if s.startswith("|"):
            flush(); rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            rows = [r for r in rows if not all(re.match(r"^:?-{2,}:?$", c) for c in r if c)]
            if rows:
                head, body = rows[0], rows[1:]
                out.append('<div class="tbl-wrap"><table><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>" +
                           "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body) + "</tbody></table></div>")
            continue
        if s.startswith(">"):
            flush(); q = []
            while i < len(lines) and lines[i].strip().startswith(">"): q.append(lines[i].strip()[1:].strip()); i += 1
            out.append('<div class="note manager"><p>' + inline(" ".join(q)) + "</p></div>"); continue
        if s.startswith("```"):
            flush(); i += 1; code = []
            while i < len(lines) and not lines[i].strip().startswith("```"): code.append(lines[i]); i += 1
            i += 1; out.append("<pre>" + html.escape("\n".join(code)) + "</pre>"); continue
        lm = re.match(r"^([-*+]|\d+\.|[a-z]\.|[ivx]+\.)\s+(.*)", s)
        if lm:
            flush(); items = []; ordered = not lm.group(1) in "-*+"
            while i < len(lines):
                t = lines[i].strip(); mm = re.match(r"^([-*+]|\d+\.|[a-z]\.|[ivx]+\.)\s+(.*)", t)
                if mm: items.append(mm.group(2)); i += 1; continue
                if t and not t.startswith(("#", "|", ">")) and items and lines[i].startswith((" ", "\t")): items[-1] += " " + t; i += 1; continue
                if not t:  # a blank line inside a list: keep going if the list continues after it
                    j = i
                    while j < len(lines) and not lines[j].strip(): j += 1
                    if j < len(lines) and re.match(r"^([-*+]|\d+\.|[a-z]\.|[ivx]+\.)\s+", lines[j].strip()): i = j; continue
                break
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>"); continue
        para.append(s); i += 1
    flush()
    return "\n".join(out)

docs = []
SUS_FILES = [
  ("iso", "ISO 27001:2022", [("iso27001/iso27001/references/annex-a-2022.md", "All 93 Annex A controls"), ("iso27001/iso27001/references/annex-a-2013.md", "The 2013 version (114 controls)"), ("iso27001/iso27001/references/control-mapping.md", "Mapping 2013 to 2022, and to other frameworks")]),
  ("soc2", "SOC 2", [("soc2/soc2/references/controls.md", "Controls by Trust Services Criteria"), ("soc2/soc2/references/evidence.md", "Evidence each criterion needs"), ("soc2/soc2/references/policies.md", "The policies a SOC 2 expects"), ("soc2/soc2/references/vendor.md", "Vendor management for SOC 2")]),
  ("dpdp", "India: DPDP Act and Rules", [("dpdpa/dpdpa/references/sections-reference.md", "The Act, section by section"), ("dpdpa/dpdpa/references/rules-2025.md", "DPDP Rules 2025, rule by rule"), ("dpdpa/dpdpa/references/rights-and-obligations.md", "Rights and obligations in practice"), ("dpdpa/dpdpa/references/gdpr-comparison.md", "DPDP compared with GDPR")]),
  ("tprm", "Third-party risk", [("tprm/tprm/references/lifecycle-and-monitoring.md", "Vendor lifecycle and monitoring"), ("tprm/tprm/references/questionnaires-and-contracts.md", "Questionnaires and contract clauses"), ("tprm/tprm/references/soc2-report-review.md", "Reviewing a vendor's SOC 2 report"), ("tprm/tprm/references/framework-mappings.md", "TPRM across frameworks")]),
]
for gid, gname, files in SUS_FILES:
    for path, title in files:
        p = os.path.join(SUS, path); src = open(p, encoding="utf-8").read()
        did = gid + "-" + os.path.basename(path)[:-3]
        docs.append({"id": did, "group": gname, "title": title, "src": "sushegaad", "html": md(src), "words": len(src.split())})

for kind, folder in (("Policy", "policies"), ("Procedure", "procedures")):
    d = os.path.join(COMPLY, "example", folder)
    for f in sorted(os.listdir(d)):
        if not f.endswith(".md") or f == "README.md": continue
        raw = open(os.path.join(d, f), encoding="utf-8").read()
        meta, body = {}, raw
        if "\n---" in raw[:2000] and all(re.match(r"^\s*([\w-]+:.*|-\s.*|\s*)$", x) for x in raw.split("\n---", 1)[0].split("\n")):
            head, body = raw.split("\n---", 1)
            name = re.search(r"^name:\s*(.+)$", head, re.M); meta["name"] = name.group(1).strip() if name else f
            meta["tsc"] = re.findall(r"^\s*-\s*(CC\d+\.\d+|[A-Z]+\d*\.\d+)\s*$", head, re.M)
        if len(body.split()) < 30: continue   # upstream placeholders ("Coming Soon")
        title = meta.get("name", f[:-3].title()).strip('"')
        docs.append({"id": "comply-" + f[:-3], "group": "SOC 2 policy templates" if kind == "Policy" else "SOC 2 procedure templates",
                     "title": title, "src": "comply", "tsc": meta.get("tsc", []), "html": md(body), "words": len(body.split())})

with open(OUT, "w", encoding="utf-8") as o:
    o.write("/* StudyCISSP - GRC library. Generated by grc/build_library.py; do not edit by hand.\n"
            "   Reference notes: Claude-Skills-Governance-Risk-and-Compliance by Hemant Naik, MIT licence.\n"
            "   Policy and procedure templates: strongdm/comply, Apache License 2.0.\n"
            "   See THIRD-PARTY-NOTICES.md. Changes: Markdown converted to HTML, punctuation normalised. */\n")
    o.write("window.GRC_LIBRARY = " + json.dumps(docs, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(docs), "documents,", sum(d["words"] for d in docs), "words")

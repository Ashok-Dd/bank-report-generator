#!/usr/bin/env python3
"""
pdf_processor.py — CoComply Bank Intelligence Brief PDF processor.

Uses PyMuPDF (fitz) to locate and replace placeholder text.
Strategy:
  1. Dynamically compute each cell's full column width from adjacent placeholders
     in the same table row (so erasing covers any coloured cell background).
  2. draw_rect(white) over the full cell rect — removes original text AND background.
  3. insert_textbox in the same cell rect — text wraps within column width and is
     clipped at the cell height, preventing overflow into adjacent columns or rows.

Template data-cell style (measured from PDF):
  Font : NimbusSanL-ReguItal  → replicated with 'heit' (Helvetica Oblique/Italic)
  Size : 8.97 pt
  Color: 0x144A9C  → (0.078, 0.290, 0.612)
"""

import sys
import json
import re
import urllib.parse
import fitz  # PyMuPDF

# ── Rendering constants ────────────────────────────────────────────────────
FONT        = "heit"                    # Helvetica Oblique ≈ italic
FONT_SIZE   = 8.97                      # pt — matches template data cells
COLOR       = (0.078, 0.290, 0.612)     # 0x144A9C — template blue
REF_COLOR   = (0.10, 0.10, 0.10)        # near-black for single-column references
REF_LINK_COLOR = (0.078, 0.290, 0.612)  # blue for clickable references
REF_SIZE    = 7.5                       # pt for reference entries
LINE_H      = FONT_SIZE * 1.35          # ≈12 pt line height
PAGE_RIGHT  = 540                       # usable page right edge (≈pt)

# ── URL extraction ─────────────────────────────────────────────────────────
# Matches full multi-part domains (investor.associatedbank.com, OCC.gov) at end of string
_URL_RE = re.compile(
    r'https?://[^\s,]+|'
    r'(?<![/\w@])(?:[a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}(?:/[^\s,]*)?(?=[\s,]*$)'
)


def extract_url(ref: str) -> str:
    """Return a clickable URL for a reference string.
    Uses explicit URLs/domains when found; falls back to a Google search so that
    ALL references are clickable regardless of whether they contain a URL."""
    stripped = ref.strip()
    m = _URL_RE.search(stripped)
    if m:
        url = m.group(0).rstrip('.,)')
        if not url.startswith('http'):
            url = 'https://' + url
        return url
    # Fallback: Google search for the reference text (first 120 chars)
    return 'https://www.google.com/search?q=' + urllib.parse.quote(stripped[:120])


# ── Helpers ────────────────────────────────────────────────────────────────
def safe(s):
    return str(s or "").strip()


def clip(s, lim=200):
    """Clip to lim chars silently (no truncation marker)."""
    s = str(s or "").strip()
    return s[:lim]


def g(arr, i, k, lim=200):
    return clip(safe((arr[i] if i < len(arr) else {}).get(k, "")), lim)


def _ket_name(full: str) -> str:
    """Shorten 'First M. Last (Role)' → 'Last (Role)' for the narrow KET exec column.
    The full name is already shown in the Engagement Targets table above."""
    s = safe(full).strip()
    # Match: optional prefix + last word before the role in parentheses
    m = re.match(r'^(?:.+\s+)?(\S+)\s+(\([^)]+\))\s*$', s)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    return clip(s, 22)


# ── Mapping builder ────────────────────────────────────────────────────────
def build_page_mappings(data: dict):
    """
    Returns (page_mappings, refs).
    page_mappings: {page_idx: {placeholder_text: [ordered values]}}
    refs:          list of up to 16 reference strings.
    """
    ip   = data.get("institutionProfile", {}) or {}
    fh   = data.get("financialHighlights", []) or []
    el   = data.get("executiveLeadership", {}) or {}
    bc   = data.get("boardChanges", []) or []
    sp   = data.get("strategicPriorities", []) or []
    tp   = data.get("technologyPosture", {}) or {}
    gov  = data.get("governance", []) or []
    rev  = data.get("riskEvents", []) or []
    ra   = data.get("riskResponseActions", []) or []
    esg  = data.get("esgCommitments", []) or []
    et   = data.get("engagementTargets", []) or []
    ket  = data.get("keyEngagementThemes", []) or []
    refs = data.get("references", []) or []

    # ── Institution Profile ───────────────────────────────────────────────
    ip_rows = ip.get("rows", [])

    def row_val(i, lim=60):
        return clip(safe(ip_rows[i].get("value", "") if i < len(ip_rows) else ""), lim)

    def row_notes(i, lim=80):
        return clip(safe(ip_rows[i].get("notes", "") if i < len(ip_rows) else ""), lim)

    def row_ref(i, lim=20):
        return clip(safe(ip_rows[i].get("reference", "") if i < len(ip_rows) else ""), lim)

    ticker = safe(ip.get("ticker", ""))
    exch   = safe(ip.get("exchange", ""))

    ip_name  = row_val(0, 60) or clip(safe(ip.get("institutionName", "")), 60)
    ip_hq    = row_val(1)     or clip(safe(ip.get("headquarters", "")), 60)
    ip_tick  = row_val(2)     or clip(f"{ticker} / {exch}" if exch else ticker, 60)
    ip_per   = row_val(3)     or clip(safe(ip.get("reportPeriod", "")), 60)
    ip_ass   = row_val(4)     or clip(safe(ip.get("totalAssets", "")), 60)
    ip_emp   = row_val(5)     or clip(safe(ip.get("totalEmployees", "")), 60)
    ip_base  = row_val(6)     or clip(safe(ip.get("clientBase", "")), 60)
    ip_geo   = row_val(7)     or clip(safe(ip.get("geographicFootprint", "")), 60)
    ip_inv   = row_val(8)     or clip(safe(ip.get("keyStrategicInvestor", "")), 60)
    ip_mile  = row_val(9)     or clip(safe(ip.get("anniversaryMilestone", "")), 60)

    ip_notes_list = [row_notes(i) for i in range(10)]
    ip_refs_list  = [row_ref(i)   for i in range(10)]

    # ── Executive leadership ───────────────────────────────────────────────
    exec_keys = ("ceo", "cfo", "coo", "cro", "cto", "cco", "headOfRetailBanking")
    exec_names = [clip(safe(el.get(k, "")), 40) for k in exec_keys]

    _es = el.get("execStatuses",   []) or []
    _em = el.get("execMandates",   []) or []
    _er = el.get("execReferences", []) or []

    exec_statuses = [clip(safe(_es[i] if i < len(_es) else ""), 20) for i in range(7)]
    exec_mandates = [clip(safe(_em[i] if i < len(_em) else ""), 80) for i in range(7)]
    exec_refs     = [clip(safe(_er[i] if i < len(_er) else ""), 20) for i in range(7)]

    bg_notes = el.get("backgroundNotes", []) or []

    # ── Technology posture ─────────────────────────────────────────────────
    tech_keys = [
        "coreBankingPlatform", "cloudStrategy", "aiMlInitiatives",
        "cybersecurityPosture", "digitalMobileBanking", "dataAnalytics", "regtechSuptech",
    ]
    tech_dims = [(tp.get(k, {}) or {}) for k in tech_keys]

    # ════════════════════════════════════════════════════════════════════
    # PAGE 1 — Institution Profile / Financial Highlights / Exec Registry
    # ════════════════════════════════════════════════════════════════════
    p1 = {
        "[Institution Name]": [ip_name],
        "[Name]":          [ip_name] + exec_names,         # 1 IP + 7 exec
        "[City, Country]": [ip_hq],
        "[Ticker]":        [ip_tick],
        "[Period]":        [ip_per] + [g(fh, i, "period", 30) for i in range(6)],
        "[USD bn]":        [ip_ass],
        "[Number]":        [ip_emp],
        "[Description]":   [ip_base],
        "[Regions]":       [ip_geo],
        "[Investor]":      [ip_inv],
        "[Milestone]":     [ip_mile],
        "[Notes]":  ip_notes_list + [g(fh, i, "notes", 40) for i in range(6)],
        "[Ref]":    ip_refs_list + [g(fh, i, "reference", 20) for i in range(6)] + exec_refs,
        "[Value]":  [g(fh, i, "value",     30) for i in range(6)],
        "[%]":      [g(fh, i, "yoyChange", 20) for i in range(6)],
        "[Status]": exec_statuses,
        "[Mandate]": exec_mandates,
    }

    # ════════════════════════════════════════════════════════════════════
    # PAGE 2 — Background Notes / Board Changes / Strategic / Tech Posture
    # ════════════════════════════════════════════════════════════════════
    bg_map = {
        f"[Executive background note {i + 1}]":
            [clip(safe(bg_notes[i] if i < len(bg_notes) else ""), 150)]
        for i in range(4)
    }

    p2 = {
        "[Institution Name]": [ip_name],
        **bg_map,
        "[Director Name]": [g(bc, i, "directorName",  50) for i in range(5)],
        "[Event]":         [g(bc, i, "event",          40) for i in range(5)],
        "[Date]":          [g(bc, i, "effectiveDate",  20) for i in range(5)],
        "[Relevance]":     [g(bc, i, "relevance",      60) for i in range(5)],
        "[Ref]": (
            [g(bc, i, "reference", 20) for i in range(5)] +
            [g(sp, i, "reference", 20) for i in range(5)] +
            [clip(safe(td.get("reference", "")), 20) for td in tech_dims]
        ),
        "[Priority 1]": [g(sp, 0, "priority", 40)],
        "[Priority 2]": [g(sp, 1, "priority", 40)],
        "[Priority 3]": [g(sp, 2, "priority", 40)],
        "[Priority 4]": [g(sp, 3, "priority", 40)],
        "[Priority 5]": [g(sp, 4, "priority", 40)],
        "[Details]": (
            [g(sp, i, "details",  80) for i in range(5)] +
            [clip(safe(td.get("details", "")), 100) for td in tech_dims]
        ),
        "[Timeline]": [g(sp, i, "timeline",  20) for i in range(5)],
        "[Outcome]":  [g(sp, i, "keyOutcome", 60) for i in range(5)],
        "[Status]": [clip(safe(td.get("status", "")), 30) for td in tech_dims],
    }

    # ════════════════════════════════════════════════════════════════════
    # PAGE 3 — Governance / Risk Events / Response Actions
    # ════════════════════════════════════════════════════════════════════
    def gov_val(i, k, lim):
        return clip(safe((gov[i] if i < len(gov) else {}).get(k, "")), lim)

    ra_map = {
        f"[Response action {i + 1}]":
            [clip(safe(ra[i] if i < len(ra) else ""), 150)]
        for i in range(4)
    }

    p3 = {
        "[Institution Name]": [ip_name],
        "[Details]":   [gov_val(i, "details",      80) for i in range(6)],
        "[Date]": (
            [gov_val(i, "effective",    20) for i in range(6)] +
            [g(rev, i, "date",          20) for i in range(5)]
        ),
        "[Mechanism]": [gov_val(i, "keyMechanism", 80) for i in range(6)],
        "[Ref]": (
            [gov_val(i, "reference",    20) for i in range(6)] +
            [g(rev, i, "reference",     20) for i in range(5)]
        ),
        "[Incident description]": [g(rev, i, "incident", 100) for i in range(5)],
        "[Category]":             [g(rev, i, "category",  40) for i in range(5)],
        "[Impact]":               [g(rev, i, "impact",    80) for i in range(5)],
        **ra_map,
    }

    # ════════════════════════════════════════════════════════════════════
    # PAGE 4 — ESG / Engagement Targets / Key Themes  (references separate)
    # ════════════════════════════════════════════════════════════════════
    def esg_val(i, k, lim):
        return clip(safe((esg[i] if i < len(esg) else {}).get(k, "")), lim)

    roles_map = {
        f"[Role {i + 1}]":
            [clip(safe((et[i] if i < len(et) else {}).get("role", "")), 40)]
        for i in range(5)
    }
    ket_exec  = [_ket_name(t.get("executive", "")) for t in ket]
    ket_theme = [clip(safe(t.get("theme",     "")), 150) for t in ket]
    ket_map   = {
        f"[Engagement theme and talking point {i + 1}]":
            [ket_theme[i] if i < len(ket_theme) else ""]
        for i in range(5)
    }

    p4 = {
        "[Institution Name]": [ip_name],
        "[Commitment]": [esg_val(i, "commitment", 80) for i in range(6)],
        "[Progress]":   [esg_val(i, "progress",   60) for i in range(6)],
        "[Period]":     [esg_val(i, "period",      30) for i in range(6)],
        "[Ref]":        [esg_val(i, "reference",   20) for i in range(6)],
        **roles_map,
        "[Contact Name]":    [clip(safe((et[i] if i < len(et) else {}).get("contact",        "")), 50) for i in range(5)],
        "[Engagement hook]": [clip(safe((et[i] if i < len(et) else {}).get("engagementHook", "")), 150) for i in range(5)],
        "[Executive Name]":  [ket_exec[i] if i < len(ket_exec) else "" for i in range(5)],
        **ket_map,
    }

    return {0: p1, 1: p2, 2: p3, 3: p4}, refs


# ── Word-wrap helpers ──────────────────────────────────────────────────────
def _hard_clip(text: str, max_width: float) -> str:
    """Binary-search clip: return the longest prefix of *text* that fits in max_width."""
    if not text or fitz.get_text_length(text, fontname=FONT, fontsize=FONT_SIZE) <= max_width:
        return text
    lo, hi = 1, len(text) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fitz.get_text_length(text[:mid], fontname=FONT, fontsize=FONT_SIZE) <= max_width:
            lo = mid
        else:
            hi = mid - 1
    return text[:lo]


def _wrap_text(text: str, max_width: float) -> list:
    """
    Break *text* into lines that each fit within *max_width* points.
    Uses fitz.get_text_length for accurate per-font measurement.
    Single words that exceed max_width are hard-clipped at character level so that
    no line can ever overflow the column boundary horizontally.
    Returns a list of line strings (at least one entry).
    """
    if not text:
        return []
    words = text.split()
    if not words:
        return []
    lines = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        if fitz.get_text_length(candidate, fontname=FONT, fontsize=FONT_SIZE) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)          # current already fits — safe to append
            if fitz.get_text_length(word, fontname=FONT, fontsize=FONT_SIZE) > max_width:
                lines.append(_hard_clip(word, max_width))  # word wider than column
                current = ""
            else:
                current = word
    if current:
        lines.append(current)                  # current already fits — safe to append
    return lines or [""]


# ── Core replacement logic ─────────────────────────────────────────────────
def replace_placeholders(page: fitz.Page, mapping: dict) -> int:
    """
    1. Find every placeholder occurrence on *page* and sort by (y, x).
    2. Compute each cell's FULL COLUMN WIDTH dynamically from adjacent hits.
    3. draw_rect(white) over the full cell to erase original text and background.
    4. insert_text per wrapped line — text wraps at word boundaries within the
       column width and is clipped at the cell height, preventing overflow into
       adjacent columns or rows.
    Returns count of replacements applied.
    """
    counters: dict = {}

    # Collect all (y, x, placeholder, rect)
    hits = []
    for ph, vals in mapping.items():
        for rect in page.search_for(ph, quads=False):
            hits.append((rect.y0, rect.x0, ph, rect))
    hits.sort()

    if not hits:
        return 0

    n = len(hits)

    # ── Compute cell right boundary for each hit ───────────────────────────
    # Scan ALL hits in the same y-band (±2 pt) and find the nearest one
    # strictly to the RIGHT of the current placeholder.  A simple forward
    # scan fails when two placeholders share nearly the same y but the
    # right-column placeholder has a fractionally smaller y and therefore
    # sorts before the left-column placeholder — causing the forward scan
    # to mistake the left-column hit for a "next column" boundary.
    cell_rights = []
    for i in range(n):
        y_i, x_i, _, rect_i = hits[i]
        nearest_right_x = None

        for j in range(n):
            if j == i:
                continue
            y_j, x_j = hits[j][0], hits[j][1]
            if abs(y_j - y_i) <= 2 and x_j > x_i:   # same row, to the right
                if nearest_right_x is None or x_j < nearest_right_x:
                    nearest_right_x = x_j

        if nearest_right_x is not None:
            right = nearest_right_x - 3
        else:                               # last (or only) column in the row
            ph_width = rect_i.x1 - rect_i.x0
            if ph_width > 50:               # wide placeholder → list item / note
                right = PAGE_RIGHT
            else:                           # narrow → Ref or similar short column
                right = rect_i.x0 + 56

        # Ensure minimum usable cell width
        right = max(right, rect_i.x0 + 12)
        cell_rights.append(right)

    # ── Build (cell_rect, value) pairs ────────────────────────────────────
    replacements = []
    for i, (y, x, ph, rect) in enumerate(hits):
        idx  = counters.get(ph, 0)
        counters[ph] = idx + 1
        vals = mapping[ph]
        if idx >= len(vals):
            continue

        right     = cell_rights[i]
        cell_rect = fitz.Rect(rect.x0 - 1, rect.y0 - 1, right, rect.y1 + 1)
        replacements.append((cell_rect, vals[idx]))

    if not replacements:
        return 0

    # ── Step 1: Erase each cell completely (removes background colour too) ─
    for cell_rect, _ in replacements:
        page.draw_rect(cell_rect, color=(1, 1, 1), fill=(1, 1, 1))

    # ── Step 2: Insert replacement text with word-wrap, clipped to cell ───
    BASELINE_OFFSET = FONT_SIZE * 0.80   # distance from cell top to first baseline
    for cell_rect, val in replacements:
        if not val or (cell_rect.x1 - cell_rect.x0) <= 4:
            continue
        col_width = cell_rect.x1 - cell_rect.x0 - 2   # inner usable width
        lines = _wrap_text(val, col_width)
        for li, line in enumerate(lines):
            baseline_y = cell_rect.y0 + BASELINE_OFFSET + li * LINE_H
            if baseline_y > cell_rect.y1:              # clip at cell bottom
                break
            page.insert_text(
                fitz.Point(cell_rect.x0 + 1, baseline_y),
                line,
                fontname=FONT,
                fontsize=FONT_SIZE,
                color=COLOR,
            )

    return len(replacements)


def handle_references(page: fitz.Page, refs: list) -> int:
    """
    Erase the 2-column reference block on page 4, reflow as a single column,
    and add clickable hyperlinks where a URL is found in the reference string.
    """
    if not refs:
        return 0

    # Erase both columns (number markers + placeholder text)
    erase_rect = fitz.Rect(44, 646, PAGE_RIGHT, 782)
    page.draw_rect(erase_rect, color=(1, 1, 1), fill=(1, 1, 1))

    n     = min(len(refs), 16)
    lines = [f"[{i}]  {safe(refs[i - 1])}" for i in range(1, n + 1)]
    if not lines:
        return 0

    # Distribute evenly across available vertical space
    y_top   = 656
    y_bot   = 779
    step    = (y_bot - y_top) / n

    for idx, line in enumerate(lines):
        baseline_y = y_top + idx * step + REF_SIZE * 0.82
        url = extract_url(safe(refs[idx]))   # always returns a URL now

        page.insert_text(
            fitz.Point(56, baseline_y),
            line,
            fontname="helv",
            fontsize=REF_SIZE,
            color=REF_LINK_COLOR,            # all refs are blue clickable links
        )

        # Make the entire line area clickable
        link_rect = fitz.Rect(
            56,
            baseline_y - REF_SIZE * 0.9,
            PAGE_RIGHT,
            baseline_y + REF_SIZE * 0.3,
        )
        page.insert_link({
            "kind": fitz.LINK_URI,
            "from": link_rect,
            "uri": url,
        })

    return n


# ── Main patch entry point ─────────────────────────────────────────────────
def patch_pdf(pdf_bytes: bytes, data: dict):
    doc  = fitz.open(stream=pdf_bytes, filetype="pdf")
    refs = data.get("references", []) or []

    # Remove page 5 (overflow placeholders) — never used (max 16 references)
    if len(doc) > 4:
        doc.delete_page(4)

    page_mappings, _ = build_page_mappings(data)
    total = 0

    for page_idx, page in enumerate(doc):
        mapping = page_mappings.get(page_idx, {})
        if mapping:
            total += replace_placeholders(page, mapping)

        # References: erase 2-column layout, reflow as single column (page 4)
        if page_idx == 3:
            total += handle_references(page, refs)

    return doc.tobytes(), total


# ── CLI entry point ────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: pdf_processor.py <template> <data.json> <output>"}))
        sys.exit(1)

    try:
        with open(sys.argv[1], "rb") as f:
            pdf_bytes = f.read()
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Cannot read template: {e}"}))
        sys.exit(1)

    try:
        with open(sys.argv[2], "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Cannot read JSON: {e}"}))
        sys.exit(1)

    try:
        out, count = patch_pdf(pdf_bytes, data)
    except Exception as e:
        import traceback
        print(json.dumps({"success": False, "error": str(e), "trace": traceback.format_exc()}))
        sys.exit(1)

    try:
        with open(sys.argv[3], "wb") as f:
            f.write(out)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Cannot write: {e}"}))
        sys.exit(1)

    print(json.dumps({"success": True, "replacedCount": count, "outputSize": len(out)}))


if __name__ == "__main__":
    main()

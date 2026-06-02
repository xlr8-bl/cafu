"""
Build a 14-slide Maison Cafu presentation (.pptx) that mirrors the guided tour.

Brand: warm charcoal background, terracotta accent, cream text.
Serif display via Georgia (PowerPoint-safe), sans body via Calibri.

Run:
    python presentation/build_pptx.py
Output:
    deliverables/Maison_Cafu_Presentation.pptx   (falls back to presentation/ if no deliverables dir)
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

# ── brand palette ─────────────────────────────────────────────────────────────
BG = RGBColor(0x11, 0x10, 0x0E)        # warm charcoal
CARD = RGBColor(0x1E, 0x1A, 0x14)      # slightly lighter panel
TERRA = RGBColor(0xE1, 0x78, 0x2D)     # terracotta accent
CREAM = RGBColor(0xF7, 0xF3, 0xED)     # text
MUTED = RGBColor(0xA1, 0x99, 0x91)     # secondary text
GREEN = RGBColor(0x7F, 0xB0, 0x69)
BORDER = RGBColor(0x31, 0x2E, 0x2B)

SERIF = "Georgia"
SANS = "Calibri"

# 16:9 canvas
EMU_W = Emu(12192000)
EMU_H = Emu(6858000)

prs = Presentation()
prs.slide_width = EMU_W
prs.slide_height = EMU_H
BLANK = prs.slide_layouts[6]


# ── helpers ───────────────────────────────────────────────────────────────────
def _set(run, size, color, bold=False, italic=False, font=SANS):
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic
    run.font.name = font


def fill_bg(slide):
    rect = slide.shapes.add_shape(1, 0, 0, EMU_W, EMU_H)
    rect.fill.solid()
    rect.fill.fore_color.rgb = BG
    rect.line.fill.background()
    rect.shadow.inherit = False
    # send to back
    spTree = slide.shapes._spTree
    spTree.remove(rect._element)
    spTree.insert(2, rect._element)
    return rect


def add_box(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Emu(x), Emu(y), Emu(w), Emu(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    return tf


def accent_bar(slide, x=686000, y=1500000, w=1400000):
    bar = slide.shapes.add_shape(1, Emu(x), Emu(y), Emu(w), Pt(5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = TERRA
    bar.line.fill.background()
    bar.shadow.inherit = False
    return bar


def panel(slide, x, y, w, h):
    p = slide.shapes.add_shape(1, Emu(x), Emu(y), Emu(w), Emu(h))
    p.fill.solid()
    p.fill.fore_color.rgb = CARD
    p.line.color.rgb = BORDER
    p.line.width = Pt(0.75)
    p.shadow.inherit = False
    return p


LEFT = 686000          # left margin
TOP_KICKER = 760000
TOP_TITLE = 1050000
CONTENT_TOP = 1850000
WIDTH = 10820000


def content_slide(kicker, title, bullets, footer="Maison Cafu · CEC418 Software Construction"):
    """bullets: list of (head, body) tuples or plain strings."""
    slide = prs.slides.add_slide(BLANK)
    fill_bg(slide)

    # kicker
    tf = add_box(slide, LEFT, TOP_KICKER, WIDTH, 300000)
    r = tf.paragraphs[0].add_run()
    r.text = kicker.upper()
    _set(r, 12, TERRA, bold=True, font=SANS)
    tf.paragraphs[0].runs[0].font._rPr.set("spc", "300")

    # title
    tf = add_box(slide, LEFT, TOP_TITLE, WIDTH, 700000)
    r = tf.paragraphs[0].add_run()
    r.text = title
    _set(r, 34, CREAM, bold=True, font=SERIF)

    accent_bar(slide)

    # bullets
    tf = add_box(slide, LEFT, CONTENT_TOP, WIDTH, 4200000)
    first = True
    for item in bullets:
        head, body = item if isinstance(item, tuple) else (None, item)
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(12)
        p.line_spacing = 1.15
        if head:
            rh = p.add_run()
            rh.text = f"{head}  "
            _set(rh, 19, TERRA, bold=True, font=SANS)
            rb = p.add_run()
            rb.text = body
            _set(rb, 18, CREAM, font=SANS)
        else:
            rb = p.add_run()
            rb.text = body
            _set(rb, 18, CREAM, font=SANS)

    # footer
    tf = add_box(slide, LEFT, 6350000, WIDTH, 300000)
    r = tf.paragraphs[0].add_run()
    r.text = footer
    _set(r, 10, MUTED, font=SANS)
    return slide


def quote_slide(kicker, title, quote, sub=None):
    slide = prs.slides.add_slide(BLANK)
    fill_bg(slide)
    panel(slide, LEFT, 1500000, WIDTH, 3700000)

    tf = add_box(slide, LEFT, TOP_KICKER, WIDTH, 300000)
    r = tf.paragraphs[0].add_run()
    r.text = kicker.upper()
    _set(r, 12, TERRA, bold=True)

    tf = add_box(slide, LEFT, TOP_TITLE, WIDTH, 500000)
    r = tf.paragraphs[0].add_run()
    r.text = title
    _set(r, 30, CREAM, bold=True, font=SERIF)

    tf = add_box(slide, 1100000, 1900000, 10000000, 2900000, anchor=MSO_ANCHOR.MIDDLE)
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = quote
    _set(r, 23, CREAM, italic=True, font=SERIF)
    p.line_spacing = 1.25
    if sub:
        p2 = tf.add_paragraph()
        p2.space_before = Pt(18)
        r2 = p2.add_run()
        r2.text = sub
        _set(r2, 15, TERRA, bold=True, font=SANS)

    tf = add_box(slide, LEFT, 6350000, WIDTH, 300000)
    r = tf.paragraphs[0].add_run()
    r.text = "Maison Cafu · CEC418 Software Construction"
    _set(r, 10, MUTED)
    return slide


# ── Slide 1 — title ───────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK)
fill_bg(s)
accent_bar(s, x=686000, y=2750000, w=1600000)
tf = add_box(s, LEFT, 2900000, WIDTH, 1500000)
r = tf.paragraphs[0].add_run()
r.text = "Maison Cafu"
_set(r, 60, CREAM, bold=True, font=SERIF)
p = tf.add_paragraph()
r = p.add_run()
r.text = "A smart restaurant web app — and how it is built well."
_set(r, 22, MUTED, font=SANS)
p.space_before = Pt(10)
tf = add_box(s, LEFT, 5400000, WIDTH, 900000)
for line, col in [
    ("Smart Restaurant Web App (SRWA)", CREAM),
    ("CEC418 — Software Construction and Evolution", TERRA),
    ("Software Construction fundamentals · Git · GitHub · Docker · Jenkins", MUTED),
]:
    p = tf.add_paragraph() if tf.paragraphs[0].runs else tf.paragraphs[0]
    r = p.add_run()
    r.text = line
    _set(r, 14, col, bold=(col == TERRA))

# ── Slide 2 — what is it ──────────────────────────────────────────────────────
content_slide(
    "Chapter 1 · the product",
    "What is Maison Cafu?",
    [
        "A website for a Cameroonian restaurant. No app to download, no account needed — a visitor can do four simple things:",
        ("Browse", "the menu — real dishes (Ndolé, Poulet DG, Mbongo Tchobi) with photos, prices and tags."),
        ("Recommend", "add a dish and the site suggests what pairs well — like a waiter's advice."),
        ("Order", "pick dishes, set a quantity, send the order through."),
        ("Reserve", "book a table for a date and time."),
    ],
)

# ── Slide 3 — three parts ─────────────────────────────────────────────────────
content_slide(
    "Chapter 2 · the architecture",
    "The three moving parts",
    [
        ("Dining room → Frontend", "what customers see and touch. Built with React, runs in the browser."),
        ("Kitchen → Backend", "the brain on the server. Built with PHP. Receives requests, decides what to do."),
        ("Pantry → Database", "stores the menu, every order and reservation safely. MySQL."),
        ("A waiter → Recommender", "a small helper that has 'seen' past orders and knows what pairs well."),
        "One click travels: React page → /api/menu → MySQL → dishes appear back on the table.",
    ],
)

# ── Slide 4 — what is construction ────────────────────────────────────────────
content_slide(
    "Chapter 3 · the big idea",
    "What is Software Construction?",
    [
        "Construction = actually writing the code. SWEBOK lists what GOOD construction looks like — five fundamentals:",
        ("1 · Complexity", "keep it simple, so a human can understand it."),
        ("2 · Change", "build so tomorrow's changes are easy, not painful."),
        ("3 · Verification", "build so it's easy to check that it works."),
        ("4 · Reuse", "make a part once, use it everywhere."),
        ("5 · Standards", "everyone follows the same rulebook."),
    ],
)

# ── Slide 5 — complexity ──────────────────────────────────────────────────────
content_slide(
    "Fundamental 1 of 5",
    "Minimizing Complexity",
    [
        "The enemy is tangled code. The goal: make each piece small and obvious.",
        ("Analogy", "one tidy serving hatch, not fifty secret doors into the kitchen."),
        ("In the code", "every request to the server goes through ONE shared helper (api.ts)."),
        ("Why it matters", "if the page-to-server link breaks, there is one place to look — not fifty."),
        ("Say this", "“Simple code is code a stranger can read at midnight and still understand.”"),
    ],
)

# ── Slide 6 — change ──────────────────────────────────────────────────────────
content_slide(
    "Fundamental 2 of 5",
    "Anticipating Change",
    [
        "Software is never finished. Good construction makes change painless.",
        ("Migrations", "database changes are scripts that apply (up) AND undo themselves (down) — a save point."),
        ("Settings, not hard-coding", "the database address is read from the environment, so moving servers = change one setting, touch no code."),
        ("Analogy", "a lamp with a plug, not one wired into the wall."),
    ],
)

# ── Slide 7 — verification ────────────────────────────────────────────────────
content_slide(
    "Fundamental 3 of 5",
    "Constructing for Verification",
    [
        "Verification = proving the software is correct, through testing. The code makes testing easy on purpose.",
        ("Swappable database", "tests slot in a fake, throwaway database (setConnection) — fast and safe."),
        ("One command", "composer test runs every unit test; composer lint checks style."),
        ("Automated", "Jenkins re-runs the whole check on every change, and even calls /api/menu on a live copy."),
    ],
)

# ── Slide 8 — reuse ───────────────────────────────────────────────────────────
content_slide(
    "Fundamental 4 of 5",
    "Reuse",
    [
        "Build a part once, reuse it — less work, fewer bugs, consistent results.",
        ("Design tokens", "every colour and rounded corner is defined ONCE. Change the brand colour once, the whole site updates."),
        ("Shared API helper", "the same 'api' object feeds the menu, basket, recommendations and reservations."),
        ("Analogy", "a house-blend sauce mixed once and used across many dishes."),
    ],
)

# ── Slide 9 — standards ───────────────────────────────────────────────────────
content_slide(
    "Fundamental 5 of 5",
    "Standards in Construction",
    [
        "Agreed rules, so the code reads like one careful author wrote it.",
        ("PSR-12", "an automatic style checker keeps spacing and naming consistent across every file."),
        ("Strict types", "every PHP file turns on strict mode, so mistakes are caught early, not hidden."),
        ("One config", "a shared .editorconfig gives every editor the same indentation and line endings."),
    ],
)

# ── Slide 10 — devops intro ───────────────────────────────────────────────────
content_slide(
    "Part 2 · the toolchain",
    "The tools that ship it: DevOps",
    [
        "Writing good code is cooking at home. DevOps turns it into a restaurant that serves the same dish, every day, to everyone.",
        ("Git", "the time machine — records every change."),
        ("GitHub", "the shared home — the project online, one source of truth."),
        ("Docker", "the lunchbox — packs the app + everything it needs to run anywhere."),
        ("Jenkins", "the robot inspector — checks, tests and builds on every change."),
    ],
)

# ── Slide 11 — git & github ───────────────────────────────────────────────────
content_slide(
    "Tools 1 & 2 · version control + collaboration",
    "Git & GitHub",
    [
        ("Git", "records a snapshot (a 'commit') each time you finish work — like save points in a game. Nothing is ever truly lost."),
        ("Tidy history", "commits are labelled — feat: for features, chore: for housekeeping — so the project's story reads clearly."),
        ("GitHub", "puts that history ONLINE: a single source of truth the team and the tools all build from."),
        ("Why it matters", "tools like Jenkins and the host watch GitHub and react automatically when new code arrives."),
    ],
)

# ── Slide 12 — docker ─────────────────────────────────────────────────────────
content_slide(
    "Tool 3 · containerization",
    "Docker — the lunchbox",
    [
        "Ends the 'it works on my computer' problem.",
        ("Container", "packs the app AND everything it needs — exact PHP version, extensions, settings — into one sealed box."),
        ("Same everywhere", "open the box on any computer and it runs identically: laptop or cloud."),
        ("One command", "docker-compose starts the whole restaurant — PHP, MySQL, web server — together (make up)."),
        ("Correct claim", "“Docker containerizes the app so it moves from local to the cloud without breaking.” ✓"),
    ],
)

# ── Slide 13 — jenkins ────────────────────────────────────────────────────────
content_slide(
    "Tool 4 · automation (CI/CD)",
    "Jenkins — the robot inspector",
    [
        "On every change, Jenkins runs a fixed checklist (the pipeline) automatically. Fail a step, the code can't ship.",
        ("The checklist", "checkout → install → lint & style → unit tests → build Docker image → integration smoke test → deploy."),
        ("On migrations", "Jenkins' job is testing & shipping. It runs a migration ONLY to build a throwaway test database."),
        ("Who owns migrations", "Phinx owns them — Jenkins just presses the button during the integration test."),
    ],
)

# ── Slide 14 — summary ────────────────────────────────────────────────────────
quote_slide(
    "Finale · the 60-second story",
    "Bring it home",
    "“Maison Cafu is a React frontend, a PHP backend and a MySQL database. It minimizes "
    "complexity with one shared request helper, anticipates change with reversible migrations "
    "and plug-in settings, is built for verification with swappable test databases, reuses "
    "design tokens and a shared API, and follows standards like PSR-12 and strict types. "
    "Git tracks every change, GitHub is the shared home, Docker containerizes it to run "
    "anywhere, and Jenkins tests and builds it on every change.”",
    sub="Five fundamentals · four tools · one clear story.",
)

# ── save ──────────────────────────────────────────────────────────────────────
root = Path(__file__).resolve().parent.parent
out_dir = root / "deliverables"
if not out_dir.exists():
    out_dir = root / "presentation"
out_path = out_dir / "Maison_Cafu_Presentation.pptx"
prs.save(str(out_path))
print(f"Saved {len(prs.slides)} slides -> {out_path}")

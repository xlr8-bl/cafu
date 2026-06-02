"""
Maison Cafu — a guided, plain-English deep dive.

A progressive, story-driven walkthrough of the Maison Cafu / SRWA project:
what it is, how it's built, how it satisfies the five fundamentals of
Software Construction (SWEBOK), and the DevOps tools behind it
(Git, GitHub, Docker, Jenkins).

Run locally:   streamlit run presentation/app.py
Deploy:        Streamlit Community Cloud, main file = presentation/app.py
"""

from pathlib import Path

import streamlit as st

# The written report lives in the local-only deliverables folder (gitignored, since it
# carries the author's name + matric). The download button below therefore appears only
# when the file is actually present — i.e. when running locally — and stays hidden on the
# public Streamlit Cloud deploy.
REPORT_PATH = Path(__file__).resolve().parent.parent / "deliverables" / "SRWA_Report_NKAFU_CT23A129_v2.docx"

st.set_page_config(
    page_title="Maison Cafu — The Guided Tour",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ──────────────────────────────────────────────────────────────────────────────
#  Brand styling — pulled from the real app tokens
#  bg #11100E · card #17140F · cream #F7F3ED · terracotta #E1782D
#  muted #A19991 · border #312E2B · Fraunces (display) + Inter (body)
# ──────────────────────────────────────────────────────────────────────────────
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap');

:root {
    --bg:        #11100E;
    --card:      #17140F;
    --card-2:    #1E1A14;
    --cream:     #F7F3ED;
    --terra:     #E1782D;
    --terra-2:   #C8651F;
    --muted:     #A19991;
    --border:    #312E2B;
    --green:     #7FB069;
    --blue:      #6FA8C7;
}

/* page background with the same warm glow as the real site */
.stApp {
    background:
        radial-gradient(ellipse 80% 50% at 50% -8%, rgba(225,120,45,0.16), transparent 60%),
        radial-gradient(ellipse 45% 35% at 92% 108%, rgba(200,101,31,0.10), transparent 70%),
        var(--bg);
    color: var(--cream);
}

/* widen the content a touch and add breathing room */
.block-container { max-width: 920px; padding-top: 2.4rem; padding-bottom: 5rem; }

html, body, [class*="css"] { font-family: 'Inter', ui-sans-serif, system-ui; }

h1, h2, h3 { font-family: 'Fraunces', ui-serif, Georgia; letter-spacing: -0.02em; color: var(--cream); }
h1 { font-weight: 600; line-height: 1.02; }
h2 { font-weight: 600; margin-top: 0.2rem; }

p, li { color: #E7E0D6; font-size: 1.05rem; line-height: 1.7; }

/* kicker label above titles */
.kicker {
    display:inline-block; font-family:'Inter'; font-weight:600; font-size:0.72rem;
    letter-spacing:0.18em; text-transform:uppercase; color:var(--terra);
    border:1px solid var(--border); border-radius:999px; padding:4px 12px; margin-bottom:14px;
    background: rgba(225,120,45,0.06);
}

/* hero number */
.bignum { font-family:'Fraunces'; font-size:0.95rem; color:var(--muted); letter-spacing:0.1em; }

/* generic card */
.card {
    background: linear-gradient(180deg, var(--card-2), var(--card));
    border:1px solid var(--border); border-radius:16px; padding:22px 24px; margin:14px 0;
}
.card h4 { font-family:'Fraunces'; color:var(--cream); margin:0 0 6px 0; font-size:1.15rem; }
.card p  { margin:0; color:#D8D0C5; }

/* callouts */
.callout { border-radius:14px; padding:16px 18px 16px 20px; margin:16px 0; border-left:4px solid var(--terra);
           background: rgba(225,120,45,0.07); }
.callout .lbl { font-weight:700; font-size:0.74rem; letter-spacing:0.12em; text-transform:uppercase; display:block; margin-bottom:6px; }
.callout p { margin:0; }

.c-analogy { border-left-color: var(--terra);  background: rgba(225,120,45,0.07); }
.c-analogy .lbl { color: var(--terra); }
.c-grade   { border-left-color: var(--green);  background: rgba(127,176,105,0.08); }
.c-grade   .lbl { color: var(--green); }
.c-say     { border-left-color: var(--blue);   background: rgba(111,168,199,0.08); }
.c-say     .lbl { color: var(--blue); }
.c-say p   { font-family:'Fraunces'; font-size:1.12rem; font-style:italic; color:#EDE6DB; }

/* filename chip above code */
.filechip {
    display:inline-block; font-family:'Geist Mono','SF Mono',monospace; font-size:0.72rem;
    color:var(--muted); background:var(--card); border:1px solid var(--border);
    border-bottom:none; border-radius:8px 8px 0 0; padding:5px 12px; margin-bottom:-12px;
}

/* two-up comparison row */
.twoup { display:flex; gap:14px; margin:14px 0; flex-wrap:wrap; }
.twoup > div { flex:1; min-width:240px; border:1px solid var(--border); border-radius:14px; padding:16px 18px; }
.twoup .t { font-weight:700; font-size:0.74rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:8px; }
.box-restaurant { background: rgba(225,120,45,0.06); }
.box-restaurant .t { color: var(--terra); }
.box-tech { background: rgba(111,168,199,0.05); }
.box-tech .t { color: var(--blue); }

/* pills */
.pillrow { display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 2px; }
.pill { font-size:0.8rem; color:#EAE3D8; border:1px solid var(--border); background:var(--card);
        border-radius:999px; padding:5px 12px; }

/* divider */
hr { border:none; border-top:1px solid var(--border); margin:30px 0; }

/* sidebar */
section[data-testid="stSidebar"] { background:#0D0C0A; border-right:1px solid var(--border); }
section[data-testid="stSidebar"] .stRadio label { font-size:0.95rem; }
section[data-testid="stSidebar"] h2 { font-size:1.1rem; }

/* progress bar color */
.stProgress > div > div > div > div { background-color: var(--terra); }

/* nav buttons */
.stButton button {
    background: var(--card); color: var(--cream); border:1px solid var(--border);
    border-radius:12px; padding:10px 18px; font-weight:600; transition: all .15s ease;
}
.stButton button:hover { border-color: var(--terra); color: var(--terra); }

/* hide default chrome */
#MainMenu, footer, header { visibility: hidden; }

/* code blocks rounding */
.stCode, pre { border-radius: 0 12px 12px 12px !important; border:1px solid var(--border) !important; }
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)


# ──────────────────────────────────────────────────────────────────────────────
#  Small helpers for styled blocks
# ──────────────────────────────────────────────────────────────────────────────
def kicker(text):
    st.markdown(f'<span class="kicker">{text}</span>', unsafe_allow_html=True)


def callout(kind, label, body):
    cls = {"analogy": "c-analogy", "grade": "c-grade", "say": "c-say"}[kind]
    st.markdown(
        f'<div class="callout {cls}"><span class="lbl">{label}</span><p>{body}</p></div>',
        unsafe_allow_html=True,
    )


def card(title, body):
    st.markdown(
        f'<div class="card"><h4>{title}</h4><p>{body}</p></div>',
        unsafe_allow_html=True,
    )


def twoup(left_title, left_body, right_title, right_body):
    st.markdown(
        f"""
        <div class="twoup">
          <div class="box-restaurant"><div class="t">{left_title}</div>{left_body}</div>
          <div class="box-tech"><div class="t">{right_title}</div>{right_body}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def pills(items):
    chips = "".join(f'<span class="pill">{i}</span>' for i in items)
    st.markdown(f'<div class="pillrow">{chips}</div>', unsafe_allow_html=True)


def code(snippet, language="php", filename=None):
    if filename:
        st.markdown(f'<div class="filechip">{filename}</div>', unsafe_allow_html=True)
    st.code(snippet, language=language)


def report_download():
    """Offer the full written report — only when the local file is present."""
    if REPORT_PATH.exists():
        with open(REPORT_PATH, "rb") as fh:
            st.download_button(
                label="Download the full written report (.docx)",
                data=fh.read(),
                file_name=REPORT_PATH.name,
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True,
            )


# ──────────────────────────────────────────────────────────────────────────────
#  Chapters
# ──────────────────────────────────────────────────────────────────────────────
def ch_welcome():
    kicker("Start here · read me first")
    st.markdown("# Maison Cafu")
    st.markdown(
        "#### A smart restaurant website — explained from zero, one small step at a time."
    )
    st.write(
        "This guide turns a real software project into a story anyone can follow — "
        "no computer-science background needed. By the end you'll be able to stand up "
        "and explain **what was built, how it was built well, and the tools behind it** "
        "with total confidence."
    )

    callout(
        "analogy",
        "How to read this",
        "Think of it like a tour of a restaurant. We start at the front door, walk through "
        "the dining room, peek into the kitchen, then meet the team and the rules that keep "
        "everything running smoothly. Each chapter builds on the one before — so just go in order.",
    )

    st.markdown("##### What you'll be able to explain by the end")
    pills([
        "What the app does", "Its 3 main parts", "Minimizing Complexity",
        "Anticipating Change", "Constructing for Verification", "Reuse",
        "Standards", "Git", "GitHub", "Docker", "Jenkins",
    ])

    st.markdown("---")
    st.markdown("##### The two big questions this project answers")
    twoup(
        "Is it built simply?",
        "Software gets messy fast. Good construction keeps it <b>simple to understand</b> "
        "and <b>easy to change later</b>. That's the heart of the story.",
        "Is it built to last?",
        "Real software lives on a team, gets tested automatically, and ships the same way "
        "every time. That's what the <b>tools</b> (Git, Docker, Jenkins) give us.",
    )
    callout(
        "say",
        "Your opening line in the demo",
        "“Maison Cafu is a smart restaurant website — but the real story is <i>how</i> it’s "
        "built: simple enough to understand, and sturdy enough to grow.”",
    )

    report_download()


def ch_what():
    kicker("Chapter 1 · the product")
    st.markdown("# What is Maison Cafu?")
    st.write(
        "Maison Cafu is a website for a **Cameroonian restaurant**. A hungry visitor lands "
        "on the page and can do four simple things — no app to download, no account needed."
    )

    card("1 · Browse the menu",
         "Real Cameroonian dishes — Ndolé, Poulet DG, Mbongo Tchobi — with photos, prices, and tags.")
    card("2 · Get a recommendation",
         "Add a dish to the basket and the site suggests what goes well with it — like a waiter saying "
         "“that pairs nicely with…”.")
    card("3 · Place an order",
         "Pick dishes, set a quantity, and send the order through.")
    card("4 · Book a table",
         "Reserve a spot for a date and time.")

    st.markdown("---")
    callout(
        "analogy",
        "In one sentence",
        "It's a digital version of walking into a restaurant: <b>read the menu, ask the waiter "
        "for advice, order food, and book a table</b> — all from a phone or laptop.",
    )
    callout(
        "grade",
        "Why this matters for your presentation",
        "A marker first wants to know <i>what problem the software solves</i>. Keep it human: it helps "
        "a restaurant take orders and reservations online, and helps customers choose what to eat.",
    )


def ch_parts():
    kicker("Chapter 2 · the architecture")
    st.markdown("# The three moving parts")
    st.write(
        "Almost every website is made of three pieces. The easiest way to understand them is to "
        "picture a real restaurant."
    )

    twoup(
        "The dining room",
        "What customers see and touch — tables, menu cards, the décor. Pretty and friendly.",
        "The frontend",
        "The web page itself (buttons, menu, basket). Built with <b>React</b>. This is what loads in the browser.",
    )
    twoup(
        "The kitchen",
        "Hidden in the back. Takes orders, prepares them, sends plates out. Customers never see it.",
        "The backend",
        "The brain on the server. Built with <b>PHP</b>. It receives requests and decides what to do.",
    )
    twoup(
        "The pantry / ledger",
        "Where ingredients and the order book are stored. Nothing is lost; everything is recorded.",
        "The database",
        "<b>MySQL</b>. Stores the menu, every order, and every reservation safely.",
    )

    st.markdown("---")
    st.markdown("##### How a single click travels through the system")
    st.write(
        "When a visitor taps **“Show me the menu”**, here's the journey — like an order ticket "
        "moving from the dining room to the kitchen to the pantry and back:"
    )
    code(
        "Dining room  →  Kitchen   →  Pantry      →  back to the table\n"
        "(React page) →  (PHP)     →  (MySQL)      →  dishes appear\n\n"
        "  click  ──▶  /api/menu  ──▶  SELECT * …  ──▶  list of dishes shown",
        language="text",
    )

    callout(
        "analogy",
        "The waiter who connects everyone",
        "There's also a tiny <b>recommender</b> (the “what pairs well” feature). Think of it as an "
        "experienced waiter who has seen thousands of orders and knows what people usually buy together.",
    )
    callout(
        "say",
        "Say this and you'll sound senior",
        "“It's a classic three-tier design: a React <b>frontend</b>, a PHP <b>backend</b>, and a MySQL "
        "<b>database</b> — the dining room, the kitchen, and the pantry.”",
    )


def ch_construction_intro():
    kicker("Chapter 3 · the big idea")
    st.markdown("# So… what is *Software Construction*?")
    st.write(
        "“Construction” is simply the act of **writing the actual code** that makes software work — "
        "the building phase. There's a respected industry guide called **SWEBOK** (the *Software "
        "Engineering Body of Knowledge*) that lists what *good* construction looks like."
    )
    callout(
        "analogy",
        "Building a house vs. building software",
        "Anyone can stack bricks. But a <b>good</b> builder makes a house that's easy to live in, easy to "
        "renovate later, passes inspection, reuses standard parts, and follows the building code. "
        "Software construction has the exact same five ideas.",
    )

    st.markdown("##### The five fundamentals — your whole story in one map")
    card("1 · Minimizing Complexity", "Keep it simple. If it's simple, anyone can understand it.")
    card("2 · Anticipating Change", "Build so that tomorrow's changes are easy, not painful.")
    card("3 · Constructing for Verification", "Build so it's easy to check that it actually works.")
    card("4 · Reuse", "Don't rebuild the same thing twice. Make a part once, use it everywhere.")
    card("5 · Standards", "Everyone follows the same rules, so the code looks like one author wrote it.")

    callout(
        "grade",
        "The spine of your presentation",
        "These five are the headings your marker is listening for. The next five chapters take them "
        "<b>one at a time</b> and show the exact spot in Maison Cafu where each one lives.",
    )


def ch_complexity():
    kicker("Fundamental 1 of 5")
    st.markdown("# Minimizing Complexity")
    st.markdown("#### *Keep it simple, so a human can hold it in their head.*")
    st.write(
        "Complexity is the enemy. The more tangled the code, the more bugs hide in it and the harder "
        "it is to fix. The goal is to make each piece **small and obvious**."
    )

    callout(
        "analogy",
        "One door, not fifty",
        "Imagine a restaurant where every waiter walks into the kitchen through a different secret door, "
        "with their own rules. Chaos. Instead, Maison Cafu has <b>one tidy serving hatch</b> that every "
        "order passes through.",
    )

    st.write(
        "In the code, every request to the kitchen goes through **a single helper function**. "
        "The menu, the basket, the orders, the reservations — they all use the same little door:"
    )
    code(
        """// One door. Every call to the kitchen goes through here.
async function request<T>(path, init) {
    const res = await fetch(path, { ...init, headers: { Accept: 'application/json' }});
    const data = await res.json();
    if (!res.ok) throw new ApiError(res.status, data.error);
    return data;
}

export const api = {
    menu()        { return request('/api/menu'); },
    placeOrder(b) { return request('/api/orders', { method: 'POST', body: b }); },
    reserve(b)    { return request('/api/reservations', { method: 'POST', body: b }); },
};""",
        language="javascript",
        filename="app/web/src/lib/api.ts",
    )
    st.write(
        "Notice how short each line is. If something breaks in how the page talks to the server, "
        "there's **one place** to look — not fifty."
    )

    callout(
        "grade",
        "How this scores points",
        "Point at that file and say: “Every network call shares one helper — that's <b>minimizing "
        "complexity</b>. Fix it once, fixed everywhere.”",
    )
    callout(
        "say",
        "One-liner",
        "“Simple code isn't lazy code — it's code a stranger can read at midnight and still understand.”",
    )


def ch_change():
    kicker("Fundamental 2 of 5")
    st.markdown("# Anticipating Change")
    st.markdown("#### *Build today so tomorrow's change is easy.*")
    st.write(
        "Software is never finished. Prices change, new dishes appear, the restaurant moves to a new "
        "computer. Good construction **expects** this and makes change painless instead of scary."
    )

    st.markdown("##### Example A — changing the database safely")
    st.write(
        "When the database structure needs to change, you don't edit it by hand and pray. You write a "
        "**migration** — a little script that can move the database **forward** (`up`) *and* **undo "
        "itself** (`down`) if something goes wrong. Like a save point in a game."
    )
    code(
        """public function up(): void   // apply the change
{
    $sql = file_get_contents(__DIR__ . '/../sql/001_initial_schema.sql');
    foreach ($this->splitStatements($sql) as $stmt) {
        $this->execute($stmt);
    }
}

public function down(): void // undo the change, in reverse order
{
    $tables = ['order_items', 'reservations', 'orders',
               'menu_items', 'menu_categories', 'customers'];
    foreach ($tables as $t) $this->execute("DROP TABLE IF EXISTS {$t}");
}""",
        language="php",
        filename="db/migrations/20260521000001_initial_schema.php",
    )

    st.markdown("##### Example B — moving to a new computer without editing code")
    st.write(
        "The address of the database isn't typed into the code. It's read from the **environment** at "
        "run time. Move to a new server, change one setting, done — **no code touched**."
    )
    code(
        """$host = getenv('DB_HOST') ?: '127.0.0.1';   // read from the environment
$port = getenv('DB_PORT') ?: '3306';
$name = getenv('DB_NAME') ?: 'srwa';
// the code never hard-codes where the database lives""",
        language="php",
        filename="app/src/Database.php",
    )

    callout(
        "analogy",
        "Why this is clever",
        "It's the difference between a lamp <b>wired into the wall</b> (move house = call an electrician) "
        "and a lamp with a <b>plug</b> (move house = plug it in). The plug is the environment variable.",
    )
    callout(
        "grade",
        "How this scores points",
        "“Database changes are reversible <b>migrations</b>, and the database location is a plug-in "
        "<b>setting</b>, not hard-coded — both are textbook <i>anticipating change</i>.”",
    )


def ch_verification():
    kicker("Fundamental 3 of 5")
    st.markdown("# Constructing for Verification")
    st.markdown("#### *Build it so it's easy to check that it works.*")
    st.write(
        "Verification just means **proving the software is correct** — through testing. Good construction "
        "makes testing easy *on purpose*, so you can catch mistakes before customers do."
    )

    callout(
        "analogy",
        "A taste-test before the plate goes out",
        "A good kitchen tastes the soup before serving. This project tastes its own code <b>automatically</b>, "
        "every single time, before anything ships.",
    )

    st.markdown("##### Designed so tests can swap in a pretend database")
    st.write(
        "Tests shouldn't touch the real pantry. So the code allows a **fake, throwaway database** to be "
        "slotted in just for testing — fast and safe."
    )
    code(
        """/** Allow tests to inject a sqlite/in-memory PDO. */
public static function setConnection(PDO $pdo): void
{
    self::$pdo = $pdo;   // hand the code a fake DB during tests
}""",
        language="php",
        filename="app/src/Database.php",
    )

    st.markdown("##### One command runs every check")
    code(
        """composer test    →  runs all the unit tests
composer lint    →  checks the code style""",
        language="text",
        filename="app/composer.json (scripts)",
    )

    st.write(
        "And it's not just on your laptop — the robot (Jenkins, Chapter 13) runs **the whole taste-test "
        "on every change**: it checks the code, runs the tests, and even spins up the real site and "
        "calls `/api/menu` to confirm dishes come back."
    )

    callout(
        "grade",
        "How this scores points",
        "“The database is swappable so tests run against a fake one, there's a one-word test command, and "
        "a pipeline re-runs everything automatically — the whole thing is <b>built for verification</b>.”",
    )


def ch_reuse():
    kicker("Fundamental 4 of 5")
    st.markdown("# Reuse")
    st.markdown("#### *Make it once, use it everywhere.*")
    st.write(
        "Reuse means not rebuilding the same thing over and over. Build a part once, then reuse it — "
        "less work, fewer bugs, and everything stays consistent."
    )

    callout(
        "analogy",
        "House blend, not a new recipe each time",
        "A good restaurant mixes its signature sauce <b>once</b> and uses it across many dishes. If they "
        "improve the sauce, every dish gets better at once. Maison Cafu does the same with code.",
    )

    st.markdown("##### Reuse #1 — the colours and fonts are defined once")
    st.write(
        "Every colour and rounded corner is a **named setting** in one place. Change the brand colour "
        "here and the *entire* website updates — buttons, menus, highlights, all of it."
    )
    code(
        """:root {
    --primary: 25 75% 53%;   /* the terracotta brand colour, defined ONCE */
    --background: 24 9% 6%;
    --radius: 1rem;          /* every rounded corner reuses this */
}""",
        language="css",
        filename="app/web/src/index.css (design tokens)",
    )

    st.markdown("##### Reuse #2 — the same `api` helper feeds every section")
    st.write(
        "Remember the “one door” from Chapter 4? That same `api` object is reused by the menu, the "
        "basket, the recommendations, and the reservation form. **One tool, four jobs.**"
    )
    pills(["MenuSection → api.menu()", "CartDrawer → api.placeOrder()",
           "PicksSection → api.recommend()", "ReservationSection → api.reserve()"])

    callout(
        "grade",
        "How this scores points",
        "“The brand is defined once as <b>design tokens</b>, and one shared <b>api helper</b> is reused "
        "across every feature — that's <i>reuse</i> doing real work.”",
    )


def ch_standards():
    kicker("Fundamental 5 of 5")
    st.markdown("# Standards in Construction")
    st.markdown("#### *Everyone follows the same rulebook.*")
    st.write(
        "Standards mean the code follows **agreed-upon rules**, so it all looks like one careful author "
        "wrote it — even if many people contributed. Consistency makes everything easier to read."
    )

    callout(
        "analogy",
        "A kitchen where every station is laid out the same",
        "Walk into any branch and the knives, pans and labels are in the same place. New staff are "
        "productive on day one. Consistent code works exactly like that.",
    )

    st.markdown("##### Standard #1 — an automatic style checker (PSR-12)")
    st.write(
        "PHP has an official style guide called **PSR-12**. This project checks every file against it "
        "automatically, so spacing and naming never drift."
    )
    code(
        """"lint": "phpcs --standard=phpcs.xml",
"fix":  "phpcbf --standard=phpcs.xml" """,
        language="text",
        filename="app/composer.json (scripts)",
    )

    st.markdown("##### Standard #2 — strict, safe code by default")
    st.write(
        "Every PHP file opens by switching on **strict mode** — the language refuses to silently guess "
        "or fudge data types. Mistakes get caught early instead of hiding."
    )
    code("declare(strict_types=1);", language="php", filename="every .php file")

    st.markdown("##### Standard #3 — one formatting rule for the whole repo")
    st.write("A shared `.editorconfig` means every editor uses the same indentation and line endings.")
    code(
        """charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4""",
        language="text",
        filename=".editorconfig",
    )

    callout(
        "grade",
        "How this scores points",
        "“We enforce <b>PSR-12</b> automatically, turn on <b>strict types</b> everywhere, and share one "
        "<b>.editorconfig</b> — so the codebase reads like a single author wrote it.”",
    )


def ch_devops_intro():
    kicker("Part 2 · the toolchain")
    st.markdown("# The tools that ship it: DevOps")
    st.write(
        "You've seen *how the code is written well*. Now meet the **four tools** that take that code and "
        "deliver it safely and repeatably. Together they're often called **DevOps** — the bridge from "
        "“it works on my laptop” to “it works for everyone.”"
    )

    callout(
        "analogy",
        "From home cooking to a running restaurant",
        "Writing good code is cooking a great dish at home. DevOps is everything that turns that into a "
        "<b>restaurant that serves it the same way, every day, to everyone</b> — the recipe book, the "
        "shared kitchen, the delivery boxes, and the health inspector.",
    )

    st.markdown("##### The four tools, in one line each")
    card("Git — the time machine",
         "Records every change so you can rewind, compare, or branch off safely.")
    card("GitHub — the shared home",
         "Puts the project online so a team (and the tools) can all work from one source of truth.")
    card("Docker — the lunchbox",
         "Packs the app + everything it needs into one box that runs identically anywhere.")
    card("Jenkins — the robot inspector",
         "On every change, automatically checks, tests, and builds the app before it can ship.")

    callout(
        "grade",
        "Keep the framing tight",
        "Your marker asked about <b>Git, GitHub, Docker and Jenkins</b> specifically. The next four "
        "chapters give you a crisp, correct story for each.",
    )


def ch_git():
    kicker("Tool 1 · version control")
    st.markdown("# Git — the time machine")
    st.write(
        "**Git** records a snapshot of the project every time you finish a piece of work. Each snapshot "
        "is a **commit** — a save point you can return to. Nothing is ever truly lost."
    )

    callout(
        "analogy",
        "Save points in a video game",
        "Made a mess? Load an earlier save. Want to try a risky idea? Branch off into a parallel save and "
        "merge it back only if it works. That's Git.",
    )

    st.markdown("##### What a real history looks like here")
    code(
        """d73ce06  modified: app/web/vercel.json
9b4a11b  chore: add vercel rewrite to backend
0298c9f  chore: gitignore deliverables (kept local only)
3c2b3fd  feat: ship production-hardening overlay and CEC418 deliverables""",
        language="text",
        filename="git log (recent commits)",
    )
    st.write(
        "Each line is a save point with a short note. Notice the tidy labels — `feat:` for a new feature, "
        "`chore:` for housekeeping. That's a **standard** (Chapter 8) applied to history itself, so the "
        "story of the project reads clearly."
    )

    callout(
        "grade",
        "How this scores points",
        "“Git gives us a complete, reversible <b>history</b>. Every change is a labelled commit, so we can "
        "always see what changed, when, and why.”",
    )


def ch_github():
    kicker("Tool 2 · collaboration")
    st.markdown("# GitHub — the shared home")
    st.write(
        "Git lives on your laptop. **GitHub** puts a copy **online** so the whole world (or just your "
        "team) shares one official version. It's the project's home address on the internet."
    )

    twoup(
        "Git",
        "The time machine, on <b>your computer</b>. Records the history locally.",
        "GitHub",
        "The same history, <b>online</b>. A shared home everyone — and every tool — can reach.",
    )

    st.write("With the project on GitHub, three things become possible:")
    card("A single source of truth",
         "Everyone pulls from and pushes to the same place. No more “which version is the real one?”")
    card("Tools can plug in",
         "Jenkins and the hosting platform watch GitHub and react automatically when new code arrives.")
    card("Safe review before merging",
         "Changes can be proposed, discussed, and checked before they join the main project.")

    callout(
        "analogy",
        "The difference in one image",
        "Git is your private recipe notebook at home. GitHub is the <b>restaurant's shared recipe binder</b> "
        "in the kitchen that the whole team — and the health inspector — works from.",
    )
    callout(
        "grade",
        "How this scores points",
        "“GitHub is our shared online home for the code — the single source of truth that the team and the "
        "automated tools all build on.”",
    )


def ch_docker():
    kicker("Tool 3 · containerization")
    st.markdown("# Docker — the lunchbox")
    st.write(
        "The classic problem: *“it works on my computer, but not yours.”* Usually because the two "
        "computers have different versions of things. **Docker** ends that argument."
    )

    callout(
        "analogy",
        "A packed lunchbox vs. hoping the new kitchen has what you need",
        "Docker packs the app <b>and everything it needs</b> — the right PHP version, the exact extensions, "
        "the settings — into one sealed box called a <b>container</b>. Open that box on any computer and the "
        "meal is identical.",
    )

    st.write(
        "The recipe for the box is a **Dockerfile**. Here's the real one, trimmed — it starts from a known "
        "PHP version and adds exactly the parts the app needs:"
    )
    code(
        """FROM php:8.3-fpm-alpine AS runtime

# add exactly the database + tooling parts the app needs
RUN install-php-extensions pdo_mysql mysqli intl zip opcache

WORKDIR /var/www/html
COPY app/ ./            # put the app inside the box
CMD ["php-fpm", "-F"]   # how the box starts itself""",
        language="dockerfile",
        filename="Dockerfile",
    )

    st.write(
        "And because the whole restaurant has several boxes (the PHP kitchen, the MySQL pantry, the web "
        "server), one file — **docker-compose** — starts them all together with a single command: `make up`."
    )

    callout(
        "grade",
        "Your exact line — and it's correct",
        "“Docker <b>containerizes</b> the app so it runs the same on my laptop and in the cloud — we can "
        "move it from local to a server without it breaking.” Correct — spot on.",
    )
    callout(
        "say",
        "One-liner that lands",
        "“Docker is a lunchbox: the app plus everything it needs, sealed up so it tastes the same in every "
        "kitchen.”",
    )


def ch_jenkins():
    kicker("Tool 4 · automation (CI/CD)")
    st.markdown("# Jenkins — the robot inspector")
    st.write(
        "**Jenkins** is an automation robot. Every time new code arrives, it runs a fixed checklist — "
        "the **pipeline** — without anyone pressing a button. If any step fails, the code is stopped "
        "before it can ship. This is called **CI/CD** (Continuous Integration / Continuous Delivery)."
    )

    callout(
        "analogy",
        "A health inspector who never sleeps",
        "Imagine an inspector who checks <b>every single dish</b> against the same checklist before it "
        "leaves the kitchen — instantly, every time, never tired, never skipping a step. That's Jenkins.",
    )

    st.markdown("##### The checklist it runs, top to bottom")
    code(
        """1. Checkout          → grab the latest code
2. Install deps      → fetch the libraries it needs
3. Static analysis   → check the code + style (PSR-12)
4. Unit tests        → run the automated taste-tests
5. Build image       → pack the Docker lunchbox
6. Integration smoke → start the real site, set up a test DB, call /api/menu
7. Deploy            → (on the main branch) ship it""",
        language="text",
        filename="Jenkinsfile (stages)",
    )

    st.markdown("##### About that “migration and testing” question")
    callout(
        "analogy",
        "Setting the record straight (so you're bullet-proof)",
        "Jenkins' main job is <b>testing &amp; shipping</b> — steps 3, 4 and 6 are all checking the code works. "
        "It <i>does</i> run a database <b>migration</b>, but only inside step 6, to build a quick throwaway "
        "database so the tests have something to check against. Migrations themselves are owned by a tool "
        "called <b>Phinx</b> — Jenkins just presses the button during testing.",
    )
    callout(
        "say",
        "The safe, accurate line to present",
        "“Jenkins automates our quality pipeline — every change gets <b>linted, tested, built into a Docker "
        "image, and smoke-tested</b> before it can ship.”",
    )
    callout(
        "grade",
        "If the marker pushes on migrations",
        "Answer: “Phinx owns the migrations; Jenkins <i>runs</i> one during the integration test only, to "
        "spin up a temporary database to test against.” That's precise and correct.",
    )


def ch_cheatsheet():
    kicker("Finale · bring it home")
    st.markdown("# The 60-second story")
    st.write("If you remember nothing else, say this — start to finish, in plain English:")

    callout(
        "say",
        "Your closing pitch",
        "“Maison Cafu is a smart restaurant website — a React <b>frontend</b>, a PHP <b>backend</b>, and a "
        "MySQL <b>database</b>. It's built on the five fundamentals of software construction: it "
        "<b>minimizes complexity</b> with one shared helper for every request, <b>anticipates change</b> "
        "with reversible database migrations and plug-in settings, is <b>built for verification</b> with "
        "swappable test databases, leans on <b>reuse</b> through design tokens and a shared API helper, and "
        "follows <b>standards</b> like PSR-12 and strict types. Behind it, <b>Git</b> tracks every change, "
        "<b>GitHub</b> is the shared home, <b>Docker</b> containerizes it so it runs anywhere, and "
        "<b>Jenkins</b> automatically tests and builds it on every change.”",
    )

    st.markdown("---")
    st.markdown("##### Likely questions — and short, safe answers")

    card("“Why PHP and not something newer?”",
         "It's a proven, widely-taught language for server code, and it pairs cleanly with MySQL. The point "
         "of the project is good <i>construction</i>, which is language-agnostic.")
    card("“What does Docker actually give you?”",
         "Portability. The same sealed box runs identically on my laptop and on a cloud server — no "
         "“works on my machine” problems.")
    card("“Is Jenkins for migrations?”",
         "No — Jenkins is for automated testing and shipping. It runs a migration only to build a "
         "temporary test database. Phinx owns migrations.")
    card("“Where's the proof it works?”",
         "The pipeline runs unit tests and a live smoke test that calls /api/menu on a real running copy "
         "of the site, on every change.")

    st.markdown("---")
    st.markdown("##### Your one-line map of the five fundamentals")
    pills([
        "Complexity → one shared helper",
        "Change → migrations + settings",
        "Verification → swappable test DB",
        "Reuse → design tokens + api",
        "Standards → PSR-12 + strict types",
    ])

    callout(
        "grade",
        "Final tip for delivery",
        "Go in order, use the restaurant pictures, and land each fundamental with its one real example. "
        "You're not memorising code — you're telling a clear story you fully understand. You've got this.",
    )

    st.markdown("---")
    st.markdown("##### Go deeper")
    st.write("The full written report covers every point above in detail.")
    report_download()


# ──────────────────────────────────────────────────────────────────────────────
#  Navigation
# ──────────────────────────────────────────────────────────────────────────────
CHAPTERS = [
    ("Welcome — read me first", ch_welcome),
    ("1 · What is Maison Cafu?", ch_what),
    ("2 · The three moving parts", ch_parts),
    ("3 · What is Software Construction?", ch_construction_intro),
    ("4 · Minimizing Complexity", ch_complexity),
    ("5 · Anticipating Change", ch_change),
    ("6 · Constructing for Verification", ch_verification),
    ("7 · Reuse", ch_reuse),
    ("8 · Standards", ch_standards),
    ("9 · The DevOps toolchain", ch_devops_intro),
    ("10 · Git", ch_git),
    ("11 · GitHub", ch_github),
    ("12 · Docker", ch_docker),
    ("13 · Jenkins", ch_jenkins),
    ("14 · The 60-second story", ch_cheatsheet),
]

st.session_state.setdefault("ch", 0)

with st.sidebar:
    st.markdown("## Maison Cafu")
    st.caption("A guided, plain-English deep dive")
    st.markdown("")

    choice = st.radio(
        "Chapters",
        options=list(range(len(CHAPTERS))),
        format_func=lambda i: CHAPTERS[i][0],
        index=st.session_state.ch,
        label_visibility="collapsed",
    )
    if choice != st.session_state.ch:
        st.session_state.ch = choice
        st.rerun()

    st.markdown("---")
    done = st.session_state.ch + 1
    st.progress(done / len(CHAPTERS))
    st.caption(f"Chapter {done} of {len(CHAPTERS)}")

# render current chapter
current = st.session_state.ch
st.markdown(f'<span class="bignum">{current + 1:02d} / {len(CHAPTERS):02d}</span>',
            unsafe_allow_html=True)
CHAPTERS[current][1]()

# prev / next footer
st.markdown("---")
col_prev, col_spacer, col_next = st.columns([1, 2, 1])
with col_prev:
    if current > 0 and st.button("← Previous", use_container_width=True):
        st.session_state.ch = current - 1
        st.rerun()
with col_next:
    if current < len(CHAPTERS) - 1 and st.button("Next →", use_container_width=True):
        st.session_state.ch = current + 1
        st.rerun()

st.markdown(
    '<p style="text-align:center;color:#6b6358;font-size:0.8rem;margin-top:1.5rem;">'
    'Maison Cafu · CEC418 Software Construction · a guided tour</p>',
    unsafe_allow_html=True,
)

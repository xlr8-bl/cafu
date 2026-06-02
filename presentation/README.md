# Maison Cafu — The Guided Tour

A progressive, plain-English deep dive into the Maison Cafu / SRWA project: what it is,
how it's built, how it satisfies the **five fundamentals of Software Construction**
(SWEBOK), and the **DevOps toolchain** behind it (Git, GitHub, Docker, Jenkins).

Built with [Streamlit](https://streamlit.io). Designed to be **clicked through live** as a
presentation, one chapter at a time.

---

## Run it on your laptop

```powershell
# from the repo root
streamlit run presentation/app.py
```

It opens at <http://localhost:8501>. Use the **sidebar** (or the Previous / Next buttons)
to move through the 15 chapters in order.

> If `streamlit` isn't found, install it first:
> ```powershell
> pip install streamlit==1.40.1
> ```

---

## Deploy a public link (free, no credit card)

Streamlit Community Cloud hosts public Streamlit apps for free, straight from GitHub.

1. Go to <https://share.streamlit.io> and sign in with your **GitHub** account.
2. Click **Create app** → **Deploy a public app from GitHub**.
3. Fill in:
   - **Repository:** `xlr8-bl/cafu`
   - **Branch:** `main`
   - **Main file path:** `presentation/app.py`
4. Click **Deploy**. First build takes ~1–2 minutes.

You'll get a shareable URL like `https://maison-cafu.streamlit.app` to put on your slides.

Streamlit Cloud reads `presentation/requirements.txt` for dependencies and
`presentation/.streamlit/config.toml` for the dark Maison Cafu theme — both are already here.

---

## What's inside

| File | Purpose |
|------|---------|
| `app.py` | The whole guided tour — 15 progressive chapters |
| `requirements.txt` | Single dependency: `streamlit` |
| `.streamlit/config.toml` | Maison Cafu dark theme (terracotta on warm charcoal) |

## The 15 chapters

1. Welcome — read me first
2. What is Maison Cafu?
3. The three moving parts (frontend / backend / database)
4. What is Software Construction?
5. Minimizing Complexity
6. Anticipating Change
7. Constructing for Verification
8. Reuse
9. Standards
10. The DevOps toolchain
11. Git · 12. GitHub · 13. Docker · 14. Jenkins
15. The 60-second story + Q&A cheat sheet

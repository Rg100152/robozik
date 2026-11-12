# ROBOZIK

A robotic-themed, single-page marketing site for a fictional advanced robotics
and automation lab. Built with plain HTML, CSS and vanilla JavaScript — no build
step, no dependencies.

## Run it

Open `index.html` directly in a browser:

```bash
xdg-open index.html
```

Or serve the folder locally (recommended so the Google Fonts and images load
consistently):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's inside

- **Hero** — animated SVG humanoid, canvas particle network, HUD readouts,
  parallax, and a three-line headline reveal.
- **About** — image collage, capability checklist, animated counters.
- **Services** — six cards with cursor-tracked spotlights.
- **Robot lineup** — three product cards with 3D tilt on hover.
- **Process** — four-step timeline from brief to fleet deployment.
- **Testimonials** — auto-playing slider with manual controls.
- **Contact** — validated form with toast confirmation.
- **Field reel** — modal gallery that auto-plays all nine supplied photos.
- **Extras** — preloader boot sequence, custom cursor, mobile menu, scroll
  progress bar, scrollspy, back-to-top, reduced-motion support.

## Files

```
index.html          page markup, SVG icon sprite, SEO/meta tags
css/style.css       design tokens, reset, nav, preloader, shared animation
css/hero.css        hero layout, robot SVG animation, HUD, ticker
css/sections.css    about, services, robots, process
css/pages.css       testimonials, contact, footer, modal, responsive rules
js/main.js          all interactions and animation logic
thinkin_bot_*.jpg   nine supplied robot photos (collage + field reel)
```

## Customize

- **Brand colors** — edit the custom properties at the top of `css/style.css`
  (`--cyan`, `--violet`, `--bg`, etc.).
- **Fonts** — swap the Google Fonts link in `index.html`; update
  `--font-display`, `--font-body`, `--font-mono` in `css/style.css`.
- **Copy and sections** — all content lives in `index.html`, grouped with
  comments such as `<!-- ===== SERVICES ===== -->`.
- **Gallery images** — the About collage is in `index.html`; the reel list is
  the `reelFrames` array near the top of the reel section in `js/main.js`.
- **Contact form** — currently simulates submission and shows a toast. Point it
  at a real endpoint by replacing the `submit` handler in `initForms()`.

## Accessibility & performance notes

- Keyboard focus styles, skip link, labelled form fields and ARIA states on the
  mobile menu and modal.
- `prefers-reduced-motion` disables the preloader, parallax, tilt, cursor and
  auto-advancing slides.
- All animations are CSS/SVG/canvas only; the page works without external JS
  libraries. Fonts degrade to system fallbacks.

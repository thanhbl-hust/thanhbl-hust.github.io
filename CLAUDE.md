# thanhbl-hust.github.io

Personal site of Lam Thanh Bui (DevOps Engineer), served by GitHub Pages at https://thanhbl-hust.github.io/.
On the first visit in a tab's session (only then), a full-screen intro plays (`kubectl rollout restart` → pods replaced one by one → zoom into the page); then the main page shows: the whoami block, then a fake `kubectl get namespace` whose `my-cv` / `my-blogs` rows link to the CV page and the blog. Every page has a top bar (contact icons + theme switch, top-right) and, except on the home page, a bottom nav (Resume / Blogs).

Language: everything in English, except blog posts, which are written in Vietnamese (`lang="vi"` on the post title/body).

## Layout

```
site/                           # static pages + assets, copied as-is into _site/
  index.html                    # main page: whoami block + `kubectl get namespace` block (finished state); inline pre-paint script (see "Intro gating")
  cv/index.html                 # CV, hand-written HTML: craftaholic.sh-style timeline (Experience, Education) + Skills; placeholder text the owner fills in
  favicon.svg / favicon.ico / apple-touch-icon.png  # site icon: the pod cube from the intro, in blue (owner's pick); see "Favicon"
  assets/css/main.css           # colour tokens on :root (light/dark) + page, top bar, bottom nav, CV, blog, prose styles
  assets/css/rollout-intro.css  # everything inside the intro overlay (.ri-* classes)
  assets/js/theme.js            # light/dark: plain script in <head> of every page; wires the toggle switch
  assets/js/main.js             # entry: intro, then (after the page-in animation) NamespaceList.play()
  assets/js/namespaces.js       # NamespaceList: types `kubectl get namespace`, row menu (hover/focus/↑↓/Enter)
  assets/js/rollout-intro.js    # RolloutIntro + CONFIG (deployment, replicas, storageKey, timing)
  assets/js/deployment.js       # Deployment frame: pod cards, FLIP layout, kubectl rollout status line
  assets/js/terminal.js         # Terminal: prompt, char-by-char typing, enter() prints output
  assets/js/timeline.js         # Timeline: cancellable sleep(); cancel() freezes the running script
  assets/js/session.js          # shouldAnimate()/markSeen(): when the intro and the typing play
  assets/js/toc.js              # blog posts: highlights the TOC entry of the section being read
blog/YYYY-MM-DD-slug.md         # blog posts (Markdown + front matter, Vietnamese)
blog/images/<post-slug>/*       # images for posts, copied to /blogs/images/ (link them as /blogs/images/...)
templates/blog-index.html       # /blogs/ page; {{{posts}}} = list built by the script
templates/blog-post.html        # /blogs/<slug>/ page; {{title}} {{date}} {{minutes}} {{slug}} {{description}} {{{html}}}
templates/partials/*.html       # pasted in place of <!-- include:NAME --> in every built page (favicon in <head>, top-bar, site-nav)
scripts/build.mjs               # site/ + blog/ + templates/ -> _site/ (the only build step)
scripts/hljs-hcl.mjs            # HCL/Terraform grammar for highlight.js (aliases hcl, terraform, tf)
package.json / package-lock.json# dev dependencies only, pinned exact: marked, highlight.js
_site/                          # build output, git-ignored; this is what gets deployed
.github/workflows/deploy.yml    # push to main -> npm ci -> npm run build -> upload _site/ -> deploy to Pages
CLAUDE.md                       # this file (not deployed)
```

## Build & blog

- `npm run build` = what CI runs; `npm run build:drafts` also renders posts with `draft: true` (for local preview only — drafts are never deployed).
- A post is `blog/YYYY-MM-DD-slug.md` with front matter `title` (required), `date` (YYYY-MM-DD, else taken from the file name), `description`, optional `slug` (a-z0-9-), `draft: true|false`. URL: `/blogs/<slug>/`. The build fails loudly on a missing title, bad date or bad slug.
- `blog/2026-11-19-huong-dan-viet-blog.md` is the owner's Markdown cheat sheet (Vietnamese, `draft: true`, so preview-only): new post, front matter, text styles, lists, code blocks, quotes, tables, images, `<details>`. Keep it in sync if the blog conventions change.
- Images: files in `blog/images/` (one sub-folder per post) are copied to `_site/blogs/images/` on every build — drafts' images too, so they are public even when the post isn't. Posts reference them with absolute paths `/blogs/images/...`.
- Everything, post bodies included, is JetBrains Mono (owner's request after a sans-serif prose try). `main.css` forces `code, kbd, pre, samp` to `var(--mono)` and form controls to `font: inherit`, because browsers otherwise use their own monospace (Consolas…) / Arial there.
- Fenced code blocks are highlighted at build time: the `code` renderer in `build.mjs` runs highlight.js (all its languages + our `hljs-hcl.mjs`) and wraps the block as `<div class="code-block"><span class="code-lang">LANG</span><pre><code class="hljs …">`. Unknown/missing language → plain text (label still shown if a name was given). Colours are the `--hl-*` tokens (light + dark) mapped to `.hljs-*` classes in `main.css`; no highlight.js CSS theme is loaded. Inline code isn't highlighted. The guide post lists the language names to use. Ligatures are off in `code/pre/kbd` so `==`, `->` show as typed.
- Blog-only inline syntax (marked extensions in `build.mjs`, documented in the guide): `:red[text]` with red/orange/yellow/green/blue/purple/gray → `<span class="tc-COLOR">`, and `==text==` → `<mark>`. Colours are `--tc-*` tokens (light + dark; green/blue/gray reuse `--green`/`--blue`/`--muted`). Inside `[...]` no `]`; doesn't apply inside code.
- Templates: `{{key}}` is HTML-escaped, `{{{key}}}` is raw. Pages under `blogs/` use `../` or `../../` for assets.
- Top bar: `templates/partials/top-bar.html`, included right after `<body>` with `<!-- include:top-bar -->`. Icon-only contact links (GitHub, LinkedIn, email — taken from the owner's CV; never add their phone number) followed by the theme switch, top-right. Fixed: it stays put while the page scrolls (owner's request). The icons sit in an opaque pill as tall as the switch.
- Bottom nav: `templates/partials/site-nav.html` (Resume → `/cv/`, Blogs → `/blogs/`; root-absolute links), included before `</body>` with `<!-- include:site-nav -->` on every page except the home page (its kubectl menu already links to both — owner's request; the home `body` drops the bottom padding kept for it). It's an opaque pill floating at the bottom centre; `.site-dock` only centres it (`pointer-events: none`, the pill re-enables them). Fixed UI convention (owner's requests, in order): no translucent blocks (text showed through) → no visible strip behind the blocks → no text under the blocks either. So the blocks are separate and opaque, and `.site-dock::before` is a 120px soft fade (page colour, `var(--bg)` as `background-color` + a gradient `mask-image`, so it cross-fades with the page on a theme switch; solid for the bottom 66px): text fades out just above the pill and the TOC button and is never under them. No hard edge — the owner rejected a solid strip with a short fade. The top bar has no fade (yet): text still scrolls under its pills. `body` has 128px bottom padding so the end of a page clears the fade. `build.mjs` (`markCurrent`) adds `aria-current` to the link of the page's own section ("page" on /cv/ and /blogs/, "true" on posts) plus a `<span class="nav-indicator">` inside it: the highlight is that element (not the link's background) so page transitions can slide it.
- Favicon: `templates/partials/favicon.html` (`<!-- include:favicon -->` in every page's `<head>`): `/favicon.ico` (`sizes="32x32"`, so Chrome prefers the SVG) + `/favicon.svg` + `/apple-touch-icon.png`. `favicon.svg` is the source — the pod cube from the intro, recoloured blue (owner's request; faces #54aeff / #218bff / #0969da = site `--blue`), transparent. `favicon.ico` (16/32/48 PNGs inside) and `apple-touch-icon.png` (180px, cube at 66% on the light `--bg` #f6f8fa: iOS fills transparency with black) are renders of it; regenerate both if the SVG changes.
- Table of contents: the `heading` renderer in `build.mjs` gives every heading an ASCII id (`slugify`: Vietnamese diacritics stripped, đ→d, de-duplicated with -2, -3…), and `renderToc()` builds `{{{toc}}}` from the post's `##`/`###` (only when there are ≥ 2 `##`). Layout: from 1340px a sticky column right of the article — absolutely positioned inside `.post-body` (title down, see `blog-post.html`), so it starts level with the h1 (owner noticed it sat higher, level with `← cd ..`) and the article stays centred; it sticks at 72px, below the fixed top bar. Narrower, it's a drawer (owner's request, replacing a box above the article): a "Contents" button (icon-only under 600px) floats at the bottom right, level with and as tall as the Resume/Blogs pill; pressing it slides the TOC in from the right over a dimmed + blurred backdrop (`--scrim` token). `assets/js/toc.js` (module, post pages only) marks the section being read with `.is-active` (▸ in a fixed gutter) and runs the drawer: `html.toc-open`, everything else `inert` while open (the siblings of the drawer and of each ancestor), focus to the active entry and back to the button; closes on the backdrop, ×, Esc, picking an entry, or widening past 1340px. Page scroll is locked while open by cancelling wheel / touchmove / scroll keys that wouldn't scroll the drawer itself — not `overflow: hidden`, which would drop the scrollbar and expose the kept gutter (see Conventions) as an undimmed strip that fixed elements can't paint over; `html.toc-open` sets `scrollbar-gutter: auto` for pages too short to have a scrollbar. The slide stays on under reduced motion (visitor-initiated). `renderToc()` emits the button, backdrop and nav together. Headings have `scroll-margin-top`; smooth scrolling only without reduced motion.

## CV

- Top (owner's request): the name as the `h1`, then `.cv-meta` (position · year of birth, just the number — owner dropped the "Born" label), then a `.lead` intro paragraph. Name and position are the ones already public on the home page; the birth year and the intro are placeholders the owner fills in.
- Layout follows craftaholic.sh's `/work/`: per entry date · place, "Company — Project", role, one-line description, a `Key:` highlight and tag pills; then Education (same timeline) and Skills (`<dl>` of tag groups).
- The content is **placeholder text on purpose** ("Company — Project", "Tool", "Skill"…): the owner fills it in by hand. HTML comments in the file say which block to copy for a new entry. Don't fill it from their CV unless asked; never publish their phone number.

## The intro (RolloutIntro)

- Tunables live in `CONFIG` at the top of `rollout-intro.js`: deployment name, replica count, every delay in ms (total ≈ 6 s — the owner's target after trying 7.5 s and 10.5 s versions).
- `play()` is the whole script, top to bottom: type command → `enter()` → `showDeployment()` (terminal FLIPs up, frame fades in) → per replica: new pod `pending → creating → running`, then one old pod `terminating` → removed → `finish()`.
- Kubernetes behaviour is deliberately realistic (audience = DevOps people):
  - RollingUpdate, maxSurge 1 / maxUnavailable 0: an old pod is terminated only after its replacement is Ready.
  - Up to `replicas + 2` cards are visible at once (surge pod + an old pod still Terminating). Layout must fit that: 5 × 160px cards in one row; below 920px the pods become a vertical list with fixed height (`--slots`).
  - Pod names `<deployment>-<pod-template-hash>-<5 chars>` are random per load, using Kubernetes' alphabet `bcdfghjklmnpqrstvwxz2456789`; both hashes are 9 chars and differ. Pods of one ReplicaSet share the prefix, so the owner read them as "the same name": the card shows the prefix small/muted and the 5-char suffix big/bold, and `uniqueId()` guarantees no suffix repeats.
  - The status line uses the same checks, in the same order, as `kubectl rollout status` (terminating pods don't count). With this strategy it shows "N out of 3 new replicas have been updated..." → "1 old replicas are pending termination..." → "successfully rolled out"; the "N of 3 updated replicas are available..." branch exists but isn't reached.
- Pod card look is driven only by `data-phase` on `.ri-pod` (`pending | creating | running | terminating`); `--c` = status colour, `--a` = cube fill strength. `is-new` = enter animation, `is-pulse` = one-off ring when it becomes Ready.
- `finish(skipped)`: cancels the timeline, calls `onComplete` (the page starts its `page-in` animation underneath), then fades the overlay — zooming into the middle new pod when not skipped. Skip = the Skip button or any key.

## Main page: `kubectl get namespace` (NamespaceList)

- `index.html` contains the finished block: command, table (header + two `<a class="kube-row">`), next prompt. Column alignment is literal spaces under `white-space: pre`, kubectl-style (NAME 11 ch, STATUS 9 ch); keep them when editing rows. The `▸` marker sits in a fixed 2ch gutter so columns never shift.
- Animates (types ~50 ms/char, 300 ms pause, then shows the table) under the same rules as the intro (`session.js`, key `kubectl-ns:seen`), also with reduced motion (typing isn't movement). While typing, `.kube.is-typing` hides the table with `visibility` (space kept, so the centred page doesn't jump).
- Starts after the `.page` entrance animation finishes (`page.getAnimations()` in `main.js`).
- Menu: hover/focus selects a row (`.is-selected` = light highlight + `▸`); roving tabindex; ↑/↓ and Enter are handled on `document` only when focus is on the body or a row, so other controls keep their keys. `my-cv` is selected by default. AGE fits even at 320 px, so it isn't dropped on mobile.

## Intro gating

- `session.js` → `shouldAnimate(key)`: plays **only on the first view in a tab's session** (`sessionStorage['rollout-intro:seen']`, every access in try/catch) — not on reload, not when coming back from cv/ or blogs/. The owner went once-per-session → every reload → back to first view only (final); don't add reload replays again.
- `?intro` forces both animations; `main.js` then removes it from the URL (`history.replaceState`) so Back / reload doesn't force them again (the owner hit exactly that with preview links that had `?intro`).
- Plays with `prefers-reduced-motion: reduce` too (owner's request — their Windows has animation effects off and the intro was invisible to them), but toned down: no FLIP slides (terminal move-up, card reflow), stage/cards fade instead of rise/pop, and the exit is a fade instead of the zoom. Keep it that way.
- The inline script in `index.html` repeats this check (session key, `?intro`) before first paint and sets `html.intro-pending`, which covers the page until `mount()` removes it (CSS failsafe hides the cover after 4 s). If you change the storage key or the rules, change both places.

## Conventions

- No framework and no runtime dependencies: plain HTML/CSS + native ES modules + Web Animations API. The only build step is `scripts/build.mjs` (Markdown posts, syntax highlighting, partials), with `marked` and `highlight.js` as its only (dev) dependencies — nothing is shipped to the browser. Keep it that way unless asked.
- Font: JetBrains Mono from Google Fonts (chosen to match craftaholic.sh). Minimal, Lens/k9s-like status colours.
- Light theme by default (owner asked for a light background — "phông nền sáng"; "font" in their messages can mean phông = background), plus a dark mode toggle.
  - `theme.js` (plain script, first thing in `<head>`, so no flash) sets `<html data-theme="light|dark">` from `localStorage['theme']` and on DOMContentLoaded wires up the switch from the top-bar partial. Every page must include both.
  - Tokens: `:root` / `:root[data-theme="dark"]` in `main.css`; intro status colours and cube shading (`--ri-shade-*`) on `.ri` / `[data-theme="dark"] .ri` in `rollout-intro.css`. Any new colour must be a token with both values.
  - Switching must animate, not jump (owner asked): the knob slides (`transform`). Where `document.startViewTransition` exists, `theme.js` swaps `data-theme` inside a same-document view transition with `html.theme-vt` (0.2s, `main.css`): the whole page cross-fades as one picture, so every letter, surface and the bottom fade change in step, and the knob's slide plays live in the new picture. Fallback: `html.theme-anim` (450 ms) cross-fades every colour in 0.15s — text and surfaces at the same speed. History: surfaces at 0.4s with text at 0.15s made grey/coloured text sit on a background of its own shade mid-fade and look late; per-element transitions also let the masked bottom fade (composited) run ahead of the page and stutter on long posts — the owner saw "letters not changing right away" twice. The knob's own transitions are kept by more specific `!important` rules.
- Reduced motion means "no big movement", not "no animation": the intro and the kubectl typing still play (toned down, see "Intro gating"), the page entrance scale is skipped, the theme toggle's slide/fade stays on (small, visitor-initiated). The owner's own Windows has "Animation effects" off, so their browsers — and headless Edge on that machine — report `prefers-reduced-motion: reduce`; that path is what they actually see.
- Content is centred: `.page` is as wide as its content — 720px on CV/blog/posts, 520px on the home page (`.page.home`, = the `.kube` block) — so left and right margins are equal (the owner noticed the CV leaning to one side when the column was 880px).
- `html { scrollbar-gutter: stable }`: the scrollbar's space is kept on short pages too, so going between a long page (CV) and a short one (/blogs/) doesn't shift everything by half a scrollbar (owner noticed). The kept space shows the page colour (the intro overlay is `var(--bg)` too). Fixed elements can't paint over it — keep anything that dims the page from removing the scrollbar.
- Page transitions: `@view-transition { navigation: auto }` cross-fades same-origin navigations (Chromium, Safari 18.2+; others navigate normally). `.top-bar` and `.site-nav` have their own `view-transition-name` so they stay put; `.nav-indicator` slides to the new section with the theme knob's easing (owner asked for movement "like the theme"). Kept under reduced motion (visitor-initiated). `view-transition-name`s must stay unique per page.
- Must work at 390px wide: 16px side gutter, no horizontal page scroll. `body` is a grid with `grid-template-columns: minmax(0, 1fr)` so fixed-width content (the 520px `.kube` block) can shrink with `max-width: 100%` instead of widening the page — keep it.

## Preview & verify

Build, then serve `_site/` (ES modules don't load from `file://`, and `site/` alone lacks the blog pages and the shared top bar / bottom nav):

```
npm ci                                  # once
npm run build:drafts                    # rebuild after every change
python -m http.server 8000 -d _site     # http://localhost:8000/?intro
```

Show the owner a local preview before pushing visual changes.

Headless screenshots: `--virtual-time-budget` jumps to the end of the intro, and headless windows won't go below ~500px wide. For real mid-animation frames, drive Edge/Chrome over CDP (`--remote-debugging-port`, `Emulation.setDeviceMetricsOverride` for a true 390px viewport, `Page.captureScreenshot` at real times). Pass `--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows` and run one browser at a time, or the timers drift by seconds.

## Deploy

- Pushing to `main` runs "Deploy to GitHub Pages" (Pages source = GitHub Actions, already enabled): `npm ci` → `npm run build` (no drafts) → deploy `_site/`. Also `workflow_dispatch`.
- Commit and push as GitHub user `thanhbl-hust`, author `Lam Thanh Bui <117031677+thanhbl-hust@users.noreply.github.com>` (set in the repo's local git config).
- If `deploy-pages` fails with `No artifacts named "github-pages"` right after a successful upload, it's a transient GitHub issue: re-run the job.

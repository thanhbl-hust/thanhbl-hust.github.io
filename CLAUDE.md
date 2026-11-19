# thanhbl-hust.github.io

Personal site of Lam Thanh Bui (DevOps Engineer), served by GitHub Pages at https://thanhbl-hust.github.io/.
On first visit in a browser session a full-screen intro plays (`kubectl rollout restart` → pods replaced one by one → zoom into the page); then the main page shows: the whoami block, then a fake `kubectl get namespace` whose `my-cv` / `my-blogs` rows link to the CV and blogs pages (both still empty placeholders).

## Layout

```
site/                           # the published site — the ONLY folder that gets deployed
  index.html                    # main page: whoami block + `kubectl get namespace` block (finished state); inline pre-paint script (see "Intro gating")
  cv/index.html                 # CV page (placeholder, no intro, links back with "← cd ..")
  blogs/index.html              # blogs page (placeholder, same layout)
  assets/css/main.css           # colour tokens on :root (light theme) + main page / sub page styles
  assets/css/rollout-intro.css  # everything inside the intro overlay (.ri-* classes)
  assets/js/theme.js            # light/dark: plain script in <head> of every page; adds the toggle switch
  assets/js/main.js             # entry: intro, then (after the page-in animation) NamespaceList.play()
  assets/js/namespaces.js       # NamespaceList: types `kubectl get namespace`, row menu (hover/focus/↑↓/Enter)
  assets/js/rollout-intro.js    # RolloutIntro + CONFIG (deployment, replicas, storageKey, timing)
  assets/js/deployment.js       # Deployment frame: pod cards, FLIP layout, kubectl rollout status line
  assets/js/terminal.js         # Terminal: prompt, char-by-char typing, enter() prints output
  assets/js/timeline.js         # Timeline: cancellable sleep(); cancel() freezes the running script
.github/workflows/deploy.yml    # push to main -> upload site/ -> deploy to Pages
CLAUDE.md                       # this file (not deployed)
```

## The intro (RolloutIntro)

- Tunables live in `CONFIG` at the top of `rollout-intro.js`: deployment name, replica count, every delay in ms (total ≈ 10.5 s; the owner asked for a slower rollout than the first ≈ 7.5 s version).
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
- Animates (types ~50 ms/char, 300 ms pause, then shows the table) only on the first view per session (`sessionStorage['kubectl-ns:seen']`), not with reduced motion; `?intro` forces it. While typing, `.kube.is-typing` hides the table with `visibility` (space kept, so the centred page doesn't jump).
- Starts after the `.page` entrance animation finishes (`page.getAnimations()` in `main.js`).
- Menu: hover/focus selects a row (`.is-selected` = light highlight + `▸`); roving tabindex; ↑/↓ and Enter are handled on `document` only when focus is on the body or a row, so other controls keep their keys. `my-cv` is selected by default. AGE fits even at 320 px, so it isn't dropped on mobile.

## Intro gating

- Plays once per session: `sessionStorage['rollout-intro:seen']`, every access in try/catch.
- Never plays with `prefers-reduced-motion: reduce`.
- `?intro` in the URL forces it (for testing). A new tab is a new session, so it plays there too.
- The inline script in `index.html` repeats this check before first paint and sets `html.intro-pending`, which covers the page until `mount()` removes it (CSS failsafe hides the cover after 4 s). If you change the storage key or the rules, change both places.

## Conventions

- No build step, no dependencies, no framework: plain HTML/CSS + native ES modules + Web Animations API. Keep it that way unless asked.
- Font: JetBrains Mono from Google Fonts (chosen to match craftaholic.sh). Minimal, Lens/k9s-like status colours.
- Light theme by default (owner asked for a light background — "phông nền sáng"; "font" in their messages can mean phông = background), plus a dark mode toggle.
  - `theme.js` (plain script, first thing in `<head>`, so no flash) sets `<html data-theme="light|dark">` from `localStorage['theme']` and injects the fixed top-right switch on DOMContentLoaded. Every page must include it.
  - Tokens: `:root` / `:root[data-theme="dark"]` in `main.css`; intro status colours and cube shading (`--ri-shade-*`) on `.ri` / `[data-theme="dark"] .ri` in `rollout-intro.css`. Any new colour must be a token with both values.
  - Switching must animate, not jump (owner asked): the knob slides (`transform`), and `html.theme-anim` (set for 450 ms) cross-fades all colours. The knob's own transitions are kept by more specific `!important` rules.
- Reduced motion: the intro and page entrance are skipped, but the theme toggle's slide/fade stays on (small, visitor-initiated). Note the owner's own Windows has "Animation effects" off, so their browsers report `prefers-reduced-motion: reduce` — they only see the intro with `?intro`, and headless Edge on that machine reports it too.
- Must work at 390px wide: 16px side gutter, no horizontal page scroll.

## Preview & verify

ES modules don't load from `file://`, so serve the folder:

```
python -m http.server 8000 -d site     # http://localhost:8000/?intro
```

Show the owner a local preview before pushing visual changes.

Headless screenshots: `--virtual-time-budget` jumps to the end of the intro, and headless windows won't go below ~500px wide. For real mid-animation frames, drive Edge/Chrome over CDP (`--remote-debugging-port`, `Emulation.setDeviceMetricsOverride` for a true 390px viewport, `Page.captureScreenshot` at real times). Pass `--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows` and run one browser at a time, or the timers drift by seconds.

## Deploy

- Pushing to `main` runs "Deploy to GitHub Pages" (Pages source = GitHub Actions, already enabled); also `workflow_dispatch`.
- Commit and push as GitHub user `thanhbl-hust`, author `Lam Thanh Bui <117031677+thanhbl-hust@users.noreply.github.com>` (set in the repo's local git config).
- If `deploy-pages` fails with `No artifacts named "github-pages"` right after a successful upload, it's a transient GitHub issue: re-run the job.

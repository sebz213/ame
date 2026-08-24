# Decision status — D-1..D-48 and the Ame-relevant R- entries

Status: **complete for the D- series (48 of 48). R- series triaged by scope; the
Ame-relevant entries are classified, the rest are named and scoped out.**
Date: 2026-08-24
Tree: `ame-hygiene-plan`, gate green at `2026-08-24`
Owner: Sebastien Chery

Executes item 4 of the critical path in `AME-EXTRACTION-PREFLIGHT-2026-08-24.md`,
which rewrote work order 0.3 as **0.3′** after finding that its stated target —
"decisions D-50 through D-58" — has never existed. The real series are D-1..D-48
in `tokens/decisions.md` and R-1..R-100 in `DECISIONS.md`.

**This file annotates; it does not rewrite.** Every entry stays as written, wrong
headings included (STANDARD.md C8: a dated record is the defence against having
your work absorbed, and a record edited after the fact defends nothing). What
changed since an entry was written is recorded here, once, with the command that
established it.

**Three statuses.** *current* — describes the code today. *superseded by X* — a
later decision or change replaced it; X is named. *historical* — describes work
that was real, is finished, and no longer has a subject in the tree.

---

## Summary

| | D- series | Ame-relevant R- |
|---|---|---|
| current | 27 | 12 verified |
| superseded | 9 | 3 self-declared |
| historical | 12 | — |
| **total classified** | **48** | **15** |

**Nine D- entries describe a state the code has left.** None was marked. Every one
of them would have shipped in a public repo as a current description.

---

## D- series

### Current (27)

| Entry | Verified by |
|---|---|
| **D-1** The format is DTCG 2025.10, not Style Dictionary's dialect | `style-dictionary.config.json` absent. *Name corrected by D-48; the heading still reads DTOS and is left as written.* |
| **D-2** Type is mandatory, and it changed what several tokens are | no `ink-channels` token in the built set; `font.weight-synthesis.450` present, typed `number` |
| **D-3** Shadows are composites, their colour a pointer | `base/color.json` carries `"$ref": "#/color/ink/$value/components"`; `elevation.*` are `shadow` composites |
| **D-4** The glass foreground pair became tokens | all four exist: `surface.glass-fg-{on-light,on-dark,muted-on-light,muted-on-dark}` |
| **D-6** anime.js eases are named here, not tokenized | no `ease.js-*` in `base/motion.json` |
| **D-7** The type scale is not what the surface renders | still true, smaller: 12 off-scale at writing, **8 today** (S1 baseline 8). The decision not to widen the scale stands. |
| **D-8** Neue Haas ships eight static cuts, not two | `app/layout.tsx` registers exactly 100, 200, 300, 350, 400, 500, 700, 900 |
| **D-9** Drift is measured against a baseline, not forbidden | the live shape of S1–S5, D2, D3, U1, H1 |
| **D-10** Ame names the system, not yet the emitted names | boundary holds; already amended in place by D-46 |
| **D-11** The deliverable standard is copied | `tokens/deliverables.md` present |
| **D-13** vercel.json is deleted, and the v0 badge goes with it | both `vercel.json` and `.v0/` absent |
| **D-14** The feed prototype gets a Suspense boundary | `Suspense` present in `app/prototypes/feed/page.tsx` |
| **D-15** G1's pattern is tighter than STANDARD.md C5's grep | `shipped.pattern` is `\[\[[A-Za-z_][A-Za-z0-9_]*\]\]` |
| **D-16** X1 makes "the run that earned it" checkable | `checkRecord` live in `check.mjs` |
| **D-17** Sixteen surface reads were repointed at semantic roles | U1 = 0 on every logged run since |
| **D-19** The DTCG value bounds moved out of the checker | `invariants.json > type_bounds`; Z2 now enforces that no threshold returns |
| **D-20** dipstick suppresses the log line its own check would write | `--no-log` live, passed by `dipstick.mjs` |
| **D-21** The dipstick filename, and what c5 does not measure | naming scheme live in `tokens/dipstick/` |
| **D-23** The glass border doubled, on request | `color.ink-alpha.12` = `rgb(16 19 25 / 0.12)`, `color.white-alpha.20` = `rgb(255 255 255 / 0.2)` |
| **D-24** The edge is a variable, and two surfaces were rebound | `elevation.glass-edge`, `elevation.glass-drop`, `color.paper-alpha.88`, `color.modal-dark` all present |
| **D-26** The grain is four numbers, and the SVG is derived | `build.mjs` emits `--port-dither-noise` from the tokens |
| **D-27** Every surface above the page overlay carries its own grain | `portfolio.css` reads `--port-dither-noise` at two selectors |
| **D-28** What "all our gradients" turned out to mean | all 6 `gradient` hits in `portfolio.css` are still inside the dither comment block |
| **D-39** The dismiss is 800ms | `component.splash.fade` = `800ms` = `{duration.long}` |
| **D-40** The 15px jump when the splash leaves | `scrollbar-gutter` present in `app/globals.css` |
| **D-42** *(no title — see defect below)* G1 counted emitted files and called them routes | `routeOf` live in `check.mjs`; the report gives routes and files |
| **D-45** The dark theme reaches the solid surfaces | `background.card-on-dark` = `#1a1e28` |
| **D-46** The viewer became the Ame Prototype Viewer | `components/prototype-viewer/` present, `components/iphone-viewer.tsx` gone |
| **D-48** The format is DTCG, and it never was DTOS | this pass |

### Superseded (9)

| Entry | Superseded by | What the code says now |
|---|---|---|
| **D-5** LOGO_GAP was 33 in the code and 32 in the token | an unrecorded later change | **The token is `12px` and `LOGO_GAP = 12`.** Parity P1c still holds them together, so the *mechanism* D-5 introduced works — but the value it argues from is gone. Its claim that "all four are now parity-checked" is also stale: `ITEM_W` and `ITEM_GAP` no longer exist in `site-header.tsx`; only P1c (LOGO_GAP) and P1d (NAV_OFFSET_FALLBACK) remain of the four. |
| **D-12** The lint script is deleted rather than completed | **R-23**, which says so in its own heading | `lint` is a real script; `eslint@^10.8.0` is a devDependency; 0 errors on the current tree |
| **D-18** Two curves deleted, thirty-five kept with a reason | later reductions | clientless baselined at 35 → **H1 = 16 today** |
| **D-25** D2, the check for a restated value | later cleanup | baselined at 24 → **D2 = 0 today**. The clause and its stated limit (D2 skips any value containing `var()`) are current; only the number moved. |
| **D-29** The splash reveal: the mark becomes a hole and opens | **D-32**, then removed entirely by **D-38** | feature gone |
| **D-33** The mask is vector, because a raster mask blurs at 46x | **D-36**, which says "Correcting D-33" in its heading | diagnosis was wrong; feature since removed |
| **D-38** The mask reveal is removed; the exit is a quick fade | **D-39** | the removal is current (`mark-mask.svg` absent, `port-splash-reveal` absent); the fade is **800ms, not the 200ms D-38 argues for** |
| **D-41** Exploded sheets hide much earlier than the flat screen | **D-46**'s viewer rewrite | **`STACK_HIDE_DOT_EXPLODED` does not exist anywhere in the tree.** The mechanism is now `EXPLODE_WITHIN = 1.35` and `EXPLODE_OPACITY_FADE = 0.15` in `components/prototype-viewer/viewer-constants.ts`. D-41 names "the single value to move" if the sheets misbehave — that value is gone, and so is the subject of its "unverified visually" caveat. |
| **D-43** A dark counterpart for the top utility bar | an unrecorded later change | D-43 builds the chain base `color.surface-ink` → semantic `background.utility-on-dark` → component `topbar.bg-on-dark`. **`background.utility-on-dark` does not exist**, and `topbar.bg-on-dark` now resolves to `{background.ink}` = `#101319`, not `#1a1e28`. The token's own description now reads "ink itself, so it blends into the page" — the opposite of D-43's elevation argument. |
| **D-44** A dark theme, expressed as re-pointed aliases | later reductions | mechanism current; its closing numbers are not — "S2 34→33 and H1 32→29" against **S2 = 0, H1 = 16** today |

### Historical (12)

D-22 (numbering continues from D-10 — its effect is permanent and its subject is
the file itself), and the splash-reveal arc: **D-29, D-30, D-31, D-32, D-34,
D-35, D-36, D-37**. D-38 already says of these: *"D-29 through D-37 describe a
feature that no longer exists. They stay as the record of why it was built and
what it cost."* That is exactly right and is why they are kept. Verified gone:
`public/images/logo/mark-mask.svg`, `.port-splash-reveal`, `component.splash.scale`.

---

## Defects found while classifying

**D-42 has no title.** Every other entry states its decision on the heading line;
this one is bare `## D-42`. Its first bold line — "G1 counted emitted files and
called them routes" — is the title and should be on the heading. Not fixed here:
this file annotates, and moving the line is an edit to the record. Flagged for the
owner to make in a normal edit if wanted.

**Nine entries describe a state the code has left, and none was marked.** The
supersession that *was* marked (D-33 by D-36, D-29 by D-32, D-12 by R-23) was
marked because the author noticed at the time. The other six drifted silently —
D-5's value, D-43's whole chain, D-41's constant, and the three baseline numbers.
This is the failure mode C10 names: stale docs mislead agents, and an agent reading
D-43 today would look for a token that does not exist.

**The pattern is specific and worth naming.** Every silent supersession is a
*number or a name inside an entry whose argument is still sound*. D-5's mechanism
works; only 33 is wrong. D-43's reasoning about tone-portable chrome is fine; only
the chain moved. Nothing here needs re-deciding — it needs the values re-read. A
check could catch most of it: a decision entry that names a token path could be
verified to resolve, the same way W1 verifies that a CI step names a script that
exists. Not built; recorded as the obvious next clause.

---

## R- series

100 entries, scoped rather than exhaustively classified, because most govern the
portfolio or the `woven` research feature and will not travel with Ame.

### Ame-relevant, verified current (12)

**R-8** (seven files over 500 lines, each with a reason), **R-22** (N2, the synonym
check), **R-24** (contrast maths and ratchet as testable modules — `contrast.mjs`,
`ratchet.mjs` both live), **R-25** (the two token homes are two concepts — U4),
**R-26** (the uses-graph is checked — U2, U3, U4), **R-40** (K1, the asset budget
with a ratchet), **R-50** (the contract→invariants→check bijection — Z1, Z2, both
live and both re-passed today), **R-57** (the /ame brand registry — AM1, AM2, AM3),
**R-59** (foundations are a generated projection — `docgen:check` passes on 38
files), **R-69** (CI references checked against the tree — W1, which verified this
pass's own script rename), **R-71** (CV1, every rendered pair is a declared pair —
now also proven in the failing direction by `examples/violating`), **R-86** (patterns
are built, not typed — D3, ratcheted at 10).

### Self-declared supersessions (3)

**R-4** → **R-32** (no CITATION file → a CITATION.cff is adopted; `CITATION.cff` is
present). **R-23** supersedes **D-12**. **R-54** supersedes closeout 1. Each says so
in its own heading — the good case.

### Open, and the one that matters for packaging

**R-100 The fork resolves: two spacing authorities, cleanly partitioned,
undeclared** (2026-08-11). Verified still exactly true today:

```bash
sed -n '/@theme/,/^}/p' app/globals.css | grep -i spacing   # → nothing
grep -rl "var(--space-" app components lib hooks            # → 3 chrome files
grep -rhoE "\b(p|m|gap|space)[xytrbl]?-[0-9]+" components/portfolio | wc -l   # → 197
```

`app/globals.css`'s `@theme` block declares no spacing scale, so Tailwind runs its
own default and nothing connects it to the token values. `var(--space-*)` has
exactly three consumers repo-wide — `components/ame/{footer,nav,top-bar}.tsx`, the
shared chrome — against ~197 Tailwind spacing utilities in `components/portfolio`.

R-100 states the consequence plainly and leaves it open: *"which mechanism owns
layout spacing… is a constitutional question about what kind of design system Ame
is — a token contract that governs rendering, or a token contract that governs its
own chrome while the product spaces itself by utility. Both are coherent; they are
different systems. The decision is Sébastien's."*

**This is the single most important unresolved thing for the public README.** The
central claim — a gate that rejects raw values — sits next to a system where
spacing on the product surface is not token-bound at all. The claim is still true
as written (the gate does reject what it scans), but a reader who assumes it covers
spacing would be wrong. Until R-100 is decided, **Scope and limits (work order 3.4)
must say so**, in R-100's own terms:

> Spacing is governed in two places. The `space.*` tokens bind the shared chrome;
> the product surface spaces itself with Tailwind utilities that do not derive from
> the token source. Which of the two owns layout spacing is an open decision
> (R-100, 2026-08-11), not an oversight.

### Out of Ame scope

Portfolio and site decisions (R-2..R-7, R-9..R-21, R-27..R-34, R-39, R-41..R-49,
R-51..R-56, R-58, R-60..R-68, R-70, R-72, R-73) stay with the portfolio repo. The
`woven` research arc (R-74..R-85, R-87, R-92..R-100) is a separate feature with its
own contract and its own removability check; only R-100's finding above bears on
Ame, and it bears on it heavily.

---

## Also found: a publication risk that is not a decision

Not part of 0.3′, recorded here because this pass surfaced it and it affects
Phase 1.

**16 licensed Neue Haas Display TTFs, 1.7 MB, sit in `public/fonts/`.** Neue Haas
Display is a commercial typeface. The repo standard is explicit — R2: *"Licensed
font files do not enter a public repo unless their license permits it."* This is
also what **R-3** ("The remote stays private until the font licence is read")
recorded as the reason the repo is private in the first place, and that licence
question appears never to have been closed.

`public/` is not in the Ame extraction subset, so on the current plan the fonts do
not travel. But the plan is what keeps them out, not a check — and X2 now exists
precisely because plans that keep things out are the ones that fail silently.
**Before 1.1: confirm the split command excludes `public/`, and close R-3 either
way.** The font question blocks making anything public, not just Ame.

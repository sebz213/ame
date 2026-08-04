# Decisions

Reasoning. The conditions themselves are in `contract.md`; the numbers are in
`outcomes.md`. Nothing here is enforced, and nothing enforced is argued here.

## D-1 The format is DTOS 2025.10, not Style Dictionary's dialect

The files used `value` and `{path.value}`, which is Style Dictionary v3 syntax.
DTOS reserves `$value` and resolves `{group.token}` to the target's `$value`
implicitly. The old files were therefore not design-token files under the
standard they claimed; a conforming tool would have read every token as a plain
JSON object with no value and no type. The conversion is what makes the claim
true.

`style-dictionary.config.json` was removed with the conversion. SD's `{x.value}`
reference form does not resolve DTOS `{x}` references, so keeping the config
would have left a second build that produces different output from the same
files. One build.

## D-2 Type is now mandatory, and it changed what several tokens are

DTOS says a token whose type cannot be determined is invalid, and that a tool
must not guess the type from the value. Nothing in the old files carried a type,
so every token was invalid. Assigning types forced three reclassifications:

- **The weight-stroke set is not a font weight.** `font.weight.stroke-450` held
  `0.013em`, a `-webkit-text-stroke` width. Typing it `fontWeight` would have
  been a lie the format would accept (`0.013` is a legal weight number). It is
  `font.weight-synthesis.450`, typed `number`, and its description says what the
  value is. The name records the visual target; the value is a stroke width.
- **`color.ink-channels` was a string, not a colour.** `"16, 19, 25"` existed to
  compose `rgba(var(--color-ink-channels), a)`. DTOS colour objects carry
  `alpha` directly, so the workaround has no reason to exist. It is gone.
- **The anime.js eases are not cubic beziers.** `outElastic(1, 0.45)` is a
  function call in a JS animation library. Typing it `cubicBezier` is false and
  no other type fits. They are not tokens; the inventory is D-6 below.

## D-3 Shadows are composites, and their colour is a pointer

`elevation.*` held CSS box-shadow strings containing `rgba(16, 19, 25, …)`. The
README claimed `color.ink-channels` had removed that duplication; it had not, and
the literals sat in five recipes. Each shadow is now a DTOS `shadow` composite
whose colour is `{color.ink-alpha.NN}`, and each of those is a colour object
whose `components` is a JSON pointer to `color.ink`. Re-toning the brand
near-black now re-tones every ring, every drop shadow, and both pill fills from
one edit, which is what the original claim described.

The `color-mix(in oklab, ink 8%, transparent)` recipes became ink at alpha 0.08.
Mixing a colour with `transparent` contributes nothing to the premultiplied
result, so the two are the same paint; the token form is the one a non-CSS
consumer can read.

## D-4 The glass foreground pair became tokens

`--port-glass-fg` had 41 call sites and `--port-glass-fg-muted` 23, making them
the two most-read values on the surface, and neither was in the token system.
They were declared in `portfolio.css` as `var(--port-text-primary)` on light
backdrops and `#ffffff` / `rgba(255,255,255,0.78)` on dark. A contract that omits
its two most-used values does not constrain the surface.

The values are now four tokens, one per tone. The *switch* stays in CSS, because
which tone is live is a runtime state driven by `[data-backdrop]` and by a
registered `@property` cross-fade. The rule is: the values are decided in tokens,
the switching is done in CSS. Same split for the glass fill and the glass shadow.

## D-5 LOGO_GAP was 33 in the code and 32 in the token

`component.nav.logo-gap` was `2rem` with a description reading "LOGO_GAP=32".
`site-header.tsx` has `const LOGO_GAP = 33`. Two homes for one number, drifted by
a pixel, with the token describing a value the code had already left behind.

The token is now `33px`, because the shipped surface is the fact and the token
was the stale copy. Three sibling constants (`ITEM_W`, `ITEM_GAP`,
`NAV_OFFSET_FALLBACK`) had the same two-home shape without having drifted yet.
All four are now parity-checked (P1), so the next drift fails the check instead
of ageing into a description.

The stronger fix is for `site-header.tsx` to import the values rather than
restate them, which removes the condition instead of checking it. That is an app
change, not a token change, and it is deferred: the check makes the drift
impossible to ship in the meantime.

## D-6 anime.js eases are named here, not tokenized

The spring-family eases the surface uses, none of which is a cubic bezier:

| Where | Ease |
|---|---|
| Popover and panel in | `outElastic(1, 0.45)` |
| Nav and pill overshoot | `outElastic(1, 0.6)` |
| Dismiss exit | `inBack(2)`, `inBack(3)` when displaced |
| Toolbar and pill exit | `inBack(1.6)` |
| Nav pill settle | `outBack` |

The old `ease.js-*` tokens covered four of these six and nothing read them. Two
values (`inBack(1.6)`, `outBack`) were in the code and not in the set, so the
token group was both unread and incomplete: a clause with no client that also
failed to describe the thing it named.

## D-7 The type scale is not what the surface actually renders

`font.size` holds ten sizes. The check finds 12 font-size literals in portfolio
source that are not members, including 40px, 48px and 52px used twice each. Those
are display sizes the scale never admitted. The honest reading is that the scale
describes the body and control range and the hero range was never scaled.

Extending the scale to swallow the strays would make S1 pass without any type
decision having been made. The count is recorded instead, and closing it is its
own change, taken deliberately, when someone decides what the display range is.

## D-8 Neue Haas ships eight static cuts, not two

The old README said Neue Haas "ships as static 400 and 500 cuts only." The font
loader in `app/layout.tsx` registers 100, 200, 300, 350, 400, 500, 700 and 900.
The real constraint is narrower and still binding: the cuts are static files with
no variable axis, so nothing between 400 and 500 is reachable by interpolation.
The weight synthesis is still necessary. The premise it was argued from was
wrong, which is worth correcting because a rule defended by a false fact is a
rule nobody can check.

## D-9 Drift is measured against a baseline, not forbidden

Off-scale literals arrive through Tailwind arbitrary-value classes, which never
touch this directory. Forbidding them outright would make the check fail on work
that never edited a token; ignoring them would let the scales quietly stop
describing the surface. Both are worse than a recorded count that must not grow,
which is the shape the repository standard already uses for duplication.

---

# Ame work order, 2026-07-29

## D-10 Ame names the system, not yet the emitted names

The name applies in this pass to the manifest, the emitted CSS header, the titles
of `README.md` and `contract.md`, the runbook, and the run record. It does not
apply to emitted custom property names, to file paths a consumer imports, or to
component names.

Those renames are global or nothing (STANDARD.md N3), and each is a consumer
migration: `--port-text-primary` has 51 call sites. Renaming a subset would leave
two words for one concept, which is the homonym decay N3 names. The boundary is
written here so it is not inferred from what happens to be renamed.

**Amended 2026-08-03 (D-46).** Ame now applies to one component name. The viewer
became the Ame Prototype Viewer under `components/ame-prototype-viewer/`, the
rename earned by making the machinery model-agnostic (D-46). This is the first
crossing of the "not component names" boundary above, and it is a global rename
of that one concept, not a subset: every import site moved in the same change. The
boundary otherwise stands. `AME-VIEWER-ORDER.md`'s binding docs call this decision
"D-7"; that is the pre-renumber name for this entry (see D-22).

## D-11 The deliverable standard is copied, with its escape characters removed

`tokens/deliverables.md` reproduces the operator's Case Study Deliverable
Standard in full. The original carries markdown escapes from its export, which
render as literal backslashes. They are removed; no word is changed. The source
path is named at the top, and the operator's copy stays the authority.

## D-12 The lint script is deleted rather than completed

`"lint": "eslint ."` called a binary the repo does not install, with no config
present: STANDARD.md C2 says such a script is deleted or completed. Completing it
means adding eslint, a config, and a rule set, which is a new rule surface and a
new dependency this work order did not ask for. Deleting it is the smaller change
that satisfies the clause. Adding real linting stays available as its own change.

## D-13 vercel.json is deleted, and the v0 badge goes with it

The file's only content was
`{"buildCommand": "node .v0/inject-built-with-v0.mjs && next build"}`, recorded
here because there is no git history to recover it from. Removing it hands the
build back to the package `build` script, which is now the gate; leaving it would
have meant deploys ran `next build` alone and skipped every check.

`.v0/inject-built-with-v0.mjs` was referenced by nothing else once the file was
gone, so it went too (STANDARD.md H2). This removes a visible "Built with v0"
credit from deployed pages. That is a real loss and it is the cost of the gate
running on deploys.

## D-14 The feed prototype gets a Suspense boundary

`next build` failed prerendering `/prototypes/feed`: `useSearchParams()` bails out
of prerendering unless a Suspense boundary catches it. This was failing before
this work order and was not hidden by `ignoreBuildErrors`, which only suppresses
type errors. The page body moved into `FeedPrototypeBody` behind a Suspense
boundary. Without it the gate could not run to completion, so nothing downstream
of `next build` could be proven.

## D-15 G1's pattern is tighter than STANDARD.md C5's grep

C5's own command greps for a bare double bracket in emitted HTML. Run against
Next 16 output it flagged 45 files that hold no placeholder: React Server
Component payloads open with a doubled bracket, and every route emits one. A gate
that fires on every route teaches its reader to ignore it.

The pattern is now a bracketed identifier, which is the shape the source
placeholders actually use. It flags 9 routes, all of which carry a real
placeholder, and no route that does not. The pattern lives in `invariants.json`;
C5's untightened form is the clause, this is its one evaluation site.

## D-16 X1 makes "the run that earned it" checkable

The rule as written is that a `baseline.json` edit is valid only in the same
change as the run that earned it, with that run in the log. Without git in the
tree, "same change" is not observable. The checkable half is: a baseline number
never sits above what the last logged run measured for that key. A baseline moves
down.

That is not the whole rule, and it caught a real error the first time it ran: H1
was still 47 in the baseline after the run measured 42.

## D-17 Sixteen surface reads were repointed at semantic roles

U1 measured 16 reads of base-tier custom properties from `app/(portfolio)/` and
`components/portfolio/`. Each was repointed at a semantic role holding the
identical literal, and five new roles were added where none existed:
`motion.overshoot-ease`, `motion.slide-ease`, `motion.slide-duration`,
`motion.exit-ease`, `type.dense-leading`.

Five of those reads were hand-written copies of a token's value: the nav slide's
duration and curve, the mobile menus' close curve, the root letter-spacing, the
reduced-motion clamp, and the body weight stroke. Binding them removed the second
home as well as the U1 violation.

Paint is unchanged, and that is a measurement rather than a claim: each of the 8
name pairs was compared in the emitted CSS and resolves to the same literal.

On P5: the work order exempts WO-4 deletions from paint parity and says nothing
about additions. The emitted CSS gained 5 declarations. An added custom property
that no rule reads cannot repaint anything, and each of these is read only by a
rule that previously held the same value inline. Recorded rather than assumed.

## D-18 Two curves deleted, thirty-five kept with a reason

`ease.out-expo` and `ease.in-back` were read by nothing and no hand-written copy
of either curve existed anywhere in the tree. Deleted.

Thirty-five tokens remain clientless: most `type.*` roles, 16 `component.*`
tokens, `font.leading.*`, `font.weight.*`, `space.grid-gap`,
`space.control-pad`, `border.*`, `background.card`, `motion.state-duration`,
`motion.exit-duration`. They describe values the markup sets through Tailwind
classes. Binding them is a rewrite of the portfolio components, not a token
change, and a rewrite of that size cannot be reviewed alongside a format
conversion. The number is baselined at 35 and X1 stops it moving up.

Keeping a clientless token is a contract with one signature, which the audit
already called a defect. The honest position is that it is a known defect with a
number on it, not that it is fine.

## D-19 The DTOS value bounds moved out of the checker

`check.mjs` held the `fontWeight` range and the unit lists inline. Those are
bounds the DTOS schemas impose, and the standing rule is that rule data lives in
`invariants.json` only. They are now `type_bounds` there, with the schema path as
the source. The checker states no number of its own; what remains are sRGB
transfer-function constants, which are the definition of the contrast measurement
rather than a threshold, and two float-comparison epsilons.

## D-20 dipstick suppresses the log line its own check would write

dipstick executes `check.mjs` rather than re-implementing a rule, and `check.mjs`
appends to `runs.log` on every run. Two consecutive dipstick runs therefore
differed in `i6.lines`, and the read-only guarantee in dipstick's own doc block
was false: it grew the history by looking at it.

`check.mjs` gained `--no-log`, which dipstick passes. `runs.log` is the gate's
memory, so it records gate runs; a measurement read is not one. Two consecutive
exports now differ in `$exported` and `dateCreated` only.

## D-21 The dipstick filename, and what c5 does not measure

The export is named
`dipstick.<UTC basic instant>.ame@<version>.json`. At 40 characters with an `@`
in it, the name is outside STANDARD.md N5's flag threshold. Justified: the basic
ISO form has no colons, so the name is legal on Windows and sorts
chronologically, and carrying the version in the name means the file answers when
and of what version without being opened (S9 rule 1c). The directory listing is
the export history; no separate log exists.

Constraint c5, component APIs, reports a file count and nothing else. The
evidence object says so in its own `measured` field, because an evidence block
that omits its limit reads as a fuller measurement than it is.

## D-22 Decision numbering continues from D-10

The work order said to continue from D-7. D-7, D-8, and D-9 were already taken by
the July 28 audit pass, and reusing a number would put two decisions under one
name. Numbering continues from D-10.

## D-23 The glass border doubled, on request

The inset ring every `.port-glass` surface carries went from `ink @ 0.06` to
`ink @ 0.12` on a light backdrop, and from `white @ 0.10` to `white @ 0.20` on a
dark one. Both doubled, so the two tones stay at matched strength.

This is a deliberate paint change, which the standing P5 parity rule of the Ame
work order otherwise forbids. The operator asked for it directly; P5 governs
machinery changes, not design decisions taken on purpose. Every glass surface
moved at once because they all read one token, which is the property the token
layer exists to have.

## D-24 The edge is a variable, and two surfaces were rebound

Three changes, one shape: a value that a surface needed to vary got a name.

**The edge became its own token.** `elevation.glass` was a two-layer composite,
so changing the border meant editing a recipe that also held the drop. It is now
`elevation.glass-edge` and `elevation.glass-drop`, with `-light` and `-on-dark`
variants, composed in CSS as
`box-shadow: var(--port-glass-edge), var(--port-glass-drop)`. A surface overrides
`--port-glass-edge` alone and leaves the drop where it is.

**The nav takes the faint edge**, through a `.port-glass-quiet` modifier. It sits
high on plain paper, where the doubled edge reads as a hard outline rather than a
glass rim. Every other glass surface floats over content, where it does not.

**The Ask-AI trigger pill takes the opaque glass**, the same fill the cookie,
contact, and Ask-AI panels use, by adding `port-glass-opaque` to its class list.
It was on the translucent fill, so it read as a lighter object than the panel it
opens.

Two more hand-written literals went with this: the opaque fills were
`color-mix(in oklab, var(--port-page-bg) 88%, transparent)` and
`lab(19 0.33 -15.02 / 0.69)`, written in `portfolio.css`. They are now
`color.paper-alpha.88` and `color.modal-dark`. D2 could not see either: the first
contains a `var()`, and the second had no token to match against.

## D-25 D2, the check for a restated value

D1 catches a re-declared custom property. It cannot see a hand-written literal
that happens to equal a token's resolved value, which is the same second home in
different syntax. The nav pill and the work card each restated a shadow recipe
the token layer already held, and the gate passed for the whole Ame pass.

D2 compares by numeric signature, the ordered numbers in a value, so
`rgba(16,19,25, 0.04)` and `rgb(16 19 25 / 0.04)` are recognised as one value. It
found 24 more on first run, almost all in the fumadocs theming block:
`oklch(0.22 0 0)` restated 10 times where `color.neutral.800` exists.

Those 24 are not fixed. They are a different surface with its own theming
concerns, and closing them is a diff that has nothing to do with the glass work
that surfaced the check. Baselined at 24 so the number cannot grow.

The limit worth naming: D2 skips any value containing `var()`, so a `color-mix()`
over a token reads as bound even when the percentage is a second home. That is
how the opaque light fill hid until it was read by eye.

## D-26 The grain is four numbers, and the SVG is derived from them

The dither was a hand-written `feTurbulence` data URI in `portfolio.css`, carried
as a D1 exception on the grounds that no DTOS type admits an asset. True, but the
wrong conclusion: what defines the grain is not the SVG, it is four numbers.

`dither.strength`, `.frequency`, `.octaves` and `.tile` are now tokens, and
`build.mjs` serializes them into the URI it emits as `--port-dither-noise` —
the same job `cssShadow` does for a shadow composite. The generated string is
byte-identical to the literal it replaced, checked rather than assumed. The D1
exception is gone, and changing the grain is now a number, not an edit to an
encoded SVG.

This is the one emitted custom property that is not a token. It is recorded as
the fourth spec gap in `contract.md`.

## D-27 Every surface above the page overlay now carries its own grain

The page overlay sits at `z-index: 1`, which the file's own comment explains:
anything positioned above it is not blended, and that exclusion was deliberate
because blending over the live WebGL canvas caused a repaint fight.

The consequence nobody had written down: the glass nav, every modal, the Ask-AI
pill and the work cards all float above that layer, and they are exactly the
surfaces carrying soft shadows and translucent fills — the things that band. The
only undithered surfaces on the page were the ones that most needed it, and
`.port-dither`, the class built to fix that case, had zero consumers.

`.port-glass`, `.port-glass-pill` and `.port-card` now carry the grain through
the same `::after` recipe. `.port-dither` stays as the opt-in name for anything
new. The iPhone viewer card is still excluded, for the reason already recorded.

**The mistake worth keeping.** The first version also set `position: relative` on
all four selectors, so the pseudo-element would have something to anchor to. That
broke the surface: `.port-glass` elements are variously `fixed` (the cookie
modal), `absolute` (the mobile menus) and `relative` (the AI panel), and a blanket
`relative` moved the fixed ones and dropped the nav's selection pill out of its
placement entirely — visible immediately in the browser as a blank pill sitting
left of the labels.

They need no help: every `.port-glass` carries a `backdrop-filter`, and a
non-`none` backdrop-filter already makes an element a containing block for
absolutely positioned descendants. The nav pill is itself `absolute`. Only
`.port-dither` and `.port-card` take a position, because only they lack one.

## D-28 What "all our gradients" turned out to mean

The instruction was to make sure every box shadow and gradient carries the
dither. The shadows are done, above. The gradients need a correction: **the
portfolio surface has none.** Every `gradient` hit in `portfolio.css` is inside a
comment describing the dither's purpose.

35 real gradients exist elsewhere: `app/globals.css`, the three prototype routes,
and seven `components/ui/*` files. None is inside `.portfolio-root`, so the
dither system does not reach them and extending it there is a decision about a
different surface, not a continuation of this one. Recorded rather than silently
skipped, and not done.

## D-29 The splash reveal: the mark becomes a hole and opens

Three loops run unchanged. Then the mark fades as a cutout of the same artwork,
at the same size, in the same place takes over — so what reads is one thing
becoming the other. The cutout then opens over one logo cycle, reversed.

**The hole is punched in the overlay, not the site.** Google's version
(`featured-hero__mask`) masks the content. Here the content is a WebGL canvas
plus CSS3D iframes, and a mask on an ancestor flattens and clips that subtree. So
the overlay keeps its ink fill and takes a two-layer mask: a full-cover gradient,
the mark image over it, `mask-composite: exclude`. The mark's alpha is subtracted
and the site behind is never touched. Safari spells the same operation
`-webkit-mask-composite: xor`; both are emitted, both confirmed supported.

**The opening is a transform, not an animated mask-size.** `mask-size` repaints
the masked element every frame. A scale runs on the compositor and the mask
scales with the element, so the aperture grows for free.

**Reversed, literally.** `animation-direction: reverse` plays the keyframes
backwards and reverses the easing, and the easing is `--logo-ease`, the mark's
own hand-tuned bounce. That curve moved from `.logo-bounce` to `:root` in
globals.css so the logo and the reveal read one definition; a curve written twice
can disagree with itself. There is no DTOS type for a `linear()` easing function,
so it cannot be a token, and one home in CSS is the next best thing.

**The fade is load-bearing, not decoration.** The mark is a comb. Measured on the
generated asset, its alpha mean is 128.4/255, so it covers about half its box at
every scale and the aperture is half stripes no matter how far it opens. Growing
alone never clears the viewport. Opacity holds through the first 60% of the play
and drops over the last 40%, by which point a single gap is wider than the
screen. Verified at 82%: scale 34.9, page fully clear.

**The gate now releases at the start.** With a fade the page is covered until the
last frame, so an entrance beginning underneath is wasted, which is what
`splash-gate` exists to prevent. A reveal inverts that: the site is visible
through the aperture from frame one, and holding the viewer back would open a
hole onto a phone standing still. The fade path keeps the original end-release.

`EXIT` is a flag, not a replacement, so the two can be compared without a revert.

## D-30 The mask asset is generated from the two halves, at the CSS offsets

`logo-top.png` and `logo-bottom.png` are separate layers the bounce animates
independently, so neither is the mark on its own. `mark-mask.png` is the two
composited at exactly the offsets `globals.css` already places them at
(`815/825` wide; top at `0,0`; bottom at `40/3300, 1196/3592`), which at an
825x898 canvas is an 815x599 part at `(0,0)` and at `(10,299)`. The bottom edge
landing on 898 is the arithmetic checking itself.

sharp did the compositing. It is a transitive dependency, not a direct one, so it
is not resolvable from the project root — the generator imported it by store
path. That makes this a one-off, not a build step, and the asset is committed.
Re-run it only if the halves are re-exported.

## D-31 Verifying it needed the timing slowed, and that is worth writing down

The reveal is 2180ms. Round-trips to the browser in this environment measured
around 10 to 20 seconds, so the window could not be caught by waiting: three
attempts landed after the splash had already unmounted, one of them 50 seconds
past navigation.

Two things had to move together to hold it open — `component.splash.cycle` (the
CSS duration) and `REVEAL_MS` in the component (the unmount timer). That they are
two numbers is itself the finding: P4 ties `component.splash.cycle` to
`LOGO_CYCLE_MS`, and `REVEAL_MS` derives from `LOGO_CYCLE_MS`, so the chain holds
by construction rather than by check. Both were restored and the check is green.

## D-32 The reveal expands the held mark, without animating it

The reverse bounce is gone. The cycles end with the mark assembled and held, and
that held shape is what opens — one move, on `motion.exit-ease`, the accelerating
curve the system already uses for a surface leaving. `--logo-ease` went back to
`.logo-bounce`, its original home, since nothing else replays it now.

D-29 described a reversed bounce. That description is superseded; this entry is
the current behaviour.

## D-33 The mask is vector, because a raster mask blurs at 46x

The first mask was a PNG composited from the two halves. A raster mask
rasterizes at its natural size and is interpolated from there, so by the end of
the expansion the stripe edges were visibly soft — the blur was the mask, not the
page behind it.

`mark-mask.svg` is the mark as vector, extracted from `lockup.svg`, which
`logo-bounce.tsx` already establishes is the same artwork: its stripe block is
1630x1774 at (1098.02, 44), an aspect of 0.9188 against the mark container's
825/898 = 0.9187. The extraction crops the viewBox to that block. An SVG
re-rasterizes at whatever size it is drawn, so the edges stay exact all the way
out. `mark-mask.png` is deleted.

## D-34 Two filters, because the wordmark hid inside the mark's bounding box

The first extraction kept every path whose bounding box fell inside the stripe
block. That produced a mask with the letters "Sé" cut into it: the lockup's
"Sébastien" wordmarks are laid OVER the stripe block, so six glyph paths sit
inside its box and became letter-shaped holes, several screens wide once the
aperture opened.

The bounding box cannot separate them. The shape of the path can: a stripe is an
axis-aligned rectangle, so its `d` uses only M, H, V and Z, while a glyph needs
curves. Filtering on that keeps 58 stripes and rejects 40 curved paths, and the
kept set measures 5.9 to 43.5 units wide — all thin bars, no glyph slabs.

Worth keeping because the first version looked plausible. 64 paths, the right
bounding box, the right aspect ratio, and a mask that was wrong in a way only
rendering it at 7x would show.

## D-35 Only the ink layer scales

The mask and the transform were on the outer splash box, which also contained the
mark. So the mark scaled with the aperture: at 7x the held logo and its lockup
layers were magnified across the whole screen while they faded. That is a zoom,
not a reveal.

The overlay is now two siblings inside an untransformed box: an absolutely
positioned ink layer that carries the mask and the scale and contains nothing,
and the mark on top of it, which fades in place. Nothing inside the scaling
element means nothing for the expansion to drag along.

## D-36 The blur was the transform, not the mask. Correcting D-33

D-33 said a PNG mask was the reason the aperture went soft, and that a vector
mask would fix it. The vector mask was still soft, so that diagnosis was wrong
and this entry replaces it.

The cause is scaling by `transform`. A transform is cheap because it runs on the
compositor, but the compositor scales a raster the browser has **already made**:
the element and its mask are rasterized at pre-transform size and that bitmap is
then blown up. At 46x the stripe edges were mush no matter how the mask was
authored. Vector or raster made no difference, because neither was being
re-rasterized.

Growing `mask-size` instead leaves the element untransformed, so the mask is
re-rasterized at its new size every frame and the edges stay exact all the way
out. That is what Google's `featured-hero` does — `mask-size: 400%` on an
element whose `transform` stays at `translate(0px, 0px)` — and the reason is
this, not a stylistic preference.

I had it backwards on purpose earlier: D-29 recorded choosing transform over
`mask-size` because "mask-size repaints the masked element every frame". That
repaint is real and it is the price of the effect. It is affordable here for a
specific reason: the element under the mask is one flat colour, so a frame costs
a fill and a mask composite, with nothing to re-lay-out and nothing to re-decode.
Google pays the same cost over a playing video.

The vector mask stays. It is the correct asset regardless — it is smaller than
the PNG and it is what makes per-frame re-rasterization worth anything — but it
was not the fix, and D-33 should not be read as if it were.

## D-37 mask-size keyframes must restate every layer

`mask-size` is one property carrying a list, one entry per mask layer. The mask
here has two: the full-cover gradient that supplies the material, and the mark
that subtracts from it. A keyframe naming only the mark's size drops the gradient
layer, and an overlay whose first mask layer has gone does not open — it
disappears. Both layers are written out in both keyframes.

## D-38 The mask reveal is removed; the exit is a quick fade on the enter curve

The cutout reveal is gone: `.port-splash-reveal`, its keyframes, the
`component.splash.scale` token, the `EXIT` flag, the two-sibling overlay
restructure, and `public/images/logo/mark-mask.svg`. The splash is one element
again, as it was before D-29, and it leaves by fading.

What is not a revert: the fade's two terms are tokens now, where they were a
hardcoded `400ms ease-out`.

- `component.splash.fade` = `{duration.fast}` = 200ms. Down from 400 because the
  mark has already had 6.5 seconds by then; the exit's job is to get out of the
  way, not to be watched.
- `component.splash.fade-ease` = `{motion.enter-ease}` =
  `cubic-bezier(0.2, 0, 0, 1)`. Fast off the mark and settling at the end, so
  what reads is the page arriving rather than the overlay leaving.

Verified as resolved rather than assumed: a probe element carrying the same
declaration computes `opacity 0.2s cubic-bezier(0.2, 0, 0, 1)`.

`splashSettled()` goes back to firing at the end of the fade. The early release
in D-29 existed because a reveal makes the page visible from its first frame; a
fade does not, so the original reasoning applies again — an entrance beginning
under an opaque overlay is exactly what the gate prevents.

Kept: `duration.cycle` and `component.splash.cycle`, whose only client is
invariant P4, which holds `LOGO_CYCLE_MS` to the token. The logo cycle is a real
system value and worth keeping declared even though no rule reads it.

New: invariant **P5** ties `FADE_MS` in `loading-screen.tsx` to
`component.splash.fade`. The number lives in two places because one is a CSS
transition and the other is the JS unmount timer; the check is what stops them
drifting, which is the same shape as P1 and P4.

D-29 through D-37 describe a feature that no longer exists. They stay as the
record of why it was built and what it cost; this entry is where the behaviour
now lives.

## D-39 The dismiss is 800ms

`component.splash.fade` now reads `{duration.long}` = 800ms, and `FADE_MS`
follows it (P5). Resolved value confirmed on the page:
`opacity 0.8s cubic-bezier(0.2, 0, 0, 1)`.

Two consequences worth having written down rather than discovered later.

**800ms is a new step on a closed scale, and it lands 20ms from `settle` (780).**
That is a 2.5% difference: two names for what is, in practice, one duration. The
scale is meant to be the closed set of tempos the surface uses, so a near
duplicate weakens it. It is added rather than rounded onto `settle` because
`settle` means "popover and panel spring in" and this is a full-page dismiss;
merging them would tie two unrelated surfaces to one number. If a third consumer
ever wants this length, one of the two should absorb the other.

**The splash floor moved from 6740ms to 7340ms.** The dismiss is serial with the
cycles, not overlapped: `CYCLES * LOGO_CYCLE_MS` runs, then `FADE_MS`, and only
then does `splashSettled()` release the viewer's entrance. Quadrupling the fade
from 200 to 800 adds 600ms to every visit before the page can be touched. The
COST box at the top of `loading-screen.tsx` counts the fade, so it was updated in
the same change; a stale number in that box is exactly the kind of thing it
exists to prevent.

## D-40 The 15px jump when the splash leaves

`body { overflow: hidden }` holds the page still while the splash is up. That
removes the scrollbar, and putting it back on release widened the content box by
the scrollbar's width — measured 15px on this display, applied to every element
at the exact moment a first-time visitor first sees the page.

Fixed with `scrollbar-gutter: stable` on `html`, which reserves the track whether
or not a scrollbar is showing. Measured after: content width 1692px locked,
unlocked and restored, shift 0.

Two other fixes were measured and rejected:

- Padding-compensating `body` by the scrollbar width leaves a 0.1px residue and
  needs JS to discover a number the browser already knows.
- `html { overflow-y: scroll }` makes `html` the scroll container so `body`'s
  overflow no longer propagates to the viewport. It fixes the shift, and it
  breaks the lock outright: the page still scrolled to 800px while the splash
  was up. Rejected on the second measurement, not the first.

**No token, and that is the honest outcome.** `stable` is a keyword and the
scrollbar's width is the user agent's, not the design system's; there is no value
here to name. It is also not a contract clause, because `STANDARD.md` holds that
a clause without a check does not bind, and `check.mjs` runs in Node with no
layout engine to measure a reflow. It is a rule in the stylesheet with its
reasoning and its measurements attached, which is what this case actually
supports.

## D-41 Exploded sheets hide much earlier than the flat screen

Collapsed, the CSS3D layer sits at `z-index: 2`, under the overlay that draws the
bezel, so the phone's body occludes it and hiding at a dot of -0.02 (just past
edge-on) is safe.

Exploded, the layer is lifted to `z-index: 4` so the spread sheets are not
clipped by the bezel. That lift is the defect: DOM has no depth test, so from
z-index 4 the sheets paint over the shell, and as the phone turns they are drawn
straight through its body and read as the interior.

The sheets now take their own cutoff and their own fade while exploded
(`STACK_HIDE_DOT_EXPLODED` = 0.45, roughly 63 degrees off head-on, fading out
from 0.75). Hiding them while the face is still well toward the camera is the
only fix that does not give up the un-clipped spread the z-index lift buys.

**Unverified visually.** It typechecks and the mechanism is the one the defect
comes from, but the explode cycle is rotation-driven and did not fire during
roughly 25 seconds of DOM sampling across two attempts, so the layer never
reached `z-index: 4` while it was being watched. 0.45 is a reasoned number, not a
measured one, and it is the single value to move if the sheets vanish too eagerly
or a sliver still shows.

## D-42

**G1 counted emitted files and called them routes.**

The check reported `14 route(s) carry a placeholder`. There are 5. Next 16
emits one route as several files — `foo.html`, `foo.rsc`, and a `foo.segments/`
tree of per-segment payloads — so three case studies produce twelve files
between them, and the file count runs about 3x the route count on any dynamic
route.

The verdict was never affected: G1 fails on one hit or fourteen. What was wrong
is the number a reader takes away, and that number had been carried into
`docs/orders/AUDIT-CLOSEOUT.md`, four commit messages, and the C5 row of the clause table,
each time as "14 routes."

`routeOf()` now derives the route from the emitted path: cut at `.segments/`,
drop the `.html` or `.rsc`. The report gives both numbers and lists the routes:

```
G1: 5 route(s) carry a placeholder, across 14 emitted file(s)
     /portfolio
     /portfolio/case-studies/case-study-1
     /portfolio/case-studies/case-study-2
     /portfolio/case-studies/case-study-3
     /portfolio/privacy
```

Listing them is the part that pays. "14 routes" is a number to worry about; five
named routes is a work list, and it is immediately obvious that the three case
studies are one template rendered three times.

This is CLAUDE.md 14 on a number nobody thought to check, because it was never
load-bearing — the gate's colour did not depend on it, so its wrongness was
invisible. A number reported to a reader is a claim whether or not a branch
reads it.

## D-43 A dark counterpart for the top utility bar, so the bar is one component on two grounds

The top bar painted `--component-topbar-bg` (#eeeeeb) and had no dark counterpart.
On a paper page that is a warm near-white strip; dropped onto an ink ground it is a
white band across the top. So a sister site on ink could not share the bar — it had
to re-implement it as glass, a different surface.

Closed the gap through the chain: base `color.surface-ink` (#1a1e28, a subtle
elevation of ink that keeps its blue cast), semantic `background.utility-on-dark`
(references it), component `topbar.bg-on-dark` (references the semantic), plus
`topbar.fg-on-dark` / `-fg-hover-on-dark` referencing the glass on-dark foreground
pair. C7 (topbar fg-on-bg contrast) is unchanged; the on-dark pair reads on the ink
strip at glass's own on-dark ratios (C8/C9). The bar is now one tone-aware component,
not two.

## D-44 A dark theme, expressed as re-pointed aliases, not a second set of tokens

The marketing route needed the whole portfolio surface on ink, not one flag flipped.
Re-declaring the surface tokens under a `.dark` selector was not an option: contract
B1 gives every token exactly one home under `.portfolio-root`, and D1 bans a hand file
re-declaring a generated name. Both would break.

The alias layer is the clean seam. An alias is "a spelling a surface binds" (B3), not a
token, so it is the one thing that may resolve differently per context without a value
gaining a second home. An alias value is now either a path (light only) or `{ light,
dark }`; the build emits the light target on `.portfolio-root` as before, then a generated
`.portfolio-root[data-theme="dark"]` block that re-points the themed aliases to their
on-dark tokens. Four aliases are themed: `--port-page-bg` → `background.ink`, and
`--port-text-{primary,heading,secondary}` → three new `text.*-on-dark` tokens
(white / white / white-alpha.78). Every base, semantic, and component token still has one
home; only the spelling gained a per-theme target. B3 now reads "resolves to exactly one
token per theme scope," and check.mjs counts both scopes' targets in the client census.

A route opts in with `data-theme="dark"` on its `<main>`, and every surface below inherits
the ink treatment through the same variables it already read. /portfolio stays light;
/mmarketing renders the same home component dark. Because it is one component, the marketing
route adds no duplicated literals — S1–S5 hold at baseline. The baseline drops S2 34→33 and
H1 32→29 in this change, the run that earned it in runs.log.

## D-45 The dark theme reaches the solid surfaces, not only the page and text

D-44 flipped the page ground and the running text. That left the SOLID chrome and
card surfaces on their light values, because those read component tokens or fixed
fills directly rather than the themed --port-* aliases: the utility strip and the
footer stayed paper, and the .port-card fill stayed a light card, so white text on
it lost contrast. The glass surfaces are deliberately untouched — glass is glass on
either ground.

Apple's dark mode is the reference for the fix: it uses a base/elevated split where
a foreground surface advances by getting LIGHTER, not darker. So the card is not the
page colour; it is one step up. Added `background.card-on-dark` ({color.surface-ink},
#1a1e28 on the #101319 page) and a single `[data-theme="dark"] .port-card` rule that
binds it — a property, not a re-declared custom property, so no invariant moves. The
utility strip and footer switch to their existing on-dark tones by route/theme, and
the nav's selected label now reads `surface.glass-fg-on-light` (always ink on its
bright pill) instead of the themed text token, which is what its own comment always
intended. Contrast on the ink ground clears Apple's 4.5:1 floor at every surface.

## D-46 The viewer became the Ame Prototype Viewer, model-agnostic by a contract

2026-08-03. Executes `docs/orders/AME-VIEWER-ORDER.md` (WO-V1 through WO-V6).

`components/iphone-viewer.tsx` was a 2,265-line viewer that could render exactly
one hardcoded iPhone: the glb path and five node names were literals in the render
code. A "prototype viewer" that renders one device is an N6 defect, a name
promising more than the code does. The rename is earned by removing the literals.

**The shape now.** `components/ame-prototype-viewer/`:
- `model-contract.ts` — the `ModelContract` type and the producer-facing export
  spec (the Blender steps, the node names, the "rename a node and the viewer names
  it back" test). This is instrument 5's home: the definition of a valid input.
- `models/iphone-17-pro.ts` — the single registered instance. Every node name lives
  here once, in `nodes`; `requiredNodes` derives from it. A new device is a new file
  here, and the render code does not change.
- `load-model.ts` — loading plus validation. `validateModel` traverses the scene,
  computes `requiredNodes` minus found, and throws one error naming the contract id
  and each missing node. No silent fallback.
- `viewer.tsx` — the machinery, exporting `AmePrototypeViewer` with a required
  `model: ModelContract` prop. It greps clean of all five node names and the glb
  path; it reads them from the prop.

**The route-name call.** `app/prototypes/iphone/` keeps its name: it renders the
iPhone contract specifically, so the name still states its concept. What changed is
what it renders. It used to embed the standalone HTML twin through an `<iframe>`;
it now renders `<AmePrototypeViewer model={iPhone17Pro} />`, which is the machinery
the twin duplicated.

**Three call sites, not one.** The order's P2 expected the iphone route to import
the component; it did not — it embedded the twin. The real React import sites were
`app/(portfolio)/portfolio/page.tsx` and `app/prototypes/ambient-engine/page.tsx`.
Both were updated to import the contract and pass it as `model`, and the route was
converted to render the component. N3: the rename moved every site in one change.

**upAxis and unitScale are disclosed premises, not load-checks.** Node presence is
machine-checked at load; upAxis (`y`) and unitScale (`1`) are stated by the contract
and not re-verified by the viewer. They were measured once from the glb on
2026-07-29 (Display extent 0.0664 x 0.1444 units against 66.4 x 144.4 mm). The doc
block says so rather than implying all fields are checked. A false claim of checking
is worse than a disclosed gap.

**The twin is deleted.** `public/iphone-viewer.html` was a 45 KB second
implementation of the concept (H4). Delete is the order's default and there was no
reason to freeze it: the route that referenced it now renders the live component, so
nothing is left pointing at a frozen file.

**viewer.tsx stays large, and here is the next split.** At 2,378 lines it is over
M2's 500. This pass extracted the contract, the model instance, and load+validation;
it did not break up the render machinery, because that is a second reviewable diff,
not a rider on the rename (STANDARD clause 9). The planned next split, recorded so it
is a named work item not a vague intent: lift the material factories and the
scratch/dither overlay builders (the `make*Material` functions and
`createPhysicalScratchOverlay`, roughly the first 560 lines) into `materials.ts`, and
the renderer/scene/light setup into `scene.ts`, each hiding one decision (M1). The
node-name coupling that made the file un-decomposable is already gone; what remains is
length, not entanglement. Recorded in DECISIONS.md R-8 as the viewer's current
rationale.

**The prior partial contract folded in.** `components/iphone-viewer-contract.ts`
(a flat `MODEL_PATH` / `REQUIRED_NODES` / `assertModelContract` export from the WO-5
runbook pass) was the earlier attempt. Its facts moved into the three new files and
it was deleted; keeping it would have been a second home for the node names.

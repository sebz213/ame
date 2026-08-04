# Audit: the token system as a contract

The system before this pass, reviewed against Meyer's *Applying Design by
Contract* (1992) and against the Design Token Open Standard (DTOS 2025.10). Every
count below was measured, not estimated; the scripts that measure them are
`build.mjs` and `check.mjs`.

The headline: the system was a well-argued document that bound nothing. 167
tokens, 29 of them read by anything, no types, no checks, and its four load-
bearing rules stated only in prose.

---

## 1. It was not a design token file

DTOS reserves `$value`. An object with `$value` is a token; an object without one
is a group. Every token in `base/`, `semantic/`, and `component/` used `value`.

Under the standard the directory claimed to follow, the file contained **zero
tokens**. A conforming reader would have walked 167 groups, found no values, and
emitted nothing.

The reference syntax was Style Dictionary's `{path.value}`, not DTOS's
`{group.token}`. The two are not interchangeable: DTOS appends `/$value`
implicitly, so `{color.ink.value}` asks a conforming resolver for the `value`
property of the resolved value of `color.ink`, which does not exist.

The `README` cited the three-layer discipline from a 2024 paper and the build
from Style Dictionary. Neither citation is the standard the format claimed.

**Now:** `$value` throughout, `{group.token}` references, `$ref` JSON pointers
where a property-level reference was needed. `style-dictionary.config.json` was
removed rather than left to produce different output from the same files.

## 2. Nothing had a type, so nothing had a meaning

DTOS: *"If the `$type` property is not set… the token's type cannot be determined
and the token MUST be considered invalid."* And: *"Tools MUST NOT attempt to
guess the type of a token by inspecting the contents of its value."*

No file carried a single `$type`. Every value was a CSS string: `"14px"`,
`"350ms"`, `"cubic-bezier(0.16, 1, 0.3, 1)"`, `"400"`, `"16, 19, 25"`. The build
resolved them by string substitution, which works for CSS and for nothing else.
There was no iOS target, no Android target, and no Figma import, because there
was no typed value to give one.

Typing forced three things into the open:

- **`font.weight.stroke-450` was not a font weight.** It held `0.013em`, a
  `-webkit-text-stroke` width. `fontWeight` would have accepted `0.013` as a
  legal weight number. The name asserted a glyph weight; the value was a stroke.
- **`color.ink-channels: "16, 19, 25"` was not a colour.** It was a string
  workaround for `rgba()` composition, in the colour file, under the colour
  group. DTOS colour objects carry `alpha`, so the workaround had no reason to
  exist.
- **`ease.js-elastic-soft: "outElastic(1, 0.45)"` was not an easing curve.** It
  is an anime.js function call. No DTOS type admits it and typing it
  `cubicBezier` would have been false.

## 3. No Hidden Clauses — four rules that bound nobody

Meyer's rule: a fully spelled-out contract makes the stated constraints the only
relevant ones, and an omitted precondition clause is `require true`. The system
stated four rules in prose and checked none of them, so all four were `require
true`, and the artifact broke three.

| Rule as written in the README | What the files did |
|---|---|
| "A component never holds a hex; a semantic token never holds a raw px." | `semantic.nav.bg` held `oklch(1 0 0 / 0.72)`. `semantic.motion.reduced-duration` held `0.01ms`. All five `elevation.*` recipes held raw `rgba(16, 19, 25, …)`. Nine `component.*` tokens held raw px or rem. Two held raw `color-mix()`. |
| "One colour, one encoding — removes the `#101319`-vs-`rgba(16,19,25)` duplication the audit flagged." | The duplication was still there, in five shadow recipes and two pill fills. `color.ink-channels` was read by nothing. |
| "The build fails loudly on an unresolved or cyclic reference, so the layering can't quietly rot." | True for references. The layering itself was never checked, and had rotted. |
| "Never add a raw literal to a component file — add a base primitive and reference it." | The component file was, by count, mostly raw literals. |

The last row is the shape Meyer is describing. The convention was stated as
guidance and enforced by nobody, so the file it governed became its
counter-example, and the README kept asserting the rule while the artifact
disproved it.

**Now:** the rules are in `invariants.json` as data and in `check.mjs` as code.
Where a rule as written was wrong, the clause was corrected rather than the
artifact bent to fit it. L3 states that a component **may** hold a dimension or
number literal, because a measure used by exactly one element has no shared scale
to sit on. That permission is stated so it is not inferred.

### The parity failure the missing clause allowed

`component.nav.logo-gap` was `2rem` with the description "Logo→nav breathing room
(LOGO_GAP=32)". `site-header.tsx` has `const LOGO_GAP = 33`.

Two homes for one number, drifted by a pixel, with the token describing a value
the code had already left behind. Three sibling constants had the same two-home
shape and had not drifted yet. `component.nav.item-width` carried the description
"The JS constant ITEM_W reads this intent" — ITEM_W is a hardcoded `78`; it reads
nothing.

**Now:** P1 checks all four against `site-header.tsx`, and P2 checks the rendered
flex gap. The token is 33px, because the shipped surface is the fact.

## 4. Honesty — most of the contract had one signature

Meyer's Table 1: every obligation for one party is a benefit for the other. A
clause with no client obligates nobody.

Measured before this pass:

| | |
|---|---|
| Tokens defined | 167 |
| Read by a `var()` in source | 17 |
| Read only by another token or an alias | 59 |
| **Read by nothing at all** | **91** |
| Aliases defined / read | 24 / 14 |

**The entire component layer was unread.** All 30 component tokens: every card
token, every pill token, both ask-ai radii, the topbar height, the header-logo
height and stretch. The components render with Tailwind classes.

And the inverse: the two most-read values on the surface were not in the
contract. `--port-glass-fg` has 41 call sites and `--port-glass-fg-muted` 23,
both declared in `portfolio.css`. `--port-dither-strength`, `--port-glass-halo`,
and `--port-panel-w` likewise. A contract that omits its two most-used values and
carries 91 clauses nobody invokes has the census exactly backwards.

The `ease.js-*` group is the clearest single case: four tokens, read by nothing,
naming four of the six anime.js eases the code actually uses. It was unread *and*
incomplete: a clause with no client that also failed to describe the thing it
named.

**Now:** the glass system (fill, foreground, muted foreground, shadow, blur,
saturate, dither strength) is tokens, with only the runtime tone switch left in
CSS. The unread count is 47 of 187, recorded in `baseline.json` so it cannot
grow. It is not zero, and `outcomes.md` says which 47 and why closing it is its
own change.

## 5. No redundant checking — where the same condition had two homes

Meyer's argument against defensive programming: assign each consistency condition
to exactly one party, exactly once, because redundant checking adds software that
can itself fail. Six duplications, all found by D1:

- `--port-glass-blur: 14px` and `--port-glass-saturate: 1.5` declared in
  `.port-glass` **and** emitted as tokens. The README's own text ("Blur and
  saturate live HERE, not on each call site") named `portfolio.css` as the home
  while the token file also claimed it.
- `--ease-out-expo`, `--ease-out-back`, `--ease-in-back`, `--ease-spring`
  declared in `:root` with the same four literals the token file holds.
- `.port-glass` restated `inset 0 0 0 1px rgba(16,19,25,0.06), 0 1px 6px
  rgba(16,19,25,0.06)` inline, four lines below reading a var, while
  `--component-glass-shadow` held the identical recipe and was read by nothing.
- `--port-panel-w: 18.08rem` in `portfolio.css` and `component.ask-ai.width:
  "18.08rem"` in the token file, the token's description pointing at the CSS as
  though the CSS were the source.
- `--port-dither-strength: 0.035` in CSS, absent from tokens.
- The build emitted `--ease-out-expo` as both a token and an alias, so the
  generated file would have contained `--ease-out-expo: var(--ease-out-expo)`.

Also in this class: the old README carried the accessibility rules, the
versioning rules, the layering rules, the drift table, and the weight rationale
in one file, so a rule, its reason, and its measurement were interleaved and only
one could be checked. Splitting them into `contract.md`, `decisions.md`, and
`outcomes.md` gives each condition one home.

**Now:** every generated name is declared once; every consistency condition is
evaluated in `check.mjs` and nowhere else; five exceptions are named in
`invariants.json` with the reason each is genuinely not a token.

## 6. Invariants that were adjectives

The README said the contrast pairs "are the pairs to keep under review" and that
the topbar pair "is the tightest by design… but is the one a contrast linter
should watch." A linter that should exist is not an invariant. Meyer's invariants
attach to the class and hold on every instance; these attached to a sentence.

Computed now, on the resolved token values:

| Pair | Ratio |
|---|---|
| `text.body` on `background.page` | 17.82 |
| `text.heading` on `background.page` | 20.12 |
| `text.secondary` on `background.page` | 5.28 |
| `text.brand` on `background.page` | 4.70 |
| `text.danger` on `background.page` | 4.71 |
| `text.on-brand` on `text.brand` | 4.69 |
| `component.topbar.fg` on `component.topbar.bg` | 4.74 |
| `surface.glass-fg-on-dark` on `background.ink` | 18.60 |
| `surface.glass-fg-muted-on-dark` on `background.ink` | 11.47 |
| `surface.glass-fg-muted-on-light` on `background.page` | 5.28 |

The top-bar pair is not the tightest. `text.on-brand` on `text.brand` clears AA
by 0.19, `text.brand` by 0.20, `text.danger` by 0.21, and the top bar by 0.24.
Three pairs tighter than the one the README singled out were unnamed, and the
brand pair had never been measured at all.

The README's other accessibility claim, that `motion.reduced-duration = 0.01ms`
is "the clamp the `@media (prefers-reduced-motion: reduce)` rule already
applies," was also unchecked; the token was read by nothing.

## 7. One factual correction

The README's weight-synthesis section: *"Neue Haas ships as static 400 and 500
cuts only — there is no weight axis between them."*

`app/layout.tsx` registers eight static cuts: 100, 200, 300, 350, 400, 500, 700,
900. The real constraint is that they are static files with no variable axis, so
nothing between 400 and 500 is reachable by interpolation. The synthesis is still
necessary; the premise it was argued from was wrong.

The synthesis itself is disclosed correctly and remains so, now in the token
description rather than only in prose: every value in `font.weight-synthesis.*`
is a stroke width, the name records the visual target, and any surface showing
one is showing a stroked 400.

---

## Summary

| | Before | After |
|---|---|---|
| DTOS-valid tokens | 0 of 167 | 187 of 187 |
| Typed tokens | 0 | 187 |
| Machine-checked conditions | 2 (unresolved reference, cycle) | 32 |
| Stated rules the artifact broke | 3 of 4 | 0 |
| Values with two homes | 6 | 0 |
| Tokens read by nothing | 91 of 167 | 47 of 187 |
| Contrast pairs measured | 0 | 10 |
| Parity checks | 0 | 6 |

## Deferred, with the reason

- **47 clientless tokens.** Closing them means either deleting the tokens or
  making the components read them. The second is a rewrite of the portfolio
  components away from Tailwind arbitrary values, which is a large diff that has
  nothing to do with the token format. Baselined so it cannot grow.
- **`site-header.tsx` importing its four nav constants** instead of restating
  them. That removes the condition rather than checking it, which is the stronger
  fix, and it is an app change. P1 makes the drift unshippable meanwhile.
- **The display type range (S1, 12 strays).** Extending `font.size` to swallow
  40px, 48px, and 52px would make the check pass without a type decision having
  been made. Recorded instead.
- **`--port-dither-noise`.** An inline SVG data URI. No DTOS type admits it; it
  stays in CSS as a named D1 exception.

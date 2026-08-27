# Ame: the token contract

Ame is the design token system for the portfolio surface. This file states its
conditions. Only conditions. Why a condition exists is in
`decisions.md`; what it currently measures is in `outcomes.md`. Every condition
below is evaluated in exactly one place, `check.mjs`, and nowhere else.

A clause that is not written here does not bind. An implied convention is a
missing clause, and a missing clause admits anything.

**Exits.** A clause either names an override or deliberately has none, and the
difference is recorded rather than left to inference. Most overrides are a waiver
list carrying a reason, or a ratchet baseline that permits a count to hold. The
deliberately exitless clauses are marked `override: none` in `invariants.json` with
the reason: **C1–C15** (a contrast override would let a surface ship unreadable text
with a reason attached, and no reason makes 3:1 body copy legible), **G1** (an
exemption would be a way to ship unfinished work as fact), **Z1 and Z2** (a bijection
with an exception is not a bijection), and **CS2** (above reference white no
specification offers a criterion, so a waiver would argue against nothing).

A wall is a legitimate answer, but it has to be documented as a wall — otherwise
every auditor re-tests it as a door someone forgot to lock. Eleven clauses are
currently neither: CS1, P1c, P1d, P2–P5, U3, U4, AM2 and RC1 carry no exit and no
statement that they should not. That is unfinished, not a category.

## Parties

| | Obligation | Benefit |
|---|---|---|
| **Consumer** (a component, a CSS rule, a build) | Read a value only by its generated name. Do not restate a value it can read. | Gets the value the design decided, resolved, typed, and re-toned whenever the design changes. |
| **Supplier** (this directory) | Emit every token exactly once, resolved, correctly typed, at `:root`. Hold every value the surface uses. | Is free to re-tone, retype, or re-file any token without a consumer changing. |

Each row's obligation is the other row's benefit. A clause with no consumer
obligates nobody; `check.mjs` H1 counts those and `outcomes.md` reports the count.

## Precondition — what a token file must satisfy before the build runs

- **A1** Every token is an object with `$value`.
- **A2** Every token resolves a `$type` from: `color`, `dimension`, `duration`,
  `cubicBezier`, `fontFamily`, `fontWeight`, `number`, `shadow`. Explicit on the
  token, inherited from the closest typed group, or taken from the token it
  references.
- **A3** Every `$value` satisfies the DTOS 2025.10 value schema for its `$type`.
- **A4** Every `{group.token}` reference and every `$ref` JSON pointer resolves,
  and no reference chain is circular.
- **A5** No token or group name begins with `$` or contains `.`, `{`, or `}`.
- **A6** Every path segment matches `^[a-z0-9]+([-_][a-z0-9]+)*$`.

Violating A1, A4, or A2 stops the build. Violating A3, A5, or A6 fails the check.
There is no third behaviour: the build does not repair, warn, or guess.

## Postcondition — what the build guarantees when the precondition holds

- **B1** Every token appears in `packages/ame-tokens/tokens.css` exactly once, at
  `:root`, as `--ame-` plus its path with `.` replaced by `-`. The themed names
  are re-pointed under `[data-theme="dark"]`. (This clause named
  `build/portfolio.tokens.css` and `.portfolio-root` until 2026-08-27; both were
  two versions stale, and B1 is structural, so no check read it and nothing
  could disagree with it out loud.)
- **B2** Every emitted value is a literal in the CSS syntax for its type. No
  emitted value contains an unresolved reference.
- **B3** Every alias in `ALIASES` resolves to exactly one token and emits
  `var(--that-token)`. An alias adds a spelling, never a second home for a value.
- **B4** `packages/ame-tokens/tokens.css` (the published home the portfolio and
  Metis bind) is byte-identical to the versioned artifact under `build/`.
- **B6** Every other emitted artifact — the compiled recipe CSS, the typed
  module, and its declarations — is byte-identical to a fresh build from source,
  the same condition B4 states for the token CSS. A recipe edited without a
  rebuild, or a generated file edited by hand, fails here. A generated artifact
  is committed only under this treatment (STANDARD.md V3); the recipe scopes it
  emits re-declare a token's custom property inside a narrower selector, which is
  not a second home for the value — the value is the token's, resolved once, and
  the scope only says where it applies.

- **B5** Both emitted files stamp the manifest version on their first line:
  `/* ame@<version> · <format> · generated, do not edit */`. The version's single
  home is `ame.json`. A shipped artifact and a bumped manifest cannot silently
  disagree; the check names the stale file and says to rebuild.

## Invariants — properties of the whole system, on every surface

These hold before and after any change to any token, not of any one token.

### L. Layering

- **L1** A base token states a literal. It references nothing.
- **L2** A semantic token references base. The one stated exception: shadow
  geometry (`offsetX`, `offsetY`, `blur`, `spread`) is declared at the semantic
  layer, which is its single home.
- **L3** A component token references semantic or base for `color`, `duration`,
  `cubicBezier`, and `shadow`. It may state a `dimension` or `number` literal,
  because a measure used by exactly one element has no shared scale to sit on.
  This permission is stated so it is not inferred; nothing else may be stated.

- **L4** A recipe token references base, semantic, or component, on the same
  terms L3 gives a component token. It is the value one slot of one component
  takes, so it sits at the bottom of the layering and nothing references it back:
  the layer above a recipe is the element itself.

### N. Naming

- **N1** Path segments are lowercase alphanumerics with `-` or `_` separators.
  `_` marks a fractional step (`unit.1_5`, `font.size.11_9`). The CSS name is
  derived mechanically from the path and is never chosen by hand.

- **N2** One word per concept. A token path and one of the repo's own exported
  symbols do not use two different words for one thing (`bg` and `background`,
  `nav` and `navigation`). The forbidden pairs and the canonical word for each
  concept are in `invariants.json`; a deprecated word in a new identifier fails
  N2, and the legacy names that predate the rule are waived there with the reason
  they cannot move yet. This is STANDARD.md N3 (Deissenboeck's bijection) at token
  scale; vendored code under `components/ui` is out of scope.

### C. Contrast

- **C1–C15** Fifteen foreground/background pairs, each with a required WCAG 2.2
  ratio, computed from the resolved token values. A translucent foreground is
  composited over its background before measuring. The pairs and their minimums
  are in `invariants.json`; the measured ratios are in `outcomes.md`.

### CS. Color space

- **CS1** Every base colour under a perceptual ramp is declared in OKLCH. The
  neutral ramp, the brand pair and danger are chosen by eye along a lightness or
  chroma progression, and OKLCH is the space that keeps those steps even. The fixed
  anchors — ink, paper, white, black, the alpha ladders — stay sRGB, because they are
  exact values rather than points on a ramp. A3 bounds which spaces the *format*
  permits; this states which space these tokens must *use*, which is a different
  claim and does not borrow A3's authority.

  Known reach, stated rather than implied: this proves every base colour under the
  listed prefixes declares `oklch`. It does not prove the ramps are perceptually
  uniform, that the steps are well chosen, or that an sRGB value declared elsewhere
  is not visually part of a ramp — a hex sitting between two neutral steps is
  invisible to this and always will be.

- **CS2** No token's HDR rendition renders brighter than HDR Reference White
  (203 cd/m², Rpt BT.2408-9 §2.1). A token may carry an `org.metis.hdr` anchor, which
  the build emits as `color-hdr(<token> 0, <anchor> N)` behind an `@supports` guard:
  the user agent interpolates between the two by the display's headroom and never
  discloses what that headroom was.

  Why a ceiling and not a ratio. Every C clause measures a WCAG ratio, and WCAG is
  calibrated for a regime whose brightest white *is* reference white — which is the
  definition of SDR, zero stops of headroom. Above reference white no specification
  offers an author-side criterion: the HDR module's entire Accessibility
  Considerations section asks the *user agent* to provide a luminance limit and gives
  authors nothing to measure. So the rule is a bound — stay inside the regime the
  ratios were defined for — and the gain from HDR is taken in chroma rather than in
  brightness, which is the right trade for colours that are type and UI.

  Known reach, stated rather than implied: this proves every declared HDR anchor sits
  at or below the ceiling, and that the headroom-0 anchor is the ordinary token, so
  **C1–C15 go on auditing exactly the colour an SDR display shows, unchanged**. What
  renders *between* the stops is interpolated by the user agent in Absolute D65 XYZ,
  is deliberately not exposed, and has no threshold defined for it by anyone — it is
  unaudited by construction, not by omission. `rec2100-hlg` is refused rather than
  measured, because its white luminance depends on viewing conditions and no ceiling
  is checkable from the declaration. HDR imagery and video carry their own luminance
  and are outside this clause; the reader's *Limit HDR brightness* control reaches
  them, this does not.

  Built against a W3C **Working Draft**, which is inappropriate to cite as other than
  work in progress. The `@supports` guard is what makes that defensible: the spec's
  own §5 heading says `hdr-color()` while its grammar and every example say
  `color-hdr(`, and if engines land the other spelling the block simply never applies.
  See `decisions.md`.

  The clause carries `must_catch` and `must_never_catch` samples per C6, run through
  its own predicate on every run. That is adopted rather than required: nothing in
  `check.mjs` enforces C6 the way `packages/woven/check.mjs` does for itself, and a
  clause written while documenting that gap should not widen it. The check is
  `checkColorSpace`.

### CV. Contrast coverage

- **CV1** A pair a surface renders is a pair a C clause measures. Where a rule
  states both a foreground and a background from tokens, that pair is declared in
  `contrast.pairs` or waived with a reason. C1–C15 fix the ratio of each declared
  pair; this fixes the set of pairs, so a new reading combination cannot ship
  unmeasured. Pair order does not matter: the WCAG ratio is symmetric. Reach, so
  the clause does not overclaim: only a foreground and background stated together,
  in one rule or one inline style object, are visible to it. A background on a
  container with the colour inherited by a child is a rendered pair this clause
  cannot see. Nor is a pair whose colour does not exist until runtime: a component
  computing a value, interpolating one, or taking one from content produces a
  rendered pair that was never in the graph to enumerate. CV1 closes the gap between
  *declared* and *audited*; the gap between *rendered* and *declared* is only closed
  for pairs a static read can find, which is the same limit U1 has and the reason
  neither clause's zero means the property holds everywhere. Alpha fills are composited over the surface's declared ground
  before measuring: a translucent background states its pigment, not the colour
  anyone reads, so the pair carrying the requirement is the foreground against
  the ground beneath (`contrast.darkGround` holds that ground, one per theme). A C
  clause measuring foreground-on-ground therefore covers a surface that paints
  that foreground on a fill above it.

### P. Parity

A value with a second home in hand-written source. Each clause names the file,
the literal, and the token that owns the value; the data is
`invariants.json > parity` and the check is in `check.mjs`.

This section declared `P1-P3` over "four nav constants" while the data held
six entries under P1c, P1d, P2, P3, P4 and P5. Three ids the gate can emit were
therefore undeclared, which also made them invisible to the Z1 census — the
census walks contract-declared ids, so a clause the contract does not name is a
clause the bijection cannot miss.

- **P1c** `components/portfolio/site-header.tsx` holds `const LOGO_GAP = <n>`, which must equal `component.nav.logo-gap` read as px. The token is the home; the literal is a second one and may only agree with it.
- **P1d** `components/portfolio/site-header.tsx` holds `const NAV_OFFSET_FALLBACK = <n>`, which must equal `component.nav.offset-fallback` read as px. The token is the home; the literal is a second one and may only agree with it.
- **P2** `components/portfolio/site-header.tsx` holds `gap-[<n>rem]`, which must equal `component.nav.item-gap` read as rem. The token is the home; the literal is a second one and may only agree with it.
- **P3** `components/portfolio/*.tsx` holds `strokeWidth={<n>}`, which must equal `font.icon-stroke` read as number. The token is the home; the literal is a second one and may only agree with it.
- **P4** `components/logo-bounce.tsx` holds `export const LOGO_CYCLE_MS = <n>`, which must equal `component.splash.cycle` read as ms. The token is the home; the literal is a second one and may only agree with it.
- **P5** `components/portfolio/loading-screen.tsx` holds `const FADE_MS = <n>`, which must equal `component.splash.fade` read as ms. The token is the home; the literal is a second one and may only agree with it.

### KW. Keyword evidence

- **KW1** Every résumé keyword that carries a link points at an anchor that
  exists, in a file that exists, holding the text the link says it holds. Two
  anchor kinds: a `<Kw id="…">` wrapper in hand-written MDX, whose inner text
  must contain the declared evidence; and a heading id on a generated docs page,
  whose heading must be present in the source. Every `<Kw>` in content is also
  claimed by a keyword, so an anchor cannot be orphaned by a link being removed.
  The map is `lib/portfolio/keywords.ts` and is the single home; nothing here or
  in `check.mjs` restates a keyword, a route, or a phrase.

  A keyword in the grid is a claim about the owner. A linked keyword is a claim
  with an address, and this clause is what stops the address going stale — the
  same rule the token gate applies to values, applied to claims. A keyword with
  no example ships unlinked rather than pointing somewhere weak: this clause
  governs the links that exist, and never manufactures one.

### FX. The gate is seen to fail

- **FX1** Two fixtures live in `examples/`. The compliant one sits inside the
  real scan surfaces and carries the same obligations as any other source, so a
  clause that changes must still admit it or the change is not finished. The
  violating one carries deliberate mistakes and is out of normal scope;
  `check.mjs --fixtures` puts it in, and `tokens/gate-fixtures.mjs` runs that and
  passes only when the gate rejected it — checking *which* clauses fired against
  `invariants.json > fixtures.expect`, not merely that something did.

  The inversion lives in the runner and nowhere else, so the gate itself has no
  mode in which failing is success. A gate that has never been seen to fail is
  indistinguishable from one that cannot, and every clause here is otherwise
  proven only in the direction that passes.

### D. One home per value

- **D1** A generated custom property is not re-declared in hand-written CSS.
- **D2** A hand-written literal in a scanned surface that equals a resolved token
  value fails, named alongside the token it collides with. The scan roots and the
  value comparison are data in `invariants.json > restated`; the check is
  `checkRestated` in `check.mjs`. Drift is ratcheted downward only.

  D2 was enforced, baselined, and asserted by the violating fixture while being
  declared nowhere: absent from this file and therefore absent from the Z1
  census, which walks contract-declared ids. An undeclared check is invisible to
  the bijection that exists to catch exactly that, so the clause the README
  quotes as the system's headline claim was the one clause the census could not
  see. Declared 2026-08-27.

- **D3** Pattern syntax in rule data does not grow. A regex written as text into a
  data file has to cross a serialization boundary to reach the code that runs it,
  and six defects in one evening came from an escape being eaten or reinterpreted
  on that crossing, silently, because a wrong pattern still parses (R-86).
  The rule these sites migrate toward is that rule data holds literal text
  and pattern syntax is assembled in code, where the escape characters exist once
  and are tested (R-86). The files listed in `pattern_escapes.sites` predate it and are held
  at their current count, not forgiven: a new pattern typed into them fails, and a
  migration that removes one lowers the number for good. X1 governs the number
  itself.
  Five names are excepted and each exception is written out in
  `invariants.json > duplication.allowed_because`.

### S. Scale membership

- **Z5** Every property declared *ramped* names the clause that watches it. A ramp
  with no clause fails the build at the moment it is declared, which is the cheapest
  time to find it. `invariants.json > coverage` is the denominator: `ramped` lists the
  properties that have a scale and must never carry a literal, `layout` lists those
  that deliberately have none and why, and `appeal` names what moves a property
  between them. Before this existed a grep returned 172 arbitrary values with nothing
  to distinguish debt from deliberate, so the incumbent reading — all of it is debt —
  won by default.

  This clause exists because every earlier gap was found by accident. Leading had a
  ramp and no clause for the whole of its existence; tracking, easing, px spacing,
  backdrop-blur and breakpoint were the same, and three of those five were surfaced
  not by anyone's list but by asking whether the boundary file could classify every
  literal without a judgment call. Z5 turns that from an audit someone remembers to
  run into a condition the build holds.

- **S1–S12** Every font-size, spacing (rem and px), radius, duration, z-index,
  fractional opacity, line-height, letter-spacing, backdrop-blur, breakpoint, and
  easing literal in portfolio source is a member of the corresponding scale.
  Reported as a measured count with a baseline rather than as a hard failure,
  because a Tailwind arbitrary-value class can introduce a literal without touching
  this directory. The count must not grow.

  S6 covers opacity and was added when the colour decision's claim to *centralize
  operational states* turned out to be a convention: a surface could write
  `opacity: 0.4` — the exact value of `state.opacity-disabled` — and no clause
  objected. D2 could not, because it indexes only values carrying three or more
  numbers and scans one file; S1–S5 had no opacity scale; U1 sees `var()` calls, not
  literals. `0` and `1` are excluded by the pattern rather than by an exception list:
  they are the identity values, which no scale owns, and they appeared 44 times in
  this surface as structural facts rather than decisions. Matching only `0.x` keeps
  the clause on the values someone actually chose. S6's matcher is assembled in
  `check.mjs` from a literal property name rather than typed into `invariants.json`
  as a regex — D3 counts a new pattern in rule data, and S1–S5 predate that rule
  rather than licensing more of it.

  What S6 does **not** do, stated so it is not rediscovered: it enforces that a value
  is a legal member of the scale, not that a surface bound the token instead of
  retyping it. `opacity: 0.4` passes, because 0.4 *is* `state.opacity-disabled`.

  S7 covers line-height, and it was the one scale with a ramp and no clause. The
  leading ramp shipped with the token layer; nothing ever held anything to it, so
  values sat off it unseen for as long as it existed. Converting arbitrary Tailwind
  values into token references is what surfaced it — `1.6` and `1.5` turned out to be
  real ramp members, while `1.45`, `1.3` and `1.1` were on no scale at all. Unlike S6
  it is **not** `fractional_only`: a leading value is a ratio above 1, so the `0.x`
  pattern that keeps identity values out of the opacity clause would have matched
  none of them and the clause would have reported a confident zero.

  Known reach: S7 reads the Tailwind utility form and the CSS-property form. A value
  written as a style-object `lineHeight` would pass unseen. There are none in the
  scanned surfaces today, so nothing is currently lost to that gap — which is a fact
  about this moment, not a property of the clause.
  Centralization is D2's shape, and D2 cannot reach a single-number value: its
  `min_numbers: 3` exists to stop coincidental matches on every `16` and `0.4` in the
  tree, so lowering it trades one false negative for many false positives. The check
  that would close this reads the *resolved* CSS and compares computed values against
  the token table, catching a retyped value without touching D2's threshold — at the
  cost of running post-emit, after `next build`, where the rest of this gate runs
  before it. That is why it is not built, and it is a statement about the current
  representation rather than about the problem.

### G. Shipped state

- **G1** No placeholder survives into the emitted app tree. Evaluated only when
  `check.mjs` is called with `--shipped`, after `next build`, over
  `.next/server/app`. The pattern lives in `invariants.json`, never as a literal
  in the checker. `STANDARD.md` C5 states the same condition at repo scope; this
  is its one evaluation site. A placeholder says on its face that the page is
  unfinished, so a red G1 is the standard working, not a bug to route around.

### U. Binding paths and the uses-graph

- **U1** No file under `app/(portfolio)/` or `components/portfolio/` reads a
  base-tier custom property through `var()`. Surfaces bind semantic and
  component tokens; only tokens bind base tokens. The base-name set is derived
  from the token tree when the check runs, so adding a base token extends the
  tripwire with no list to maintain. An alias is not a base name: an alias is a
  spelling a surface is meant to bind. Counted like the scales, target 0.

  Known reach, stated rather than implied: this proves no scanned file contains a
  literal base-name reference. It does not prove no surface reaches a primitive. A
  count of 0 is produced equally by a tree with no violations and by a scan that had
  nothing to find — a surface path pointing somewhere real but reference-free, a
  `var()` composed at runtime, a base name spelled through a variable. Z3 closes the
  first of those by failing on a scan root that does not exist; a path that exists and
  contains no `var()` at all still reads 0 and still passes. What would close it is
  not a larger count but a mutation: inject a base binding and require the clause to
  fail. Until that exists, read this clause as *no literal base-name reference was
  found in what was scanned*, and treat the scope list as part of the claim.

- **U2** No file under `app/` or `components/` reads a base-tier custom property.
  U1 is this rule on the portfolio surface; U2 is the same rule on the rest of
  the tree, so together they cover every surface. The base-name set is derived,
  not restated (base and semantic share first segments, so a prefix list would
  misclassify a semantic token). Vendored `components/ui` is out of scope (R-8).
  Five reads in `components/ame/` (the shared chrome, R-12) are waived by name in
  `invariants.json` with the reason and the follow-up order; a sixth read fails.

- **U3** No `lib/` module imports from `app/`. In the layered uses-graph `lib`
  sits below `app`, so a `lib`→`app` edge would make the graph cyclic. This is
  Parnas's acyclic uses-graph as a machine check (STANDARD.md M).

- **U4** No file under `app/(portfolio)/` or `components/portfolio/` imports a
  `lib/*-tokens` module. The portfolio DTOS token system and the `lib/*-tokens`
  `/system` design system are two homes for "design tokens", adjudicated as two
  concepts (DECISIONS R-25). A portfolio-surface import of a `lib/*-tokens`
  module would merge them into a hidden third binding; U4 keeps the two two.

- **U5** Definition scope covers reference scope. A stylesheet that loads on every
  route may only read a custom property this repo defines in a stylesheet that also
  loads on every route. The failure this prevents is silent by construction: an
  undefined `var()` is not an error, the declaration is dropped, and the page loses
  the value with nothing said. Caught by hand at R-140 — `@theme` loads globally,
  `--ame-unit-1` was emitted into a sheet only the portfolio route group imports, and
  wiring Tailwind's spacing to it would have collapsed spacing on every docs page.
  The rule generalises the near-miss: plumbing must be at least as wide as the
  government drawing from it. Only properties this repo defines are judged; one owned
  by a dependency is that dependency's to scope. An intended asymmetry is recorded in
  `invariants.json > css_scope.exempt` with its reason.

### RC. Recipes

A recipe is one component's styling contract: the slots it dresses, and the axes
those slots vary along. The axes are DTCG **Resolver 2025.10** modifiers and
their contexts are the values an axis takes, so the variant model is the
standard's rather than a second one invented here. `resolver.json` is the single
home of both; `recipe/*.json` holds the values. Data in `invariants.json >
recipes`, evaluated in `checkRecipes`.

- **RC1** Every recipe token path is exactly `recipe.<name>.<slot>.<property>`,
  its `<name>` a recipe the resolver declares and its `<slot>` one that recipe
  declares. Every recipe names an element that exists and a root class. Every
  `var()` inside a structural declaration names a token or an alias this build
  emits, so the part of a recipe that has no DTOS type still cannot drift from
  the token layer. A system with no recipes at all fails rather than passing
  vacuously (STANDARD.md C6: a check whose silence is load-bearing proves it can
  still find something).

- **RC2** The resolver document satisfies the module it claims. Its `version` is
  the one this build implements. Every `$ref` resolves. Every set source is a
  token file on disk and every token file on disk is a set source, so a file
  cannot be invisible to the resolver or named after it is gone. Every modifier
  declares at least the minimum contexts (one context is a set, which the spec
  says a modifier must not be) and a `default` that is one of them. No modifier
  references another modifier, and nothing references `resolutionOrder` — both
  forbidden by the spec because they make a single input apply to axes it was
  never given. Every set and modifier appears in `resolutionOrder` exactly once.

- **RC3** A component a recipe dresses binds the generated types. It imports the
  typed module, and it does not restate any axis's contexts as a hand-written
  union: the axis is declared once, in the resolver, and the prop takes its type
  from there. This is the clause that keeps a variant from going back to being a
  loose string — a context added to an axis widens the prop with no edit here,
  and one removed breaks every caller still passing it.

### X. The record

- **X1** A number in `baseline.json` never sits above what the last logged run
  in `runs.log` measured for that key. A baseline moves down, in the same change
  as the run that earned it, and that run is in the log.

### H. Clients

- **H1** Every token has at least one client: a `var()` in source, another
  token's reference, an alias, or a named invariant that reads it. A closed
  scale is consumed whole by the check that admits nothing outside it, so the
  checker is a real client. The count of clientless tokens must not grow.

### AM. The /ame brand taxonomy and registry

The `/ame` brand design system's structure, checked. `/ame` is the sole
documentation area (the former `/system` workshop was removed with its
`content/docs` tree). Its registry (`content/ame/component-registry.json`) is the
single home its docs and these checks read; its taxonomy's home is
`content/ame/meta.json`. Data in `invariants.json > ame_registry` and
`> ame_taxonomy`; evaluated in `checkAmeTaxonomyRegistry` in `check.mjs`. Decisions
R-55, R-57.

- **AM1** Every `.tsx` file under `components/ame/` and `components/portfolio/`,
  minus the recorded exclusion set (`ame_registry.excluded`: context providers
  and pure-logic sinks that are not documentable UI), has exactly one `/ame`
  registry row keyed by its source path, and every row points at a real file and
  carries exactly one tier drawn from the six `/ame` taxonomy tiers. A row may
  point at a file outside the scan dirs (the prototype viewer
  `components/prototype-viewer/viewer.tsx`) as long as it resolves and its
  tier is valid. A component with no row, a duplicate row, an excluded file that
  still carries a row, or a row with an unknown tier or a dangling source fails.
  This is the identifier-dictionary bijection (STANDARD.md N3) at `/ame`
  component scope: one component, one home, one tier.

- **AM2** Every declared `/ame` tier is non-empty (at least one page under its
  separator in `meta.json`) or carries a recorded `deferred_because`. A tier is
  populated or deferred with a reason, never silently absent. STANDARD.md H3 at
  `/ame` docs-taxonomy scope.

- **AM3** Every `/ame` registry row that is `animated: true` AND at status
  `documented` resolves to a `playground` reference that exists. This session
  every animated row is at status `deferred`, so AM3 passes vacuously; it binds
  in Phase 3, when a documented animated component must name a live playground.
  Stated now so the clause, its data, and its check land together, not bolted on
  when Phase 3 arrives.

### K. Asset weight

- **K1** Every file under `public/` sits within a byte ceiling for its class:
  SVG, font, image, model, video. The ceilings, the extension-to-class map, the
  deliberately unweighed extensions, and the per-file waivers are data in
  `invariants.json > asset_budget`; the check is `checkAssetBudget` in
  `check.mjs`, evaluated in the gate. A file over its class ceiling is a
  violation. So is a file whose extension belongs to no class and is not listed
  in `asset_budget.unweighed`: the world is closed, and an unclassed asset stops
  the line rather than passing unweighed. That sentence used to be false. The
  check skipped anything `classOf` could not place, so `.mp4` — in no class —
  was never weighed, and `video/sheet-loop.mp4` grew to 5.9 MB, larger than the
  GLB this clause was written to catch and the element `/portfolio`'s LCP
  resolves against, while K1 reported green on the four classes it happened to
  know about. An asset that already exceeds its ceiling is
  waived at its current byte size and may not grow past it: the X1 ratchet
  applied to bytes, so a waiver only moves down, in the reduction order that
  owns it. This is the performance budget the deliverables standard names as a
  gate instrument (`deliverables.md`, "the contrast check and performance
  budget"), so the 25 MB-SVG / 82 MB-GLB class of regression cannot land
  silently. WO-8.6, decision R-40.

- **K2** Every model contract states the content hash of the glb it points at,
  and that hash is the file's. The contracts directory, the public root, the
  hash algorithm and the recorded prefix width are data in
  `invariants.json > model_versioning`; the check is `checkModelVersioning` in
  `check.mjs`. The clause exists because `next.config.mjs` serves
  `/models/:path*` as `public, max-age=31536000, immutable`, which promises a
  browser that the bytes at that URL will not change for a year, and the path
  carried no version to make that true. It was false in this repo, not in
  theory: `iphone17-pro.glb` went 82,689,464 to 4,340,480 B under the same name
  after the 82 MB version had already shipped under that header, so a visitor
  holding it keeps it into 2027 and no deploy reaches them. `modelRequestUrl`
  now requests the file at `?v=<contentHash>`, which makes new bytes a new cache
  key; K2 is what stops that constant drifting from the file it versions, since
  a forgotten hash restores the original bug silently. Withdrawing the header
  instead is not a fix and the clause should not be read as preferring it:
  `max-age=31536000` alone already serves a stale copy for a year unasked, and
  `immutable` only additionally suppresses the revalidation a manual reload
  sends. A file that does not exist, a hash of the wrong shape, a contract
  missing either field, and finding no contract at all are each violations --
  the last one because a check that measures nothing must not report green,
  which is the failure K1 shipped with. Decision R-193.

### LC. The licence

- **LC1** The licence has one identifier and every file that declares it agrees.
  The SPDX id, the declaring files, and the string each must contain are data in
  `invariants.json > licence`; the check is `checkLicence` in `check.mjs`,
  evaluated in the gate. A declaring file that is missing, that does not state
  the licence, or that still names a superseded one beside the word licence is a
  violation. Only the declaring files are read: `CHANGELOG.md`, `DECISIONS.md`,
  `docs/orders/` and the dated preflight correctly still say MIT, because they
  record what was true when they were written and rewriting history to agree
  with a new licence would be a worse falsehood than the drift this catches.
  `licence.docs_covered` names the four prose documents offered under CC BY 4.0
  as well; each must exist, or the second offer points at nothing.

  The clause was written the day the licence moved from MIT to Apache-2.0, and
  it failed on its first run against a tree that had already been changed by
  hand -- the package README still read "MIT, stated in LICENSE". Eight
  declarations, seven of them updated, and seven is indistinguishable from eight
  until a stranger reads the eighth. That is the README-figures failure in a
  place where being wrong costs more than a stale number.


### Z. The bijection census

The contract, its data, and its checker are meant to be one rule in three homes:
a clause here, its values in `invariants.json`, its logic in `check.mjs`. Section
Z checks that correspondence itself, so the bijection is enforced by the gate
rather than by discipline. WO-9.1, decision R-50.

- **Z1** Every clause declared in this file has a census record in
  `invariants.json > census.clauses` naming the `invariants.json` key that holds
  its data and the `check.mjs` function that evaluates it, or a `structural`
  waiver naming the `build.mjs` mechanism that enforces it instead (the
  preconditions `build.mjs` throws on, and the postconditions it emits, have no
  `check.mjs` branch and are waived by name). A clause with no record, a record
  naming an absent invariants key or an absent check function, or a stale record
  for a clause this file no longer declares, fails Z1. The check is `checkCensus`.

- **Z2** No threshold literal is hardcoded in `check.mjs`. A value a clause
  compares against lives in `invariants.json` and the checker reads it, never
  restates it (`deliverables.md`: the gate imports its thresholds). The scan
  flags a decimal literal or an integer at or above `census.threshold_scan.min_integer`
  in checker code, after stripping comments, strings, and regex literals, unless
  the number is in `census.threshold_scan.allow`. The check is `checkThresholdScan`.

- **Z3** No clause measures over a denominator that is not there. A check whose scan
  root does not exist reads zero files, finds zero violations and passes, reporting a
  health nothing established — the shape of a green gate that checked nothing. Every
  path a clause hands `walkFiles` is recorded there, in the primitive rather than in
  the clauses, because a guard each author has to remember is discipline moved from
  the rule-follower to the rule-writer rather than removed; recording it once covers
  all sixteen scanning clauses and the ones not yet written. A recorded path that does
  not exist fails Z3 unless it is named in `census.denominator.allow_missing` with its
  reason. This proves a scan root exists, not that it holds anything: an empty but
  present directory still yields a zero, and the stronger form is a per-clause
  candidate count the census requires each clause to record. The check is
  `checkDenominator`.

- **Z4** Every allowlisted exception in the census names its reason, and the number of
  them only goes down. An allowlist is where a clause admits it cannot judge
  something, which makes it the cheapest way to silence a failing check: an entry
  costs a line and buys silence forever. So an entry must carry a non-empty reason —
  anonymous exceptions cannot be retired, because nobody can say what they bought —
  and the total across every census allowlist is recorded as drift, which puts it
  under the same one-way constraint as every other measured number in
  `baseline.json`. The lists may be emptied, never extended. Allowlists are found by
  shape, any census key named `allow` or `allow_something`, rather than by a registry
  the next author would have to remember to join. This covers the census's own
  allowlists, not the exemption lists elsewhere in `invariants.json`. The check is
  `checkAllowlists`.

## What does not belong in this file

Reasoning belongs in `decisions.md`. Measurements belong in `outcomes.md`.
Procedure belongs in `README.md`. A condition stated here and restated as a
comment, a lint rule, or a second assertion elsewhere is a redundant check: it
can fail on its own, and then two sources disagree about one rule. One home.

## Spec gaps

Three places where DTOS 2025.10 has no expression for a value this surface uses.
Each is disclosed rather than faked.

1. **`em` is not a DTOS dimension unit.** `dimension` admits `px` and `rem` only.
   Tracking and the weight-synthesis strokes are in `em` because they must scale
   with font size. They are typed `number` and carry
   `$extensions["org.metis.css"].unit = "em"`, which the build appends.
2. **`vh` is not a DTOS dimension unit.** `component.ask-ai.raise` is typed
   `number` with the same extension mechanism.
3. **`$extensions` inheritance is not specified.** DTOS defines `$type`
   inheritance from a group and through a reference; it says nothing about
   `$extensions`. This build applies the same two rules to `$extensions`, so a
   semantic token that references `font.tracking.tight` emits `em`. That is this
   build's own rule, not the spec's.

4. **No asset type.** The grain is an SVG data URI, which no DTOS type admits.
   Rather than leave it hand-written, its four parameters are tokens
   (`dither.strength`, `.frequency`, `.octaves`, `.tile`) and `build.mjs`
   serializes them into the feTurbulence URI it emits as `--ame-dither-noise`.
   That is one emitted custom property which is not a token — the single
   exception to "every emitted name is a token" — and it is derived, so it
   cannot drift from the numbers that define it.

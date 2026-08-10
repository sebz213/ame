# Ame: the token contract

Ame is the design token system for the portfolio surface. This file states its
conditions. Only conditions. Why a condition exists is in
`decisions.md`; what it currently measures is in `outcomes.md`. Every condition
below is evaluated in exactly one place, `check.mjs`, and nowhere else.

A clause that is not written here does not bind. An implied convention is a
missing clause, and a missing clause admits anything.

## Parties

| | Obligation | Benefit |
|---|---|---|
| **Consumer** (a component, a CSS rule, a build) | Read a value only by its generated name. Do not restate a value it can read. | Gets the value the design decided, resolved, typed, and re-toned whenever the design changes. |
| **Supplier** (this directory) | Emit every token exactly once, resolved, correctly typed, under `.portfolio-root`. Hold every value the surface uses. | Is free to re-tone, retype, or re-file any token without a consumer changing. |

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

- **B1** Every token appears in `build/portfolio.tokens.css` exactly once, under
  `.portfolio-root`, as `--` plus its path with `.` replaced by `-`.
- **B2** Every emitted value is a literal in the CSS syntax for its type. No
  emitted value contains an unresolved reference.
- **B3** Every alias in `ALIASES` resolves to exactly one token and emits
  `var(--that-token)`. An alias adds a spelling, never a second home for a value.
- **B4** `packages/ame-tokens/tokens.css` (the published home the portfolio and
  Metis bind) is byte-identical to the versioned artifact under `build/`.
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

- **C1–C10** Ten foreground/background pairs, each with a required WCAG 2.2
  ratio, computed from the resolved token values. A translucent foreground is
  composited over its background before measuring. The pairs and their minimums
  are in `invariants.json`; the measured ratios are in `outcomes.md`.

### CV. Contrast coverage

- **CV1** A pair a surface renders is a pair a C clause measures. Where a rule
  states both a foreground and a background from tokens, that pair is declared in
  `contrast.pairs` or waived with a reason. C1–C10 fix the ratio of each declared
  pair; this fixes the set of pairs, so a new reading combination cannot ship
  unmeasured. Pair order does not matter: the WCAG ratio is symmetric. Reach, so
  the clause does not overclaim: only a foreground and background stated together,
  in one rule or one inline style object, are visible to it. A background on a
  container with the colour inherited by a child is a rendered pair this clause
  cannot see.

### P. Parity

- **P1–P3** A value with a second home in hand-written source. The token is the
  home; the literal must equal it. Currently: four nav constants in
  `site-header.tsx`, the rendered nav flex gap, and the lucide `strokeWidth` on
  every icon.

### D. One home per value

- **D1** A generated custom property is not re-declared in hand-written CSS.
  Five names are excepted and each exception is written out in
  `invariants.json > duplication.allowed_because`.

### S. Scale membership

- **S1–S5** Every font-size, spacing, radius, duration, and z-index literal in
  portfolio source is a member of the corresponding scale. Reported as a
  measured count with a baseline rather than as a hard failure, because a
  Tailwind arbitrary-value class can introduce a literal without touching this
  directory. The count must not grow.

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
  SVG, font, image, model. The ceilings, the extension-to-class map, and the
  per-file waivers are data in `invariants.json > asset_budget`; the check is
  `checkAssetBudget` in `check.mjs`, evaluated in the gate. A file over its
  class ceiling is a violation. An asset that already exceeds its ceiling is
  waived at its current byte size and may not grow past it: the X1 ratchet
  applied to bytes, so a waiver only moves down, in the reduction order that
  owns it. This is the performance budget the deliverables standard names as a
  gate instrument (`deliverables.md`, "the contrast check and performance
  budget"), so the 25 MB-SVG / 82 MB-GLB class of regression cannot land
  silently. WO-8.6, decision R-40.

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
   serializes them into the feTurbulence URI it emits as `--port-dither-noise`.
   That is one emitted custom property which is not a token — the single
   exception to "every emitted name is a token" — and it is derived, so it
   cannot drift from the numbers that define it.

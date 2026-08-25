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
- **A3** Every `$value` satisfies the DTCG 2025.10 value schema for its `$type`.
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
  cannot see. Alpha fills are composited over the surface's declared ground
  before measuring: a translucent background states its pigment, not the colour
  anyone reads, so the pair carrying the requirement is the foreground against
  the ground beneath (`contrast.darkGround` holds that ground, one per theme). A C
  clause measuring foreground-on-ground therefore covers a surface that paints
  that foreground on a fill above it.

### D. One home per value

- **D1** A generated custom property is not re-declared in hand-written CSS.
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


### X. The record

- **X1** A number in `baseline.json` never sits above what the last logged run
  in `runs.log` measured for that key. A baseline moves down, in the same change
  as the run that earned it, and that run is in the log.

- **X2** Every scan root a clause declares in `invariants.json` exists on disk.
  A clause whose root is missing walks an empty tree, finds nothing, and reports
  green — so a surface that moves or is left behind turns a real check into a
  vacuous one without any file looking wrong. The failure this forbids is not a
  broken check but a silent one: a check that cannot fail is not a check. The
  root list is derived from the same keys the clauses read, never restated, so a
  clause cannot acquire a root that X2 does not watch.

### H. Clients

- **H1** Every token has at least one client: a `var()` in source, another
  token's reference, an alias, or a named invariant that reads it. A closed
  scale is consumed whole by the check that admits nothing outside it, so the
  checker is a real client. The count of clientless tokens must not grow.

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

Three places where DTCG 2025.10 has no expression for a value this surface uses.
Each is disclosed rather than faked.

1. **`em` is not a DTCG dimension unit.** `dimension` admits `px` and `rem` only.
   Tracking and the weight-synthesis strokes are in `em` because they must scale
   with font size. They are typed `number` and carry
   `$extensions["org.metis.css"].unit = "em"`, which the build appends.
2. **`vh` is not a DTCG dimension unit.** `component.ask-ai.raise` is typed
   `number` with the same extension mechanism.
3. **`$extensions` inheritance is not specified.** DTCG defines `$type`
   inheritance from a group and through a reference; it says nothing about
   `$extensions`. This build applies the same two rules to `$extensions`, so a
   semantic token that references `font.tracking.tight` emits `em`. That is this
   build's own rule, not the spec's.

4. **No asset type.** The grain is an SVG data URI, which no DTCG type admits.
   Rather than leave it hand-written, its four parameters are tokens
   (`dither.strength`, `.frequency`, `.octaves`, `.tile`) and `build.mjs`
   serializes them into the feTurbulence URI it emits as `--port-dither-noise`.
   That is one emitted custom property which is not a token — the single
   exception to "every emitted name is a token" — and it is derived, so it
   cannot drift from the numbers that define it.

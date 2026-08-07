# Ame: design tokens for the portfolio surface

Ame is a three-layer token system in the Design Token Open Standard format (DTOS
2025.10). It holds every value the surface renders through: colour, spacing,
typography, radii, elevation, motion, glass, and stacking.

```
tokens/
├─ ame.json                the manifest. The version every artifact stamps.
├─ contract.md             the conditions. Precondition, postcondition, invariants.
├─ decisions.md            the reasoning. Why a condition is what it is.
├─ outcomes.md             the numbers. What the checks currently measure.
├─ deliverables.md         the Case Study Deliverable Standard, and this repo's status against it.
├─ invariants.json         the conditions, machine-readable. One entry per clause.
├─ baseline.json           the drift counts a change must not exceed.
├─ runs.log                append-only history of gate runs.
│
├─ base/                   primitives. color, space, type, shape, motion, effect.
├─ semantic/               decisions, each a reference to a primitive.
├─ component/              element-specific, referencing semantic.
│
├─ ame.mjs                 the command. Routes, and routes only.
├─ build.mjs               transforms. Does not judge.
├─ check.mjs               judges. Every condition, evaluated once, here.
├─ dipstick.mjs            measures. Read-only; writes one export and nothing else.
├─ dipstick.schema.json    the export's shape, single home.
├─ dipstick/               dated state exports. The listing is the history.
└─ build/portfolio.tokens.css   GENERATED
```

Four homes for four kinds of statement, and each condition, reason, number, and
procedure lives in exactly one of them. A rule written twice can disagree with
itself.

Also binding, outside this directory: [`STANDARD.md`](../STANDARD.md) (the repo
standard), [`CLAUDE.md`](../CLAUDE.md) (the session contract every agent reads
first), and [`RUNBOOK.md`](../RUNBOOK.md) (the three operator procedures).

## Running it

```bash
pnpm ame build      # emits build/portfolio.tokens.css and packages/ame-tokens/tokens.css (the published home)
pnpm ame check      # every invariant; exit 1 on a violation or on drift growth
pnpm ame dipstick   # a dated export of what all 13 deliverables currently are
pnpm build          # the gate: build, check, next build, check --shipped
```

The build throws rather than emit a partial file. The check prints the contrast
table, the drift counts against `baseline.json`, and any violation, then appends
one line to `runs.log`. Zero dependencies, all of them.

## The three layers

- **Base** states literals. `color.ink`, `unit.6`, `duration.moderate`.
- **Semantic** references base. `text.body → {color.ink}`,
  `space.section-gap → {unit.14}`. Its one stated exception is shadow geometry.
- **Component** references semantic, and may state a dimension or number of its
  own, because a measure used by one element has no shared scale to sit on.

A reference points down a layer, never up or sideways (L1–L3). A surface binds
semantic and component, never base (U1). Both are checked.

## Changing something

Edit a **semantic** reference when one role should move. Edit a **base**
primitive when the whole system should re-tone: every shadow, ring, and pill fill
is a pointer into `color.ink`, so re-toning it moves all of them at once.

Then run the check. If a contrast pair drops below its minimum or a drift count
grows, the change stops there. `RUNBOOK.md` procedure 1 is the full path.

Never add a value to `portfolio.css` that a token could hold. That is a second
home, and D1 fails on it.

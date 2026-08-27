# Outcomes

Numbers. The Size block below is generated from the tree by `pnpm numbers` and
verified on every push by `pnpm numbers:check`, so it cannot outlive what it
counts. It read 253 tokens against a tree measuring 339, dated 2026-08-10, and
cited `pnpm tokens:check`, a script that no longer exists. The conditions that
produced them are in `contract.md`; why they are what they are is in
`decisions.md`.

Every number below is the gate's own output, re-read on the measuring date. The
census had drifted before this pass — it reported 216 tokens, H1 32, and S2 34
against a tree measuring 253, 18, and 0 — which made the one document whose job
is "what these numbers mean" the least current thing in the directory. A census
nobody re-reads is a second home for counts `baseline.json` already holds, so the
measuring date belongs in the heading and the run belongs in `runs.log` (R-70).

## Size

<!-- numbers:start -->

Measured on the tree that ships, by the commands shown, and regenerated from it
rather than typed. `pnpm numbers:check` re-runs every command on every push. So
these figures describe **this commit**, which is a stronger claim than a date,
and one that cannot quietly go stale.

| | | |
|---|---|---|
| Tokens | 339 | `pnpm gate` header |
| Contrast pairs | 19, both themes, all passing their minimums | `pnpm gate` contrast table |
| Emitted CSS | 485 lines | `wc -l packages/ame-tokens/tokens.css` |
| Decisions | 15, dated | `grep -c "^## D-" tokens/decisions.md` |
| Tokens with no consumer here | 94 of 339 | `pnpm gate` H1 line |

<!-- numbers:end -->

The one violation is AM1: `components/portfolio/expertise-card.tsx` has no `/ame`
registry row. It is the open edge of the card-extraction work, not a token defect.

## Contrast (C1–C10, and their dark twins)

Computed from the resolved token values: oklch to linear-light sRGB, translucent
foregrounds composited over their background, WCAG 2.2 relative-luminance ratio.
Each `role: reading` pair is measured a second time as it resolves under
`[data-theme=dark]`, reported as `Cn-dark`, against the same minimum.

| | Pair | Ratio | Min |
|---|---|---|---|
| C1 | `text.body` on `background.page` | 18.60 | 7 |
| C1-dark | `text.body-on-dark` on `background.ink` | 18.60 | 7 |
| C2 | `text.heading` on `background.page` | 21.00 | 7 |
| C2-dark | `text.heading-on-dark` on `background.ink` | 18.60 | 7 |
| C3 | `text.secondary` on `background.page` | 5.51 | 4.5 |
| C3-dark | `text.secondary-on-dark` on `background.ink` | 7.15 | 4.5 |
| C4 | `text.brand` on `background.page` | 4.90 | 4.5 |
| C5 | `text.danger` on `background.page` | 4.91 | 4.5 |
| C6 | `text.on-brand` on `text.brand` | 4.69 | 4.5 |
| C7 | `component.topbar.fg` on `component.topbar.bg` | 4.74 | 4.5 |
| C8 | `surface.glass-fg-on-dark` on `background.ink` | 18.60 | 4.5 |
| C9 | `surface.glass-fg-muted-on-dark` on `background.ink` | 11.47 | 4.5 |
| C10 | `surface.glass-fg-muted-on-light` on `background.page` | 5.51 | 4.5 |

Two pairs now clear AA by less than 0.25: C6 (0.19) and C7 (0.24). C4 and C5,
which were inside that band at 0.20 and 0.21, moved out to 0.40 and 0.41 when
`background.page` went to pure white. The tightest pair is C6, `text.on-brand` on
`text.brand` — both ends are brand colours, so it is the one pair a brand re-tone
moves from both sides at once. A colour change to `brand`, `danger`, or
`neutral.500` fails the check rather than shipping.

Sanity: the old check here was pure white on `background.page` reading 1.04.
`background.page` is now `#ffffff`, so that pair reads exactly 1.00 and no longer
discriminates. Replaced with an independent recomputation: `text.body` (#101319)
on white gives 18.60 and `text.heading` (#000000) on white gives 21.00 by a
separately written WCAG implementation, matching the gate to the digit. 21.00 is
the theoretical maximum for the formula, which anchors the top of the range.

## Drift (baseline in `baseline.json`)

| | What | Count | Detected |
|---|---|---|---|
| S1 | font-size literals off `font.size` | 8 | 23.12px, 11px ×3, 34px, 40px, 48px, 52px |
| S2 | rem literals off the `unit` ramp | 0 | was 34; `1.035rem` ×20 and the rest were bound or given tokens |
| S3 | radius literals off `radius` | 0 | pattern fires on `rounded-[5px]`; 5px is `radius.sm`, so 0 is a result, not a silent pass |
| S4 | durations off the `duration` scale | 2 | 600ms, 340ms |
| S5 | z-indexes off the `z` scale | 0 | was 8, all near the splash layer; the scale now holds them |
| D2 | hand-written literals equal to a token value | 1 | `app/(portfolio)/portfolio.css`: `oklch(0.9 0 0)` restates `border.subtle` |
| U1 | surfaces reading a base-tier property | 0 | scope widened past the two portfolio directories this pass; see below |
| H1 | tokens with no client | 18 | listed by the check |

S1's remaining 8 are one off-ramp value (`23.12px`) plus a display-size run
(34, 40, 48, 52px) and `11px` ×3. The display sizes are the hero and section
headings, set by Tailwind arbitrary values rather than by `type.*` roles.

S2 and S5 reaching 0 is the ratchet working as designed: each fell in the change
that earned it, and X1 now stops either climbing back.

U1's 0 is a stronger claim this pass than last. The tripwire always read `.ts` and
`.tsx`, but only under `app/(portfolio)` and `components/portfolio`, so the `/ame`
area was a surface it did not watch. Widened to the `/ame` tree, `components/docs-ui`,
`components/mdx`, `content`, `lib`, and `hooks` (and to `.mdx`), it found 5 base
primitives bound through inline `style` — `--ame-color-ink`, `--ame-radius-pill`,
`--ame-duration-slow`, `--ame-font-size-13` in `nav.tsx`, `--ame-font-leading-relaxed` in
`footer.tsx`. Each was repointed at the role holding its value, so 0 is measured
across the wider scope rather than preserved by a baseline (R-70). `components/ui`
stays out as vendored (R-8) and `app/prototypes` as deliberately outside the token
scope (R-66); both are named in `invariants.json` rather than quietly absent.

## Clients (H1)

18 of 253 tokens have no client. The count was 91 of 167 before the audit pass,
47 after it, 35 after the Ame pass, 32 after the glass pass, 19 by the time the
`/ame` area landed, and 18 now. What the remaining 18 are:

- **Nine `component.*` tokens**: `header-logo.stretch-x`, the three
  `accessibility.*` (panel radius, trigger radius, raise), `card.min-height`,
  `card.lift`, `pill.bg-rest`, `pill.bg-hover`, `contact-row.radius`. The elements
  are styled with `rounded-2xl`, `min-h-[320px]` and the like.
- **Four `font.*` base roles**: `leading.none`, `leading.normal`, `weight.regular`,
  `weight.medium`.
- **Two `motion.*` roles**, state and exit duration.
- **`type.meta-tracking`, `border.subtle`, and `space.control-pad`.**

`component.pill.radius` left this list in the current pass: `nav.tsx` had been
reading the base `--ame-radius-pill` directly, so binding the component role removed a
base-tier read and a clientless clause with one edit. That is the same mechanism
the 47-to-35 move used, where five tokens were clientless *because* the surface
restated their value by hand. A clientless token and a raw base binding are often
one defect seen from two sides, which is why U1 and H1 tend to fall together.

18 is a real count of one-signature clauses. Closing it means either deleting the
tokens or rewriting the components to read them. D-18 records the reasoning; the
baseline holds the number and X1 stops it moving up.

## What the DTOS conversion changed on the rendered surface (historical, 2026-07-29)

Nothing intended. Two values moved:

- `component.nav.logo-gap`: 2rem to 33px, correcting the token to the shipped
  code (D-5). The token had no reader, so nothing rendered differently.
- `.port-glass` and `.port-tone` now read their fill, foreground, and shadow from
  tokens instead of restating the same literals. The literals were identical, so
  the paint is unchanged and the second home is gone.

## DTOS 2025.10 conformance, rechecked 2026-07-29

Re-verified against the spec folder at
`G:\Library Collection\Process Standardization\Design Token Open Standard\community-group-main\schemas\src\2025.10`,
which was reachable from the execution environment, so no copy was vendored.

- **Reserved properties used:** `$value`, `$type`, `$description`, `$extensions`,
  and `$ref` inside colour values. All five are defined by the spec. Nothing
  outside that set appears on a token.
- **Types:** all 8 in use. Recounted 2026-08-10: colour 83, dimension 69,
  number 50, duration 21, shadow 20, cubicBezier 7, fontWeight 2, fontFamily 1.
- **Units:** `px` and `rem` on every dimension, `ms` on every duration. Both
  match the schema enums exactly.
- **Colour spaces:** `srgb`, `oklch`, and `lab`, all three in the schema enum.
  `lab` entered with `color.modal-dark`, the shared panel surface.

Four disclosed deviations, up from three:

1. `em` is not a DTOS dimension unit. 15 tokens carry it as `number` plus a
   `$extensions` unit: the four tracking steps, the five weight-synthesis
   strokes, and the six semantic roles that reference them.
2. `vh` is not a DTOS dimension unit. `component.ask-ai.raise` carries it the
   same way.
3. `$extensions` inheritance is not specified. This build applies the `$type`
   rules to it, so a semantic token referencing `font.tracking.tight` emits `em`.
4. **New:** `packages/ame-tokens/ame.json` sits outside the token grammar entirely. It is a
   manifest, not a token file, and no DTOS construct carries a package version.
   The build reads it and stamps both artifacts; B5 checks the stamp.

The value bounds the schemas impose (the `fontWeight` range, the unit enums, the
colour-space enum, the cubic-bezier point count) moved out of `check.mjs` into
`invariants.json > type_bounds`, so the checker now states no number of its own
beyond the sRGB transfer-function constants that define the contrast measurement.

# Outcomes

Numbers. Measured by `pnpm ame check` on 2026-07-29. The conditions that
produced them are in `contract.md`; why they are what they are is in
`decisions.md`.

## Size

| | |
|---|---|
| Tokens | 216 |
| Aliases | 28 |
| Violations | 0 |

## Contrast (C1–C10)

Computed from the resolved token values: oklch to linear-light sRGB, translucent
foregrounds composited over their background, WCAG 2.2 relative-luminance ratio.

| | Pair | Ratio | Min |
|---|---|---|---|
| C1 | `text.body` on `background.page` | 17.82 | 7 |
| C2 | `text.heading` on `background.page` | 20.12 | 7 |
| C3 | `text.secondary` on `background.page` | 5.28 | 4.5 |
| C4 | `text.brand` on `background.page` | 4.70 | 4.5 |
| C5 | `text.danger` on `background.page` | 4.71 | 4.5 |
| C6 | `text.on-brand` on `text.brand` | 4.69 | 4.5 |
| C7 | `component.topbar.fg` on `component.topbar.bg` | 4.74 | 4.5 |
| C8 | `surface.glass-fg-on-dark` on `background.ink` | 18.60 | 4.5 |
| C9 | `surface.glass-fg-muted-on-dark` on `background.ink` | 11.47 | 4.5 |
| C10 | `surface.glass-fg-muted-on-light` on `background.page` | 5.28 | 4.5 |

Four pairs clear AA by less than 0.25: C4 (0.20), C5 (0.21), C6 (0.19), C7
(0.24). Each is one small lightness step from failing. The old README called the
top-bar pair "the tightest by design"; it is fourth-tightest, and the three
tighter ones were unnamed. A colour change to `brand`, `danger`,
`brand-contrast`, or `neutral.500` fails the check rather than shipping.

Sanity: pure white on `background.page` measures 1.04, which is the near-1 a
near-white-on-near-white pair must give. The converter is not returning a
plausible-looking wrong answer.

## Drift (baseline in `baseline.json`)

| | What | Count | Detected |
|---|---|---|---|
| S1 | font-size literals off `font.size` | 12 | 23.12px, 11px ×3, 34px ×2, 40px ×2, 48px ×2, 52px ×2 |
| S2 | rem literals off the `unit` ramp | 34 | 1.035rem ×20, 0.2125rem ×5, 0.95rem ×2, 1.7rem ×2, and 5 singletons |
| S3 | radius literals off `radius` | 0 | pattern fires on `rounded-[5px]`; 5px is `radius.sm`, so 0 is a result, not a silent pass |
| S4 | durations off the `duration` scale | 6 | 600ms ×2, 340ms ×2, 0ms ×2 |
| S5 | z-indexes off the `z` scale | 8 | 9000, 9001, 9990, 9997, 9998 ×2, 2 ×2 |
| D2 | hand-written literals equal to a token value | 24 | 10 restate `color.neutral.800`; almost all in the docs theming block |
| U1 | surfaces reading a base-tier property | 0 | measured 16 before the rebinding pass |
| H1 | tokens with no client | 32 | listed by the check |

S2's largest entry, `1.035rem` ×20, is one icon size repeated across the
components. It is the single biggest off-ramp value on the surface and it has no
token.

S5's strays are all near the splash layer (9000–9998) while `z.splash` is 9999.
The scale names seven layers; the surface uses at least six more around one of
them.

## Clients (H1)

32 of 216 tokens have no client. The count was 91 of 167 before the audit pass,
47 after it, 35 after the Ame pass, 32 after the glass pass. What the remaining
32 are:

- **Most of the `type.*` role set.** The markup sets type with Tailwind classes,
  so the roles document sizes Tailwind owns. Six now bind: meta size, body
  tracking, lead leading, root tracking, body synthesis, dense leading.
- **Sixteen `component.*` tokens**, including every card token, every pill token,
  and both ask-ai radii. The elements are styled with `rounded-2xl`,
  `min-h-[320px]` and the like.
- **Two `motion.*` roles**, state and exit duration. The other four bind, and
  three of those were added in this pass to catch surfaces that had been
  hand-writing the same curve.
- **`font.leading.*`, `font.weight.*`, `border.*`, `background.card`, and two
  `space.*` roles.**

The 47 to 35 move came from binding the eight base-tier reads U1 found, from five
tokens whose value the surface had been restating by hand, and from deleting
`ease.out-expo` and `ease.in-back`, which nothing read and nothing copied.

32 is a real count of one-signature clauses. Closing it means either deleting the
tokens or rewriting the components to read them, which is a diff that cannot be
reviewed alongside a format conversion. D-18 records the reasoning; the baseline
holds the number and X1 stops it moving up.

## What the conversion changed on the rendered surface

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
- **Types:** all 8 in use. colour 68, dimension 62, number 39, shadow 20,
  duration 14, cubicBezier 10, fontWeight 2, fontFamily 1.
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

# Ame

Ame is a design token system with an enforcement gate. Its 3 layers of DTCG tokens compile to CSS custom properties. A CI check fails any build where a scanned surface hand-writes a value the tokens already own.

**[Contract](tokens/contract.md)** · **[Decisions](tokens/decisions.md)** · **[Outcomes](tokens/outcomes.md)** · **[Fixtures](examples/README.md)** · **[Lexicon](docs/LEXICON.md)** · **[Standard](STANDARD.md)**

**New here?** Three doors, and they want different things.

| You are | Start at | It takes |
|---|---|---|
| **Assessing the work**: a hiring manager, a peer, anyone deciding whether this is real | [The one claim, checked](#the-one-claim-checked) | 60 seconds, no clone |
| **Adopting the tokens** in your own app | [Getting started](#getting-started) | one install |
| **Contributing** a change | [CONTRIBUTING.md](CONTRIBUTING.md), where `pnpm gate` green *is* the install test | one install |

## The one claim, checked

This system says a build fails when a scanned file hand-writes a value the tokens already own. You do not have to take that on trust, and you do not have to clone anything. `examples/violating/` is a panel written to break the rules on purpose. [The CI log](../../actions) shows the gate rejecting it on every push, naming the literal it found and the token it collided with.

```
D2 restated: examples/violating/panel.css:
  "0px 1px 6px 0px rgb(16 19 25 / 0.06)" == component.glass.drop
```

A gate nobody has watched fail is indistinguishable from a gate that cannot. That fixture is the difference. `pnpm gate:fixtures` is green only when the gate rejected it, so a clause that quietly stops catching turns CI red instead of silent.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/architecture-dark.svg">
  <img alt="Three token layers (base literals, semantic roles, component measures) compile to tokens.css. The gate rejects raw values, layer leaks, and contrast failures." src="docs/architecture-light.svg">
</picture>
<sub>Drawn to ISO 5807-1985, in the same symbols the system's own flowchart component uses, and colored from the tokens themselves: a color change in <code>base/color.json</code> changes this picture or fails the build (<code>pnpm diagram:check</code>). It ships in both themes because the system has both.</sub>

## What's in the box

The consumable unit is `packages/ame-tokens` plus the gate.

| Piece | What it is |
|---|---|
| `packages/ame-tokens/` | DTCG tokens in 3 layers (base, semantic, component), a build with no dependencies outside Node's standard library, and the emitted `tokens.css` |
| `tokens/check.mjs` + `tokens/invariants.json` + `tokens/contract.md` | the gate; its rules are in [The gate](#the-gate) below |
| `examples/` | 1 compliant fixture inside the real gate's scan, and 1 violating fixture the gate must reject on every run |
| `tokens/decisions.md` + `docs/` | the dated decision log, the naming lexicon, the extraction preflight, and what the citations point at |
| `components/ame/` | demo chrome for the docs surface (nav, footer, top bar, panel wall, flowchart) |

## Requirements

Node 24 (`.nvmrc`) and pnpm 11.5.1 (pinned in `package.json > packageManager`). The token build itself has zero dependencies. The gate resolves `ame-tokens` through the pnpm workspace, so install first:

```bash
pnpm install
```

## Getting started

**Fork the system (the intended use).** Replace the values, keep the rules. Ame separates data (the token JSON), method (build + gate), and output (`tokens.css`). Your palette drops in without touching the enforcement:

```bash
# 1. edit packages/ame-tokens/base/*.json: your colors, type ramp, spacing, motion
# 2. point tokens/invariants.json > scan_roots at your app's directories
pnpm ame build     # emits tokens.css; throws rather than emit a partial file
pnpm gate          # every clause; exit 1 on any violation or drift growth
pnpm gate:fixtures # proves the gate still rejects the violating fixture
```

**Adopt the tokens as-is.** Import `packages/ame-tokens/tokens.css` and bind the custom properties. You inherit a system in which every rendered contrast pair is measured in both themes. The tokens are declared at `:root`, so they are available anywhere on the page with no wrapper class. For the dark theme, set `data-theme="dark"` on any ancestor: the emitted `[data-theme="dark"]` scope re-points the themed names beneath it.

**Point the gate at an existing codebase.** Retarget `scan_roots` at your own CSS and components. It will catch hand-written values, base-layer reads, and unmeasured contrast pairs. One limit applies, and it is first in [Scope and limits](#scope-and-limits).

## The gate

Every condition lives once: stated in `contract.md`, held as data in `invariants.json`, judged in `check.mjs`. The clause families:

| Family | Holds that |
|---|---|
| F, N | tokens satisfy the DTCG value schemas, and one word means one concept across every path and exported symbol |
| B | the committed `tokens.css` is byte-identical to a fresh build, and stamps the manifest version |
| L | references point down the layers, never up or sideways |
| C, CV | every rendered foreground/background pair meets its WCAG minimum, in light and dark, and no rendered pair goes unmeasured |
| D | one home per value: a hand-written literal equal to a token fails, named alongside the token it collides with |
| S | sizes, durations, radii, and z-indexes are scale members, drift ratcheted downward only |
| U, H | surfaces bind semantic roles, never base primitives; the uses-graph stays acyclic; clientless tokens are counted and capped |
| X | the record: baselines move down in the change that earned them, and a clause pointed at a missing path fails loudly instead of passing on an empty tree |
| W, Z | CI steps name scripts that exist in the tree, and every contract clause maps to an invariant and a check |
| LC | the license has one identifier, and every file that declares it agrees |

## Scope and limits

The gate governs what its scan roots name, and nothing else. Five things to know before you rely on it.

- **The restated-value check needs the token build present.** It compares against Ame's resolved token values. The gate therefore runs alongside the token build as a workspace citizen, never as a standalone binary.
- **Spacing is a scale here, not an enforced derivation.** The `unit.*` ramp exists and the `space.*` roles reference it. The clause that held a utility framework's spacing base equal to `unit.1` (P6) governed a config file that stayed in the monorepo, so it left with its subject. Decision D-49 records that parity and describes the tree Ame was extracted from. Whether a `space.*` role or a utility class should author layout spacing is an open question, there and here.
- **Many tokens have no consumer in this tree.** The count and its denominator are the H1 row in [Numbers](#numbers), generated rather than typed. The surfaces that consumed them stayed in the monorepo Ame was extracted from. The count is baselined and ratcheted so it cannot grow. It is a fact about the extraction, not about the tokens.
- **One value sits off its scale on purpose:** a 13.85px glyph height in the top bar that the surrounding control was sized around. Baselined at 1, with the reason in the code.
- **`components/ame` is demo chrome, not a component library.** Nothing else here is one either. Treat it as reference, not product.

Some clauses left with their subject: a byte budget over `public/`, the docs-site registry, a vendored-code manifest, and the parity checks against portfolio components. They were removed rather than pointed at something that merely exists, because a clause scanning an empty tree reports green (D-53). `docs/PROVENANCE.md` records what every absent citation pointed at.

## Method

4 homes for 4 kinds of statement: conditions in `contract.md`, reasons in `decisions.md`, numbers in `outcomes.md`, procedures in `deliverables.md`. A rule written twice can disagree with itself, so nothing is written twice. The decision log is chronological and annotated, never rewritten. The lineage is Noble's dated lab notebook (2009) and the data/method/output separation of Marwick's research compendia, applied to design tokens. The format is the [DTCG specification](https://tr.designtokens.org/format/), 2025.10. Decision D-1 records the choice against [Style Dictionary](https://github.com/style-dictionary/style-dictionary)'s dialect. Contrast is the [WCAG 2.2 relative-luminance ratio](https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio), computed from resolved token values in `tokens/contrast.mjs`.

## Numbers

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

## Contributing, license, citation

Issues and PRs are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) is the 5-minute guide, and `pnpm gate` green is the install test. The gate is the filter, so nothing reaches a human reviewer until it passes. Every commit needs a sign-off certifying the [DCO](DCO), and that is checked in CI rather than requested. To report a vulnerability, read [SECURITY.md](SECURITY.md) first: it states the threat model plainly and explains why there is no bounty.

The license is Apache-2.0, stated in [LICENSE](LICENSE). Section 6 withholds the name, so a fork may take the system and sell what it builds but may not call itself Ame ([NOTICE](NOTICE)). The four documents carrying the reasoning are additionally offered under CC BY 4.0, at your choice ([LICENSE-DOCS](LICENSE-DOCS)). One piece of this tree is not the author's: the 218 icons under `components/ame/icons/` are the Schweizerische Eidgenossenschaft's set, MIT. Its permission notice must travel with the copies, so [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES) reproduces it in full. Clause LC in the gate reads every one of those declarations on every run, so they cannot disagree. To cite the system, use [CITATION.cff](CITATION.cff).

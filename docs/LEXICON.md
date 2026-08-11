# Lexicon

The repository's high-frequency name elements, one word per concept and one
concept per word. This is the project's identifier dictionary: the countermeasure
Deissenboeck and Pizka (S8) and Feitelson et al. (S10) prescribe against the two
failures that decay a codebase's names. A synonym (two words for one concept)
multiplies the reader's effort; a homonym (one word for two concepts) misleads
them. Feitelson measured that two developers pick the same name for the same thing
about 6.9% of the time, so no name is self-evident and a shared dictionary is not
optional.

This file is the single home for these definitions. STANDARD.md's N clauses hold
the rules (casing, the 30-character cap, no misleading names); this file holds the
vocabulary those rules are applied to. When a concept is renamed, the rename is
global (N3) and its entry here moves with it.

## Name elements

| Word | The one concept it names |
|---|---|
| **ame** | The repository as a whole: the portfolio and the design token system that ships it, in one tree. Also the token system specifically, versioned as `ame@x.y.z` in `packages/ame-tokens/ame.json`, which is the package boundary a consumer binds. One brand at two scales; the version is what distinguishes them (R-1). |
| **metis** | The sister marketing brand, rendered on the ink (dark) ground. Written **Metis** in prose. The `/metis-marketing` route and the Metis lockup are its surface inside this repo; the top bar, nav, and footer are shared ame components tinted for it (R-12). |
| **surface** | A rendered consumer that binds tokens: the portfolio routes under `app/(portfolio)/` and the components under `components/portfolio/`. Surfaces bind semantic and component tokens, never base tokens (U1). Note the homonym: the semantic token group `surface.*` names the glass foreground and fill roles, which are values a surface binds, not a surface itself. |
| **token** | A named design value in Design Token Open Standard (DTOS) format, emitted once as a CSS custom property. Tokens live in three layers: base, semantic, component. |
| **base** | The bottom token layer. A base token states a literal and references nothing (L1). `packages/ame-tokens/base/`. |
| **semantic** | The middle token layer. A semantic token references base and names a role (`background.page`, `text.body`); shadow geometry is its one stated-literal exception (L2). `packages/ame-tokens/semantic/`. |
| **component** | Two concepts, kept apart by context. (1) The top token layer: a component token references semantic or base and may state a `dimension` or `number` literal for a measure used by one element (L3); `packages/ame-tokens/component/`. (2) A React component under `components/`. The token sense is always qualified "component token" where ambiguity is possible. |
| **variant** | A component's addressable form: a prop value that selects one of its enumerated states (`<Button variant="primary">`). The fifth constraint deliverable; every call site binds the variant string by name. |
| **order** | A work-order document in the repo's premise / numbered-WO / proof idiom, under `docs/orders/`. An order names work to be done and the proof that closes each item. |
| **dipstick** | The deliverable gauge: `pnpm ame dipstick` writes a dated export of what the token system currently holds, so two readings can be compared without opening the system. Read-only; it does not append to the gate's run record. |
| **drift** | A measured count that carries a baseline and must not grow past it (the scale-membership counts S1–S5, the restated-literal count D2, the base-binding count U1, the clientless-token count H1). Distinct from a violation, which breaks a stated clause outright. A baseline moves down only, in the change that earned it (X1). |
| **gate** | The falsifiable check chain CI and a deploy run: `pnpm build` runs `packages/ame-tokens/build.mjs`, `tokens/check.mjs`, `next build`, then `tokens/check.mjs --shipped`. The gate is verified by having failed for the reason it exists to catch (R-10), not by reading it. |
| **placeholder** | A `[[TOKEN]]`-shaped copy marker standing in for content not yet written. A placeholder says on its face that a page is unfinished, so G1 blocks any placeholder from reaching a deployed route (STANDARD.md C5). |
| **metis-marketing** | The ink-theme portfolio home: route `app/(portfolio)/metis-marketing/` and component `metis-marketing-splash.tsx` (`MetisMarketingSplash`). It renders the same home component as `/portfolio`, opening dark with the Metis splash and mark. |
| **mmarketing** | Superseded name for **metis-marketing**. Renamed in full (route, component file, exported symbols, `DARK_ROUTES`) because it read as a typo, which fails Feitelson's derive-the-same-meaning test outright (R-20). Retained here only as the former spelling; no code uses it. |
| **woven** | The verification feature: an intake-to-receipt pipeline for AI-generated deliverables. Home `packages/woven/`, versioned `woven@0.1.0` on a clock independent of `ame@x.y.z` (R-74). Written **Woven** in prose; the lowercase word is the banned metaphor verb for abstract work, and the coherence gate matches it case-sensitively so the name passes and the metaphor does not. One concept only: **woven** names this repo's feature. Any future external product carrying the name is a separate naming decision, deferred and deliberately not recorded here, so that `git grep woven` and a future deck cannot come to disagree about what the word refers to. |
| **nagi** | 凪, the lull when wind and water go still. The state of the tree asserted after a removal: quiet residue, zero orphans, nothing left pointing at what was taken. Named by [NAGI-ORDER](orders/NAGI-ORDER.md), whose items each assert one part of it. Kept apart from its two neighbours: a **removal** is the act, a **rehearsal** is the proof the act would be clean, and nagi is the state that proof asserts — the noun the other two exist for. The homonym question, asked and answered as an absence: lowercase "nagi" has no ordinary-English sense and no occurrence anywhere in this tree at naming time (2026-08-11), so no meaning ban of the W1.3 kind is expected. Recorded rather than assumed, so a future collision arrives as a caught surprise instead of a silent drift. |
| **instrument** | A derived, parity-checked statistic over rendered canon, emitting DRIFT readings. Built from the tree, byte-rebuildable from shipped embeddings, so it cannot go stale the way a golden screenshot does. An instrument measures and never decides; a policy over its readings is what produces a verdict. |
| **convergence** | Resemblance to a reference cloud, read by an instrument. A reading, never a verdict. Its pair is **conformance**: compliance with stated rules, decided by clauses, output VIOLATION or pass. The two never share a meaning. |
| **battery** | A fixed, versioned prompt set run against outside generators by dated recipe. Two exist: ambient (what the crowd makes) and counterfactual (what a machine makes of Ame's own assignment). Editing a prompt without bumping the battery version is a violation, because an undated recipe cannot be re-run. |
| **receipt** | The signed record of one asset's verdicts, readings, and attestations, pinned to the clause-pack and instrument versions it was judged under. Its three ranks stay typographically apart: clause verdicts reproduce, band verdicts reproduce as arithmetic, attestations verify only as signatures. |
| **attestation** | A signed human judgment, recorded where determinism does not reach. Verifiable as a signature, reproducible never — which is what separates it from a verdict, and why it is never blended into one. |

## Docs taxonomy tiers

The `/system` workshop is organized into seven named tiers (WO-10.2, DECISIONS
R-36). The order runs base to composition, the same direction as the token
layering (base to semantic/component to surface), so the taxonomy teaches the
architecture by shape. The tier names are the vocabulary; `content/docs/meta.json`
is the one home for which page sits in which tier, and the component registry
(`components/docs/component-registry.json`) carries each component's tier.

| Tier | The one concept it names |
|---|---|
| **Start** | The single entry point: the Overview page that says what the system is and how it is organized (`content/docs/index.mdx`). |
| **Using Ame** | The consumer-consumption tier: how a consumer binds the system, installs a component, and reads a value by name (`content/docs/using-ame.mdx`). |
| **Foundations** | The raw token scales: colors, typography, layout. The three token pages live here. |
| **Layouts** | The composition layer between foundations and components (phi-spacing, type ramp as grid, concentricity). Deferred with a recorded reason in its tier index (WO-10.5, WO-10.4). |
| **Components** | One node per component. The 5 documented components live here; the rest of `components/ui/` are registry rows carrying this tier at status `deferred`. |
| **Sections** | Composed regions: multiple components arranged into one showcase. The hero showcase lives here. |
| **Pages** | Full-page compositions (case studies, prototypes) and bare test fixtures. Deferred with a recorded reason (WO-10.9 intake, WO-10.7 fixtures). |

## The two token homes

"Design tokens" has two homes in this tree, and they are two concepts, not one
(DECISIONS R-25). Each governs a different surface, so a change to one is not a
change to the other.

- **`tokens/` (the DTOS pipeline)** governs the **portfolio surface**: the routes
  under `app/(portfolio)/` and the components under `components/portfolio/`. It is
  Neue Haas on `.portfolio-root`, emitted as CSS custom properties, and it is the
  contract-checked home (`tokens/contract.md`). Its type ramp lives in
  `packages/ame-tokens/base/type.json`; its motion in `packages/ame-tokens/base/motion.json`.

- **`lib/*-tokens.ts` (seven TypeScript modules)** governs the **`/system`
  workshop and the root shell**: `app/page.tsx`, `components/docs/`,
  `components/playgrounds/`, and the `components/ui` primitives they document. It
  is Inter, expressed as Tailwind class strings on TypeScript objects, and it is
  the playgrounds' source of truth. Its type ramp is `lib/typography-tokens.ts`;
  its motion `lib/motion-tokens.ts`.

They are legitimately separate because they render different surfaces in
different faces, and where their role names coincide the values deliberately
differ: the portfolio `type.body-size` is 15px Neue Haas, the `/system`
`TYPOGRAPHY.body` is 16px Inter, and the two motion doctrines contradict (the
portfolio allows springs and overshoot, `lib/motion-tokens.ts` forbids them). The
boundary is enforced, not just described: no portfolio-surface file may import a
`lib/*-tokens` module (invariant U4), so the two homes cannot silently merge.

## File pairs that differ only by scope

Two pairs of files carry near-identical names distinguished only by the scale they
govern. Recorded here so the scope is read from the dictionary, not guessed.

| This file | governs | not to be confused with | which governs |
|---|---|---|---|
| `DECISIONS.md` (R-numbers) | repo-scale judgment calls | `tokens/decisions.md` (D-numbers) | token-scale decisions and corrections |
| `docs/orders/AUDIT-CLOSEOUT-2.md` | the repo audit: every STANDARD.md clause with its check output | `tokens/audit.md` | the audit that produced the current token contract |

The number prefix is the tell: an `R-` entry is repo scale, a `D-` entry is token
scale. The two decisions files are two homes for two concerns at two scales, one
home each (R-2).

## Concept pairs kept apart

Words that are easy to collapse and expensive to confuse. Recorded as pairs so the
distinction is read from the dictionary rather than reconstructed each time.

| This | does | not to be confused with | which |
|---|---|---|---|
| the **gate** | decides conformance: compliance with stated rules, output VIOLATION or pass | the **instrument** | reads convergence: resemblance to a reference cloud, output a DRIFT reading |
| the **dipstick** | reports what the token system *holds*, by reading the tokens | the **instrument** | reports what the rendered system *resembles*, by reading what those tokens paint |
| a **removal** | is the act: it changes the tree | a **rehearsal** | is the proof that act would be clean: it changes nothing, and runs on every push |
| **verify** = reproduce | re-run a clause pack against the asset bytes and get the same verdict | **verify** = confirm | check that a signature belongs to a reviewer's key |

Neither half of the first pair substitutes for the other, and the quadrants are
why: an asset can pass every clause and still sit off-system (the gap no clause
reaches), or resemble the canon closely while binding the wrong tokens (the gap no
resemblance sees). The instrument exists because of the first gap, the gate because
of the second.

The receipt never uses the bare word "verify". Each rank names which sense it
means, because a receipt that flattens three ranks into one checkmark lies about
its best one.

## Mention versus use

A check reads text. Text sometimes *uses* a term and sometimes only *mentions*
it — names it in order to talk about it. A rule about the use does not apply to
the mention, and no matcher that reads characters can tell them apart on its own.

The distinction has now been reached three times here, independently, in three
different layers, which is why it has a home instead of being rediscovered a
fourth time.

| Layer | The mention that must not be caught | Where |
|---|---|---|
| A gate | The comment explaining that `SUBSTACK_URL` is a `[[token]]` — G1 flags its own documentation | `components/portfolio/contact-menu.tsx`, STANDARD.md C5 |
| A lexicon clause | "Woven" the canonical name, against lowercase "woven" the banned metaphor verb (R-75) | `content/glossary.ts`, `scripts/check-coherence.ts` |
| A config file | A `$description` that says a field reads `pending`, against a field that actually does (W-R1) | `packages/woven/experiments/recipe.mjs` |

The working rule, stated once so a check author inherits it: when a ban is on how
a word is used rather than on the characters in it, narrow the check to something
mechanical — a capital, a path, a key that is not an annotation — and state the
hole that narrowing leaves. Do not widen the matcher until it catches meaning; a
matcher built to chase meaning fires on prose about a rule rather than on the rule
(R-72), which is the same defect one layer up.

Every check with a must-never-catch list carries its mention cases there, so the
distinction is asserted on every run rather than remembered (STANDARD.md C6).

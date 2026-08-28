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

## Which tree an entry governs

This file travels into the published `ame` package and is written for the
monorepo that produced it, so some entries name things the package does not
contain. Rather than two lexicons that can disagree, entries carry a marker:

- **no marker** — governs both trees. The token vocabulary, the gate's own
  words, the naming rules themselves.
- ***(monorepo)*** — the concept exists only in the repository Ame was extracted
  from. Its cited paths (`app/`, `content/`, `lib/`, `docs/orders/`,
  `packages/woven`) are real there and absent here, by design: the extraction
  carries the token system and the gate, not the portfolio they paint.

A reader of the package can take an unmarked entry as binding and a marked one
as context. `docs/PROVENANCE.md` says what every absent citation pointed at.

## Name elements

| Word | The one concept it names |
|---|---|
| **ame** | The repository as a whole: the portfolio and the design token system that ships it, in one tree. Also the token system specifically, versioned as `ame@x.y.z` in `packages/ame-tokens/ame.json`, which is the package boundary a consumer binds. One brand at two scales; the version is what distinguishes them (R-1). |
| **metis** *(monorepo)* | The sister marketing brand, rendered on the ink (dark) ground. Written **Metis** in prose. The `/metis-marketing` route and the Metis lockup are its surface inside this repo; the top bar, nav, and footer are shared ame components tinted for it (R-12). |
| **surface** | A rendered consumer that binds tokens. The concept governs both trees and 17 `--ame-surface-*` tokens ship in the package; the examples that follow are *(monorepo)*: the portfolio routes under `app/(portfolio)/` and the components under `components/portfolio/`. Surfaces bind semantic and component tokens, never base tokens (U1). Note the homonym: the semantic token group `surface.*` names the glass foreground and fill roles, which are values a surface binds, not a surface itself. |
| **token** | A named design value in Design Token Open Standard (DTOS) format, emitted once as a CSS custom property. Tokens live in three layers: base, semantic, component. |
| **base** | The bottom token layer. A base token states a literal and references nothing (L1). `packages/ame-tokens/base/`. |
| **semantic** | The middle token layer. A semantic token references base and names a role (`background.page`, `text.body`); shadow geometry is its one stated-literal exception (L2). `packages/ame-tokens/semantic/`. |
| **component** | Two concepts, kept apart by context. (1) The top token layer: a component token references semantic or base and may state a `dimension` or `number` literal for a measure used by one element (L3); `packages/ame-tokens/component/`. (2) A React component under `components/`. The token sense is always qualified "component token" where ambiguity is possible. |
| **variant** | A component's addressable form: a prop value that selects one of its enumerated states (`<Button variant="primary">`). The fifth constraint deliverable; every call site binds the variant string by name. |
| **order** | A work-order document in the repo's premise / numbered-WO / proof idiom, under `docs/orders/`. An order names work to be done and the proof that closes each item. |
| **two-witness refusal** | When two independent accounts of the same fact disagree, the verdict is *neither* — never the one you would have preferred. Refusing both is the only reading that does not require knowing which witness broke, and a disagreement of this kind indicts the exchange rather than one party to it. Two instances so far: WEIGHTS-ORDER WG-4 compares a downloaded file's hash against the pointer the canonical source published, and refuses when they part; the flux-schnell adapter compares the bytes that arrived through the pipe against the hash the worker claims for them, and refuses the generation outright rather than trusting the bytes it holds. Note what the second one closes — a worker that writes one file and describes another. The temptation the rule exists to defeat is trusting your own side by default, which feels like rigour and is only proximity. Distinct from a checksum, which asks whether a value is right; this asks what to do when two sources both answer and answer differently. |
| **incident replay** | The strongest form of must-catch evidence: a check born from an incident is armed with that incident's own conditions rather than a synthetic case resembling them, observed to fire, then disarmed. The evidence classes differ in kind — a synthetic case proves a check catches what its author imagined, and author and check share every blind spot; a replay proves it catches what actually got through. W5 is the specimen: the CI typecheck step was unwired and W5 reported the exact condition the repo held that morning (R-138, R-139). Clause METHODS-ORDER M8, whose mechanised half is the citation only — `replayed:` must name a ledger entry that exists — because whether the replay happened is judgment, while whether it names something findable is not. Not every check qualifies: one written ahead of a defect class has no corpse and takes synthetic cases without apology. Ancestor: the correction-of-error regression receipt, where a fix is not accepted until the failure is reproduced against it. |
| **candour tax** | Any mechanism that makes telling the truth about the system cost more than staying quiet about it. This repo's standing prohibition: honesty must never be more expensive than silence. Three enforcements, one principle — annotation-not-erasure (a false commit message is corrected in place, never rewritten away), the superseded-row exemption (R-82's gate refuses to pressure true history into deletion), and hash-exclusion-of-judgments (`trust_zone` is left out of `rosterHash`, so an honest relabel cannot masquerade as a ruler change under R-77). The test is a thought experiment: if someone corrected a claim right now, what would it cost them? A number that has to be re-derived, a reading invalidated, a receipt broken — each is a tax, and each buys stale labels. Amazon's COE doctrine learned this about people; the recurrence here is about machinery, and the machinery version is enforceable, which is why R-137 proves it in both directions rather than asserting it. |
| **true-of-emptiness** | A claim species: a property that holds only because a population is empty, banked as a virtue of design. R-120 stated two — "Woven's generators are remote services, so foreign code never enters the process tree" and "a response's build arrives at intake as `reported_version`" — both true of a roster with no members, both falsified the moment schnell joined, and neither announced its own expiry (R-135, struck-not-deleted). The general form: any claim whose truth depends on a set being empty expires on first member, silently. The cure extends the recorded-absence discipline (R-121) from facts to virtues — an absence claim carries its scope, and a **virtue claim carries its population state**. "True as of an empty roster" written at banking time turns tomorrow's discovery into today's lookup. |
| **clause** | A binding rule with a check behind it. Two species, kept apart because they have different homes and different governments. An **asset clause** binds what passes through: an obligation a deliverable must satisfy to be receipted, backed by a statute or a policy choice standing in for one, carried in a versioned pack, and pinned to each receipt (W6's jurisdiction; drafts in `instrument.clause_drafts`). A **method clause** binds what gets built: which instruments the executor may adopt and how a verdict may be stated, backed by evidence rather than statute, homed in `docs/orders/METHODS-ORDER.md` with no pack and no receipt (M1–M7). The test is what the clause would refuse — a deliverable, or a design decision. Conflating them is how a method clause gets queued behind a legal drafting session it has no business in (R-136). |
| **dipstick** | The deliverable gauge: `pnpm ame dipstick` writes a dated export of what the token system currently holds, so two readings can be compared without opening the system. Read-only; it does not append to the gate's run record. |
| **drift** | A measured count that carries a baseline and must not grow past it (the scale-membership counts S1–S5, the restated-literal count D2, the base-binding count U1, the clientless-token count H1). Distinct from a violation, which breaks a stated clause outright. A baseline moves down only, in the change that earned it (X1). |
| **gate** | The falsifiable check chain CI and a deploy run: `pnpm build` runs `packages/ame-tokens/build.mjs`, `tokens/check.mjs`, `next build`, then `tokens/check.mjs --shipped`. **In the extracted package the chain is shorter**: `pnpm build` there runs the token build, both parity checks, `pnpm gate` and `pnpm gate:fixtures`, and there is no `next build` and no `--shipped` step because there is no application to ship. This entry described only the monorepo's chain until 2026-08-27, in a file that travels. The gate is verified by having failed for the reason it exists to catch (R-10), not by reading it. |
| **placeholder** | A `[[TOKEN]]`-shaped copy marker standing in for content not yet written. A placeholder says on its face that a page is unfinished, so G1 blocks any placeholder from reaching a deployed route (STANDARD.md C5). |
| **metis-marketing** | The ink-theme portfolio home: route `app/(portfolio)/metis-marketing/` and component `metis-marketing-splash.tsx` (`MetisMarketingSplash`). It renders the same home component as `/portfolio`, opening dark with the Metis splash and mark. |
| **mmarketing** | Superseded name for **metis-marketing**. Renamed in full (route, component file, exported symbols, `DARK_ROUTES`) because it read as a typo, which fails Feitelson's derive-the-same-meaning test outright (R-20). Retained here only as the former spelling; no code uses it. |
| **woven** *(monorepo)* | The verification feature: an intake-to-receipt pipeline for AI-generated deliverables. Home `packages/woven/`, versioned `woven@0.1.0` on a clock independent of `ame@x.y.z` (R-74). Written **Woven** in prose; the lowercase word is the banned metaphor verb for abstract work, and the coherence gate matches it case-sensitively so the name passes and the metaphor does not. One concept only: **woven** names this repo's feature. Any future external product carrying the name is a separate naming decision, deferred and deliberately not recorded here, so that `git grep woven` and a future deck cannot come to disagree about what the word refers to. |
| **instrument** | A derived, parity-checked statistic over rendered canon, emitting DRIFT readings. Built from the tree, byte-rebuildable from shipped embeddings, so it cannot go stale the way a golden screenshot does. An instrument measures and never decides; a policy over its readings is what produces a verdict. |
| **convergence** | Resemblance to a reference cloud, read by an instrument. A reading, never a verdict. Its pair is **conformance**: compliance with stated rules, decided by clauses, output VIOLATION or pass. The two never share a meaning. |
| **battery** | A fixed, versioned prompt set run against outside generators by dated recipe. Two exist: ambient (what the crowd makes) and counterfactual (what a machine makes of Ame's own assignment). Editing a prompt without bumping the battery version is a violation, because an undated recipe cannot be re-run. |
| **receipt** | The signed record of one asset's verdicts, readings, and attestations, pinned to the clause-pack and instrument versions it was judged under. Its three ranks stay typographically apart: clause verdicts reproduce, band verdicts reproduce as arithmetic, attestations verify only as signatures. |
| **attestation** | A signed human judgment, recorded where determinism does not reach. Verifiable as a signature, reproducible never — which is what separates it from a verdict, and why it is never blended into one. |


it, collapsing two rulers into one. Demoted from criterion to denominator it becomes the
scale that makes the criterion legible: how many multiples of the generator's own jitter
is this difference? A criterion that moves with a second measurement is a free parameter
wearing a denominator, so the demoted number is reported beside the verdict and never
inside it.

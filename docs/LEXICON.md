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
| **two-witness refusal** | When two independent accounts of the same fact disagree, the verdict is *neither* — never the one you would have preferred. Refusing both is the only reading that does not require knowing which witness broke, and a disagreement of this kind indicts the exchange rather than one party to it. Two instances so far: WEIGHTS-ORDER WG-4 compares a downloaded file's hash against the pointer the canonical source published, and refuses when they part; the flux-schnell adapter compares the bytes that arrived through the pipe against the hash the worker claims for them, and refuses the generation outright rather than trusting the bytes it holds. Note what the second one closes — a worker that writes one file and describes another. The temptation the rule exists to defeat is trusting your own side by default, which feels like rigour and is only proximity. Distinct from a checksum, which asks whether a value is right; this asks what to do when two sources both answer and answer differently. |
| **incident replay** | The strongest form of must-catch evidence: a check born from an incident is armed with that incident's own conditions rather than a synthetic case resembling them, observed to fire, then disarmed. The evidence classes differ in kind — a synthetic case proves a check catches what its author imagined, and author and check share every blind spot; a replay proves it catches what actually got through. W5 is the specimen: the CI typecheck step was unwired and W5 reported the exact condition the repo held that morning (R-138, R-139). Clause METHODS-ORDER M8, whose mechanised half is the citation only — `replayed:` must name a ledger entry that exists — because whether the replay happened is judgment, while whether it names something findable is not. Not every check qualifies: one written ahead of a defect class has no corpse and takes synthetic cases without apology. Ancestor: the correction-of-error regression receipt, where a fix is not accepted until the failure is reproduced against it. |
| **candour tax** | Any mechanism that makes telling the truth about the system cost more than staying quiet about it. This repo's standing prohibition: honesty must never be more expensive than silence. Three enforcements, one principle — annotation-not-erasure (a false commit message is corrected in place, never rewritten away), the superseded-row exemption (R-82's gate refuses to pressure true history into deletion), and hash-exclusion-of-judgments (`trust_zone` is left out of `rosterHash`, so an honest relabel cannot masquerade as a ruler change under R-77). The test is a thought experiment: if someone corrected a claim right now, what would it cost them? A number that has to be re-derived, a reading invalidated, a receipt broken — each is a tax, and each buys stale labels. Amazon's COE doctrine learned this about people; the recurrence here is about machinery, and the machinery version is enforceable, which is why R-137 proves it in both directions rather than asserting it. |
| **true-of-emptiness** | A claim species: a property that holds only because a population is empty, banked as a virtue of design. R-120 stated two — "Woven's generators are remote services, so foreign code never enters the process tree" and "a response's build arrives at intake as `reported_version`" — both true of a roster with no members, both falsified the moment schnell joined, and neither announced its own expiry (R-135, struck-not-deleted). The general form: any claim whose truth depends on a set being empty expires on first member, silently. The cure extends the recorded-absence discipline (R-121) from facts to virtues — an absence claim carries its scope, and a **virtue claim carries its population state**. "True as of an empty roster" written at banking time turns tomorrow's discovery into today's lookup. |
| **clause** | A binding rule with a check behind it. Two species, kept apart because they have different homes and different governments. An **asset clause** binds what passes through: an obligation a deliverable must satisfy to be receipted, backed by a statute or a policy choice standing in for one, carried in a versioned pack, and pinned to each receipt (W6's jurisdiction; drafts in `instrument.clause_drafts`). A **method clause** binds what gets built: which instruments the executor may adopt and how a verdict may be stated, backed by evidence rather than statute, homed in `docs/orders/METHODS-ORDER.md` with no pack and no receipt (M1–M7). The test is what the clause would refuse — a deliverable, or a design decision. Conflating them is how a method clause gets queued behind a legal drafting session it has no business in (R-136). |
| **dipstick** | The deliverable gauge: `pnpm ame dipstick` writes a dated export of what the token system currently holds, so two readings can be compared without opening the system. Read-only; it does not append to the gate's run record. |
| **drift** | A measured count that carries a baseline and must not grow past it (the scale-membership counts S1–S5, the restated-literal count D2, the base-binding count U1, the clientless-token count H1). Distinct from a violation, which breaks a stated clause outright. A baseline moves down only, in the change that earned it (X1). |
| **gate** | The falsifiable check chain CI and a deploy run: `pnpm build` runs `packages/ame-tokens/build.mjs`, `tokens/check.mjs`, `next build`, then `tokens/check.mjs --shipped`. The gate is verified by having failed for the reason it exists to catch (R-10), not by reading it. |
| **placeholder** | A `[[TOKEN]]`-shaped copy marker standing in for content not yet written. A placeholder says on its face that a page is unfinished, so G1 blocks any placeholder from reaching a deployed route (STANDARD.md C5). |
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
| A config file | A `$description` that says a field reads `pending`, against a field that actually does (W-R1) | `packages/woven/experiments/recipe.mjs` |

The working rule, stated once so a check author inherits it: when a ban is on how
a word is used rather than on the characters in it, narrow the check to something
mechanical — a capital, a path, a key that is not an annotation — and state the
hole that narrowing leaves. Do not widen the matcher until it catches meaning; a
matcher built to chase meaning fires on prose about a rule rather than on the rule
(R-72), which is the same defect one layer up.

Every check with a must-never-catch list carries its mention cases there, so the
distinction is asserted on every run rather than remembered (STANDARD.md C6).

## A threshold travels with the instrument, never with the subject

A number fixed under one measurement is asked, sooner or later, to govern another.
Sometimes that is legitimate and sometimes it is the free-parameter sin wearing a
borrowed coat, and the two are told apart by one question: **is this number a property
of the measuring apparatus, or of the thing measured?** An apparatus property travels
wherever the apparatus goes. A subject property does not travel at all.

Reached three times, from three doors, which is why it has a home here instead of being
re-derived a fourth time.

| Instance | The number | A property of | Travels? |
|---|---|---|---|
| R-77 | the governing sentence — "a threshold derived under one ruler cannot govern another" | — | states the rule |
| R-105 | `geometric_floor` 0.34, median vertical-offset ratio | the SUBJECT: displacement inside one layout | No. Retired to `ATTESTATION_REQUIRED`; the gate now admits everything and says so, rather than excluding on facts it does not have |
| R-157 | 0.01, `quantization_budget` rounded up | the INSTRUMENT: int8-versus-fp32 distortion of the encoder | Yes. The eye's resolution goes with the eye to any image it embeds, including generated ones |

The working rule, stated once so the next author inherits it rather than re-arguing it:
before carrying a threshold into a new measurement, name what it is a property OF. If the
answer mentions the subject — this layout, this corpus, this page — it does not transfer,
and carrying it anyway is R-105's defect. If the answer names only the apparatus — its
resolution, its quantisation, its repeat noise — it transfers, and refusing to carry it
would mean re-deriving a constant of the instrument once per subject.

The same theorem arrives through other doors in this repo, which is the strongest evidence
it is one theorem. `WO-M7` says a verdict is a comparison and never a reading: what
survives is the relation, not the absolute. Both are the observation that the quantities
surviving a change of frame belong to the apparatus rather than to the object — so when a number is
asked to move, ask which of the two it was ever about.

**A third category, and it is the one you actually want.** The rule as first written sorts
numbers into instrument-properties (travel) and subject-properties (do not). There is a
third kind it did not name: a unit generated BY the measurement it judges — the statistic's
own resampling noise, or the null distribution built by permuting its own labels. That is
neither imported nor foreign; it is self-calibrated, and for a separation question it is
the CORRECT denominator rather than a merely tolerated one, because "is this signal large
relative to the noise of this very comparison" is the question effect size asks. The
distinction is worth stating because the rule, applied bluntly, would flag its own best
answer: R-105, R-157 and R-162 were all imports from another measurement, and a self-null
resembles them only in being a denominator. The test is not "was this number measured
elsewhere in the repo" but "was it measured by THIS measurement, on THIS subject" (R-163).

**The mirror case, because the rule cuts both ways.** A subject property is not useless
once it fails the transfer test; it is in the wrong ROLE. R-157's within-generator repeat
floor is exactly zero and cannot serve as a tolerance — every differing byte would exceed
it, collapsing two rulers into one. Demoted from criterion to denominator it becomes the
scale that makes the criterion legible: how many multiples of the generator's own jitter
is this difference? A criterion that moves with a second measurement is a free parameter
wearing a denominator, so the demoted number is reported beside the verdict and never
inside it.
